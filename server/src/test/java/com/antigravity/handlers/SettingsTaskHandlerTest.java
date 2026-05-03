package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.lang.reflect.Method;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.LoggerFactory;

public class SettingsTaskHandlerTest {

  private Javalin app;
  private SettingsTaskHandler handler;
  private Context ctx;

  @Before
  public void setUp() {

    app = mock(Javalin.class);
    ctx = mock(Context.class);
    handler = org.mockito.Mockito.spy(new SettingsTaskHandler(app));

    // Use doNothing for our wrapper methods to avoid calling real ctx methods
    org.mockito.Mockito.doNothing().when(handler).setStatus(any(), anyInt());
    org.mockito.Mockito.doNothing().when(handler).setResult(any(), anyString());
    org.mockito.Mockito.doReturn(null).when(handler).getQueryParam(any(), anyString());
  }

  @Test
  public void testSetLogLevel_Success() throws Exception {
    org.mockito.Mockito.doReturn("debug").when(handler).getQueryParam(ctx, "level");

    // Get access to the private method
    Method setLogLevelMethod =
        SettingsTaskHandler.class.getDeclaredMethod("setLogLevel", Context.class);
    setLogLevelMethod.setAccessible(true);
    setLogLevelMethod.invoke(handler, ctx);

    // Verify Logback level was updated
    LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
    Logger logger = loggerContext.getLogger("com.antigravity");
    assertEquals(Level.DEBUG, logger.getLevel());

    verify(handler).setStatus(ctx, 200);
    verify(handler).setResult(ctx, "Server log level updated to debug");
  }

  @Test
  public void testSetLogLevel_MissingParameter() throws Exception {
    org.mockito.Mockito.doReturn(null).when(handler).getQueryParam(ctx, "level");

    Method setLogLevelMethod =
        SettingsTaskHandler.class.getDeclaredMethod("setLogLevel", Context.class);
    setLogLevelMethod.setAccessible(true);
    setLogLevelMethod.invoke(handler, ctx);

    verify(handler).setStatus(ctx, 400);
    verify(handler).setResult(ctx, "Level parameter is required");
  }

  @Test
  public void testSetLogLevel_InvalidLevel() throws Exception {
    org.mockito.Mockito.doReturn("error").when(handler).getQueryParam(ctx, "level");

    Method setLogLevelMethod =
        SettingsTaskHandler.class.getDeclaredMethod("setLogLevel", Context.class);
    setLogLevelMethod.setAccessible(true);
    setLogLevelMethod.invoke(handler, ctx);

    LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
    Logger logger = loggerContext.getLogger("com.antigravity");
    assertEquals(Level.ERROR, logger.getLevel());

    verify(handler).setStatus(ctx, 200);
    verify(handler).setResult(ctx, "Server log level updated to error");
  }
}
