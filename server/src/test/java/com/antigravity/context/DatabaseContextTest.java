package com.antigravity.context;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Event;
import com.antigravity.models.Season;
import com.antigravity.repository.SqliteRepository;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.Collections;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class DatabaseContextTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private String rootDir;

  @Before
  public void setUp() throws Exception {
    rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
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
  public void testDatabaseInitialization() {
    assertNotNull(databaseContext.getConnection());
    assertEquals("test_db", databaseContext.getCurrentDatabaseName());
    assertEquals(rootDir, databaseContext.getDataRoot());
  }

  @Test
  public void testEnsureTable() {
    databaseContext.ensureTable("drivers");
    databaseContext.ensureTable("tracks");
    String nextId = databaseContext.getNextSequence("drivers");
    assertNotNull(nextId);
    assertEquals("1", nextId);

    String nextId2 = databaseContext.getNextSequence("drivers");
    assertEquals("2", nextId2);
  }

  @Test
  public void testSwitchDatabase() {
    databaseContext.ensureTable("drivers");
    databaseContext.getNextSequence("drivers"); // 1

    databaseContext.switchDatabase("demo_db");
    assertEquals("demo_db", databaseContext.getCurrentDatabaseName());

    String demoSeq = databaseContext.getNextSequence("drivers");
    assertEquals("1", demoSeq); // Separate sequence in demo_db
  }

  @Test
  public void testZipExportAndImport() throws Exception {
    databaseContext.ensureTable("drivers");
    databaseContext.getNextSequence("drivers");

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    databaseContext.exportDatabase("test_db", baos);
    byte[] zipData = baos.toByteArray();
    assertNotNull(zipData);
    assertTrue(zipData.length > 0);

    try (InputStream in = new ByteArrayInputStream(zipData)) {
      databaseContext.importDatabase("imported_db", in);
    }

    databaseContext.switchDatabase("imported_db");
    assertEquals("imported_db", databaseContext.getCurrentDatabaseName());
  }

  @Test
  public void testExportAndImportWithDemoRaceRecords() throws Exception {
    databaseContext.ensureTable("drivers");
    try (java.sql.Statement stmt = databaseContext.getConnection().createStatement()) {
      stmt.execute(
          "CREATE TABLE IF NOT EXISTS demo_race_records (race_id TEXT PRIMARY KEY, records_blob BLOB)");
      stmt.execute(
          "INSERT INTO demo_race_records (race_id, records_blob) VALUES ('demo_1', X'12345678')");
    }

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    databaseContext.exportDatabase("test_db", baos);
    byte[] zipData = baos.toByteArray();
    assertNotNull(zipData);
    assertTrue(zipData.length > 0);

    try (InputStream in = new ByteArrayInputStream(zipData)) {
      databaseContext.importDatabase("imported_demo_db", in);
    }

    databaseContext.switchDatabase("imported_demo_db");
    assertEquals("imported_demo_db", databaseContext.getCurrentDatabaseName());
  }

  @Test
  public void testGetDatabaseStatsIncludesEventsAndSeasons() {
    databaseContext.ensureTable("events");
    databaseContext.ensureTable("seasons");

    SqliteRepository<Event> eventRepo =
        new SqliteRepository<>(databaseContext, "events", Event.class);
    eventRepo.save(new Event("Event 1", "desc", 0.0, Collections.emptyList(), "evt1", null));
    eventRepo.save(new Event("Event 2", "desc", 0.0, Collections.emptyList(), "evt2", null));

    SqliteRepository<Season> seasonRepo =
        new SqliteRepository<>(databaseContext, "seasons", Season.class);
    seasonRepo.save(new Season("Season 1", 0, Collections.emptyList(), "sea1", null));

    DatabaseContext.DatabaseStats stats = databaseContext.getDatabaseStats("test_db");

    assertNotNull(stats);
    assertEquals(2, stats.eventCount);
    assertEquals(1, stats.seasonCount);
  }

  @Test
  public void testResetDatabaseToFactory_LoadsFactoryDefaultZip() {
    databaseContext.resetDatabaseToFactory("factory_test_db");
    databaseContext.switchDatabase("factory_test_db");

    SqliteRepository<com.antigravity.models.Driver> driverRepo =
        new SqliteRepository<>(databaseContext, "drivers", com.antigravity.models.Driver.class);
    java.util.List<com.antigravity.models.Driver> drivers = driverRepo.findAll();
    assertNotNull(drivers);
    org.junit.Assert.assertFalse(drivers.isEmpty());
    assertTrue(drivers.stream().anyMatch(d -> "Dave".equalsIgnoreCase(d.getName())));

    SqliteRepository<com.antigravity.models.Theme> themeRepo =
        new SqliteRepository<>(databaseContext, "themes", com.antigravity.models.Theme.class);
    java.util.List<com.antigravity.models.Theme> themes = themeRepo.findAll();
    assertNotNull(themes);
    org.junit.Assert.assertFalse(themes.isEmpty());
    com.antigravity.models.Theme defaultTheme =
        themes.stream().filter(com.antigravity.models.Theme::isDefault).findFirst().orElse(null);
    assertNotNull(defaultTheme);
    assertEquals("tts", defaultTheme.getAudioSlots().get("audio.min_lap_time").getType());
    assertEquals(
        "Min lap time for {{driver.nickname}}",
        defaultTheme.getAudioSlots().get("audio.min_lap_time").getText());
  }

  @Test
  public void testCreateDatabaseInitializesAssetsAndSystemInfo() {
    databaseContext.createDatabase("custom_created_db");
    assertEquals("custom_created_db", databaseContext.getCurrentDatabaseName());

    File assetDir =
        new File(databaseContext.getDataRoot() + "custom_created_db" + File.separator + "assets");
    assertTrue(assetDir.exists());
    assertTrue(assetDir.isDirectory());

    java.util.List<String> dbs = databaseContext.listDatabases();
    assertTrue(dbs.contains("custom_created_db"));
  }

  @Test
  public void testListDatabasesEdgeCases() {
    java.util.List<String> nullResult = DatabaseContext.listDatabases(null);
    assertNotNull(nullResult);
    assertTrue(nullResult.isEmpty());

    java.util.List<String> nonExistent =
        DatabaseContext.listDatabases("/path/that/does/not/exist/12345");
    assertNotNull(nonExistent);
    assertTrue(nonExistent.isEmpty());
  }

  @Test
  public void testCopyDatabase() {
    databaseContext.ensureTable("drivers");
    SqliteRepository<com.antigravity.models.Driver> driverRepo =
        new SqliteRepository<>(databaseContext, "drivers", com.antigravity.models.Driver.class);
    driverRepo.save(new com.antigravity.models.Driver("Copied Driver", "CD", "cd1", "cd1"));

    databaseContext.copyDatabase("test_db", "copied_db");

    java.util.List<String> dbs = databaseContext.listDatabases();
    assertTrue(dbs.contains("copied_db"));

    databaseContext.switchDatabase("copied_db");
    SqliteRepository<com.antigravity.models.Driver> copiedRepo =
        new SqliteRepository<>(databaseContext, "drivers", com.antigravity.models.Driver.class);
    java.util.List<com.antigravity.models.Driver> copiedDrivers = copiedRepo.findAll();
    assertEquals(1, copiedDrivers.size());
    assertEquals("Copied Driver", copiedDrivers.get(0).getName());
  }

  @Test
  public void testDeleteDatabase() {
    databaseContext.createDatabase("to_be_deleted_db");
    assertTrue(databaseContext.listDatabases().contains("to_be_deleted_db"));

    databaseContext.deleteDatabase("to_be_deleted_db");
    org.junit.Assert.assertFalse(databaseContext.listDatabases().contains("to_be_deleted_db"));
  }

  @Test
  public void testResetSequence() {
    databaseContext.ensureTable("drivers");
    databaseContext.getNextSequence("drivers"); // 1
    databaseContext.getNextSequence("drivers"); // 2
    assertEquals("3", databaseContext.getNextSequence("drivers"));

    databaseContext.resetSequence("drivers");
    assertEquals("1", databaseContext.getNextSequence("drivers"));
  }

  @Test
  public void testEnsureTableNullOrEmpty() {
    databaseContext.ensureTable(null);
    databaseContext.ensureTable("");
    databaseContext.ensureTable("   ");
  }
}
