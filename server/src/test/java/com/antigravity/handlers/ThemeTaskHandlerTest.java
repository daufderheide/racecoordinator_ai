package com.antigravity.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Theme;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class ThemeTaskHandlerTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private Javalin app;
  private ThemeTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    handler = org.mockito.Mockito.spy(new ThemeTaskHandler(databaseContext, app));

    org.mockito.Mockito.doNothing().when(handler).setStatus(any(), anyInt());
    org.mockito.Mockito.doNothing().when(handler).setResult(any(), anyString());
    org.mockito.Mockito.doNothing().when(handler).setJson(any(), any());
  }

  @After
  public void tearDown() {
    if (databaseContext != null && databaseContext.getConnection() != null) {
      try {
        databaseContext.getConnection().close();
      } catch (Exception ignored) {
      }
    }
  }

  @Test
  public void testListThemes_Success() {
    handler.listThemes(ctx);
    verify(handler).setJson(any(), any());
  }

  @Test
  public void testGetDefaultTheme_Success() {
    handler.getDefaultTheme(ctx);
    verify(handler).setJson(any(), any());
  }

  @Test
  public void testEnsureDefaultTheme_CreatesDefaultThemeWhenEmpty() {
    handler.ensureDefaultTheme();
    org.mockito.ArgumentCaptor<Object> captor = org.mockito.ArgumentCaptor.forClass(Object.class);
    handler.listThemes(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(any(), captor.capture());

    @SuppressWarnings("unchecked")
    List<Theme> themes = (List<Theme>) captor.getValue();
    assertNotNull(themes);
    assertFalse(themes.isEmpty());
    Theme defaultTheme = themes.stream().filter(Theme::isDefault).findFirst().orElse(null);
    assertNotNull(defaultTheme);
    assertNotNull(defaultTheme.getAudioSlots());
    org.junit.Assert.assertEquals(
        "tts", defaultTheme.getAudioSlots().get("audio.min_lap_time").getType());
    org.junit.Assert.assertEquals(
        "Min lap time for {{driver.nickname}}",
        defaultTheme.getAudioSlots().get("audio.min_lap_time").getText());
    org.junit.Assert.assertEquals(
        "tts", defaultTheme.getAudioSlots().get("audio.drift_lap").getType());
    org.junit.Assert.assertEquals(
        "Drift lap for {{driver.nickname}}",
        defaultTheme.getAudioSlots().get("audio.drift_lap").getText());
    org.junit.Assert.assertEquals(
        "default_yellow_flag", defaultTheme.getAudioSlots().get("audio.yellowflag").getUrl());
    org.junit.Assert.assertEquals(
        "audio_set", defaultTheme.getAudioSlots().get("audio.countdown").getType());
    org.junit.Assert.assertEquals(
        "default_countdown", defaultTheme.getAudioSlots().get("audio.countdown").getUrl());
    org.junit.Assert.assertEquals(
        "audio_set", defaultTheme.getAudioSlots().get("audio.seconds_left").getType());
    org.junit.Assert.assertEquals(
        "default_seconds_left", defaultTheme.getAudioSlots().get("audio.seconds_left").getUrl());
  }

  @Test
  public void testCreateTheme_Success() {
    Theme themeRequest =
        new Theme("New Theme", false, new HashMap<>(), new HashMap<>(), "new", null);
    org.mockito.Mockito.doReturn(themeRequest).when(handler).getBody(any(), eq(Theme.class));

    handler.createTheme(ctx);
    verify(handler).setStatus(any(), eq(201));
    verify(handler).setJson(any(), any());
  }

  @Test
  public void testGetTheme_FoundAndNotFound() {
    handler.ensureDefaultTheme();
    org.mockito.Mockito.doReturn(Theme.DEFAULT_THEME_ID)
        .when(handler)
        .getPathParam(any(), eq("id"));

    handler.getTheme(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(any(), any());

    // Not found
    org.mockito.Mockito.doReturn("nonexistent_id").when(handler).getPathParam(any(), eq("id"));
    handler.getTheme(ctx);
    verify(handler).setStatus(any(), eq(404));
  }

  @Test
  public void testUpdateTheme_SuccessAndForbiddenDefault() {
    handler.ensureDefaultTheme();

    // Updating default theme -> 403
    Theme themeUpdate =
        new Theme(
            "Updated Default",
            true,
            new HashMap<>(),
            new HashMap<>(),
            Theme.DEFAULT_THEME_ID,
            null);
    org.mockito.Mockito.doReturn(Theme.DEFAULT_THEME_ID)
        .when(handler)
        .getPathParam(any(), eq("id"));
    org.mockito.Mockito.doReturn(themeUpdate).when(handler).getBody(any(), eq(Theme.class));

    handler.updateTheme(ctx);
    verify(handler).setStatus(any(), eq(403));

    // Create custom theme and update it
    Theme custom =
        new Theme("Custom Theme", false, new HashMap<>(), new HashMap<>(), "custom_1", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom);

    Theme updatedCustom =
        new Theme(
            "Custom Theme Renamed", false, new HashMap<>(), new HashMap<>(), "custom_1", null);
    org.mockito.Mockito.doReturn("custom_1").when(handler).getPathParam(any(), eq("id"));
    org.mockito.Mockito.doReturn(updatedCustom).when(handler).getBody(any(), eq(Theme.class));

    handler.updateTheme(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(any(), any());
  }

  @Test
  public void testDeleteTheme_DefaultForbiddenAndCustomDeleted() {
    handler.ensureDefaultTheme();

    // Delete default -> 400
    org.mockito.Mockito.doReturn(Theme.DEFAULT_THEME_ID)
        .when(handler)
        .getPathParam(any(), eq("id"));
    handler.deleteTheme(ctx);
    verify(handler).setStatus(any(), eq(400));

    // Delete custom -> 204
    Theme custom =
        new Theme("To Delete", false, new HashMap<>(), new HashMap<>(), "delete_1", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom);

    org.mockito.Mockito.doReturn("delete_1").when(handler).getPathParam(any(), eq("id"));
    handler.deleteTheme(ctx);
    verify(handler).setStatus(any(), eq(204));
  }

  @Test
  public void testDuplicateTheme_SuccessAndNotFound() {
    handler.ensureDefaultTheme();

    org.mockito.Mockito.doReturn(Theme.DEFAULT_THEME_ID)
        .when(handler)
        .getPathParam(any(), eq("id"));
    handler.duplicateTheme(ctx);
    verify(handler).setStatus(any(), eq(201));

    // Not found
    org.mockito.Mockito.doReturn("nonexistent_id").when(handler).getPathParam(any(), eq("id"));
    handler.duplicateTheme(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(any(), eq(404));
  }

  @Test
  public void testUpdateTheme_UpdatesActiveRaceTheme() {
    Theme custom =
        new Theme("Active Custom", false, new HashMap<>(), new HashMap<>(), "theme_active_1", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom);

    com.antigravity.race.Race mockRace = org.mockito.Mockito.mock(com.antigravity.race.Race.class);
    org.mockito.Mockito.when(mockRace.getTheme()).thenReturn(custom);
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockRace);

    try {
      java.util.Map<String, String> updatedSlots = new HashMap<>();
      updatedSlots.put("flag.heat_paused", "default_flag_checkered");
      Theme updated =
          new Theme("Active Custom", false, updatedSlots, new HashMap<>(), "theme_active_1", null);

      org.mockito.Mockito.doReturn("theme_active_1").when(handler).getPathParam(any(), eq("id"));
      org.mockito.Mockito.doReturn(updated).when(handler).getBody(any(), eq(Theme.class));

      handler.updateTheme(ctx);

      verify(mockRace).setTheme(any(Theme.class));
    } finally {
      com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);
    }
  }
}
