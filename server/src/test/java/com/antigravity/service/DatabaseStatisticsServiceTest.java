package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.GlobalStatistics;
import java.io.File;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class DatabaseStatisticsServiceTest {
  @Rule public TemporaryFolder tempFolder = new TemporaryFolder();

  private DatabaseContext context;
  private DatabaseStatisticsService statsService;

  @Before
  public void setUp() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + File.separator;
    context = new DatabaseContext("test_db", null, rootDir);
    statsService = new DatabaseStatisticsService();
  }

  @Test
  public void testGetGlobalStatistics_DefaultWhenNullOrNotFound() {
    GlobalStatistics nullStats =
        statsService.getGlobalStatistics(context, (String) null, RaceScope.PRODUCTION);
    assertNotNull(nullStats);

    GlobalStatistics emptyStats =
        statsService.getGlobalStatistics(context, "non_existent_race", false);
    assertNotNull(emptyStats);
    assertEquals("non_existent_race", emptyStats.getRaceEntityId());
  }

  @Test
  public void testGetDriverStatistics_EmptyDefault() {
    DriverStatistics stats = statsService.getDriverStatistics(context, "driver_1", "race_1", false);
    assertNotNull(stats);
    assertEquals("driver_1", stats.getDriverId());
    assertEquals("race_1", stats.getRaceId());
    assertEquals(0.0, stats.getBestLapTime(), 0.001);
  }

  @Test
  public void testSaveAndGetDriverTrackStats() {
    DriverTrackStats stats = new DriverTrackStats();
    stats.setId("driver_1_track_1");
    stats.setDriverId("driver_1");
    stats.setTrackId("track_1");
    stats.setTotalRaces(5);

    statsService.saveDriverTrackStats(context, stats, false);

    DriverTrackStats fetched =
        statsService.getDriverTrackStats(context, "driver_1", "track_1", false);
    assertNotNull(fetched);
    assertEquals("driver_1", fetched.getDriverId());
    assertEquals("track_1", fetched.getTrackId());
    assertEquals(5, fetched.getTotalRaces());
  }
}
