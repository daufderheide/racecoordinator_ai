package com.antigravity;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.Test;

public class AppTest {

  @Test
  public void testGetLocalIpAddress() {
    String ip = App.getLocalIpAddress();
    assertTrue(ip != null && !ip.isEmpty());
  }

  @Test
  public void testBackupIncompatibleDatabase() throws IOException {
    Path tempDir = Files.createTempDirectory("mongo-test");
    Path mongoDir = tempDir.resolve("mongodb_data");

    Files.createDirectories(mongoDir);

    Path backup = App.backupIncompatibleDatabase(tempDir.toString(), "123");

    assertTrue(backup != null);
    assertTrue(Files.exists(backup));
  }

  @Test
  public void testBackupIncompatibleDatabaseNotPresent() throws IOException {
    Path tempDir = Files.createTempDirectory("mongo-test");

    Path backup = App.backupIncompatibleDatabase(tempDir.toString(), "123");

    assertTrue(backup == null);
  }

  @Test
  public void shouldUseEmbeddedMongoByDefault() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {});
    assertTrue(result);
  }

  @Test
  public void shouldDisableEmbeddedMongoWhenArgumentIsPresent() {
    boolean result = App.shouldUseEmbeddedMongo(new String[] {"--no-embedded-mongo"});
    assertFalse(result);
  }
}
