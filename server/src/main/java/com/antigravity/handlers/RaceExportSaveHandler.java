package com.antigravity.handlers;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.handlers.dto.SavedRaceDescriptor;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonStandingItem;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverAnalysisSummary;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.OverallStandings;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.RaceStatisticsUtils;
import com.antigravity.race.SeasonStandingsCalculator;
import com.antigravity.race.states.Racing;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AnalyticsService;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.CsvExporter;
import com.antigravity.util.RequestContextUtils;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.javalin.http.Context;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceExportSaveHandler {

  private static final Logger logger = LoggerFactory.getLogger(RaceExportSaveHandler.class);
  private final DatabaseContext databaseContext;

  public RaceExportSaveHandler(DatabaseContext databaseContext) {
    this.databaseContext = databaseContext;
  }

  public void exportRaceCsv(Context ctx) {
    try {
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      String csv;
      synchronized (race) {
        OverallStandings standings =
            new OverallStandings(
                race.getRaceModel().getHeatScoring(),
                race.getRaceModel().getOverallScoring(),
                race.getRaceModel().getGroupOptions(),
                race.getRaceModel().isPractice());
        standings.recalculate(race.getDrivers(), race.getHeats());
        csv = CsvExporter.export(race);
      }

      ctx.contentType("text/csv")
          .header("Content-Disposition", "attachment; filename=\"race_export.csv\"")
          .result(csv);
    } catch (Exception e) {
      logger.error("Error exporting CSV", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private Season getSeason(Race race) {
    if (race == null || race.getSeasonEntityId() == null || race.getSeasonEntityId().isEmpty()) {
      return null;
    }
    SqliteRepository<Season> seasonRepo =
        new SqliteRepository<>(databaseContext, "seasons", Season.class);
    return seasonRepo.findByEntityId(race.getSeasonEntityId());
  }

  private byte[] postProcessExportWorkbook(byte[] rawBytes, Race race) {
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook outputWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(new ByteArrayInputStream(rawBytes))) {
      RaceStatisticsUtils.applyPostJxlsLaneColors(outputWb, race);
      RaceStatisticsUtils.removeAllCommentsAndVmlDrawings(outputWb);

      int lapDataIdx = outputWb.getSheetIndex("Lap Data");
      if (lapDataIdx != -1) {
        outputWb.setSheetOrder("Lap Data", outputWb.getNumberOfSheets() - 1);
      }

      ByteArrayOutputStream cleanOs = new ByteArrayOutputStream();
      outputWb.write(cleanOs);
      return cleanOs.toByteArray();
    } catch (Exception e) {
      logger.warn("Failed to clean up workbook comments/vml drawings; returning raw bytes", e);
      return rawBytes;
    }
  }

  private List<ExportLapData> buildExportLapData(List<Heat> runHeats) {
    Map<String, Double> driverAbsoluteTimes = new HashMap<>();
    List<ExportLapData> allLaps = new ArrayList<>();

    for (Heat h : runHeats) {
      int heatNum = h.getHeatNumber();
      for (int lane = 0; lane < h.getDrivers().size(); lane++) {
        DriverHeatData dhd = h.getDrivers().get(lane);
        if (dhd == null || dhd.isEmptyParticipant()) {
          continue;
        }
        String driverId = dhd.getDriver().getStableId();
        String driverName =
            (dhd.getDriver().isTeamParticipant() && dhd.getDriver().getTeam() != null
                ? dhd.getDriver().getTeam().getName()
                : (dhd.getDriver().getDriver() != null
                    ? dhd.getDriver().getDriver().getName()
                    : ""));
        String actualDriverName =
            dhd.getActualDriver() != null ? dhd.getActualDriver().getName() : "";

        double currentAbsoluteLapTime = driverAbsoluteTimes.getOrDefault(driverId, 0.0);
        double absoluteHeatLapTime = 0.0;

        for (DriverHeatData.LapData lap : dhd.getLaps()) {
          absoluteHeatLapTime += lap.getLapTime();
          currentAbsoluteLapTime += lap.getLapTime();

          allLaps.add(
              new ExportLapData(
                  driverName,
                  actualDriverName,
                  heatNum,
                  lane + 1,
                  absoluteHeatLapTime,
                  currentAbsoluteLapTime,
                  lap.getLapTime(),
                  lap.getSegments()));
        }

        driverAbsoluteTimes.put(driverId, currentAbsoluteLapTime);
      }
    }

    allLaps.sort(Comparator.comparingDouble(ExportLapData::getAbsoluteLapTime));
    return allLaps;
  }

  public void exportRaceXls(Context ctx) {
    try {
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      InputStream is = loadTemplateInputStream(ctx);
      if (is == null) {
        return;
      }

      ByteArrayOutputStream os = new ByteArrayOutputStream();

      synchronized (race) {
        List<RaceParticipant> driversCopy = new ArrayList<>();
        for (RaceParticipant rp : race.getDrivers()) {
          if (!rp.isEmptyParticipant()) {
            driversCopy.add(rp);
          }
        }
        OverallStandings standings =
            new OverallStandings(
                race.getRaceModel().getHeatScoring(),
                race.getRaceModel().getOverallScoring(),
                race.getRaceModel().getGroupOptions(),
                race.getRaceModel().isPractice());
        standings.recalculate(driversCopy, race.getHeats());

        org.jxls.common.Context jxlsContext = new org.jxls.common.Context();
        jxlsContext.putVar("race", race);
        jxlsContext.putVar("standings", driversCopy);

        List<Heat> runHeats = new ArrayList<>();
        List<String> heatSheetNames = new ArrayList<>();
        for (Heat h : race.getHeats()) {
          if (h.isStarted()
              || race.getCurrentHeat() != null
                  && h.getHeatNumber() <= race.getCurrentHeat().getHeatNumber()) {
            runHeats.add(h);
            heatSheetNames.add("Heat " + h.getHeatNumber());
          }
        }
        if (runHeats.isEmpty()) {
          runHeats.add(new Heat());
          heatSheetNames.add("Heat 1");
        }
        jxlsContext.putVar("heats", runHeats);
        jxlsContext.putVar(
            "heatSheetNames", RaceStatisticsUtils.makeSheetNamesUnique(heatSheetNames));

        List<Heat> allHeats =
            race.getHeats() != null && !race.getHeats().isEmpty()
                ? new ArrayList<>(race.getHeats())
                : Collections.singletonList(new Heat());
        jxlsContext.putVar("allHeats", allHeats);

        List<DriverAnalysisSummary> driverSummaries = new ArrayList<>();
        List<String> driverSheetNames = new ArrayList<>();
        RaceStatisticsUtils.prepareExportData(
            race, driversCopy, runHeats, driverSummaries, driverSheetNames);

        jxlsContext.putVar("driverSummaries", driverSummaries);
        jxlsContext.putVar("driverSheetNames", driverSheetNames);

        Season season = getSeason(race);
        List<SeasonStandingItem> seasonStandings =
            season != null
                ? SeasonStandingsCalculator.calculateStandings(season)
                : new ArrayList<>();
        jxlsContext.putVar("hasSeason", season != null);
        jxlsContext.putVar("season", season);
        jxlsContext.putVar("seasonName", season != null ? season.getName() : "");
        jxlsContext.putVar("seasonStandings", seasonStandings);
        jxlsContext.putVar("laps", buildExportLapData(runHeats));

        List<Integer> activeLanes = RaceStatisticsUtils.determineActiveLanes(race, runHeats);
        InputStream sanitizedIs =
            RaceStatisticsUtils.sanitizeWorkbookTemplate(is, activeLanes, race);
        org.jxls.util.JxlsHelper.getInstance().processTemplate(sanitizedIs, os, jxlsContext);
      }

      byte[] rawBytes = os.toByteArray();
      byte[] resultBytes = postProcessExportWorkbook(rawBytes, race);

      if (resultBytes.length == 0) {
        logger.error("Generated Excel workbook output is 0 bytes");
        ctx.status(500).result("Error: Generated Excel file was empty");
        return;
      }

      ctx.contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
          .header("Content-Disposition", "attachment; filename=\"race_export.xlsx\"")
          .result(resultBytes);
    } catch (Exception e) {
      logger.error("Error exporting XLS", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private InputStream loadTemplateInputStream(Context ctx) {
    String base64Template = null;
    try {
      Map<String, Object> body = ctx.bodyAsClass(Map.class);
      if (body != null) {
        base64Template = (String) body.get("templateBase64");
      }
    } catch (Exception ignored) {
    }

    InputStream is = null;
    if (base64Template != null && !base64Template.trim().isEmpty()) {
      try {
        String raw = base64Template.trim();
        if (raw.contains(",")) {
          raw = raw.substring(raw.indexOf(",") + 1);
        }
        byte[] decoded = Base64.getDecoder().decode(raw);
        if (decoded != null && decoded.length > 0) {
          is = new ByteArrayInputStream(decoded);
        }
      } catch (Exception e) {
        logger.warn("Custom base64 template decoding failed; falling back to default template", e);
      }
    }

    if (is == null) {
      is = getClass().getResourceAsStream("/race_export_template.xlsx");
      if (is == null) {
        is = getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
      }
      if (is == null) {
        logger.error("Default template race_export_template.xlsx not found");
        ctx.status(500).result("Default template not found");
        return null;
      }
    }
    return is;
  }

  public void saveRace(Context ctx) {
    try {
      Race race = ClientSubscriptionManager.getInstance().getRace();
      if (race == null) {
        ctx.status(404).result("No active race found");
        return;
      }

      if (race.getState() instanceof Racing) {
        ctx.status(400).result("Cannot save race while in racing state");
        return;
      }

      RaceSaveData saveData = new RaceSaveData();
      saveData.setModel(race.getRaceModel());
      saveData.setTrack(race.getTrack());
      saveData.setDrivers(race.getDrivers());
      saveData.setHeats(race.getHeats());
      saveData.setStateClassName(race.getState().getClass().getName());
      saveData.setAccumulatedRaceTime(race.getRaceTime());
      saveData.setHasRacedInCurrentHeat(race.hasRacedInCurrentHeat());
      saveData.setCurrentHeatIndex(race.getHeats().indexOf(race.getCurrentHeat()));

      saveData.setDemoMode(race.isDemoMode());
      saveData.setStatistics(race.getStatistics());
      saveData.setAutoSave(false);

      LocalDateTime now = LocalDateTime.now();
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
      String timestamp = now.format(formatter);
      String raceName = race.getRaceModel() != null ? race.getRaceModel().getName() : "Race";
      String customSaveName = null;

      try {
        if (ctx.body() != null && !ctx.body().trim().isEmpty()) {
          @SuppressWarnings("unchecked")
          Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
          if (body != null) {
            customSaveName = (String) body.get("saveName");
            if (customSaveName == null) {
              customSaveName = (String) body.get("name");
            }
          }
        }
      } catch (Exception e) {
        logger.warn("Failed to parse custom save name in saveRace body", e);
      }

      String saveName;
      if (customSaveName != null && !customSaveName.trim().isEmpty()) {
        String trimmed = customSaveName.trim();
        if (!trimmed.toLowerCase().endsWith(".json")) {
          trimmed += ".json";
        }
        saveName = trimmed;
      } else {
        String sanitized = raceName.replaceAll("[^a-zA-Z0-9_-]", "_");
        saveName = timestamp + "_" + sanitized + ".json";
      }
      saveData.setSaveName(saveName);

      DatabaseService dbService = DatabaseService.getInstance();
      dbService.saveManualRace(databaseContext, saveData);

      ctx.status(200).result("Race saved successfully: " + saveName);
    } catch (Exception e) {
      logger.error("Error saving race", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  public void getSavedRaces(Context ctx) {
    try {
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      List<RaceSaveData> saves = dbService.getSavedRaces(databaseContext, scope);
      List<SavedRaceDescriptor> files =
          saves.stream()
              .map(save -> new SavedRaceDescriptor(save.getSaveName(), save.isCorrupt()))
              .collect(Collectors.toList());
      ObjectMapper mapper = getObjectMapper();
      ctx.contentType("application/json").result(mapper.writeValueAsString(files));
    } catch (Exception e) {
      logger.error("Error getting saved races", e);
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  public void deleteSavedRace(Context ctx) {
    String saveName = ctx.pathParam("filename");
    try {
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      boolean deleted = dbService.deleteSavedRace(databaseContext, saveName, scope);
      if (deleted) {
        ctx.status(200).result("Save deleted: " + saveName);
      } else {
        ctx.status(404).result("Save not found or failed to delete: " + saveName);
      }
    } catch (Exception e) {
      logger.error("Error deleting saved race: {}", saveName, e);
      ctx.status(500).result("Error: " + e.getMessage());
    }
  }

  public void renameSavedRace(Context ctx) {
    try {
      String oldSaveName = ctx.pathParamMap().get("filename");
      boolean isDemo = "true".equalsIgnoreCase(ctx.queryParam("isDemo"));
      String newSaveName = null;

      try {
        if (ctx.body() != null && !ctx.body().trim().isEmpty()) {
          @SuppressWarnings("unchecked")
          Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
          if (body != null) {
            if (oldSaveName == null || oldSaveName.trim().isEmpty()) {
              oldSaveName = (String) body.get("oldFilename");
              if (oldSaveName == null) {
                oldSaveName = (String) body.get("filename");
              }
            }
            newSaveName = (String) body.get("newFilename");
            if (newSaveName == null) {
              newSaveName = (String) body.get("newName");
            }
            if (newSaveName == null) {
              newSaveName = (String) body.get("saveName");
            }
            if (body.containsKey("isDemo")) {
              Object d = body.get("isDemo");
              if (d instanceof Boolean) {
                isDemo = (Boolean) d;
              } else if (d instanceof String) {
                isDemo = Boolean.parseBoolean((String) d);
              }
            }
          }
        }
      } catch (Exception e) {
        logger.warn("Failed to parse renameSavedRace body", e);
      }

      if (oldSaveName == null || oldSaveName.trim().isEmpty()) {
        ctx.status(400).result("Old filename is required");
        return;
      }
      if (newSaveName == null || newSaveName.trim().isEmpty()) {
        ctx.status(400).result("New filename is required");
        return;
      }

      DatabaseService dbService = DatabaseService.getInstance();
      RaceScope scope = RaceScope.fromBoolean(isDemo);
      boolean renamed =
          dbService.renameSavedRace(databaseContext, oldSaveName.trim(), newSaveName.trim(), scope);
      if (!renamed) {
        ctx.status(404).result("Save file not found or could not be renamed");
        return;
      }

      String normalizedNewName = newSaveName.trim();
      if (!normalizedNewName.toLowerCase().endsWith(".json")) {
        normalizedNewName += ".json";
      }

      ctx.status(200).result("Race save renamed successfully: " + normalizedNewName);
    } catch (Exception e) {
      logger.error("Error renaming saved race", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void loadRace(Context ctx) {
    try {
      Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
      String saveName = (String) body.get("filename");
      String customName = (String) body.get("name");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      if (saveName == null) {
        ctx.status(400).result("Filename is required");
        return;
      }

      DatabaseService dbService = DatabaseService.getInstance();
      RaceSaveData saveData = dbService.getSavedRace(databaseContext, saveName, scope);

      if (saveData == null) {
        ctx.status(404).result("Save file not found");
        return;
      }

      if (customName != null && !customName.trim().isEmpty() && saveData.getModel() != null) {
        saveData.setModel(
            new com.antigravity.models.Race.Builder() // fqn-collision
                .from(saveData.getModel())
                .withName(customName.trim())
                .build());
      }

      Track savedTrack = saveData.getTrack();
      Track dbTrack =
          DatabaseService.getInstance()
              .getTrack(databaseContext, saveData.getModel().getTrackEntityId());

      Track trackToUse = savedTrack;
      if (dbTrack != null && dbTrack.getLanes().size() == savedTrack.getLanes().size()) {
        trackToUse = dbTrack;
      }

      if (saveData.getHeats() != null) {
        for (Heat heat : saveData.getHeats()) {
          heat.initializeStandings(
              saveData.getModel().getHeatScoring(), saveData.getModel().isPractice());
        }
      }

      Race race =
          new Race.Builder()
              .model(saveData.getModel())
              .drivers(saveData.getDrivers())
              .track(trackToUse)
              .heats(saveData.getHeats())
              .currentHeatIndex(saveData.getCurrentHeatIndex())
              .accumulatedRaceTime(saveData.getAccumulatedRaceTime())
              .hasRacedInCurrentHeat(saveData.isHasRacedInCurrentHeat())
              .autoStartFired(saveData.isAutoStartFired())
              .autoAdvanceFired(saveData.isAutoAdvanceFired())
              .stateClassName(saveData.getStateClassName())
              .isDemoMode(saveData.isDemoMode())
              .statistics(saveData.getStatistics())
              .databaseContext(databaseContext)
              .build();

      ClientSubscriptionManager.getInstance().setRace(race);
      race.init();
      AnalyticsService.getInstance().trackRaceStart(race);

      ClientSubscriptionManager.getInstance().broadcast(race.createSnapshot());

      ctx.status(200).result("Race loaded successfully");
    } catch (Exception e) {
      logger.error("Error loading race", e);
      ctx.status(500).result("Internal Server Error: " + e.getMessage());
    }
  }

  private ObjectMapper getObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.enable(SerializationFeature.INDENT_OUTPUT);
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    return mapper;
  }

  public static class ExportLapData {
    private final String driverName;
    private final String actualDriverName;
    private final int heatNumber;
    private final int laneNumber;
    private final double absoluteHeatLapTime;
    private final double absoluteLapTime;
    private final double lapTime;
    private final List<Double> segments;

    public ExportLapData(
        String driverName,
        String actualDriverName,
        int heatNumber,
        int laneNumber,
        double absoluteHeatLapTime,
        double absoluteLapTime,
        double lapTime,
        List<Double> segments) {
      this.driverName = driverName;
      this.actualDriverName = actualDriverName;
      this.heatNumber = heatNumber;
      this.laneNumber = laneNumber;
      this.absoluteHeatLapTime = absoluteHeatLapTime;
      this.absoluteLapTime = absoluteLapTime;
      this.lapTime = lapTime;
      this.segments = segments != null ? segments : new ArrayList<>();
    }

    public String getDriverName() {
      return driverName;
    }

    public String getActualDriverName() {
      return actualDriverName;
    }

    public int getHeatNumber() {
      return heatNumber;
    }

    public int getLaneNumber() {
      return laneNumber;
    }

    public double getAbsoluteHeatLapTime() {
      return absoluteHeatLapTime;
    }

    public double getAbsoluteLapTime() {
      return absoluteLapTime;
    }

    public double getLapTime() {
      return lapTime;
    }

    public List<Double> getSegments() {
      return segments;
    }
  }
}
