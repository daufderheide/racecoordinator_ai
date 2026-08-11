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
        "default_countdown", defaultTheme.getSlots().get("audio.countdown"));
    org.junit.Assert.assertEquals(
        "default_seconds_left", defaultTheme.getSlots().get("audio.seconds_left"));
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
}
