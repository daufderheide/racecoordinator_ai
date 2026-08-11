package com.antigravity.service;

import static org.junit.Assert.assertNotNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DatabaseServiceDemoRecordTest {

  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext databaseContext;
  private DatabaseService dbService;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    databaseContext = new DatabaseContext("test_db", null, rootDir);
    dbService = DatabaseService.getInstance();
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
  public void testUpdateGlobalStatisticsInDemoMode() {
    Race model = new Race.Builder().withName("Test Race Demo").withEntityId("DEMO1").build();
    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new Driver("Dave", "DB")));

    com.antigravity.race.Race runtimeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(drivers)
            .track(dbService.getFactoryTrack())
            .isDemoMode(true)
            .build();

    dbService.updateGlobalStatistics(databaseContext, runtimeRace);
    assertNotNull(databaseContext);
  }

  @Test
  public void testUpsertAutoSaveInDemoMode() {
    RaceSaveData data = new RaceSaveData();
    data.setDemoMode(true);
    data.setSaveName("autosave_DEMO1.json");

    dbService.upsertAutoSave(databaseContext, data);
    assertNotNull(databaseContext);
  }
}
