package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Driver;
import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.TeamOptions;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.proto.AssetMessage;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.repository.SqliteRepository;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
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
    resetCustomUIs(context);
    resetThemes(context);
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
            .withThemeId(Theme.DEFAULT_THEME_ID)
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
            .withThemeId(Theme.DEFAULT_THEME_ID)
            .withEntityId(context.getNextSequence("races"))
            .build();

    raceRepo.save(race);

    Race fuelRace = createDefaultFuelRace(track.getEntityId(), context.getNextSequence("races"));
    raceRepo.save(fuelRace);

    Race practiceRace =
        createDefaultPracticeRace(track.getEntityId(), context.getNextSequence("races"));
    raceRepo.save(practiceRace);
    logger.info("Races reset.");
  }

  public Race createDefaultFuelRace(String trackEntityId, String raceEntityId) {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Lap, 25, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            true,
            false,
            FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
            100.0,
            FuelOptions.FuelUsageType.QUADRATIC,
            4.0,
            100.0,
            10.0,
            2.0,
            6.0,
            1.0,
            1.0);
    TeamOptions teamOptions = new TeamOptions(25, 0.0, 50, 0.0, false);
    return new Race.Builder()
        .withName("Fuel Race")
        .withTrackEntityId(trackEntityId)
        .withHeatRotationType(HeatRotationType.FriendlyRoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withFuelOptions(fuelOptions)
        .withTeamOptions(teamOptions)
        .withMinLapTime(3.0)
        .withAutoAdvanceTime(60.0)
        .withAutoStartTime(60.0)
        .withAutoAdvanceWarmupTime(0.0)
        .withAutoStartWarmupTime(0.0)
        .withStartBehindSensor(true)
        .withThemeId(Theme.FUEL_THEME_ID)
        .withEntityId(raceEntityId)
        .build();
  }

  public Race createDefaultPracticeRace(String trackEntityId, String raceEntityId) {
    HeatScoring heatScoring =
        new HeatScoring(
            FinishMethod.Timed, 0, HeatRanking.LAP_COUNT, HeatRankingTiebreaker.AVERAGE_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();
    return new Race.Builder()
        .withName("Practice")
        .withTrackEntityId(trackEntityId)
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
        .withThemeId(Theme.PRACTICE_THEME_ID)
        .withEntityId(raceEntityId)
        .build();
  }

  public void resetCustomUIs(DatabaseContext context) {
    SqliteRepository<CustomUI> uiRepo =
        new SqliteRepository<>(context, "custom_uis", CustomUI.class);
    uiRepo.drop();
    uiRepo.save(CustomUI.createDefault());
    uiRepo.save(CustomUI.createPractice());
    uiRepo.save(CustomUI.createFuel());
    logger.info("Custom UIs reset.");
  }

  public void resetThemes(DatabaseContext context) {
    SqliteRepository<Theme> themeRepo = new SqliteRepository<>(context, "themes", Theme.class);
    themeRepo.drop();

    Map<String, String> slots = createDefaultThemeSlots();
    Map<String, AudioConfig> audioSlots = createDefaultThemeAudioSlots();

    Theme defaultTheme =
        new Theme(
            "Default Theme",
            true,
            slots,
            audioSlots,
            CustomUI.DEFAULT_UI_ID,
            Theme.DEFAULT_THEME_ID,
            null);
    Theme practiceTheme =
        new Theme(
            "Practice Theme",
            true,
            slots,
            audioSlots,
            CustomUI.PRACTICE_UI_ID,
            Theme.PRACTICE_THEME_ID,
            null);
    Theme fuelTheme =
        new Theme(
            "Fuel Theme", true, slots, audioSlots, CustomUI.FUEL_UI_ID, Theme.FUEL_THEME_ID, null);

    themeRepo.save(defaultTheme);
    themeRepo.save(practiceTheme);
    themeRepo.save(fuelTheme);
    logger.info("Themes reset.");
  }

  private Map<String, String> createDefaultThemeSlots() {
    Map<String, String> slots = new HashMap<>();
    slots.put("flag.racing", "default_flag_green");
    slots.put("flag.heat_paused", "default_flag_yellow");
    slots.put("flag.heat_over", "default_flag_red");
    slots.put("flag.race_over", "default_flag_checkered");
    slots.put("flag.not_started", "default_flag_red");
    slots.put("flag.starting", "default_flag_red");
    slots.put("flag.restarting", "default_flag_yellow");
    slots.put("flag.one_lap_to_go", "default_flag_white");
    slots.put("flag.heat_finishing", "default_flag_checkered");
    slots.put("flag.warmup", "default_flag_green_yellow");
    slots.put("flag.driver_finished", "default_flag_red");
    slots.put("flag.penalty", "default_flag_black");
    slots.put("lamp.red.on", "default_start_red_on");
    slots.put("lamp.red.dim", "default_start_red_dim");
    slots.put("lamp.green", "default_start_green");
    slots.put("gauge.fuel", "default_fuel_gauge");
    return slots;
  }

  private Map<String, AudioConfig> createDefaultThemeAudioSlots() {
    Map<String, AudioConfig> as = new HashMap<>();
    as.put("audio.countdown", new AudioConfig("audio_set", "default_countdown", null));
    as.put("audio.seconds_left", new AudioConfig("audio_set", "default_seconds_left", null));
    as.put("audio.yellowflag", new AudioConfig("preset", "default_yellow_flag", null));
    as.put("audio.seconds_left.halfway", new AudioConfig("preset", "default_heat_half", null));
    as.put("audio.heat_over", new AudioConfig("preset", "default_heat_over", null));
    as.put("audio.race_over", new AudioConfig("preset", "default_race_over", null));
    as.put("audio.penalty", new AudioConfig("preset", "default_penalty", null));
    as.put(
        "audio.min_lap_time", new AudioConfig("tts", null, "Min lap time for {{driver.nickname}}"));
    as.put("audio.drift_lap", new AudioConfig("tts", null, "Drift lap for {{driver.nickname}}"));
    return as;
  }

  public void backfillRaces(DatabaseContext context) {
    SqliteRepository<Race> raceRepo = new SqliteRepository<>(context, "races", Race.class);
    List<Race> races = raceRepo.findAll();
    boolean hasPractice = false;
    boolean hasFuelRace = false;
    for (Race race : races) {
      if ("Practice".equals(race.getName())) {
        hasPractice = true;
      }
      if ("Fuel Race".equals(race.getName())) {
        hasFuelRace = true;
      }
      if (race.getThemeId() == null || race.getThemeId().trim().isEmpty()) {
        String themeId = Theme.DEFAULT_THEME_ID;
        if (race.isPractice() || "Practice".equalsIgnoreCase(race.getName())) {
          themeId = Theme.PRACTICE_THEME_ID;
        } else if ((race.getFuelOptions() != null && race.getFuelOptions().isEnabled())
            || "Fuel Race".equalsIgnoreCase(race.getName())) {
          themeId = Theme.FUEL_THEME_ID;
        }
        Race updated = new Race.Builder().from(race).withThemeId(themeId).build();
        raceRepo.save(updated);
        logger.info(
            "Backfilled themeId '{}' for race '{}' ({})",
            themeId,
            race.getName(),
            race.getEntityId());
      }
    }

    if (!hasPractice || !hasFuelRace) {
      SqliteRepository<Track> trackRepo = new SqliteRepository<>(context, "tracks", Track.class);
      List<Track> tracks = trackRepo.findAll();
      Track track = tracks.isEmpty() ? null : tracks.get(0);
      if (track != null) {
        if (!hasFuelRace) {
          Race fuelRace =
              createDefaultFuelRace(track.getEntityId(), context.getNextSequence("races"));
          raceRepo.save(fuelRace);
          logger.info("Backfilled Fuel Race to database.");
        }
        if (!hasPractice) {
          Race practiceRace =
              createDefaultPracticeRace(track.getEntityId(), context.getNextSequence("races"));
          raceRepo.save(practiceRace);
          logger.info("Backfilled Practice Race to database.");
        }
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
