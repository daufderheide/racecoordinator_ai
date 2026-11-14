package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Theme;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.Race;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThemeTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(ThemeTaskHandler.class);

  public static final List<String> DEFAULT_FACTORY_THEME_IDS = Theme.DEFAULT_FACTORY_THEME_IDS;

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Theme> themeRepository;

  public ThemeTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    this.themeRepository = new SqliteRepository<>(databaseContext, "themes", Theme.class);

    app.get("/api/themes", this::listThemes, Role.VIEWER);
    app.get("/api/themes/default", this::getDefaultTheme, Role.VIEWER);
    app.get("/api/themes/factory-settings", this::getFactoryTheme, Role.VIEWER);
    app.get("/api/themes/{id}", this::getTheme, Role.VIEWER);
    app.post("/api/themes", this::createTheme, Role.VIEWER);
    app.put("/api/themes/{id}", this::updateTheme, Role.VIEWER);
    app.delete("/api/themes/{id}", this::deleteTheme, Role.VIEWER);
    app.post("/api/themes/{id}/duplicate", this::duplicateTheme, Role.VIEWER);
  }

  public synchronized void ensureDefaultTheme() {
    try {
      databaseContext.ensureTable("themes");
      List<Theme> themes = themeRepository.findAll();
      boolean[] foundFlags = new boolean[4]; // [default, practice, fuel, driver_station]
      for (Theme t : themes) {
        migrateAndCheckTheme(t, foundFlags);
      }

      if (!foundFlags[0]
          && !databaseContext.isDefaultArtifactDeleted("theme", Theme.DEFAULT_THEME_ID)) {
        createAndSaveFactoryTheme(
            Theme.DEFAULT_THEME_ID, Theme.DEFAULT_THEME_NAME, CustomUI.DEFAULT_UI_ID);
      }
      if (!foundFlags[1]
          && !databaseContext.isDefaultArtifactDeleted("theme", Theme.PRACTICE_THEME_ID)) {
        createAndSaveFactoryTheme(
            Theme.PRACTICE_THEME_ID, Theme.PRACTICE_THEME_NAME, CustomUI.PRACTICE_UI_ID);
      }
      if (!foundFlags[2]
          && !databaseContext.isDefaultArtifactDeleted("theme", Theme.FUEL_THEME_ID)) {
        createAndSaveFactoryTheme(Theme.FUEL_THEME_ID, Theme.FUEL_THEME_NAME, CustomUI.FUEL_UI_ID);
      }
      if (!foundFlags[3]
          && !databaseContext.isDefaultArtifactDeleted("theme", Theme.DRIVER_STATION_THEME_ID)) {
        createAndSaveFactoryTheme(
            Theme.DRIVER_STATION_THEME_ID,
            Theme.DRIVER_STATION_THEME_NAME,
            CustomUI.DRIVER_STATION_UI_ID);
      }
    } catch (Exception e) {
      logger.error("Failed to ensure default theme", e);
    }
  }

  private void migrateAndCheckTheme(Theme t, boolean[] foundFlags) {
    boolean updated = false;
    String entityId = t.getEntityId();
    String name = t.getName();

    if ("2".equals(entityId)
        && !foundFlags[2]
        && (t.isDefault() || "Fuel Theme".equalsIgnoreCase(name))) {
      themeRepository.delete("2");
      entityId = Theme.FUEL_THEME_ID;
      name = Theme.FUEL_THEME_NAME;
      foundFlags[2] = true;
      updated = true;
    }

    Map<String, String> s = new HashMap<>(t.getSlots());
    if (migrateThemeSlots(s, t.isDefault()) || cleanObsoleteAudioSlots(s)) {
      updated = true;
    }

    Map<String, AudioConfig> as =
        t.getAudioSlots() != null ? new HashMap<>(t.getAudioSlots()) : new HashMap<>();
    if (populateDefaultAudioSlots(as)) {
      updated = true;
    }

    String uiId = t.getUiId();
    if (Theme.FUEL_THEME_ID.equals(entityId) && "2".equals(uiId)) {
      uiId = CustomUI.FUEL_UI_ID;
      updated = true;
    }

    ThemeMetadata meta = normalizeDefaultThemeMetadata(entityId, name, uiId, foundFlags);
    name = meta.name;
    uiId = meta.uiId;
    if (meta.updated) {
      updated = true;
    }

    List<String> companionIds = t.getCompanionThemeIds();
    if (t.isDefault() && (companionIds == null || companionIds.isEmpty())) {
      companionIds = new ArrayList<>(DEFAULT_FACTORY_THEME_IDS);
      updated = true;
    }

    if (updated) {
      Theme newTheme =
          new Theme(
              name,
              t.isDefault(),
              s,
              as,
              t.getDriverAudioOverrides(),
              uiId,
              t.getDriverStationThemeId(),
              t.getDriverViewThemeId(),
              companionIds,
              entityId,
              t.getId());
      themeRepository.save(newTheme);
    }
  }

  private boolean cleanObsoleteAudioSlots(Map<String, String> s) {
    boolean updated = false;
    String[] obsoleteKeys = {
      "audio.countdown",
      "audio.seconds_left",
      "audio.laps_left",
      "audio.auto_start",
      "audio.auto_advance"
    };
    for (String key : obsoleteKeys) {
      if (s.remove(key) != null) {
        updated = true;
      }
    }
    return updated;
  }

  private static class ThemeMetadata {
    final String name;
    final String uiId;
    final boolean updated;

    ThemeMetadata(String name, String uiId, boolean updated) {
      this.name = name;
      this.uiId = uiId;
      this.updated = updated;
    }
  }

  private ThemeMetadata normalizeDefaultThemeMetadata(
      String entityId, String name, String uiId, boolean[] foundFlags) {
    boolean updated = false;
    if (Theme.DEFAULT_THEME_ID.equals(entityId)) {
      foundFlags[0] = true;
      if (uiId == null) {
        uiId = CustomUI.DEFAULT_UI_ID;
        updated = true;
      }
      if (Theme.isLegacyDefaultName(name) && !Theme.DEFAULT_THEME_NAME.equals(name)) {
        name = Theme.DEFAULT_THEME_NAME;
        updated = true;
      }
    } else if (Theme.PRACTICE_THEME_ID.equals(entityId)) {
      foundFlags[1] = true;
      if (uiId == null) {
        uiId = CustomUI.PRACTICE_UI_ID;
        updated = true;
      }
      if (Theme.isLegacyPracticeName(name) && !Theme.PRACTICE_THEME_NAME.equals(name)) {
        name = Theme.PRACTICE_THEME_NAME;
        updated = true;
      }
    } else if (Theme.FUEL_THEME_ID.equals(entityId)) {
      foundFlags[2] = true;
      if (uiId == null) {
        uiId = CustomUI.FUEL_UI_ID;
        updated = true;
      }
      if (Theme.isLegacyFuelName(name) && !Theme.FUEL_THEME_NAME.equals(name)) {
        name = Theme.FUEL_THEME_NAME;
        updated = true;
      }
    } else if (Theme.DRIVER_STATION_THEME_ID.equals(entityId)) {
      foundFlags[3] = true;
      if (uiId == null) {
        uiId = CustomUI.DRIVER_STATION_UI_ID;
        updated = true;
      }
      if (Theme.isLegacyDriverStationName(name) && !Theme.DRIVER_STATION_THEME_NAME.equals(name)) {
        name = Theme.DRIVER_STATION_THEME_NAME;
        updated = true;
      }
    }
    if (uiId == null || uiId.trim().isEmpty()) {
      uiId = CustomUI.DEFAULT_UI_ID;
      updated = true;
    }
    return new ThemeMetadata(name, uiId, updated);
  }

  private void createAndSaveFactoryTheme(String entityId, String name, String uiId) {
    Map<String, String> slots = createDefaultSlots();
    Map<String, AudioConfig> audioSlots = new HashMap<>();
    populateDefaultAudioSlots(audioSlots);

    Theme theme =
        new Theme(
            name,
            true,
            slots,
            audioSlots,
            new HashMap<>(),
            uiId,
            Theme.DRIVER_STATION_THEME_ID,
            Theme.DRIVER_STATION_THEME_ID,
            new ArrayList<>(DEFAULT_FACTORY_THEME_IDS),
            entityId,
            null);
    themeRepository.save(theme);
    logger.info("Created factory theme with ID {}", entityId);
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
      if (!s.containsKey("flag.disqualified")) s.put("flag.disqualified", black);
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
    if (!as.containsKey("audio.laps_left")) {
      as.put("audio.laps_left", new AudioConfig("audio_set", "default_laps_left", null));
      updated = true;
    }
    if (!as.containsKey("audio.auto_start")) {
      as.put("audio.auto_start", new AudioConfig("audio_set", "default_auto_start", null));
      updated = true;
    }
    if (!as.containsKey("audio.auto_advance")) {
      as.put("audio.auto_advance", new AudioConfig("audio_set", "default_auto_advance", null));
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
    if (!as.containsKey("audio.min_lap_time")
        || ("preset".equals(as.get("audio.min_lap_time").getType())
            && "default_beep".equals(as.get("audio.min_lap_time").getUrl()))) {
      as.put(
          "audio.min_lap_time", new AudioConfig("tts", null, "Min lap time for {driver.nickname}"));
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
    slots.put("flag.disqualified", "default_flag_black");
    slots.put("lamp.red.on", "default_start_red_on");
    slots.put("lamp.red.dim", "default_start_red_dim");
    slots.put("lamp.green", "default_start_green");
    slots.put("gauge.fuel", "default_fuel_gauge");
    return slots;
  }

  <T> T getBody(Context ctx, Class<T> clazz) {
    try {
      return DatabaseHandlerUtils.bodyAsClassWithId(ctx.body(), clazz);
    } catch (Exception e) {
      throw new RuntimeException("Error parsing request body: " + e.getMessage(), e);
    }
  }

  void setStatus(Context ctx, int status) {
    ctx.status(status);
  }

  void setResult(Context ctx, String result) {
    ctx.result(result);
  }

  void setJson(Context ctx, Object obj) {
    ctx.json(obj);
  }

  String getPathParam(Context ctx, String key) {
    return ctx.pathParam(key);
  }

  void listThemes(Context ctx) {
    try {
      ensureDefaultTheme();
      List<Theme> themes = themeRepository.findAll();
      setJson(ctx, themes);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error listing themes: " + e.getMessage());
    }
  }

  void getDefaultTheme(Context ctx) {
    try {
      ensureDefaultTheme();
      Theme defaultTheme = null;
      for (Theme t : themeRepository.findAll()) {
        if (t.isDefault()) {
          defaultTheme = t;
          break;
        }
      }
      if (defaultTheme == null) {
        setStatus(ctx, 404);
        setResult(ctx, "No default theme found");
        return;
      }
      setJson(ctx, defaultTheme);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error getting default theme: " + e.getMessage());
    }
  }

  public Theme getFactoryTheme() {
    Map<String, String> slots = createDefaultSlots();
    Map<String, AudioConfig> audioSlots = new HashMap<>();
    populateDefaultAudioSlots(audioSlots);
    List<String> allIds =
        themeRepository.findAll().stream()
            .map(Theme::getEntityId)
            .filter(id -> id != null && !id.trim().isEmpty())
            .collect(Collectors.toList());
    if (allIds.isEmpty()) {
      allIds = new ArrayList<>(DEFAULT_FACTORY_THEME_IDS);
    }
    return new Theme(
        "New Theme",
        false,
        slots,
        audioSlots,
        new HashMap<>(),
        CustomUI.DEFAULT_UI_ID,
        Theme.DRIVER_STATION_THEME_ID,
        Theme.DRIVER_STATION_THEME_ID,
        allIds,
        "new",
        null);
  }

  void getFactoryTheme(Context ctx) {
    try {
      setJson(ctx, getFactoryTheme());
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error getting factory theme: " + e.getMessage());
    }
  }

  void getTheme(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      Theme theme = themeRepository.findByEntityId(id);
      if (theme == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Theme not found");
        return;
      }
      setJson(ctx, theme);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error getting theme: " + e.getMessage());
    }
  }

  void createTheme(Context ctx) {
    try {
      Theme theme = getBody(ctx, Theme.class);
      for (Theme existing : themeRepository.findAll()) {
        if (existing.getName() != null && existing.getName().equalsIgnoreCase(theme.getName())) {
          setStatus(ctx, 409);
          setResult(ctx, "Theme name already exists");
          return;
        }
      }

      List<Theme> existingThemes = themeRepository.findAll();
      List<String> existingThemeIds =
          existingThemes.stream()
              .map(Theme::getEntityId)
              .filter(id -> id != null && !id.trim().isEmpty())
              .collect(Collectors.toList());

      if (theme.getEntityId() == null
          || theme.getEntityId().isEmpty()
          || "new".equals(theme.getEntityId())) {
        String nextId = getNextSequence("themes");
        theme =
            new Theme(
                theme.getName(),
                false,
                theme.getSlots(),
                theme.getAudioSlots(),
                theme.getDriverAudioOverrides(),
                theme.getUiId(),
                theme.getDriverStationThemeId(),
                theme.getDriverViewThemeId(),
                theme.getCompanionThemeIds(),
                nextId,
                null);
      }

      String newThemeId = theme.getEntityId();
      List<String> newCompanionIds = theme.getCompanionThemeIds();
      boolean newHadAllSelected =
          newCompanionIds == null
              || (!existingThemeIds.isEmpty() && newCompanionIds.containsAll(existingThemeIds));
      if (newHadAllSelected) {
        Set<String> updatedNewCompanionIds =
            new LinkedHashSet<>(newCompanionIds != null ? newCompanionIds : existingThemeIds);
        if (newThemeId != null && !newThemeId.trim().isEmpty()) {
          updatedNewCompanionIds.add(newThemeId);
        }
        theme =
            new Theme(
                theme.getName(),
                theme.isDefault(),
                theme.getSlots(),
                theme.getAudioSlots(),
                theme.getDriverAudioOverrides(),
                theme.getUiId(),
                theme.getDriverStationThemeId(),
                theme.getDriverViewThemeId(),
                new ArrayList<>(updatedNewCompanionIds),
                newThemeId,
                theme.getId());
      }

      themeRepository.save(theme);
      addThemeToAllThemesWithAllSelected(newThemeId, existingThemes, existingThemeIds);
      if (Theme.DEFAULT_THEME_ID.equals(theme.getEntityId())
          || Theme.isLegacyDefaultName(theme.getName())) {
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.DEFAULT_THEME_ID);
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.DEFAULT_THEME_NAME);
      } else if (Theme.PRACTICE_THEME_ID.equals(theme.getEntityId())
          || Theme.isLegacyPracticeName(theme.getName())) {
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.PRACTICE_THEME_ID);
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.PRACTICE_THEME_NAME);
      } else if (Theme.FUEL_THEME_ID.equals(theme.getEntityId())
          || Theme.isLegacyFuelName(theme.getName())) {
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.FUEL_THEME_ID);
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.FUEL_THEME_NAME);
      } else if (Theme.DRIVER_STATION_THEME_ID.equals(theme.getEntityId())
          || Theme.isLegacyDriverStationName(theme.getName())) {
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.DRIVER_STATION_THEME_ID);
        databaseContext.clearDefaultArtifactDeleted("theme", Theme.DRIVER_STATION_THEME_NAME);
      }
      if (theme.getEntityId() != null) {
        databaseContext.clearDefaultArtifactDeleted("theme", theme.getEntityId());
      }
      if (theme.getName() != null) {
        databaseContext.clearDefaultArtifactDeleted("theme", theme.getName());
      }
      setStatus(ctx, 201);
      setJson(ctx, theme);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error creating theme: " + e.getMessage());
    }
  }

  void updateTheme(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      Theme theme = getBody(ctx, Theme.class);

      for (Theme existing : themeRepository.findAll()) {
        if (!id.equals(existing.getEntityId())
            && existing.getName() != null
            && existing.getName().equalsIgnoreCase(theme.getName())) {
          setStatus(ctx, 409);
          setResult(ctx, "Theme name already exists");
          return;
        }
      }

      Theme current = themeRepository.findByEntityId(id);
      if (current == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Theme not found");
        return;
      }

      theme =
          new Theme(
              theme.getName() != null && !theme.getName().trim().isEmpty()
                  ? theme.getName()
                  : current.getName(),
              current.isDefault(),
              theme.getSlots(),
              theme.getAudioSlots(),
              theme.getDriverAudioOverrides() != null
                  ? theme.getDriverAudioOverrides()
                  : current.getDriverAudioOverrides(),
              theme.getUiId(),
              theme.getDriverStationThemeId() != null
                  ? theme.getDriverStationThemeId()
                  : current.getDriverStationThemeId(),
              theme.getDriverViewThemeId() != null
                  ? theme.getDriverViewThemeId()
                  : current.getDriverViewThemeId(),
              theme.getCompanionThemeIds() != null
                  ? theme.getCompanionThemeIds()
                  : current.getCompanionThemeIds(),
              id,
              null);

      themeRepository.save(theme);

      Race activeRace = ClientSubscriptionManager.getInstance().getRace();
      if (activeRace != null
          && activeRace.getTheme() != null
          && id.equals(activeRace.getTheme().getEntityId())) {
        activeRace.setTheme(theme);
      }

      setJson(ctx, theme);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error updating theme: " + e.getMessage());
    }
  }

  void deleteTheme(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      Theme theme = themeRepository.findByEntityId(id);

      if (theme == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Theme not found");
        return;
      }

      themeRepository.delete(id);
      if (Theme.DEFAULT_THEME_ID.equals(id)
          || Theme.PRACTICE_THEME_ID.equals(id)
          || Theme.FUEL_THEME_ID.equals(id)
          || Theme.DRIVER_STATION_THEME_ID.equals(id)
          || "2".equals(id)
          || theme.isDefault()) {
        databaseContext.markDefaultArtifactDeleted("theme", id);
        if (Theme.DEFAULT_THEME_ID.equals(id) || Theme.isLegacyDefaultName(theme.getName())) {
          databaseContext.markDefaultArtifactDeleted("theme", Theme.DEFAULT_THEME_ID);
        }
        if (Theme.PRACTICE_THEME_ID.equals(id) || Theme.isLegacyPracticeName(theme.getName())) {
          databaseContext.markDefaultArtifactDeleted("theme", Theme.PRACTICE_THEME_ID);
        }
        if (Theme.FUEL_THEME_ID.equals(id)
            || "2".equals(id)
            || Theme.isLegacyFuelName(theme.getName())) {
          databaseContext.markDefaultArtifactDeleted("theme", Theme.FUEL_THEME_ID);
        }
        if (Theme.DRIVER_STATION_THEME_ID.equals(id)
            || Theme.isLegacyDriverStationName(theme.getName())) {
          databaseContext.markDefaultArtifactDeleted("theme", Theme.DRIVER_STATION_THEME_ID);
        }
      }

      Race activeRace = ClientSubscriptionManager.getInstance().getRace();
      if (activeRace != null
          && activeRace.getTheme() != null
          && id.equals(activeRace.getTheme().getEntityId())) {
        Theme defaultTheme = null;
        for (Theme t : themeRepository.findAll()) {
          if (t.isDefault()) {
            defaultTheme = t;
            break;
          }
        }
        activeRace.setTheme(defaultTheme);
      }

      setStatus(ctx, 204);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error deleting theme: " + e.getMessage());
    }
  }

  void duplicateTheme(Context ctx) {
    try {
      String id = getPathParam(ctx, "id");
      Theme source = themeRepository.findByEntityId(id);
      if (source == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Source theme not found");
        return;
      }

      String newName;
      try {
        Map<String, String> body = getBody(ctx, Map.class);
        newName = body.get("name");
      } catch (Exception e) {
        newName = null;
      }
      if (newName == null || newName.isEmpty()) {
        newName = source.getName() + " (Copy)";
      }

      List<Theme> allThemes = themeRepository.findAll();
      boolean exists = true;
      String testName = newName;
      int suffix = 2;
      while (exists) {
        exists = false;
        for (Theme t : allThemes) {
          if (t.getName() != null && t.getName().equalsIgnoreCase(testName)) {
            exists = true;
            testName = newName + " " + suffix;
            suffix++;
            break;
          }
        }
      }
      newName = testName;

      List<String> existingThemeIds =
          allThemes.stream()
              .map(Theme::getEntityId)
              .filter(tid -> tid != null && !tid.trim().isEmpty())
              .collect(Collectors.toList());

      String nextId = getNextSequence("themes");
      List<String> sourceCompanionIds = source.getCompanionThemeIds();
      List<String> copyCompanionIds =
          sourceCompanionIds != null ? new ArrayList<>(sourceCompanionIds) : null;
      boolean sourceHadAllSelected =
          copyCompanionIds == null
              || (!existingThemeIds.isEmpty() && copyCompanionIds.containsAll(existingThemeIds));
      if (sourceHadAllSelected) {
        Set<String> updatedCopyCompanionIds =
            new LinkedHashSet<>(copyCompanionIds != null ? copyCompanionIds : existingThemeIds);
        updatedCopyCompanionIds.add(nextId);
        copyCompanionIds = new ArrayList<>(updatedCopyCompanionIds);
      }

      Theme copy =
          new Theme(
              newName,
              false,
              source.getSlots(),
              source.getAudioSlots(),
              source.getDriverAudioOverrides(),
              source.getUiId(),
              source.getDriverStationThemeId(),
              source.getDriverViewThemeId(),
              copyCompanionIds,
              nextId,
              null);
      themeRepository.save(copy);
      addThemeToAllThemesWithAllSelected(nextId, allThemes, existingThemeIds);

      setStatus(ctx, 201);
      setJson(ctx, copy);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error duplicating theme: " + e.getMessage());
    }
  }

  private void addThemeToAllThemesWithAllSelected(
      String newThemeId, List<Theme> existingThemes, List<String> existingThemeIds) {
    if (newThemeId == null
        || newThemeId.trim().isEmpty()
        || existingThemes == null
        || existingThemes.isEmpty()
        || existingThemeIds == null
        || existingThemeIds.isEmpty()) {
      return;
    }
    for (Theme existing : existingThemes) {
      if (existing == null || newThemeId.equals(existing.getEntityId())) {
        continue;
      }
      List<String> companionIds = existing.getCompanionThemeIds();
      boolean hasAllSelected = companionIds == null || companionIds.containsAll(existingThemeIds);
      if (hasAllSelected) {
        Set<String> updatedCompanionIds =
            new LinkedHashSet<>(companionIds != null ? companionIds : existingThemeIds);
        if (updatedCompanionIds.add(newThemeId)) {
          Theme updatedTheme =
              new Theme(
                  existing.getName(),
                  existing.isDefault(),
                  existing.getSlots(),
                  existing.getAudioSlots(),
                  existing.getDriverAudioOverrides(),
                  existing.getUiId(),
                  existing.getDriverStationThemeId(),
                  existing.getDriverViewThemeId(),
                  new ArrayList<>(updatedCompanionIds),
                  existing.getEntityId(),
                  existing.getId());
          themeRepository.save(updatedTheme);

          Race activeRace = ClientSubscriptionManager.getInstance().getRace();
          if (activeRace != null
              && activeRace.getTheme() != null
              && existing.getEntityId().equals(activeRace.getTheme().getEntityId())) {
            activeRace.setTheme(updatedTheme);
          }
        }
      }
    }
  }

  private String getNextSequence(String collectionName) {
    return databaseContext.getNextSequence(collectionName);
  }
}
