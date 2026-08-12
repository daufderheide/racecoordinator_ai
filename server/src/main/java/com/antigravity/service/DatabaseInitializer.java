package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.repository.SqliteRepository;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseInitializer {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);

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
  public void resetDrivers(DatabaseContext context) {
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

  public Track resetTracks(DatabaseContext context) {
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

  public void resetRaces(DatabaseContext context, Track track) {
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

  public void resetTeams(DatabaseContext context) {
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
}
