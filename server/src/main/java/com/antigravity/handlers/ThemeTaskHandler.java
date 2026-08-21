package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Theme;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.Race;
import com.antigravity.repository.SqliteRepository;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ThemeTaskHandler {
  private static final Logger logger = LoggerFactory.getLogger(ThemeTaskHandler.class);

  private final DatabaseContext databaseContext;
  private final SqliteRepository<Theme> themeRepository;

  public ThemeTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;
    this.themeRepository = new SqliteRepository<>(databaseContext, "themes", Theme.class);

    app.get("/api/themes", this::listThemes, Role.VIEWER);
    app.get("/api/themes/default", this::getDefaultTheme, Role.VIEWER);
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
      boolean hasDefault = false;
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

        if (t.isDefault()) {
          hasDefault = true;
        }

        if (updated) {
          Theme newTheme = new Theme(t.getName(), t.isDefault(), s, as, t.getEntityId(), t.getId());
          themeRepository.save(newTheme);
        }
      }
      if (!hasDefault) {
        Map<String, String> slots = createDefaultSlots();
        Map<String, AudioConfig> audioSlots = new HashMap<>();
        populateDefaultAudioSlots(audioSlots);

        Theme defaultTheme =
            new Theme("Default Theme", true, slots, audioSlots, Theme.DEFAULT_THEME_ID, null);
        themeRepository.save(defaultTheme);
        logger.info("Created default theme with ID {}", Theme.DEFAULT_THEME_ID);
      }
    } catch (Exception e) {
      logger.error("Failed to ensure default theme", e);
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

  <T> T getBody(Context ctx, Class<T> clazz) {
    return ctx.bodyAsClass(clazz);
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

      if (theme.getEntityId() == null
          || theme.getEntityId().isEmpty()
          || "new".equals(theme.getEntityId())) {
        String nextId = getNextSequence("themes");
        theme =
            new Theme(
                theme.getName(), false, theme.getSlots(), theme.getAudioSlots(), nextId, null);
      }

      themeRepository.save(theme);
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

      if (current.isDefault()) {
        setStatus(ctx, 403);
        setResult(ctx, "Cannot update the default theme");
        return;
      }

      theme =
          new Theme(
              theme.getName(),
              current.isDefault(),
              theme.getSlots(),
              theme.getAudioSlots(),
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
      if (theme != null && theme.isDefault()) {
        setStatus(ctx, 400);
        setResult(ctx, "Cannot delete the default theme");
        return;
      }

      if (theme == null) {
        setStatus(ctx, 404);
        setResult(ctx, "Theme not found");
        return;
      }

      themeRepository.delete(id);

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

      String nextId = getNextSequence("themes");
      Theme copy =
          new Theme(newName, false, source.getSlots(), source.getAudioSlots(), nextId, null);
      themeRepository.save(copy);
      setStatus(ctx, 201);
      setJson(ctx, copy);
    } catch (Exception e) {
      e.printStackTrace();
      setStatus(ctx, 500);
      setResult(ctx, "Error duplicating theme: " + e.getMessage());
    }
  }

  private String getNextSequence(String collectionName) {
    return databaseContext.getNextSequence(collectionName);
  }
}
