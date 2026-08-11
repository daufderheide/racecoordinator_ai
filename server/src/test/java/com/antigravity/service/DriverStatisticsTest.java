package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.Driver;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import java.io.File;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DriverStatisticsTest {

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
  public void testSaveDriverStatistics() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("RACE123")
            .build();

    List<Lane> lanes =
        Arrays.asList(new Lane("#ff0000", "#ffffff", 100), new Lane("#00ff00", "#000000", 100));
    Track track = new Track.Builder().name("2-Lane Track").lanes(lanes).build();

    Driver d1 = new Driver("Driver 1", "d1", "d1", null);
    RaceParticipant p1 = new RaceParticipant(d1);
    List<RaceParticipant> participants = Arrays.asList(p1);

    DriverHeatData hd1_p1 = new DriverHeatData(p1);
    hd1_p1.addLap(5.5, false, true);
    hd1_p1.addLap(6.0, false, true);

    Heat heat1 = new Heat(1, Arrays.asList(hd1_p1), new HeatScoring(), false);
    heat1.setStarted(true);

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(participants)
            .heats(Arrays.asList(heat1))
            .track(track)
            .isDemoMode(true)
            .build();

    dbService.saveDriverStatistics(databaseContext, runtimeRace);

    DriverStatistics stats =
        dbService.getDriverStatistics(databaseContext, "d1", "RACE123", RaceScope.PRODUCTION);
    assertNotNull(stats);
  }

  @Test
  public void testGetDriverStatisticsStrictScopeIsolation() throws Exception {
    String rootDir = tempFolder.newFolder("db_root_isolation").getAbsolutePath() + File.separator;
    DatabaseContext dc = new DatabaseContext("iso_db", null, rootDir);
    DriverStatistics stats = dbService.getDriverStatistics(dc, "d1", "RACE123", RaceScope.DEMO);
    assertEquals(0.0, stats.getBestLapTime(), 0.001);
  }
}
