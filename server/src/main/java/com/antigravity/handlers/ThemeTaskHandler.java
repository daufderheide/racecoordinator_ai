package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.AudioConfig;
import com.antigravity.models.Theme;
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
        if (t.isDefault()) {
          hasDefault = true;
          boolean updated = false;
          Map<String, String> s = new HashMap<>(t.getSlots());
          if (!s.containsKey("gauge.fuel")) {
            s.put("gauge.fuel", "default_fuel_gauge");
            updated = true;
          }
          if (!s.containsKey("audio.countdown")) {
            s.put("audio.countdown", "default_countdown");
            updated = true;
          }
          if (!s.containsKey("audio.seconds_left")) {
            s.put("audio.seconds_left", "default_seconds_left");
            updated = true;
          }

          Map<String, AudioConfig> as =
              t.getAudioSlots() != null ? new HashMap<>(t.getAudioSlots()) : new HashMap<>();
          if (populateDefaultAudioSlots(as)) {
            updated = true;
          }

          if (updated) {
            Theme newTheme = new Theme(t.getName(), true, s, as, t.getEntityId(), t.getId());
            themeRepository.save(newTheme);
          }
          break;
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

  private boolean populateDefaultAudioSlots(Map<String, AudioConfig> as) {
    boolean updated = false;
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
    slots.put("flag.green", "default_flag_green");
    slots.put("flag.red", "default_flag_red");
    slots.put("flag.yellow", "default_flag_yellow");
    slots.put("flag.white", "default_flag_white");
    slots.put("flag.yellowgreen", "default_flag_green_yellow");
    slots.put("flag.checkered", "default_flag_checkered");
    slots.put("flag.black", "default_flag_black");
    slots.put("lamp.red.on", "default_start_red_on");
    slots.put("lamp.red.dim", "default_start_red_dim");
    slots.put("lamp.green", "default_start_green");
    slots.put("gauge.fuel", "default_fuel_gauge");
    slots.put("audio.countdown", "default_countdown");
    slots.put("audio.seconds_left", "default_seconds_left");
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
