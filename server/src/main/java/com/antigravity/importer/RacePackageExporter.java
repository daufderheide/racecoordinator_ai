package com.antigravity.importer;

import com.antigravity.App;
import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.importer.model.RacePackageManifest;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.Team;
import com.antigravity.proto.RecordData;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AssetService;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RacePackageExporter {

  private static final Logger logger = LoggerFactory.getLogger(RacePackageExporter.class);
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private final DatabaseContext databaseContext;
  private final AssetService assetService;
  private final SqliteRepository<Driver> driverRepository;
  private final SqliteRepository<Race> raceRepository;
  private final SqliteRepository<Team> teamRepository;

  public RacePackageExporter(DatabaseContext databaseContext, AssetService assetService) {
    this(databaseContext, assetService, null, null, null);
  }

  public RacePackageExporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository) {
    this(databaseContext, assetService, driverRepository, null, null);
  }

  public RacePackageExporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<Race> raceRepository) {
    this(databaseContext, assetService, driverRepository, raceRepository, null);
  }

  public RacePackageExporter(
      DatabaseContext databaseContext,
      AssetService assetService,
      SqliteRepository<Driver> driverRepository,
      SqliteRepository<Race> raceRepository,
      SqliteRepository<Team> teamRepository) {
    this.databaseContext = databaseContext;
    this.assetService = assetService;
    this.driverRepository =
        driverRepository != null
            ? driverRepository
            : new SqliteRepository<>(databaseContext, "drivers", Driver.class);
    this.raceRepository =
        raceRepository != null
            ? raceRepository
            : new SqliteRepository<>(databaseContext, "races", Race.class);
    this.teamRepository =
        teamRepository != null
            ? teamRepository
            : new SqliteRepository<>(databaseContext, "teams", Team.class);
  }

  public byte[] exportRacePackage(String raceHistoryId, boolean isDemo) throws IOException {
    if (raceHistoryId == null || raceHistoryId.trim().isEmpty()) {
      throw new IllegalArgumentException("raceHistoryId cannot be null or empty");
    }

    DatabaseService dbService = DatabaseService.getInstance();
    RaceScope scope = RaceScope.fromBoolean(isDemo);
    RaceHistoryRecord history = dbService.getRaceHistoryById(databaseContext, raceHistoryId, scope);
    if (history == null) {
      RaceScope altScope = isDemo ? RaceScope.PRODUCTION : RaceScope.DEMO;
      history = dbService.getRaceHistoryById(databaseContext, raceHistoryId, altScope);
    }
    if (history == null) {
      throw new IllegalArgumentException("Race history record not found for id: " + raceHistoryId);
    }

    // 1. Gather protobuf RecordData if available
    RecordData recordData = dbService.getRaceRecords(databaseContext, history.getId(), isDemo);
    if (recordData == null && history.getModel() != null) {
      recordData =
          dbService.getRaceRecords(databaseContext, history.getModel().getEntityId(), isDemo);
    }

    // 2. Gather RaceSaveData if available
    RaceSaveData saveData = dbService.getSavedRace(databaseContext, history.getId(), scope);
    if (saveData == null && history.getModel() != null) {
      saveData = dbService.getSavedRace(databaseContext, history.getModel().getEntityId(), scope);
    }

    // 3. Collect full Driver objects for participants AND Teams
    List<Driver> drivers = collectDrivers(history);
    List<Team> teams =
        TeamExportImportHelper.collectTeamsAndMemberDrivers(
            history, teamRepository, driverRepository, drivers);

    // 4. Export driver companion assets & JSON using DriverExporter
    DriverExporter driverExporter =
        new DriverExporter(databaseContext, driverRepository, assetService, null);
    byte[] driverPackageZip = driverExporter.exportDriversZip(drivers, "json");

    // 5. Build manifest
    String raceName = history.getModel() != null ? history.getModel().getName() : "Historical Race";
    long startTime = history.getTimestamp() != null ? history.getTimestamp() : 0L;
    long endTime = startTime + (long) (history.getAccumulatedRaceTime() * 1000);
    int heatCount = history.getHeats() != null ? history.getHeats().size() : 0;
    int driverCount = drivers.size();

    List<String> driverNames = new ArrayList<>();
    for (Driver d : drivers) {
      if (d.getName() != null) {
        driverNames.add(d.getName());
      }
    }
    String fingerprint =
        calculatePackageFingerprint(
            startTime, heatCount, driverCount, history.getAccumulatedRaceTime());

    RacePackageManifest manifest =
        new RacePackageManifest(
            1,
            App.SERVER_VERSION,
            "1.0.0",
            "race_package",
            history.getId(),
            raceName,
            startTime,
            endTime,
            heatCount,
            driverCount,
            fingerprint);

    // 6. Gather Race configuration and custom rotation
    Race raceConfig = null;
    if (history.getModel() != null) {
      raceConfig = history.getModel();
    }
    if (raceConfig == null && history.getOriginalEntityId() != null) {
      raceConfig = raceRepository.findByEntityId(history.getOriginalEntityId());
    }
    if (raceConfig == null) {
      raceConfig = raceRepository.findByEntityId(history.getId());
    }

    CustomRotationExportImportHelper.CustomRotationPackage customRotation =
        CustomRotationExportImportHelper.resolveCustomRotationPackage(raceConfig, assetService);

    // 7. Assemble complete package ZIP
    return assemblePackageZip(
        manifest,
        history,
        raceConfig,
        customRotation,
        teams,
        recordData,
        saveData,
        driverPackageZip);
  }

  private List<Driver> collectDrivers(RaceHistoryRecord history) {
    Map<String, Driver> driverMap = new LinkedHashMap<>();
    if (history.getDrivers() != null) {
      for (RaceParticipant rp : history.getDrivers()) {
        if (rp.isTeamParticipant()) {
          continue;
        }
        String driverId = rp.getDriver() != null ? rp.getDriver().getEntityId() : rp.getObjectId();
        if (driverId != null && driverId.startsWith("t_")) {
          continue;
        }
        if (driverId == null || driverId.trim().isEmpty()) {
          if (rp.getDriver() != null && rp.getDriver().getId() != null) {
            driverId = rp.getDriver().getId();
          }
        }
        Driver participantDriver = rp.getDriver();
        if (driverId == null || driverId.trim().isEmpty()) {
          if (participantDriver != null && participantDriver.getName() != null) {
            driverId = UUID.randomUUID().toString();
            participantDriver =
                Driver.Builder.from(participantDriver).withEntityId(driverId).build();
          }
        }
        if (driverId == null || driverId.trim().isEmpty() || driverId.startsWith("t_")) {
          continue;
        }
        Driver fullDriver = driverRepository.findByEntityId(driverId);
        if (fullDriver != null) {
          driverMap.put(driverId, fullDriver);
        } else if (participantDriver != null) {
          driverMap.put(driverId, participantDriver);
        }
      }
    }

    if (history.getHeats() != null) {
      for (Heat h : history.getHeats()) {
        if (h.getDrivers() != null) {
          for (DriverHeatData dhd : h.getDrivers()) {
            RaceParticipant heatParticipant = dhd.getDriver();
            Driver heatDriver =
                dhd.getActualDriver() != null
                    ? dhd.getActualDriver()
                    : (heatParticipant != null && !heatParticipant.isTeamParticipant()
                        ? heatParticipant.getDriver()
                        : null);
            if (heatDriver != null) {
              String dId = heatDriver.getEntityId();
              if (dId == null || dId.trim().isEmpty()) {
                dId = heatDriver.getId();
              }
              if (dId != null && dId.startsWith("t_")) {
                continue;
              }
              if (dId == null || dId.trim().isEmpty()) {
                dId = UUID.randomUUID().toString();
                heatDriver = Driver.Builder.from(heatDriver).withEntityId(dId).build();
              }
              if (!driverMap.containsKey(dId)) {
                Driver fullDriver = driverRepository.findByEntityId(dId);
                driverMap.put(dId, fullDriver != null ? fullDriver : heatDriver);
              }
            }
          }
        }
      }
    }

    if (history.getDriverResults() != null) {
      for (SeasonDriverResult sdr : history.getDriverResults()) {
        String sdrId = sdr.getDriverId();
        if (sdrId != null && sdrId.startsWith("t_")) {
          continue;
        }
        if (sdrId != null && !sdrId.trim().isEmpty() && !driverMap.containsKey(sdrId)) {
          Driver fullDriver = driverRepository.findByEntityId(sdrId);
          if (fullDriver != null) {
            driverMap.put(sdrId, fullDriver);
          } else {
            Driver stub =
                new Driver.Builder()
                    .withEntityId(sdrId)
                    .withName(sdr.getDriverName() != null ? sdr.getDriverName() : "Driver")
                    .build();
            driverMap.put(sdrId, stub);
          }
        }
      }
    }

    return new ArrayList<>(driverMap.values());
  }

  private byte[] assemblePackageZip(
      RacePackageManifest manifest,
      RaceHistoryRecord history,
      Race raceConfig,
      CustomRotationExportImportHelper.CustomRotationPackage customRotation,
      List<Team> teams,
      RecordData recordData,
      RaceSaveData saveData,
      byte[] driverPackageZip)
      throws IOException {

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    Set<String> writtenEntries = new HashSet<>();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      // Write manifest.json
      zos.putNextEntry(new ZipEntry("manifest.json"));
      zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(manifest));
      zos.closeEntry();
      writtenEntries.add("manifest.json");

      // Write race_history.json
      zos.putNextEntry(new ZipEntry("race_history.json"));
      zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(history));
      zos.closeEntry();
      writtenEntries.add("race_history.json");

      // Write race_config.json if present
      if (raceConfig != null) {
        zos.putNextEntry(new ZipEntry("race_config.json"));
        zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(raceConfig));
        zos.closeEntry();
        writtenEntries.add("race_config.json");
      }

      // Write custom_rotation.json if present
      if (customRotation != null) {
        zos.putNextEntry(new ZipEntry("custom_rotation.json"));
        zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(customRotation));
        zos.closeEntry();
        writtenEntries.add("custom_rotation.json");
      }

      // Write teams.json if present
      if (teams != null && !teams.isEmpty()) {
        zos.putNextEntry(new ZipEntry("teams.json"));
        zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(teams));
        zos.closeEntry();
        writtenEntries.add("teams.json");
      }

      // Write race_records.pb if present
      if (recordData != null) {
        zos.putNextEntry(new ZipEntry("race_records.pb"));
        zos.write(recordData.toByteArray());
        zos.closeEntry();
        writtenEntries.add("race_records.pb");
      }

      // Write saved_race.json if present
      if (saveData != null) {
        zos.putNextEntry(new ZipEntry("saved_race.json"));
        zos.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(saveData));
        zos.closeEntry();
        writtenEntries.add("saved_race.json");
      }

      // Copy team avatars if present
      copyTeamAvatarsToZip(teams, zos, writtenEntries);

      // Extract driverPackageZip entries and copy them into package
      if (driverPackageZip != null && driverPackageZip.length > 0) {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(driverPackageZip))) {
          ZipEntry entry;
          byte[] buffer = new byte[8192];
          while ((entry = zis.getNextEntry()) != null) {
            String name = entry.getName();
            if (!writtenEntries.contains(name)) {
              zos.putNextEntry(new ZipEntry(name));
              int read;
              while ((read = zis.read(buffer)) != -1) {
                zos.write(buffer, 0, read);
              }
              zos.closeEntry();
              writtenEntries.add(name);
            }
            zis.closeEntry();
          }
        }
      }
    }
    return baos.toByteArray();
  }

  private void copyTeamAvatarsToZip(
      List<Team> teams, ZipOutputStream zos, Set<String> writtenEntries) {
    if (teams == null || databaseContext == null) {
      return;
    }
    for (Team t : teams) {
      if (t != null && t.getAvatarUrl() != null && !t.getAvatarUrl().trim().isEmpty()) {
        String avatar = t.getAvatarUrl().trim();
        String simple = new File(avatar).getName();
        String zipPath = "images/" + simple;
        if (!writtenEntries.contains(zipPath)) {
          Path p = resolveAssetFilePath(avatar, simple);
          if (p != null && Files.exists(p)) {
            try {
              zos.putNextEntry(new ZipEntry(zipPath));
              Files.copy(p, zos);
              zos.closeEntry();
              writtenEntries.add(zipPath);
            } catch (Exception e) {
              logger.warn("Failed to copy team avatar {} to package", avatar, e);
            }
          }
        }
      }
    }
  }

  private Path resolveAssetFilePath(String avatar, String simple) {
    Path p = Paths.get(avatar);
    if (Files.exists(p)) {
      return p;
    }
    String dbName = databaseContext.getCurrentDatabaseName();
    if (dbName == null || dbName.trim().isEmpty()) {
      dbName = "RaceCoordinator_AI_DB";
    }
    Path p1 = Paths.get(databaseContext.getDataRoot(), dbName, "assets", avatar);
    if (Files.exists(p1)) {
      return p1;
    }
    Path p2 = Paths.get(databaseContext.getDataRoot(), dbName, "assets", "images", simple);
    if (Files.exists(p2)) {
      return p2;
    }
    return null;
  }

  public static String calculatePackageFingerprint(
      long startTime, int heatCount, int driverCount, float accumulatedRaceTime) {
    StringBuilder sb = new StringBuilder();
    sb.append(startTime).append(":");
    sb.append(heatCount).append(":");
    sb.append(driverCount).append(":");
    sb.append(Math.round(accumulatedRaceTime * 10.0f) / 10.0f);
    return AssetService.calculateSha256(sb.toString().getBytes(StandardCharsets.UTF_8));
  }

  public static String calculatePackageFingerprint(
      String raceName, long startTime, List<String> driverNames) {
    return calculateLegacyPackageFingerprint(raceName, startTime, driverNames);
  }

  public static String calculateLegacyPackageFingerprint(
      String raceName, long startTime, List<String> driverNames) {
    StringBuilder sb = new StringBuilder();
    sb.append(raceName != null ? raceName.trim().toLowerCase(Locale.ROOT) : "").append(":");
    sb.append(startTime).append(":");
    if (driverNames != null) {
      List<String> sorted = new ArrayList<>(driverNames);
      Collections.sort(sorted, String.CASE_INSENSITIVE_ORDER);
      sb.append(String.join(",", sorted));
    }
    return AssetService.calculateSha256(sb.toString().getBytes(StandardCharsets.UTF_8));
  }
}
