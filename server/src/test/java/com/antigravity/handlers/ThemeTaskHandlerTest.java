package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.CustomUI;
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
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
    Theme defaultTheme =
        themes.stream()
            .filter(t -> Theme.DEFAULT_THEME_ID.equals(t.getEntityId()))
            .findFirst()
            .orElse(null);
    assertNotNull(defaultTheme);
    org.junit.Assert.assertEquals(CustomUI.DEFAULT_UI_ID, defaultTheme.getUiId());
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

    Theme practiceTheme =
        themes.stream()
            .filter(t -> Theme.PRACTICE_THEME_ID.equals(t.getEntityId()))
            .findFirst()
            .orElse(null);
    assertNotNull(practiceTheme);
    org.junit.Assert.assertEquals(CustomUI.PRACTICE_UI_ID, practiceTheme.getUiId());
    assertTrue(practiceTheme.isDefault());

    Theme fuelTheme =
        themes.stream()
            .filter(t -> Theme.FUEL_THEME_ID.equals(t.getEntityId()))
            .findFirst()
            .orElse(null);
    assertNotNull(fuelTheme);
    org.junit.Assert.assertEquals(CustomUI.FUEL_UI_ID, fuelTheme.getUiId());
    assertTrue(fuelTheme.isDefault());
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

    // Updating default theme -> success
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
    verify(handler, org.mockito.Mockito.atLeastOnce()).setJson(any(), any());

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
  public void testDeleteTheme_DefaultAndCustomDeleted() {
    handler.ensureDefaultTheme();

    // Delete custom -> 204
    Theme custom =
        new Theme("To Delete", false, new HashMap<>(), new HashMap<>(), "delete_1", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom);

    org.mockito.Mockito.doReturn("delete_1").when(handler).getPathParam(any(), eq("id"));
    handler.deleteTheme(ctx);
    verify(handler).setStatus(any(), eq(204));

    // Delete default -> 204
    org.mockito.Mockito.doReturn(Theme.DEFAULT_THEME_ID)
        .when(handler)
        .getPathParam(any(), eq("id"));
    handler.deleteTheme(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(any(), eq(204));
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

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race")
            .withEntityId("r1")
            .build();
    Track track = com.antigravity.service.DatabaseService.getInstance().getFactoryTrack();
    com.antigravity.race.Race realRace =
        new com.antigravity.race.Race.Builder().model(raceModel).track(track).theme(custom).build();
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(realRace);

    try {
      java.util.Map<String, String> updatedSlots = new HashMap<>();
      updatedSlots.put("flag.heat_paused", "default_flag_checkered");
      Theme updated =
          new Theme("Active Custom", false, updatedSlots, new HashMap<>(), "theme_active_1", null);

      org.mockito.Mockito.doReturn("theme_active_1").when(handler).getPathParam(any(), eq("id"));
      org.mockito.Mockito.doReturn(updated).when(handler).getBody(any(), eq(Theme.class));

      handler.updateTheme(ctx);

      assertEquals(updatedSlots, realRace.getTheme().getSlots());
    } finally {
      com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);
    }
  }

  @Test
  public void testCustomThemeWithSequenceId2_PreservedAndDeletable() {
    handler.ensureDefaultTheme();

    // Create custom theme with ID "2" (generated by sequence)
    Theme custom2 =
        new Theme(
            "My New Custom Theme",
            false,
            new HashMap<>(),
            new HashMap<>(),
            "default_ui_layout_rc_ai",
            "2",
            null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom2);

    // Call ensureDefaultTheme again (which runs on listThemes)
    handler.ensureDefaultTheme();

    // Verify custom theme "2" was NOT deleted or mutated into Fuel Theme
    Theme retrieved =
        new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
            .findByEntityId("2");
    assertNotNull(retrieved);
    assertEquals("My New Custom Theme", retrieved.getName());
    assertFalse(retrieved.isDefault());

    // Delete custom theme "2"
    org.mockito.Mockito.doReturn("2").when(handler).getPathParam(any(), eq("id"));
    handler.deleteTheme(ctx);
    verify(handler, org.mockito.Mockito.atLeastOnce()).setStatus(any(), eq(204));

    Theme afterDelete =
        new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
            .findByEntityId("2");
    assertNull(afterDelete);
  }

  @Test
  public void testCustomThemeReferencingCustomUiId2_UiIdPreserved() {
    handler.ensureDefaultTheme();

    // Create custom theme with ID "3" referencing custom UI "2"
    Theme custom3 =
        new Theme(
            "Theme with Custom UI 2", false, new HashMap<>(), new HashMap<>(), "2", "3", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(custom3);

    // Call ensureDefaultTheme again
    handler.ensureDefaultTheme();

    // Verify custom theme "3" retained uiId "2" (NOT changed to default_fuel_ui_layout_rc_ai)
    Theme retrieved =
        new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
            .findByEntityId("3");
    assertNotNull(retrieved);
    assertEquals("2", retrieved.getUiId());
    assertEquals("Theme with Custom UI 2", retrieved.getName());
  }

  @Test
  public void testCustomThemeWithNullUiId_BackfilledToDefaultUi() {
    handler.ensureDefaultTheme();

    // Create legacy theme with ID "legacy_1" without uiId (null)
    Theme legacy =
        new Theme("Legacy Theme", false, new HashMap<>(), new HashMap<>(), null, "legacy_1", null);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
        .save(legacy);

    // Run startup backfill
    handler.ensureDefaultTheme();

    Theme retrieved =
        new com.antigravity.repository.SqliteRepository<>(databaseContext, "themes", Theme.class)
            .findByEntityId("legacy_1");
    assertNotNull(retrieved);
    assertEquals(com.antigravity.models.CustomUI.DEFAULT_UI_ID, retrieved.getUiId());
  }
}
