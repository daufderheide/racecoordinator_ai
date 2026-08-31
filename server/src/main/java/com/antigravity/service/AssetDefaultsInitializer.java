package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Theme;
import com.antigravity.proto.AssetMessage;
import com.antigravity.proto.SaveAudioSetEntry;
import com.antigravity.proto.SaveImageSetEntry;
import com.antigravity.repository.SqliteRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AssetDefaultsInitializer {
  private static final Logger logger = LoggerFactory.getLogger(AssetDefaultsInitializer.class);

  private final AssetService assetService;
  private final DatabaseContext databaseContext;

  static class DefaultAsset {
    final String id;
    final String filename;
    final String displayName;

    DefaultAsset(String id, String filename, String displayName) {
      this.id = id;
      this.filename = filename;
      this.displayName = displayName;
    }
  }

  static class FuelDefaultAsset extends DefaultAsset {
    final int percentage;

    FuelDefaultAsset(String id, String filename, String displayName, int percentage) {
      super(id, filename, displayName);
      this.percentage = percentage;
    }
  }

  private static final List<DefaultAsset> DEFAULT_IMAGE_ASSETS = new ArrayList<>();

  static {
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-blue", "black-blue.png", "Helmet Black-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-grey", "black-grey.png", "Helmet Black-Grey"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-purple", "black-purple.png", "Helmet Black-Purple"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white", "black-white.png", "Helmet Black-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-white2", "black-white2.png", "Helmet Black-White2"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_black-yellow", "black-yellow.png", "Helmet Black-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_black", "black.png", "Helmet Black"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-green", "blue-green.png", "Helmet Blue-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-green2", "blue-green2.png", "Helmet Blue-Green2"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-purple-green", "blue-purple-green.png", "Helmet Blue-Purple-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-red-silver", "blue-red-silver.png", "Helmet Blue-Red-Silver"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-white", "blue-white.png", "Helmet Blue-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_blue-yellow-red", "blue-yellow-red.png", "Helmet Blue-Yellow-Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_blue-yellow", "blue-yellow.png", "Helmet Blue-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_green-white", "green-white.png", "Helmet Green-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_grey-black-gold", "grey-black-gold.png", "Helmet Grey-Black-Gold"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_grey-red-white", "grey-red-white.png", "Helmet Grey-Red-White"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_orange-blue", "orange-blue.png", "Helmet Orange-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-gold-blue", "red-gold-blue.png", "Helmet Red-Gold-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-orange", "red-orange.png", "Helmet Red-Orange"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_red-yellow", "red-yellow.png", "Helmet Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_silver-green", "silver-green.png", "Helmet Silver-Green"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_silver-red", "silver-red.png", "Helmet Silver-Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_white-blue-yellow", "white-blue-yellow.png", "Helmet White-Blue-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_white-blue", "white-blue.png", "Helmet White-Blue"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_white-red-yellow", "white-red-yellow.png", "Helmet White-Red-Yellow"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_green", "flag_green.png", "Green Flag"));
    DEFAULT_IMAGE_ASSETS.add(new DefaultAsset("default_flag_red", "flag_red.png", "Red Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_yellow", "flag_yellow.png", "Yellow Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset(
            "default_flag_green_yellow", "flag_green_yellow.png", "Yellow Green Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_black", "flag_black.png", "Black Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_white", "flag_white.png", "White Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_flag_checkered", "flag_checkered.png", "Checkered Flag"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_red_on", "start_red_on.png", "Start Lamp Red"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_red_dim", "start_red_dim.png", "Start Lamp Dim"));
    DEFAULT_IMAGE_ASSETS.add(
        new DefaultAsset("default_start_green", "start_green.png", "Start Lamp Green"));
  }

  private static final List<FuelDefaultAsset> DEFAULT_FUEL_IMAGE_ASSETS = new ArrayList<>();

  static {
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_100", "fuel_100.png", "Fuel Gauge 100%", 100));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_90", "fuel_90.png", "Fuel Gauge 90%", 90));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_80", "fuel_80.png", "Fuel Gauge 80%", 80));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_70", "fuel_70.png", "Fuel Gauge 70%", 70));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_60", "fuel_60.png", "Fuel Gauge 60%", 60));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_50", "fuel_50.png", "Fuel Gauge 50%", 50));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_40", "fuel_40.png", "Fuel Gauge 40%", 40));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_30", "fuel_30.png", "Fuel Gauge 30%", 30));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_20", "fuel_20.png", "Fuel Gauge 20%", 20));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_10", "fuel_10.png", "Fuel Gauge 10%", 10));
    DEFAULT_FUEL_IMAGE_ASSETS.add(
        new FuelDefaultAsset("default_fuel_0", "fuel_0.png", "Fuel Gauge 0%", 0));
  }

  private static final List<DefaultAsset> DEFAULT_AUDIO_ASSETS = new ArrayList<>();

  static {
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_beep", "beep.wav", "Lap Beep"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_chimes", "chimes.wav", "Lap Chimes"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_driveby", "driveby.wav", "Lap Driveby"));
    DEFAULT_AUDIO_ASSETS.add(new DefaultAsset("default_penalty", "penalty.wav", "Penalty"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_yellow_flag", "audio/english/woman/w_yellowflag.wav", "Yellow Flag"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_go", "audio/english/woman/w_countdown_0.wav", "Countdown Go"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_1", "audio/english/woman/w_countdown_1.wav", "Countdown 1"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_2", "audio/english/woman/w_countdown_2.wav", "Countdown 2"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_3", "audio/english/woman/w_countdown_3.wav", "Countdown 3"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_4", "audio/english/woman/w_countdown_4.wav", "Countdown 4"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_countdown_5", "audio/english/woman/w_countdown_5.wav", "Countdown 5"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_300",
            "audio/english/woman/w_sl300.wav",
            "Seconds Left -- 5 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_240",
            "audio/english/woman/w_sl240.wav",
            "Seconds Left -- 4 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_180",
            "audio/english/woman/w_sl180.wav",
            "Seconds Left -- 3 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_120",
            "audio/english/woman/w_sl120.wav",
            "Seconds Left -- 2 Minutes"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_60",
            "audio/english/woman/w_sl60.wav",
            "Seconds Left -- 1 Minute"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_30",
            "audio/english/woman/w_sl30.wav",
            "Seconds Left -- 30 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_25",
            "audio/english/woman/w_sl25.wav",
            "Seconds Left -- 25 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_20",
            "audio/english/woman/w_sl20.wav",
            "Seconds Left -- 20 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_15",
            "audio/english/woman/w_sl15.wav",
            "Seconds Left -- 15 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_10",
            "audio/english/woman/w_sl10.wav",
            "Seconds Left -- 10 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_seconds_left_5",
            "audio/english/woman/w_sl5.wav",
            "Seconds Left -- 5 Seconds"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset(
            "default_heat_half", "audio/english/woman/w_heat_half.wav", "Seconds Left -- Halfway"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset("default_heat_over", "audio/english/woman/w_heatover.wav", "Heat Over"));
    DEFAULT_AUDIO_ASSETS.add(
        new DefaultAsset("default_race_over", "audio/english/woman/w_raceover.wav", "Race Over"));
  }

  private static final Map<String, String> RESOURCE_MAP = new HashMap<>();

  static {
    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      RESOURCE_MAP.put(asset.id.toLowerCase(), "/defaults/" + asset.filename);
      RESOURCE_MAP.put(asset.filename.toLowerCase(), "/defaults/" + asset.filename);
      String safeName = asset.displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
      RESOURCE_MAP.put((asset.id + "_" + safeName).toLowerCase(), "/defaults/" + asset.filename);
    }
    for (FuelDefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
      RESOURCE_MAP.put(asset.id.toLowerCase(), "/defaults/" + asset.filename);
      RESOURCE_MAP.put(asset.filename.toLowerCase(), "/defaults/" + asset.filename);
      String safeName = asset.displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
      RESOURCE_MAP.put((asset.id + "_" + safeName).toLowerCase(), "/defaults/" + asset.filename);
    }
    for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
      RESOURCE_MAP.put(asset.id.toLowerCase(), "/defaults/" + asset.filename);
      RESOURCE_MAP.put(asset.filename.toLowerCase(), "/defaults/" + asset.filename);
      String safeName = asset.displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
      RESOURCE_MAP.put((asset.id + "_" + safeName).toLowerCase(), "/defaults/" + asset.filename);
    }
  }

  public static String getDefaultResourcePath(String nameOrId) {
    if (nameOrId == null || nameOrId.trim().isEmpty()) {
      return null;
    }
    String key = nameOrId.trim().toLowerCase();
    if (RESOURCE_MAP.containsKey(key)) {
      return RESOURCE_MAP.get(key);
    }
    String directPath = "/defaults/" + nameOrId.trim();
    if (AssetDefaultsInitializer.class.getResource(directPath) != null) {
      return directPath;
    }
    return null;
  }

  public AssetDefaultsInitializer(AssetService assetService, DatabaseContext databaseContext) {
    this.assetService = assetService;
    this.databaseContext = databaseContext;
  }

  private boolean isAssetMissingOrFileMissing(String id, String displayName) {
    AssetMessage existing = assetService.getAssetById(id);
    if (existing == null) {
      return true;
    }
    String url = existing.getUrl();
    String filename = null;
    if (url != null && url.startsWith("/assets/")) {
      filename = url.substring("/assets/".length());
    } else if (displayName != null) {
      String safeName = displayName.replaceAll("[^a-zA-Z0-9.-]", "_");
      filename = id + "_" + safeName;
    }
    if (filename != null) {
      java.io.File file = new java.io.File(assetService.getAssetDir(), filename);
      if (!file.exists() || !file.isFile() || file.length() == 0) {
        return true;
      }
    }
    return false;
  }

  public void backfillDefaults() {
    for (DefaultAsset asset : DEFAULT_IMAGE_ASSETS) {
      if (isAssetMissingOrFileMissing(asset.id, asset.displayName)) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          assetService.saveAsset(asset.id, asset.displayName, "image", data);
        } catch (Exception e) {
          logger.error("Failed to backfill asset {}", asset.filename, e);
        }
      }
    }
    Map<String, String> audioUrls = new HashMap<>();
    for (DefaultAsset asset : DEFAULT_AUDIO_ASSETS) {
      if (isAssetMissingOrFileMissing(asset.id, asset.displayName)) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          AssetMessage saved = assetService.saveAsset(asset.id, asset.displayName, "audio", data);
          audioUrls.put(asset.id, saved.getUrl());
        } catch (Exception e) {
          logger.error("Failed to backfill asset {}", asset.filename, e);
        }
      } else {
        AssetMessage existing = assetService.getAssetById(asset.id);
        audioUrls.put(asset.id, existing.getUrl());
      }
    }

    backfillAudioSetDefaults(audioUrls);
    backfillFuelGaugeDefaults();
    backfillDefaultTheme();
  }

  private void backfillAudioSetDefaults(Map<String, String> audioUrls) {
    String[][] countdownSpec = {
      {"5.0", "Countdown 5", "default_countdown_5"},
      {"4.0", "Countdown 4", "default_countdown_4"},
      {"3.0", "Countdown 3", "default_countdown_3"},
      {"2.0", "Countdown 2", "default_countdown_2"},
      {"1.0", "Countdown 1", "default_countdown_1"},
      {"0.0", "Countdown Go", "default_countdown_go"}
    };
    List<SaveAudioSetEntry> countdownEntries = new ArrayList<>();
    for (String[] spec : countdownSpec) {
      String url = audioUrls.get(spec[2]);
      if (url != null) {
        countdownEntries.add(
            SaveAudioSetEntry.newBuilder()
                .setTimeSeconds(Float.parseFloat(spec[0]))
                .setName(spec[1])
                .setUrl(url)
                .setType("preset")
                .build());
      }
    }
    if (assetService.getAssetById("default_countdown") == null && !countdownEntries.isEmpty()) {
      try {
        assetService.saveAudioSet("default_countdown", "Default Countdown", countdownEntries);
        logger.info("Backfilled default countdown audio set with ID default_countdown");
      } catch (Exception e) {
        logger.error("Failed to backfill default countdown audio set", e);
      }
    }

    String[][] slSpec = {
      {"300.0", "5 Minutes", "default_seconds_left_300"},
      {"240.0", "4 Minutes", "default_seconds_left_240"},
      {"180.0", "3 Minutes", "default_seconds_left_180"},
      {"120.0", "2 Minutes", "default_seconds_left_120"},
      {"60.0", "1 Minute", "default_seconds_left_60"},
      {"30.0", "30 Seconds", "default_seconds_left_30"},
      {"25.0", "25 Seconds", "default_seconds_left_25"},
      {"20.0", "20 Seconds", "default_seconds_left_20"},
      {"15.0", "15 Seconds", "default_seconds_left_15"},
      {"10.0", "10 Seconds", "default_seconds_left_10"},
      {"5.0", "5 Seconds", "default_seconds_left_5"}
    };
    List<SaveAudioSetEntry> secondsLeftEntries = new ArrayList<>();
    for (String[] spec : slSpec) {
      String url = audioUrls.get(spec[2]);
      if (url != null) {
        secondsLeftEntries.add(
            SaveAudioSetEntry.newBuilder()
                .setTimeSeconds(Float.parseFloat(spec[0]))
                .setName(spec[1])
                .setUrl(url)
                .setType("preset")
                .build());
      }
    }
    if (assetService.getAssetById("default_seconds_left") == null
        && !secondsLeftEntries.isEmpty()) {
      try {
        assetService.saveAudioSet(
            "default_seconds_left", "Default Seconds Left", secondsLeftEntries);
        logger.info("Backfilled default seconds left audio set with ID default_seconds_left");
      } catch (Exception e) {
        logger.error("Failed to backfill default seconds left audio set", e);
      }
    }
  }

  private void backfillFuelGaugeDefaults() {
    List<SaveImageSetEntry> fuelSetEntries = new ArrayList<>();
    for (FuelDefaultAsset asset : DEFAULT_FUEL_IMAGE_ASSETS) {
      if (isAssetMissingOrFileMissing(asset.id, asset.displayName)) {
        try {
          byte[] data = readResource("/defaults/" + asset.filename);
          AssetMessage saved = assetService.saveAsset(asset.id, asset.displayName, "image", data);
          fuelSetEntries.add(
              SaveImageSetEntry.newBuilder()
                  .setUrl(saved.getUrl())
                  .setName(asset.displayName)
                  .setPercentage(asset.percentage)
                  .build());
        } catch (Exception e) {
          logger.error("Failed to backfill fuel asset {}", asset.filename, e);
        }
      } else {
        AssetMessage existing = assetService.getAssetById(asset.id);
        fuelSetEntries.add(
            SaveImageSetEntry.newBuilder()
                .setUrl(existing.getUrl())
                .setName(asset.displayName)
                .setPercentage(asset.percentage)
                .build());
      }
    }

    if (assetService.getAssetById("default_fuel_gauge") == null && !fuelSetEntries.isEmpty()) {
      try {
        assetService.saveImageSet("default_fuel_gauge", "Default Fuel Gauge", fuelSetEntries);
        logger.info("Backfilled default fuel gauge image set with ID default_fuel_gauge");
      } catch (Exception e) {
        logger.error("Failed to backfill default fuel gauge image set", e);
      }
    }
  }

  public void backfillDefaultTheme() {
    try {
      databaseContext.ensureTable("themes");
      SqliteRepository<Theme> themeRepo =
          new SqliteRepository<>(databaseContext, "themes", Theme.class);
      List<Theme> themes = themeRepo.findAll();
      boolean hasDefault = false;
      boolean hasPractice = false;
      for (Theme t : themes) {
        boolean updated = false;
        Map<String, String> s = new HashMap<>(t.getSlots());
        if (migrateThemeSlots(s, t.isDefault())) {
          updated = true;
        }
        if (s.containsKey("audio.countdown")) {
          s.remove("audio.countdown");
          updated = true;
        }
        if (s.containsKey("audio.seconds_left")) {
          s.remove("audio.seconds_left");
          updated = true;
        }

        Map<String, AudioConfig> as =
            t.getAudioSlots() != null ? new HashMap<>(t.getAudioSlots()) : new HashMap<>();
        if (populateDefaultAudioSlots(as)) {
          updated = true;
        }

        String uiId = t.getUiId();
        if (Theme.DEFAULT_THEME_ID.equals(t.getEntityId())) {
          hasDefault = true;
          if (uiId == null) {
            uiId = CustomUI.DEFAULT_UI_ID;
            updated = true;
          }
        }
        if (Theme.PRACTICE_THEME_ID.equals(t.getEntityId())) {
          hasPractice = true;
          if (uiId == null) {
            uiId = CustomUI.PRACTICE_UI_ID;
            updated = true;
          }
        }

        if (updated) {
          Theme newTheme =
              new Theme(t.getName(), t.isDefault(), s, as, uiId, t.getEntityId(), t.getId());
          themeRepo.save(newTheme);
        }
      }
      if (!hasDefault) {
        Map<String, String> slots = createDefaultSlots();
        Map<String, AudioConfig> audioSlots = new HashMap<>();
        populateDefaultAudioSlots(audioSlots);

        Theme defaultTheme =
            new Theme(
                "Default Theme",
                true,
                slots,
                audioSlots,
                CustomUI.DEFAULT_UI_ID,
                Theme.DEFAULT_THEME_ID,
                null);
        themeRepo.save(defaultTheme);
        logger.info("Backfilled default theme with ID {}", Theme.DEFAULT_THEME_ID);
      }
      if (!hasPractice) {
        Map<String, String> slots = createDefaultSlots();
        Map<String, AudioConfig> audioSlots = new HashMap<>();
        populateDefaultAudioSlots(audioSlots);

        Theme practiceTheme =
            new Theme(
                "Practice Theme",
                true,
                slots,
                audioSlots,
                CustomUI.PRACTICE_UI_ID,
                Theme.PRACTICE_THEME_ID,
                null);
        themeRepo.save(practiceTheme);
        logger.info("Backfilled practice theme with ID {}", Theme.PRACTICE_THEME_ID);
      }
    } catch (Exception e) {
      logger.error("Failed to backfill default theme", e);
    }
  }

  private boolean migrateThemeSlots(Map<String, String> s, boolean isDefault) {
    boolean updated = false;

    // Migrate old flag slots to behavioral slots if old exist
    String green = s.remove("flag.green");
    String yellow = s.remove("flag.yellow");
    String red = s.remove("flag.red");
    String white = s.remove("flag.white");
    String yellowgreen = s.remove("flag.yellowgreen");
    String checkered = s.remove("flag.checkered");
    String black = s.remove("flag.black");

    if (green != null) {
      if (!s.containsKey("flag.racing")) s.put("flag.racing", green);
      updated = true;
    }
    if (yellow != null) {
      if (!s.containsKey("flag.heat_paused")) s.put("flag.heat_paused", yellow);
      if (!s.containsKey("flag.restarting")) s.put("flag.restarting", yellow);
      updated = true;
    }
    if (red != null) {
      if (!s.containsKey("flag.not_started")) s.put("flag.not_started", red);
      if (!s.containsKey("flag.starting")) s.put("flag.starting", red);
      if (!s.containsKey("flag.heat_over")) s.put("flag.heat_over", red);
      if (!s.containsKey("flag.driver_finished")) s.put("flag.driver_finished", red);
      updated = true;
    }
    if (white != null) {
      if (!s.containsKey("flag.one_lap_to_go")) s.put("flag.one_lap_to_go", white);
      updated = true;
    }
    if (yellowgreen != null) {
      if (!s.containsKey("flag.warmup")) s.put("flag.warmup", yellowgreen);
      updated = true;
    }
    if (checkered != null) {
      if (!s.containsKey("flag.heat_finishing")) s.put("flag.heat_finishing", checkered);
      if (!s.containsKey("flag.race_over")) s.put("flag.race_over", checkered);
      updated = true;
    }
    if (black != null) {
      if (!s.containsKey("flag.penalty")) s.put("flag.penalty", black);
      updated = true;
    }

    if (!s.containsKey("gauge.fuel")) {
      s.put("gauge.fuel", "default_fuel_gauge");
      updated = true;
    }

    if (isDefault) {
      Map<String, String> defaults = createDefaultSlots();
      for (Map.Entry<String, String> entry : defaults.entrySet()) {
        if (!s.containsKey(entry.getKey())) {
          s.put(entry.getKey(), entry.getValue());
          updated = true;
        }
      }
    }

    return updated;
  }

  private boolean populateDefaultAudioSlots(Map<String, AudioConfig> as) {
    boolean updated = false;
    if (!as.containsKey("audio.countdown")) {
      as.put("audio.countdown", new AudioConfig("audio_set", "default_countdown", null));
      updated = true;
    }
    if (!as.containsKey("audio.seconds_left")) {
      as.put("audio.seconds_left", new AudioConfig("audio_set", "default_seconds_left", null));
      updated = true;
    }
    if (!as.containsKey("audio.yellowflag")) {
      as.put("audio.yellowflag", new AudioConfig("preset", "default_yellow_flag", null));
      updated = true;
    }
    if (!as.containsKey("audio.seconds_left.halfway")) {
      as.put("audio.seconds_left.halfway", new AudioConfig("preset", "default_heat_half", null));
      updated = true;
    }
    if (!as.containsKey("audio.heat_over")) {
      as.put("audio.heat_over", new AudioConfig("preset", "default_heat_over", null));
      updated = true;
    }
    if (!as.containsKey("audio.race_over")) {
      as.put("audio.race_over", new AudioConfig("preset", "default_race_over", null));
      updated = true;
    }
    if (!as.containsKey("audio.penalty")) {
      as.put("audio.penalty", new AudioConfig("preset", "default_penalty", null));
      updated = true;
    }
    if (!as.containsKey("audio.min_lap_time")
        || ("preset".equals(as.get("audio.min_lap_time").getType())
            && "default_beep".equals(as.get("audio.min_lap_time").getUrl()))) {
      as.put(
          "audio.min_lap_time",
          new AudioConfig("tts", null, "Min lap time for {{driver.nickname}}"));
      updated = true;
    }
    if (!as.containsKey("audio.drift_lap")
        || ("preset".equals(as.get("audio.drift_lap").getType())
            && "default_beep".equals(as.get("audio.drift_lap").getUrl()))) {
      as.put("audio.drift_lap", new AudioConfig("tts", null, "Drift lap for {{driver.nickname}}"));
      updated = true;
    }
    return updated;
  }

  private Map<String, String> createDefaultSlots() {
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

  private byte[] readResource(String path) throws IOException {
    try (InputStream is = getClass().getResourceAsStream(path)) {
      if (is == null) {
        throw new IOException("Resource not found: " + path);
      }
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      int nRead;
      byte[] data = new byte[1024];
      while ((nRead = is.read(data, 0, data.length)) != -1) {
        buffer.write(data, 0, nRead);
      }
      buffer.flush();
      return buffer.toByteArray();
    }
  }
}
