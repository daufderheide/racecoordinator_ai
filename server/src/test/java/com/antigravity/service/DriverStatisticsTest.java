package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.ReplaceOptions;
import java.util.Arrays;
import java.util.List;
import org.bson.conversions.Bson;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class DriverStatisticsTest {

  private MongoDatabase mongoDatabase;
  private MongoCollection<DriverStatistics> statsCollection;
  private DatabaseService dbService;

  @Before
  @SuppressWarnings("unchecked")
  public void setUp() {
    mongoDatabase = mock(MongoDatabase.class);
    statsCollection = mock(MongoCollection.class);

    when(mongoDatabase.getCollection(eq("driver_statistics"), eq(DriverStatistics.class)))
        .thenReturn(statsCollection);
    when(mongoDatabase.getCollection(eq("demo_driver_statistics"), eq(DriverStatistics.class)))
        .thenReturn(statsCollection);

    dbService = DatabaseService.getInstance();

    // Default mock for find() to avoid NPE on unmodified tests
    FindIterable<DriverStatistics> defaultFindIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(defaultFindIterable);
    when(defaultFindIterable.first()).thenReturn(null);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSaveDriverStatistics() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("RACE123")
            .build();

    // Create track with 2 lanes
    List<Lane> lanes =
        Arrays.asList(new Lane("#ff0000", "#ffffff", 100), new Lane("#00ff00", "#000000", 100));
    Track track = new Track.Builder().name("2-Lane Track").lanes(lanes).build();

    Driver d1 = new Driver("Driver 1", "d1", "d1", null);
    RaceParticipant p1 = new RaceParticipant(d1);

    Driver d2 = new Driver("Driver 2", "d2", "d2", null);
    RaceParticipant p2 = new RaceParticipant(d2);

    List<RaceParticipant> participants = Arrays.asList(p1, p2);

    // Heat 1: p1 in Lane 0, p2 in Lane 1
    DriverHeatData hd1_p1 = new DriverHeatData(p1);
    hd1_p1.addLap(5.5, false); // Best lap 5.5, lap count 1

    DriverHeatData hd1_p2 = new DriverHeatData(p2);
    hd1_p2.addLap(6.2, false); // Best lap 6.2, lap count 1

    Heat heat1 = new Heat(1, Arrays.asList(hd1_p1, hd1_p2), new HeatScoring(), false);
    heat1.setStarted(true);

    // Heat 2: p2 in Lane 0, p1 in Lane 1
    DriverHeatData hd2_p2 = new DriverHeatData(p2);
    hd2_p2.addLap(6.0, false); // Best lap 6.0, lap count 1

    DriverHeatData hd2_p1 = new DriverHeatData(p1);
    hd2_p1.addLap(5.2, false);
    hd2_p1.addLap(5.4, false); // Best lap 5.2, lap count 2

    Heat heat2 = new Heat(2, Arrays.asList(hd2_p2, hd2_p1), new HeatScoring(), false);
    heat2.setStarted(true);

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(participants)
            .heats(Arrays.asList(heat1, heat2))
            .track(track)
            .isDemoMode(true)
            .build();

    dbService.saveDriverStatistics(mongoDatabase, runtimeRace);

    // Verify statistics upsert was called
    ArgumentCaptor<DriverStatistics> statsCaptor = ArgumentCaptor.forClass(DriverStatistics.class);
    verify(statsCollection, times(2))
        .replaceOne(any(Bson.class), statsCaptor.capture(), any(ReplaceOptions.class));

    List<DriverStatistics> savedStats = statsCaptor.getAllValues();
    assertEquals(2, savedStats.size());

    DriverStatistics statsP1 =
        savedStats.stream().filter(s -> s.getDriverId().equals("d:d1")).findFirst().orElse(null);

    assertNotNull(statsP1);
    assertEquals("RACE123", statsP1.getRaceId());
    assertEquals(5.2, statsP1.getBestLapTime(), 0.001);
    assertEquals(3.0, statsP1.getBestLapCount(), 0.001);

    // Per-lane best lap counts
    assertEquals(1.0, statsP1.getLaneBestLapCounts().get(0), 0.001); // Lane 0: Heat 1 (1 lap)
    assertEquals(2.0, statsP1.getLaneBestLapCounts().get(1), 0.001); // Lane 1: Heat 2 (2 laps)

    // Per-lane best lap times
    assertEquals(5.5, statsP1.getLaneBestLapTimes().get(0), 0.001); // Lane 0: Heat 1 (5.5s)
    assertEquals(5.2, statsP1.getLaneBestLapTimes().get(1), 0.001); // Lane 1: Heat 2 (5.2s)
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSaveDriverStatisticsWithRoundRobin() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("RACE_RR")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();

    // Create track with 4 lanes
    List<Lane> lanes =
        Arrays.asList(
            new Lane("#ff0000", "#ffffff", 100),
            new Lane("#00ff00", "#000000", 100),
            new Lane("#0000ff", "#ffffff", 100),
            new Lane("#ffff00", "#000000", 100));
    Track track = new Track.Builder().name("4-Lane Track").lanes(lanes).build();

    Driver d1 = new Driver("Driver 1", "d1", "d1", null);
    RaceParticipant p1 = new RaceParticipant(d1);
    Driver d2 = new Driver("Driver 2", "d2", "d2", null);
    RaceParticipant p2 = new RaceParticipant(d2);
    Driver d3 = new Driver("Driver 3", "d3", "d3", null);
    RaceParticipant p3 = new RaceParticipant(d3);
    Driver d4 = new Driver("Driver 4", "d4", "d4", null);
    RaceParticipant p4 = new RaceParticipant(d4);

    List<RaceParticipant> participants = Arrays.asList(p1, p2, p3, p4);

    Race runtimeRace =
        new Race.Builder().model(model).drivers(participants).track(track).isDemoMode(true).build();

    // Run heats to see their drivers and laneIdx
    List<Heat> heats = runtimeRace.getHeats();
    assertEquals(4, heats.size()); // Round Robin with 4 drivers on 4 lanes gives 4 heats

    // Add laps for each driver in each heat
    for (Heat heat : heats) {
      heat.setStarted(true);
      for (int lane = 0; lane < heat.getDrivers().size(); lane++) {
        DriverHeatData dhd = heat.getDrivers().get(lane);
        if (dhd.getDriver() != null && !dhd.getDriver().getDriver().isEmpty()) {
          dhd.addLap(5.0 + lane, false); // Best lap time: 5.0 + lane, count: 1
        }
      }
    }

    dbService.saveDriverStatistics(mongoDatabase, runtimeRace);

    // Verify statistics upsert was called
    ArgumentCaptor<DriverStatistics> statsCaptor = ArgumentCaptor.forClass(DriverStatistics.class);
    verify(
            statsCollection,
            times(4)) // Only 4 for this test because JUnit creates a new mock per test method
        .replaceOne(any(Bson.class), statsCaptor.capture(), any(ReplaceOptions.class));

    List<DriverStatistics> savedStats = statsCaptor.getAllValues();
    // The first 4 are from this test.
    DriverStatistics statsP1 =
        savedStats.stream().filter(s -> s.getDriverId().equals("d:d1")).findFirst().orElse(null);

    assertNotNull(statsP1);
    System.out.println("TEST RR statsP1 laneBestLapTimes: " + statsP1.getLaneBestLapTimes());
    System.out.println("TEST RR statsP1 laneBestLapCounts: " + statsP1.getLaneBestLapCounts());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetDriverStatistics() {
    FindIterable<DriverStatistics> findIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class))).thenReturn(findIterable);

    DriverStatistics stats =
        new DriverStatistics(
            null,
            "d:d1",
            "RACE123",
            5.2,
            2.0,
            Arrays.asList(5.5, 5.2),
            Arrays.asList(1.0, 2.0),
            null,
            null,
            null,
            null);
    when(findIterable.first()).thenReturn(stats);

    // Query with raw ID (d1) should resolve via prefix-agnostic lookup
    DriverStatistics result = dbService.getDriverStatistics(mongoDatabase, "d1", "RACE123", false);
    assertNotNull(result);
    assertEquals("d:d1", result.getDriverId());
    assertEquals(5.2, result.getBestLapTime(), 0.001);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetDriverStatisticsEmptyWhenRaceNotFound() {
    String driverId = "d1";
    String missingRaceId = "missing_race_id";

    FindIterable<DriverStatistics> mockIterable = mock(FindIterable.class);
    when(statsCollection.find(any(Bson.class)))
        .thenAnswer(
            inv -> {
              Bson filter = inv.getArgument(0);
              String filterStr = filter.toString();

              FindIterable<DriverStatistics> fi = mock(FindIterable.class);
              if (filterStr.contains("race_id")) {
                // Exact match should return null
                when(fi.first()).thenReturn(null);
              }
              return fi;
            });

    DriverStatistics result =
        dbService.getDriverStatistics(mongoDatabase, driverId, missingRaceId, false);

    assertNotNull("Should return an empty stats object for the race", result);
    assertEquals("missing_race_id", result.getRaceId());
    assertEquals("d1", result.getDriverId());
    assertEquals(0.0, result.getBestLapTime(), 0.001);
    assertEquals(0.0, result.getBestLapCount(), 0.001);
    assertNotNull(result.getLaneBestLapTimes());
    assertTrue(result.getLaneBestLapTimes().isEmpty());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testSaveDriverStatisticsSkipsUnstartedHeatsAndEmptyDrivers() {
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Test Race")
            .withEntityId("RACE_SKIP")
            .build();

    // Create track with 2 lanes
    List<Lane> lanes =
        Arrays.asList(new Lane("#ff0000", "#ffffff", 100), new Lane("#00ff00", "#000000", 100));
    Track track = new Track.Builder().name("2-Lane Track").lanes(lanes).build();

    Driver d1 = new Driver("Driver 1", "d1", "d1", null);
    RaceParticipant p1 = new RaceParticipant(d1);

    Driver emptyDriver = Driver.EMPTY_DRIVER;
    RaceParticipant pEmpty = new RaceParticipant(emptyDriver);

    List<RaceParticipant> participants = Arrays.asList(p1, pEmpty);

    // Heat 1: started, has one real driver and one empty driver
    DriverHeatData hd1_p1 = new DriverHeatData(p1);
    hd1_p1.addLap(5.5, false); // Best lap 5.5, lap count 1

    DriverHeatData hd1_pEmpty = new DriverHeatData(pEmpty);
    hd1_pEmpty.addLap(6.2, false); // Best lap 6.2, lap count 1

    Heat heat1 = new Heat(1, Arrays.asList(hd1_p1, hd1_pEmpty), new HeatScoring(), false);
    heat1.setStarted(true); // Mark as started

    // Heat 2: NOT started
    DriverHeatData hd2_pEmpty = new DriverHeatData(pEmpty);
    DriverHeatData hd2_p1 = new DriverHeatData(p1);
    Heat heat2 = new Heat(2, Arrays.asList(hd2_pEmpty, hd2_p1), new HeatScoring(), false);
    // Do NOT call heat2.start()

    Race runtimeRace =
        new Race.Builder()
            .model(model)
            .drivers(participants)
            .heats(Arrays.asList(heat1, heat2))
            .track(track)
            .isDemoMode(true)
            .build();

    dbService.saveDriverStatistics(mongoDatabase, runtimeRace);

    ArgumentCaptor<DriverStatistics> statsCaptor = ArgumentCaptor.forClass(DriverStatistics.class);
    // Should only save 1 record (for p1), because pEmpty is skipped and heat2 is not started
    verify(statsCollection, times(1))
        .replaceOne(any(Bson.class), statsCaptor.capture(), any(ReplaceOptions.class));

    List<DriverStatistics> savedStats = statsCaptor.getAllValues();
    assertEquals(1, savedStats.size());

    DriverStatistics statsP1 = savedStats.get(0);
    assertEquals("d:d1", statsP1.getDriverId());
    assertEquals(5.5, statsP1.getBestLapTime(), 0.001);
    assertEquals(1.0, statsP1.getBestLapCount(), 0.001);

    // Arrays should be sized to 2 (track lane count)
    assertEquals(2, statsP1.getLaneBestLapTimes().size());
  }
}
