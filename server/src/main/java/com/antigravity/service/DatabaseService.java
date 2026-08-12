// CHECKSTYLE:OFF FileLength
package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.Event;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.RecordData;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.util.SeasonPointsCalculator;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("checkstyle:FileLength")
public class DatabaseService {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseService.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();
  private static DatabaseService instance = new DatabaseService();
  private boolean replayMode = false;

  public void setReplayMode(boolean replayMode) {
    this.replayMode = replayMode;
  }

  public boolean isReplayMode() {
    return replayMode;
  }

  public static DatabaseService getInstance() {
    return instance;
  }

  public static void setInstance(DatabaseService service) {
    instance = service;
  }

  public DatabaseService() {}

  public void resetToFactory(DatabaseContext context) {
    logger.info("Resetting database to factory settings...");

    String dbName = context.getCurrentDatabaseName();
    try (InputStream is = getClass().getResourceAsStream("/defaults/factory_default.zip")) {
      if (is != null) {
        context.importDatabase(dbName, is);
        new AssetService(context, context.getDataRoot() + dbName + "/assets").backfillDefaults();
        logger.info("Database reset to factory complete.");
        return;
      }
    } catch (Exception e) {
      logger.warn(
          "Failed to load factory_default.zip, falling back to programmatic initialization", e);
    }

    // Backfill assets first so drivers can find sound and helmet assets
    new AssetService(context, context.getDataRoot() + context.getCurrentDatabaseName() + "/assets")
        .backfillDefaults();

    resetDrivers(context);
    resetTeams(context);
    Track track = resetTracks(context);
    resetRaces(context, track);

    logger.info("Database reset complete.");
  }

  @SuppressWarnings("checkstyle:MethodLength")
  private void resetDrivers(DatabaseContext context) {
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    driverRepo.drop();
    context.resetSequence("drivers");

    AssetService assetService =
        new AssetService(
            context, context.getDataRoot() + context.getCurrentDatabaseName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();

    List<AssetMessage> helmetAssets =
        allAssets.stream()
            .filter(a -> a.getName().toLowerCase().contains("helmet"))
            .collect(Collectors.toList());

    AssetMessage beepSound =
        allAssets.stream()
            .filter(
                a ->
                    "default_beep".equals(a.getModel().getEntityId())
                        || "Lap Beep".equalsIgnoreCase(a.getName())
                        || a.getName().toLowerCase().contains("beep"))
            .findFirst()
            .orElse(null);

    AssetMessage drivebySound =
        allAssets.stream()
            .filter(
                a ->
                    "default_driveby".equals(a.getModel().getEntityId())
                        || "Lap Driveby".equalsIgnoreCase(a.getName())
                        || a.getName().toLowerCase().contains("driveby"))
            .findFirst()
            .orElse(null);

    AssetMessage penaltySound =
        allAssets.stream()
            .filter(
                a ->
                    "default_penalty".equals(a.getModel().getEntityId())
                        || "Penalty".equalsIgnoreCase(a.getName())
                        || a.getName().toLowerCase().contains("penalty"))
            .findFirst()
            .orElse(null);

    String lapSoundUrl = beepSound != null ? beepSound.getUrl() : "/assets/default_beep_beep.wav";
    String bestLapSoundUrl =
        drivebySound != null ? drivebySound.getUrl() : "/assets/default_driveby_driveby.wav";
    String penaltySoundUrl =
        penaltySound != null ? penaltySound.getUrl() : "/assets/default_penalty_penalty.wav";
    AudioConfig lapAudio = new AudioConfig("preset", lapSoundUrl, null);
    AudioConfig bestLapAudio = new AudioConfig("preset", bestLapSoundUrl, null);
    AudioConfig penaltyAudio = new AudioConfig("preset", penaltySoundUrl, null);

    List<Driver> initialDrivers = new ArrayList<>();
    initialDrivers.add(
        createDriver(
            "Abby",
            "Bank Farter",
            helmetAssets,
            1,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Andrea",
            "The Pants",
            helmetAssets,
            2,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Austin",
            "Sports Mode",
            helmetAssets,
            3,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Christine",
            "Peo Fuente",
            helmetAssets,
            4,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Dave",
            "Bad Cheese",
            helmetAssets,
            5,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Gene",
            "Swamper Gene",
            helmetAssets,
            6,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Meyer",
            "Bull Dog",
            helmetAssets,
            7,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));
    initialDrivers.add(
        createDriver(
            "Noah Jack",
            "Boy Wonder",
            helmetAssets,
            8,
            lapAudio,
            bestLapAudio,
            penaltyAudio,
            context.getNextSequence("drivers")));

    for (Driver d : initialDrivers) {
      driverRepo.save(d);
    }
    logger.info("Drivers reset.");
  }

  private Driver createDriver(
      String name,
      String nickname,
      List<AssetMessage> helmetAssets,
      int index,
      AudioConfig lapAudio,
      AudioConfig bestLapAudio,
      AudioConfig penaltyAudio,
      String sequenceId) {
    String avatarUrl = null;
    if (!helmetAssets.isEmpty()) {
      avatarUrl = helmetAssets.get((index - 1) % helmetAssets.size()).getUrl();
    }
    return new Driver(
        name,
        nickname,
        avatarUrl,
        lapAudio,
        bestLapAudio,
        penaltyAudio,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        sequenceId,
        null);
  }

  private Track resetTracks(DatabaseContext context) {
    SqliteRepository<Track> trackRepo = new SqliteRepository<>(context, "tracks", Track.class);
    trackRepo.drop();
    context.resetSequence("tracks");
    context.resetSequence("lanes");

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("#ef4444", "black", 0, context.getNextSequence("lanes"), null));
    lanes.add(new Lane("#ffffff", "black", 0, context.getNextSequence("lanes"), null));
    lanes.add(new Lane("#3b82f6", "black", 0, context.getNextSequence("lanes"), null));
    lanes.add(new Lane("#fbbf24", "black", 0, context.getNextSequence("lanes"), null));

    ArduinoConfig config = new ArduinoConfig();
    List<ArduinoConfig> configs = new ArrayList<>();
    configs.add(config);
    Track track =
        new Track.Builder()
            .name("The Heights")
            .numTrackSections(100)
            .lanes(lanes)
            .arduinoConfigs(configs)
            .trackmateConfigs(null)
            .entityId(context.getNextSequence("tracks"))
            .id(null)
            .build();

    trackRepo.save(track);
    logger.info("Tracks reset.");
    return track;
  }

