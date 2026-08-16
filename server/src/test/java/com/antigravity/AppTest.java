package com.antigravity;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.rolling.RollingFileAppender;
import java.io.File;
import java.io.FileWriter;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.LoggerFactory;

public class AppTest {

  private Logger rootLogger;
  private RollingFileAppender<ILoggingEvent> mockAppender;
  private File tempFile;

  @Before
  @SuppressWarnings("unchecked")
  public void setup() throws Exception {
    LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
    for (Logger logger : context.getLoggerList()) {
      logger.detachAndStopAllAppenders();
    }
    rootLogger = context.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);

    mockAppender = mock(RollingFileAppender.class);
    tempFile = File.createTempFile("testlog", ".log");
    when(mockAppender.getFile()).thenReturn(tempFile.getAbsolutePath());

    rootLogger.addAppender(mockAppender);
  }

  @After
  public void teardown() {
    if (tempFile != null && tempFile.exists()) {
      tempFile.delete();
    }

    if (tempFile != null && tempFile.getParentFile() != null) {
      File[] rolledFiles =
          tempFile
              .getParentFile()
              .listFiles(
                  (dir, name) ->
                      name.startsWith("racecoordinator.") && name.endsWith("_session.log"));
      if (rolledFiles != null) {
        for (File f : rolledFiles) {
          f.delete();
        }
      }
    }

    if (rootLogger != null && mockAppender != null) {
      rootLogger.detachAppender(mockAppender);
    }
  }

  @Test
  public void testParseServerPortDefault() {
    int port = App.parseServerPort(new String[0]);
    assertEquals(7070, port);
  }

  @Test
  public void testParseServerPortArgs() {
    assertEquals(9090, App.parseServerPort(new String[] {"--port", "9090"}));
    assertEquals(9091, App.parseServerPort(new String[] {"-p", "9091"}));
    assertEquals(9092, App.parseServerPort(new String[] {"--port=9092"}));
  }

  @Test
  public void testTriggerLogRollover_SkipsWhenFileEmpty() {
    App.triggerLogRollover();
    verify(mockAppender, never()).stop();
    verify(mockAppender, never()).start();
  }

  @Test
  public void testTriggerLogRollover_ExecutesWhenFileNotEmpty() throws Exception {
    try (FileWriter writer = new FileWriter(tempFile)) {
      writer.write("logs");
    }

    App.triggerLogRollover();
    verify(mockAppender, times(1)).stop();
    verify(mockAppender, times(1)).start();

    assertFalse("Original file should have been renamed", tempFile.exists());

    File[] rolledFiles =
        tempFile
            .getParentFile()
            .listFiles(
                (dir, name) ->
                    name.startsWith("racecoordinator.") && name.endsWith("_session.log"));
    assertNotNull(rolledFiles);
    assertTrue("There should be exactly one rolled over file", rolledFiles.length == 1);
  }
}
