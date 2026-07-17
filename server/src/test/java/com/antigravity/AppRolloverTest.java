package com.antigravity;

import static org.mockito.Mockito.*;

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

public class AppRolloverTest {

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

    // Clean up any rolled over files created in temp directory during tests
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

    rootLogger.detachAppender(mockAppender);
  }

  @Test
  public void testTriggerLogRollover_SkipsWhenFileEmpty() {
    // tempFile is created empty (0 bytes)
    App.triggerLogRollover();
    verify(mockAppender, never()).stop();
    verify(mockAppender, never()).start();
  }

  @Test
  public void testTriggerLogRollover_ExecutesWhenFileNotEmpty() throws Exception {
    // Write something to tempFile to make it > 0 bytes
    try (FileWriter writer = new FileWriter(tempFile)) {
      writer.write("logs");
    }

    App.triggerLogRollover();
    verify(mockAppender, times(1)).stop();
    verify(mockAppender, times(1)).start();

    // Verify that the file was renamed
    org.junit.Assert.assertFalse("Original file should have been renamed", tempFile.exists());

    // Find the new rolled over file and verify it exists
    File[] rolledFiles =
        tempFile
            .getParentFile()
            .listFiles(
                (dir, name) ->
                    name.startsWith("racecoordinator.") && name.endsWith("_session.log"));
    org.junit.Assert.assertNotNull(rolledFiles);
    org.junit.Assert.assertTrue(
        "There should be exactly one rolled over file", rolledFiles.length == 1);
  }
}