  private void resetRaces(DatabaseContext context, Track track) {
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    raceRepo.drop();
    context.resetSequence("races");

    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 60, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race =
        new Race.Builder()
            .withName("Time Based")
            .withTrackEntityId(track.getEntityId())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withMinLapTime(3.0)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withStartBehindSensor(true)
            .withEntityId(context.getNextSequence("races"))
            .build();

    raceRepo.save(race);

    heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 15, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.FASTEST_LAP_TIME);

    race =
        new Race.Builder()
            .withName("Lap Based")
            .withTrackEntityId(track.getEntityId())
            .withHeatRotationType(HeatRotationType.FriendlyRoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withMinLapTime(3.0)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withStartBehindSensor(true)
            .withEntityId(context.getNextSequence("races"))
            .build();

    raceRepo.save(race);

    heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);

    Race practiceRace =
        new Race.Builder()
            .withName("Practice")
            .withTrackEntityId(track.getEntityId())
            .withHeatRotationType(HeatRotationType.Custom)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withMinLapTime(3.0)
            .withAutoAdvanceTime(0.0)
            .withAutoStartTime(0.0)
            .withAutoAdvanceWarmupTime(0.0)
            .withAutoStartWarmupTime(0.0)
            .withStartBehindSensor(true)
            .withCustomRotationAssetId("default_practice_single_heat")
            .withPractice(true)
            .withEntityId(context.getNextSequence("races"))
            .build();

    raceRepo.save(practiceRace);
    logger.info("Races reset.");
  }

  public void backfillRaces(DatabaseContext context) {
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    boolean hasPractice = false;
    for (Race race : races) {
      if ("Practice".equals(race.getName())) {
        hasPractice = true;
        break;
      }
    }

    if (!hasPractice) {
      SqliteRepository<Track> trackRepo = new SqliteRepository<>(context, "tracks", Track.class);
      List<Track> tracks = trackRepo.findAll();
      Track track = tracks.isEmpty() ? null : tracks.get(0);
      if (track != null) {
        HeatScoring heatScoring =
            new HeatScoring(
                FinishMethod.Timed,
                0,
                HeatRanking.LAP_COUNT,
                HeatRankingTiebreaker.AVERAGE_LAP_TIME);
        Race practiceRace =
            new Race.Builder()
                .withName("Practice")
                .withTrackEntityId(track.getEntityId())
                .withHeatRotationType(HeatRotationType.Custom)
                .withHeatScoring(heatScoring)
                .withOverallScoring(new OverallScoring())
                .withMinLapTime(3.0)
                .withAutoAdvanceTime(0.0)
                .withAutoStartTime(0.0)
                .withAutoAdvanceWarmupTime(0.0)
                .withAutoStartWarmupTime(0.0)
                .withStartBehindSensor(true)
                .withCustomRotationAssetId("default_practice_single_heat")
                .withPractice(true)
                .withEntityId(context.getNextSequence("races"))
                .build();
        raceRepo.save(practiceRace);
      }
    }
  }

  private void resetTeams(DatabaseContext context) {
    SqliteRepository<Team> teamRepo = new SqliteRepository<>(context, "teams", Team.class);
    SqliteRepository<Driver> driverRepo = new SqliteRepository<>(context, "drivers", Driver.class);
    teamRepo.drop();
    context.resetSequence("teams");

    List<Driver> allDrivers = driverRepo.findAll();
    Map<String, Driver> nameToDriver =
        allDrivers.stream().collect(Collectors.toMap(Driver::getName, d -> d, (a, b) -> a));

    List<String> boysNames = Arrays.asList("Austin", "Dave", "Gene");
    List<String> girlsNames = Arrays.asList("Abby", "Andrea", "Christine");

    List<String> boysIds = new ArrayList<>();
    for (String name : boysNames) {
      Driver d = nameToDriver.get(name);
      if (d != null) boysIds.add(d.getEntityId());
    }

    List<String> girlsIds = new ArrayList<>();
    for (String name : girlsNames) {
      Driver d = nameToDriver.get(name);
      if (d != null) girlsIds.add(d.getEntityId());
    }

    AssetService assetService =
        new AssetService(
            context, context.getDataRoot() + context.getCurrentDatabaseName() + "/assets");
    List<AssetMessage> allAssets = assetService.getAllAssets();
    List<AssetMessage> helmetAssets =
        allAssets.stream()
            .filter(a -> a.getName().toLowerCase().contains("helmet"))
            .collect(Collectors.toList());

    String boysAvatar = "";
    String girlsAvatar = "";
    if (!helmetAssets.isEmpty()) {
      boysAvatar = helmetAssets.get(0).getUrl();
      girlsAvatar =
          helmetAssets.size() > 1 ? helmetAssets.get(helmetAssets.size() - 1).getUrl() : boysAvatar;
    }

    teamRepo.save(
        new Team("The Boys", boysAvatar, boysIds, context.getNextSequence("teams"), null));
    teamRepo.save(
        new Team("The Girls", girlsAvatar, girlsIds, context.getNextSequence("teams"), null));
    logger.info("Teams reset.");
  }

  public Race getRace(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "races", Race.class).findByEntityId(entityId);
  }

  public Event getEvent(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "events", Event.class).findByEntityId(entityId);
  }

  public List<Event> getEvents(DatabaseContext context) {
    return new SqliteRepository<>(context, "events", Event.class).findAll();
  }

  public Track getTrack(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "tracks", Track.class).findByEntityId(entityId);
  }

  public Driver getDriver(DatabaseContext context, String entityId) {
    return new SqliteRepository<>(context, "drivers", Driver.class).findByEntityId(entityId);
  }

  public List<Driver> getDrivers(DatabaseContext context, List<String> entityIds) {
    SqliteRepository<Driver> repo = new SqliteRepository<>(context, "drivers", Driver.class);
    List<Driver> orderedDrivers = new ArrayList<>();
    if (entityIds != null) {
      for (String id : entityIds) {
        Driver d = repo.findByEntityId(id);
        if (d != null) orderedDrivers.add(d);
      }
    }
    return orderedDrivers;
  }

  public List<Team> getTeams(DatabaseContext context, List<String> entityIds) {
    SqliteRepository<Team> repo = new SqliteRepository<>(context, "teams", Team.class);
    List<Team> orderedTeams = new ArrayList<>();
    if (entityIds != null) {
      for (String id : entityIds) {
        Team t = repo.findByEntityId(id);
        if (t != null) orderedTeams.add(t);
      }
    }
    return orderedTeams;
  }

  public List<Team> getAllTeams(DatabaseContext context) {
    return new SqliteRepository<>(context, "teams", Team.class).findAll();
  }

  public Track getFactoryTrack() {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("#ef4444", "black", 0));
    lanes.add(new Lane("#ffffff", "black", 0));
    lanes.add(new Lane("#3b82f6", "black", 0));
    lanes.add(new Lane("#fbbf24", "black", 0));

    ArduinoConfig config = new ArduinoConfig();
    List<ArduinoConfig> configs = new ArrayList<>();
    configs.add(config);
    return new Track.Builder()
        .name("New Track")
        .numTrackSections(100)
        .lanes(lanes)
        .arduinoConfigs(configs)
        .trackmateConfigs(null)
        .entityId(null)
        .id(null)
        .build();
  }

  public void saveRaceHistory(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null || replayMode) {
      return;
    }
    boolean isDemo = runtimeRace.isDemoMode();
    String tableName = getCollectionName("race_history", isDemo);
    try {
      SqliteRepository<RaceHistoryRecord> repo =
          new SqliteRepository<>(context, tableName, RaceHistoryRecord.class);
      RaceHistoryRecord record = new RaceHistoryRecord();
      record.setId(java.util.UUID.randomUUID().toString());
      record.setDemo(isDemo);
      if (runtimeRace.getRaceModel() != null) {
        record.setOriginalEntityId(runtimeRace.getRaceModel().getEntityId());
        record.setModel(runtimeRace.getRaceModel());
      }
      record.setTrack(runtimeRace.getTrack());
      record.setDrivers(runtimeRace.getDrivers());
      record.setHeats(runtimeRace.getHeats());
      record.setAccumulatedRaceTime(runtimeRace.getRaceTime());
      record.setStatistics(runtimeRace.getStatistics());

      EventExecutionManager eventMgr = EventExecutionManager.getInstance();
      if (eventMgr.isEventActive()) {
        record.setEventRace(true);
        if (eventMgr.getActiveEvent() != null) {
          record.setEventId(eventMgr.getActiveEvent().getEntityId());
          record.setEventName(eventMgr.getActiveEvent().getName());
        }
      }

      try {
        List<SeasonDriverResult> driverResults =
            SeasonPointsCalculator.calculateDriverResultsForRace(runtimeRace);
        record.setDriverResults(driverResults);
      } catch (Exception ex) {
        logger.warn("Could not calculate driver results for race history record", ex);
      }

      repo.save(record);
      logger.info("Race successfully saved to {}", tableName);
    } catch (Exception e) {
      logger.error("Failed to save race to history", e);
    }
  }

  public void saveRawRaceHistoryRecord(DatabaseContext context, RaceHistoryRecord record) {
    if (context == null || record == null) return;
    try {
      boolean isDemo = record.isDemo();
      String tableName = getCollectionName("race_history", isDemo);
      SqliteRepository<RaceHistoryRecord> repo =
          new SqliteRepository<>(context, tableName, RaceHistoryRecord.class);
      repo.save(record);
      logger.info("Raw race history record successfully saved to {}", tableName);
    } catch (Exception e) {
      logger.error("Failed to save raw race history record", e);
    }
  }

  public Season getSeason(DatabaseContext context, String seasonId) {
    if (seasonId == null || seasonId.trim().isEmpty() || context == null) {
      return null;
    }
    return new SqliteRepository<>(context, "seasons", Season.class).findByEntityId(seasonId);
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      long timestamp,
      boolean isDemo,
      List<SeasonDriverResult> driverResults) {
    if (seasonId == null
        || seasonId.trim().isEmpty()
        || driverResults == null
        || driverResults.isEmpty()) {
      return;
    }
    try {
      SqliteRepository<Season> repo = new SqliteRepository<>(context, "seasons", Season.class);
      Season season = repo.findByEntityId(seasonId);
      if (season == null) {
        logger.warn("Season not found for entity_id: {}", seasonId);
        return;
      }
      List<SeasonRaceRecord> races = season.getRaces();
      if (races == null) races = new ArrayList<>();
      String nextRaceId = String.valueOf(races.size() + 1);
      long recordTimestamp = timestamp > 0 ? timestamp : System.currentTimeMillis();
      SeasonRaceRecord newRecord =
          new SeasonRaceRecord(nextRaceId, raceName, recordTimestamp, isDemo, driverResults);
      races.add(newRecord);

      Season updatedSeason =
          new Season(season.getName(), season.getDrops(), races, season.getEntityId(), null);
      repo.save(updatedSeason);
      logger.info(
          "Committed race '{}' results (isDemo={}) to season '{}'",
          raceName,
          isDemo,
          season.getName());
    } catch (Exception e) {
      logger.error("Failed to commit race to season", e);
    }
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      boolean isDemo,
      List<SeasonDriverResult> driverResults) {
    commitRaceToSeason(context, seasonId, raceName, 0L, isDemo, driverResults);
  }

  public void commitRaceToSeason(
      DatabaseContext context,
      String seasonId,
      String raceName,
      List<SeasonDriverResult> driverResults) {
    commitRaceToSeason(context, seasonId, raceName, 0L, false, driverResults);
  }

  public void saveRaceRecords(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null || runtimeRace.getRaceModel() == null || replayMode) return;
    boolean isDemo = runtimeRace.isDemoMode();
    String raceId = runtimeRace.getRaceModel().getEntityId();
    String tableName = getCollectionName("race_records", isDemo);
    try {
      context
          .getConnection()
          .createStatement()
          .execute(
              "CREATE TABLE IF NOT EXISTS "
                  + tableName
                  + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      String sql =
          "INSERT INTO "
              + tableName
              + " (race_id, records_blob) VALUES (?, ?) "
              + "ON CONFLICT(race_id) DO UPDATE SET records_blob=excluded.records_blob";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, raceId);
        pstmt.setBytes(2, runtimeRace.getRecordData().toByteArray());
        pstmt.executeUpdate();
      }
      logger.info(
          "SAVED RACE RECORDS: race_id={}, isDemo={}, records_size={}",
          raceId,
          isDemo,
          runtimeRace.getRecordData().toByteArray().length);
    } catch (Exception e) {
      logger.error("Failed to save race records", e);
    }
  }

  public RecordData getRaceRecords(DatabaseContext context, String raceId, boolean isDemo) {
    String tableName = getCollectionName("race_records", isDemo);
    try {
      context
          .getConnection()
          .createStatement()
          .execute(
              "CREATE TABLE IF NOT EXISTS "
                  + tableName
                  + " (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      String sql = "SELECT records_blob FROM " + tableName + " WHERE race_id = ?";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        pstmt.setString(1, raceId);
        try (ResultSet rs = pstmt.executeQuery()) {
          if (rs.next()) {
            byte[] bytes = rs.getBytes("records_blob");
            if (bytes != null) {
              logger.info(
                  "LOADED RACE RECORDS: race_id={}, isDemo={}, records_size={}",
                  raceId,
                  isDemo,
                  bytes.length);
              return RecordData.parseFrom(bytes);
            }
          }
        }
      }
    } catch (Exception e) {
      logger.error("Failed to load race records", e);
    }
    return null;
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public void updateGlobalStatistics(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null) return;
    boolean isDemo = runtimeRace.isDemoMode();
    String raceId =
        runtimeRace.getRaceModel() != null ? runtimeRace.getRaceModel().getEntityId() : "unknown";
    String tableName = getCollectionName("global_statistics", isDemo);
    try {
      SqliteRepository<GlobalStatistics> statsRepo =
          new SqliteRepository<>(context, tableName, GlobalStatistics.class);
      GlobalStatistics stats = statsRepo.findByEntityId(raceId);
      if (stats == null) {
        stats = new GlobalStatistics(raceId);
      }

      stats.addRaceCount();

      if (runtimeRace.getStatistics() != null) {
        stats.addRaceTimeMs(runtimeRace.getStatistics().getDurationMillis());
      }

      double totalLaps = 0;
      for (RaceParticipant p : runtimeRace.getDrivers()) {
        totalLaps += p.getTotalLaps();
      }
      stats.addLaps(totalLaps);

      com.antigravity.proto.RecordData recordData = runtimeRace.getRecordData(); // fqn-collision
      com.antigravity.proto.OverallRecords overall = recordData.getOverall(); // fqn-collision

      if (overall.hasFastestLap()) {
        com.antigravity.proto.RecordEntry fl = overall.getFastestLap(); // fqn-collision
        if (stats.getFastestLapTime() == 0.0 || fl.getValue() < stats.getFastestLapTime()) {
          stats.setFastestLapTime(fl.getValue());
          stats.setFastestLapDriverName(fl.getHolderName());
          stats.setFastestLapDriverNickname(fl.getHolderNickname());
          stats.setFastestLapTeamName(fl.getHolderTeamName());
          stats.setFastestLapDate(fl.getDate());
          if (runtimeRace.getTrack() != null) {
            stats.setFastestLapTrackName(runtimeRace.getTrack().getName());
          }
        }
      }

      if (overall.hasHighestScore()) {
        com.antigravity.proto.RecordEntry hs = overall.getHighestScore(); // fqn-collision
        if (stats.getHighestScore() == 0.0 || hs.getValue() > stats.getHighestScore()) {
          stats.setHighestScore(hs.getValue());
          stats.setHighestScoreHolderName(hs.getHolderName());
          stats.setHighestScoreHolderNickname(hs.getHolderNickname());
          stats.setHighestScoreTeamName(hs.getHolderTeamName());
          stats.setHighestScoreDate(hs.getDate());
          if (runtimeRace.getTrack() != null) {
            stats.setHighestScoreTrackName(runtimeRace.getTrack().getName());
          }
        }
      }

      if (runtimeRace.getTrack() != null) {
        stats.setFastestLapTrackName(runtimeRace.getTrack().getName());
        stats.setHighestScoreTrackName(runtimeRace.getTrack().getName());
      }

      List<Double> laneFastestTimes =
          stats.getLaneFastestLapTimes() != null
              ? new ArrayList<>(stats.getLaneFastestLapTimes())
              : new ArrayList<>();
      List<String> laneFastestHolders =
          stats.getLaneFastestLapDriverNames() != null
              ? new ArrayList<>(stats.getLaneFastestLapDriverNames())
              : new ArrayList<>();
      List<String> laneFastestNicknames =
          stats.getLaneFastestLapDriverNicknames() != null
              ? new ArrayList<>(stats.getLaneFastestLapDriverNicknames())
              : new ArrayList<>();
      List<String> laneFastestTeams =
          stats.getLaneFastestLapTeamNames() != null
              ? new ArrayList<>(stats.getLaneFastestLapTeamNames())
              : new ArrayList<>();
      List<Long> laneFastestDates =
          stats.getLaneFastestLapDates() != null
              ? new ArrayList<>(stats.getLaneFastestLapDates())
              : new ArrayList<>();

      for (int i = 0; i < overall.getLaneFastestLapCount(); i++) {
        com.antigravity.proto.RecordEntry entry = overall.getLaneFastestLap(i); // fqn-collision
        double newVal = entry.getValue();
        if (i >= laneFastestTimes.size()) {
          laneFastestTimes.add(newVal);
          laneFastestHolders.add(entry.getHolderName());
          laneFastestNicknames.add(entry.getHolderNickname());
          laneFastestTeams.add(entry.getHolderTeamName());
          laneFastestDates.add(entry.getDate());
        } else {
          double existingVal = laneFastestTimes.get(i);
          if (newVal > 0.0 && (existingVal == 0.0 || newVal < existingVal)) {
            laneFastestTimes.set(i, newVal);
            laneFastestHolders.set(i, entry.getHolderName());
            laneFastestNicknames.set(i, entry.getHolderNickname());
            laneFastestTeams.set(i, entry.getHolderTeamName());
            while (laneFastestDates.size() <= i) laneFastestDates.add(0L);
            laneFastestDates.set(i, entry.getDate());
          }
        }
      }
      stats.setLaneFastestLapTimes(laneFastestTimes);
      stats.setLaneFastestLapDriverNames(laneFastestHolders);
      stats.setLaneFastestLapDriverNicknames(laneFastestNicknames);
      stats.setLaneFastestLapTeamNames(laneFastestTeams);
      stats.setLaneFastestLapDates(laneFastestDates);

      List<Double> laneHighestScores =
          stats.getLaneHighestScores() != null
              ? new ArrayList<>(stats.getLaneHighestScores())
              : new ArrayList<>();
      List<String> laneHighestHolders =
          stats.getLaneHighestScoreHolderNames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreHolderNames())
              : new ArrayList<>();
      List<String> laneHighestNicknames =
          stats.getLaneHighestScoreHolderNicknames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreHolderNicknames())
              : new ArrayList<>();
      List<String> laneHighestTeams =
          stats.getLaneHighestScoreTeamNames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreTeamNames())
              : new ArrayList<>();
      List<Long> laneHighestDates =
          stats.getLaneHighestScoreDates() != null
              ? new ArrayList<>(stats.getLaneHighestScoreDates())
              : new ArrayList<>();

      for (int i = 0; i < overall.getLaneHighestScoreCount(); i++) {
        com.antigravity.proto.RecordEntry entry = overall.getLaneHighestScore(i); // fqn-collision
        double newVal = entry.getValue();
        if (i >= laneHighestScores.size()) {
          laneHighestScores.add(newVal);
          laneHighestHolders.add(entry.getHolderName());
          laneHighestNicknames.add(entry.getHolderNickname());
          laneHighestTeams.add(entry.getHolderTeamName());
          laneHighestDates.add(entry.getDate());
        } else {
          double existingVal = laneHighestScores.get(i);
          if (existingVal == 0.0 || newVal > existingVal) {
            laneHighestScores.set(i, newVal);
            laneHighestHolders.set(i, entry.getHolderName());
            laneHighestNicknames.set(i, entry.getHolderNickname());
            laneHighestTeams.set(i, entry.getHolderTeamName());
            while (laneHighestDates.size() <= i) laneHighestDates.add(0L);
            laneHighestDates.set(i, entry.getDate());
          }
        }
      }
      stats.setLaneHighestScores(laneHighestScores);
      stats.setLaneHighestScoreHolderNames(laneHighestHolders);
      stats.setLaneHighestScoreHolderNicknames(laneHighestNicknames);
      stats.setLaneHighestScoreTeamNames(laneHighestTeams);
      stats.setLaneHighestScoreDates(laneHighestDates);

      statsRepo.save(stats);
      logger.info("Race statistics updated for race: {}", raceId);
    } catch (Exception e) {
      logger.error("Failed to update global statistics for race {}", raceId, e);
    }
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, RaceScope scope) {
    if (raceEntityId == null) {
      return new GlobalStatistics();
    }
    String tableName = getCollectionName("global_statistics", scope);
    GlobalStatistics stats =
        new SqliteRepository<>(context, tableName, GlobalStatistics.class)
            .findByEntityId(raceEntityId);
    if (stats == null) {
      return new GlobalStatistics(raceEntityId);
    }
    return stats;
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, boolean isDemo) {
    return getGlobalStatistics(context, raceEntityId, RaceScope.fromBoolean(isDemo));
  }

  public List<RaceHistoryRecord> getRaceHistory(DatabaseContext context, RaceScope scope) {
    String tableName = getCollectionName("race_history", scope);
    return new SqliteRepository<>(context, tableName, RaceHistoryRecord.class).findAll();
  }

  public List<RaceHistoryRecord> getRaceHistory(DatabaseContext context, boolean isDemo) {
    return getRaceHistory(context, RaceScope.fromBoolean(isDemo));
  }

  public RaceHistoryRecord getRaceHistoryById(DatabaseContext context, String id, RaceScope scope) {
    String tableName = getCollectionName("race_history", scope);
    return new SqliteRepository<>(context, tableName, RaceHistoryRecord.class).findByEntityId(id);
  }

  public RaceHistoryRecord getRaceHistoryById(DatabaseContext context, String id, boolean isDemo) {
    return getRaceHistoryById(context, id, RaceScope.fromBoolean(isDemo));
  }

  public void upsertAutoSave(DatabaseContext context, RaceSaveData data) {
    if (data == null) {
      return;
    }
    boolean isDemo = data.isDemoMode();
    String tableName = getCollectionName("saved_races", isDemo);
    try {
      context.ensureTable(tableName);
      String sql =
          "INSERT INTO "
              + tableName
              + " (entity_id, sequence_id, json_data) VALUES (?, ?, ?) "
              + "ON CONFLICT(entity_id) DO UPDATE SET sequence_id=excluded.sequence_id, json_data=excluded.json_data";
      try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
        String entityId =
            data.getSaveName() != null ? data.getSaveName() : UUID.randomUUID().toString();
        pstmt.setString(1, entityId);
        pstmt.setString(2, data.getSaveName());
        pstmt.setString(3, objectMapper.writeValueAsString(data));
        pstmt.executeUpdate();
      }
    } catch (Exception e) {
      logger.error("Failed to auto-save race", e);
    }
  }

  public void saveManualRace(DatabaseContext context, RaceSaveData data) {
    upsertAutoSave(context, data);
  }

  public List<RaceSaveData> getSavedRaces(DatabaseContext context, RaceScope scope) {
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    List<RaceSaveData> saves = new ArrayList<>();
    String sql = "SELECT json_data FROM " + tableName;
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql);
        ResultSet rs = pstmt.executeQuery()) {
      while (rs.next()) {
        String json = rs.getString("json_data");
        if (json != null && !json.trim().isEmpty()) {
          RaceSaveData race = objectMapper.readValue(json, RaceSaveData.class);
          if (race != null) {
            if (race.getHeats() != null && race.getModel() != null) {
              for (Heat heat : race.getHeats()) {
                heat.initializeStandings(
                    race.getModel().getHeatScoring(), race.getModel().isPractice());
              }
            }
            saves.add(race);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error reading saved races", e);
    }
    return saves;
  }

  public List<RaceSaveData> getSavedRaces(DatabaseContext context, boolean isDemo) {
    return getSavedRaces(context, RaceScope.fromBoolean(isDemo));
  }

  public RaceSaveData getSavedRace(DatabaseContext context, String saveName, RaceScope scope) {
    if (context == null || saveName == null) return null;
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    String sql = "SELECT json_data FROM " + tableName + " WHERE sequence_id = ? OR entity_id = ?";
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, saveName);
      pstmt.setString(2, saveName);
      try (ResultSet rs = pstmt.executeQuery()) {
        if (rs.next()) {
          String json = rs.getString("json_data");
          if (json != null && !json.trim().isEmpty()) {
            return objectMapper.readValue(json, RaceSaveData.class);
          }
        }
      }
    } catch (Exception e) {
      logger.error("Error getting saved race {}", saveName, e);
    }
    return null;
  }

  public RaceSaveData getSavedRace(DatabaseContext context, String saveName, boolean isDemo) {
    return getSavedRace(context, saveName, RaceScope.fromBoolean(isDemo));
  }

  public boolean deleteSavedRace(DatabaseContext context, String saveName, RaceScope scope) {
    if (context == null || saveName == null) return false;
    String tableName = getCollectionName("saved_races", scope);
    context.ensureTable(tableName);
    String sql =
        "DELETE FROM "
            + tableName
            + " WHERE sequence_id = ? OR entity_id = ? OR json_extract(json_data, '$.saveName') = ? OR json_extract(json_data, '$.save_name') = ?";
    try (PreparedStatement pstmt = context.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, saveName);
      pstmt.setString(2, saveName);
      pstmt.setString(3, saveName);
      pstmt.setString(4, saveName);
      int rows = pstmt.executeUpdate();
      return rows > 0;
    } catch (Exception e) {
      logger.error("Error deleting saved race {}", saveName, e);
      return false;
    }
  }

  public boolean deleteSavedRace(DatabaseContext context, String saveName, boolean isDemo) {
    return deleteSavedRace(context, saveName, RaceScope.fromBoolean(isDemo));
  }

  public void deleteAllRaceData(DatabaseContext context, String raceEntityId) {
    if (context == null || raceEntityId == null || raceEntityId.isEmpty()) return;
    try {
      deleteFromTableWhere(
          context,
          getCollectionName("race_history", false),
          "json_data LIKE '%\"original_entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("race_history", true),
          "json_data LIKE '%\"original_entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("global_statistics", false),
          "entity_id = '" + raceEntityId + "'");
      deleteFromTableWhere(
          context,
          getCollectionName("global_statistics", true),
          "entity_id = '" + raceEntityId + "'");
      deleteFromTableWhere(
          context,
          getCollectionName("saved_races", false),
          "json_data LIKE '%\"entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("saved_races", true),
          "json_data LIKE '%\"entity_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("driver_statistics", false),
          "json_data LIKE '%\"race_id\":\"" + raceEntityId + "\"%'");
      deleteFromTableWhere(
          context,
          getCollectionName("driver_statistics", true),
          "json_data LIKE '%\"race_id\":\"" + raceEntityId + "\"%'");
    } catch (Exception e) {
      logger.error("Failed to perform cascading deletion for race {}", raceEntityId, e);
    }
  }

  private void deleteFromTableWhere(DatabaseContext context, String tableName, String whereClause) {
    context.ensureTable(tableName);
    String sql = "DELETE FROM " + tableName + " WHERE " + whereClause;
    try (Statement stmt = context.getConnection().createStatement()) {
      stmt.execute(sql);
    } catch (Exception e) {
      // Ignore
    }
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public void saveDriverStatistics(
      DatabaseContext context, com.antigravity.race.Race race) { // fqn-collision
    if (context == null || race == null || race.getRaceModel() == null) {
      return;
    }

    try {
      int laneCount = 4;
      if (race.getTrack() != null && race.getTrack().getLanes() != null) {
        laneCount = race.getTrack().getLanes().size();
      }
      final int finalLaneCount = laneCount;
      String tableName = getCollectionName("driver_statistics", race.isDemoMode());
      SqliteRepository<DriverStatistics> repo =
          new SqliteRepository<>(context, tableName, DriverStatistics.class);
      Map<String, DriverStatistics> statsMap = new HashMap<>();
      Map<String, Double> driverRaceLaps = new HashMap<>();

      long raceDate = System.currentTimeMillis();

      if (race.getHeats() != null) {
        for (Heat heat : race.getHeats()) {
          if (heat == null || !heat.isStarted() || heat.getDrivers() == null) continue;
          final int heatLaneCount = heat.getDrivers().size();
          for (int laneIdx = 0; laneIdx < heatLaneCount; laneIdx++) {
            DriverHeatData driverData = heat.getDrivers().get(laneIdx);
            if (driverData != null
                && driverData.getDriver() != null
                && driverData.getDriver().getDriver() != null
                && !driverData.getDriver().getDriver().isEmpty()) {
              String stableId = driverData.getDriver().getStableId();

              driverRaceLaps.put(
                  stableId,
                  driverRaceLaps.getOrDefault(stableId, 0.0) + driverData.getAdjustedLapCount());

              DriverStatistics stats =
                  statsMap.computeIfAbsent(
                      stableId,
                      id -> {
                        DriverStatistics s =
                            repo.findByEntityId(id + "_" + race.getRaceModel().getEntityId());
                        if (s == null) {
                          s = new DriverStatistics();
                          s.setDriverId(id);
                          s.setRaceId(race.getRaceModel().getEntityId());

                          List<Double> bestTimes = new ArrayList<>();
                          List<Double> bestCounts = new ArrayList<>();
                          for (int k = 0; k < finalLaneCount; k++) {
                            bestTimes.add(0.0);
                            bestCounts.add(0.0);
                          }
                          s.setLaneBestLapTimes(bestTimes);
                          s.setLaneBestLapCounts(bestCounts);
                          s.setBestLapTime(0.0);
                          s.setBestLapCount(0.0);
                          s.setLaneBestLapTimesDates(
                              new ArrayList<>(Collections.nCopies(finalLaneCount, 0L)));
                          s.setLaneBestLapCountsDates(
                              new ArrayList<>(Collections.nCopies(finalLaneCount, 0L)));
                        } else {
                          if (s.getLaneBestLapTimes() == null)
                            s.setLaneBestLapTimes(new ArrayList<>());
                          while (s.getLaneBestLapTimes().size() < finalLaneCount) {
                            s.getLaneBestLapTimes().add(0.0);
                          }
                          if (s.getLaneBestLapCounts() == null)
                            s.setLaneBestLapCounts(new ArrayList<>());
                          while (s.getLaneBestLapCounts().size() < finalLaneCount) {
                            s.getLaneBestLapCounts().add(0.0);
                          }
                        }
                        return s;
                      });

              updateDriverStatsForHeat(stats, driverData, raceDate, laneIdx);
            }
          }
        }
      }

      for (Map.Entry<String, DriverStatistics> entry : statsMap.entrySet()) {
        String stableId = entry.getKey();
        DriverStatistics stats = entry.getValue();
        double sessionLapCount = driverRaceLaps.getOrDefault(stableId, 0.0);
        if (sessionLapCount > stats.getBestLapCount()) {
          stats.setBestLapCount(sessionLapCount);
          stats.setBestLapCountDate(raceDate);
        }
        repo.save(stats);
      }

      logger.info(
          "Successfully saved driver statistics for race: {}", race.getRaceModel().getEntityId());
    } catch (Exception e) {
      logger.error("Failed to save driver statistics", e);
    }
  }

  private void updateDriverStatsForHeat(
      DriverStatistics stats, DriverHeatData driverData, long raceDate, int laneIdx) {
    double heatLapCount = driverData.getAdjustedLapCount();

    double heatBestLap = driverData.getBestLapTime();
    if (heatBestLap > 0.0) {
      if (stats.getBestLapTime() == 0.0 || heatBestLap < stats.getBestLapTime()) {
        stats.setBestLapTime(heatBestLap);
        stats.setBestLapTimeDate(raceDate);
      }
    }

    if (laneIdx < stats.getLaneBestLapCounts().size()) {
      double laneLapCount = stats.getLaneBestLapCounts().get(laneIdx);
      if (heatLapCount > laneLapCount) {
        stats.getLaneBestLapCounts().set(laneIdx, heatLapCount);
        stats.getLaneBestLapCountsDates().set(laneIdx, raceDate);
      }
    }

    if (laneIdx < stats.getLaneBestLapTimes().size()) {
      double laneBestLap = stats.getLaneBestLapTimes().get(laneIdx);
      if (heatBestLap > 0.0) {
        if (laneBestLap == 0.0 || heatBestLap < laneBestLap) {
          stats.getLaneBestLapTimes().set(laneIdx, heatBestLap);
          stats.getLaneBestLapTimesDates().set(laneIdx, raceDate);
        }
      }
    }
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, RaceScope scope) {
    if (context == null || driverId == null || driverId.isEmpty()) {
      return null;
    }

    String tableName = getCollectionName("driver_statistics", scope);
    SqliteRepository<DriverStatistics> repo =
        new SqliteRepository<>(context, tableName, DriverStatistics.class);
    List<DriverStatistics> allStats = repo.findAll();
    DriverStatistics match = null;
    for (DriverStatistics s : allStats) {
      if (driverId.equals(s.getDriverId()) && (raceId == null || raceId.equals(s.getRaceId()))) {
        match = s;
        break;
      }
    }
    if (match != null) {
      return match;
    }

    DriverStatistics emptyStats = new DriverStatistics();
    emptyStats.setDriverId(driverId);
    emptyStats.setRaceId(raceId);
    emptyStats.setBestLapTime(0.0);
    emptyStats.setBestLapCount(0.0);
    emptyStats.setLaneBestLapTimes(new ArrayList<>());
    emptyStats.setLaneBestLapCounts(new ArrayList<>());
    emptyStats.setLaneBestLapTimesDates(new ArrayList<>());
    emptyStats.setLaneBestLapCountsDates(new ArrayList<>());
    return emptyStats;
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, boolean isDemo) {
    return getDriverStatistics(context, driverId, raceId, RaceScope.fromBoolean(isDemo));
  }

  public DriverTrackStats getDriverTrackStats(
      DatabaseContext context, String driverId, String trackId, boolean isDemo) {
    if (context == null || driverId == null || trackId == null) return null;

    String tableName = getCollectionName("driver_track_stats", isDemo);
    SqliteRepository<DriverTrackStats> repo =
        new SqliteRepository<>(context, tableName, DriverTrackStats.class);

    String id = driverId + "_" + trackId;
    return repo.findByEntityId(id);
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public void updateDriverTrackStats(
      DatabaseContext context, com.antigravity.race.Race race, boolean isDemo) { // fqn-collision
    try {
      if (context == null || race == null || race.getRaceModel() == null) return;
      String trackId = race.getRaceModel().getTrackEntityId();
      if (trackId == null || trackId.isEmpty()) return;

      double minLapTime = race.getRaceModel().getMinLapTime();

      for (RaceParticipant rp : race.getDrivers()) {
        if (rp == null) continue;
        String driverId = PredictionEngine.getParticipantId(rp);
        if (driverId == null || driverId.isEmpty()) continue;

        DriverTrackStats stats = getDriverTrackStats(context, driverId, trackId, isDemo);
        if (stats == null) {
          stats = new DriverTrackStats();
          stats.setId(driverId + "_" + trackId);
          stats.setDriverId(driverId);
          stats.setTrackId(trackId);
        }

        stats.setTotalRaces(stats.getTotalRaces() + 1);

        int heatsCompleted = 0;
        int lapsCompleted = 0;
        Map<Integer, List<Double>> laneLaps = new HashMap<>();

        if (race.getHeats() != null) {
          for (Heat heat : race.getHeats()) {
            if (heat.getDrivers() != null) {
              for (int laneIdx = 0; laneIdx < heat.getDrivers().size(); laneIdx++) {
                DriverHeatData dhd = heat.getDrivers().get(laneIdx);
                if (dhd != null && dhd.getDriver() != null) {
                  String heatDriverId = PredictionEngine.getParticipantId(dhd.getDriver());
                  if (driverId.equals(heatDriverId)) {
                    heatsCompleted++;
                    lapsCompleted += dhd.getLapCount();

                    if (dhd.getLaps() != null) {
                      List<Double> validLaps = new ArrayList<>();
                      for (DriverHeatData.LapData lap : dhd.getLaps()) {
                        if (lap.getLapTime() > 0
                            && (minLapTime == 0 || lap.getLapTime() >= minLapTime)) {
                          validLaps.add(lap.getLapTime());
                        }
                      }
                      if (!validLaps.isEmpty()) {
                        laneLaps.computeIfAbsent(laneIdx, k -> new ArrayList<>()).addAll(validLaps);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        List<Double> allValidLaps = new ArrayList<>();
        List<DriverTrackStats.LanePaceStats> laneStatsList = stats.getLaneStats();
        if (laneStatsList == null) {
          laneStatsList = new ArrayList<>();
          stats.setLaneStats(laneStatsList);
        }

        for (Map.Entry<Integer, List<Double>> entry : laneLaps.entrySet()) {
          int laneIdx = entry.getKey();
          List<Double> laps = entry.getValue();
          allValidLaps.addAll(laps);

          if (!laps.isEmpty()) {
            java.util.Collections.sort(laps);
            double median;
            int mid = laps.size() / 2;
            if (laps.size() % 2 == 0) {
              median = (laps.get(mid - 1) + laps.get(mid)) / 2.0;
            } else {
              median = laps.get(mid);
            }

            DriverTrackStats.LanePaceStats existing = null;
            for (DriverTrackStats.LanePaceStats lps : laneStatsList) {
              if (lps.getLaneIndex() == laneIdx) {
                existing = lps;
                break;
              }
            }

            if (existing == null) {
              existing = new DriverTrackStats.LanePaceStats();
              existing.setLaneIndex(laneIdx);
              laneStatsList.add(existing);
            }

            if (existing.getMedianLapTime() > 0 && existing.getSampleSizeLaps() > 0) {
              double totalWeight = existing.getSampleSizeLaps() + laps.size();
              existing.setMedianLapTime(
                  ((existing.getMedianLapTime() * existing.getSampleSizeLaps())
                          + (median * laps.size()))
                      / totalWeight);
              existing.setSampleSizeLaps((int) totalWeight);
            } else {
              existing.setMedianLapTime(median);
              existing.setSampleSizeLaps(laps.size());
            }
          }
        }

        if (!allValidLaps.isEmpty()) {
          java.util.Collections.sort(allValidLaps);
          double sessionMedian;
          int mid = allValidLaps.size() / 2;
          if (allValidLaps.size() % 2 == 0) {
            sessionMedian = (allValidLaps.get(mid - 1) + allValidLaps.get(mid)) / 2.0;
          } else {
            sessionMedian = allValidLaps.get(mid);
          }

          if (stats.getOverallMedianLapTime() > 0 && stats.getTotalLaps() > 0) {
            double totalWeight = stats.getTotalLaps() + allValidLaps.size();
            if (totalWeight > 0) {
              stats.setOverallMedianLapTime(
                  ((stats.getOverallMedianLapTime() * stats.getTotalLaps())
                          + (sessionMedian * allValidLaps.size()))
                      / totalWeight);
            }
          } else {
            stats.setOverallMedianLapTime(sessionMedian);
          }
        }

        stats.setTotalHeats(stats.getTotalHeats() + heatsCompleted);
        stats.setTotalLaps(stats.getTotalLaps() + lapsCompleted);

        stats.setLastUpdated(System.currentTimeMillis());
        saveDriverTrackStats(context, stats, isDemo);
      }
    } catch (Throwable t) {
      logger.error("updateDriverTrackStats: FAILED with throwable!", t);
    }
  }

  public void saveDriverTrackStats(
      DatabaseContext context, DriverTrackStats stats, boolean isDemo) {
    if (context == null
        || stats == null
        || stats.getDriverId() == null
        || stats.getTrackId() == null) {
      return;
    }
    String tableName = getCollectionName("driver_track_stats", isDemo);
    SqliteRepository<DriverTrackStats> repo =
        new SqliteRepository<>(context, tableName, DriverTrackStats.class);
    repo.save(stats);
  }

  public RacePredictionRecord getRacePredictionRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return null;
    String tableName = getCollectionName("race_predictions", isDemo);
    SqliteRepository<RacePredictionRecord> repo =
        new SqliteRepository<>(context, tableName, RacePredictionRecord.class);
    List<RacePredictionRecord> all = repo.findAll();
    for (RacePredictionRecord r : all) {
      if (raceId.equals(r.getRaceId())) return r;
    }
    return null;
  }

  public void saveRacePredictionRecord(
      DatabaseContext context, RacePredictionRecord record, boolean isDemo) {
    if (context == null || record == null || record.getRaceId() == null) return;
    String tableName = getCollectionName("race_predictions", isDemo);
    SqliteRepository<RacePredictionRecord> repo =
        new SqliteRepository<>(context, tableName, RacePredictionRecord.class);
    repo.save(record);
  }

  public PredictionEvaluationRecord getPredictionEvaluationRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return null;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    for (PredictionEvaluationRecord r : repo.findAll()) {
      if (raceId.equals(r.getRaceId())) return r;
    }
    return null;
  }

  public void deletePredictionEvaluationRecord(
      DatabaseContext context, String raceId, boolean isDemo) {
    if (context == null || raceId == null) return;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    repo.delete(raceId);
  }

  public void savePredictionEvaluationRecord(
      DatabaseContext context, PredictionEvaluationRecord record, boolean isDemo) {
    if (context == null || record == null || record.getRaceId() == null) return;
    String tableName = getCollectionName("prediction_evaluations", isDemo);
    SqliteRepository<PredictionEvaluationRecord> repo =
        new SqliteRepository<>(context, tableName, PredictionEvaluationRecord.class);
    repo.save(record);
  }

  private String getCollectionName(String baseName, RaceScope scope) {
    if (scope == null) {
      scope = RaceScope.PRODUCTION;
    }
    return scope.getCollectionName(baseName);
  }

  private String getCollectionName(String baseName, boolean isDemo) {
    return getCollectionName(baseName, RaceScope.fromBoolean(isDemo));
  }
}
