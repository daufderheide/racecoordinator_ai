package com.antigravity.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.Race;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.Track;
import com.antigravity.service.DatabaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class DatabaseTaskHandlerTest {

  @Test
  public void testRaceResponseSerialization() throws Exception {
    Race race = new Race.Builder().withName("Test Race").withAdjustDriftLaps(true).build();
    Track track = new Track.Builder().name("Test Track").build();

    DatabaseTaskHandler.RaceResponse response = new DatabaseTaskHandler.RaceResponse(race, track);
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(response);

    assertTrue("JSON must flatten Race properties", json.contains("\"adjust_drift_laps\":true"));
    assertTrue("JSON must flatten Race properties", json.contains("\"name\":\"Test Race\""));
    assertTrue("JSON must include Track object under 'track'", json.contains("\"track\":{\"@id\""));
  }

  @Test
  public void testIsStalePredictionRecord_RankMinusOneIsStale() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "isStalePredictionRecord",
            DatabaseContext.class,
            RacePredictionRecord.class,
            com.antigravity.race.Race.class,
            boolean.class);
    method.setAccessible(true);

    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();

    // Test with rank -1
    // driverId, driverName, projectedRank, projectedLaps, projectedTimeSeconds, winProbability,
    // podiumProbability
    standings.add(
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", -1, -1.0, 0.0, -1.0, -1.0));
    standings.add(
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", -1, -1.0, 0.0, -1.0, -1.0));
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    boolean isStale = (Boolean) method.invoke(handler, null, record, null, false);
    assertTrue("Record should be stale if any rank is -1", isStale);

    // Test with valid ranks
    standings.clear();
    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(1000);
    RacePredictionRecord.DriverProjection dp2 =
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", 2, 98.0, 0.0, 0.4, 0.8);
    dp2.setTotalSimulations(1000);
    standings.add(dp1);
    standings.add(dp2);

    isStale = (Boolean) method.invoke(handler, null, record, null, false);
    assertFalse(
        "Record should not be stale if ranks are valid and no empty lane/duplicates", isStale);
  }

  @Test
  public void testIsStalePredictionRecord_DriverMismatchIsStale() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "isStalePredictionRecord",
            DatabaseContext.class,
            RacePredictionRecord.class,
            com.antigravity.race.Race.class,
            boolean.class);
    method.setAccessible(true);

    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();
    standings.add(
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9));
    standings.add(
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", 2, 98.0, 0.0, 0.4, 0.8));
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    List<com.antigravity.race.RaceParticipant> activeDrivers = new ArrayList<>();
    activeDrivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Driver 1", "D1", "d_1", null)));
    activeDrivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Driver 2", "D2", "d_2", null)));
    activeDrivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Driver 3", "D3", "d_3", null)));
    when(activeRace.getDrivers()).thenReturn(activeDrivers);

    boolean isStale = (Boolean) method.invoke(handler, null, record, activeRace, false);
    assertTrue(
        "Record should be stale when active race drivers do not match prediction standings",
        isStale);
  }

  @Test
  public void testIsStalePredictionRecord_MissingDiagnosticsIsStale() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "isStalePredictionRecord",
            DatabaseContext.class,
            RacePredictionRecord.class,
            com.antigravity.race.Race.class,
            boolean.class);
    method.setAccessible(true);

    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();

    // Driver projection without totalSimulations set (defaults to 0)
    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    RacePredictionRecord.DriverProjection dp2 =
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", 2, 98.0, 0.0, 0.4, 0.8);
    standings.add(dp1);
    standings.add(dp2);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    boolean isStale = (Boolean) method.invoke(handler, null, record, null, false);
    assertTrue(
        "Record should be stale when totalSimulations <= 0 (missing diagnostic metadata)", isStale);

    // Now set totalSimulations > 0
    dp1.setTotalSimulations(1000);
    dp2.setTotalSimulations(1000);

    isStale = (Boolean) method.invoke(handler, null, record, null, false);
    assertFalse("Record should not be stale when totalSimulations > 0 and valid ranks", isStale);
  }

  @Test
  public void testGetPredictionEvaluationRecord_ActiveRaceNotOverReturns404() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    io.javalin.http.Context mockCtx = mock(io.javalin.http.Context.class);
    when(mockCtx.pathParam("id")).thenReturn("current");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    com.antigravity.race.Race mockActiveRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockRaceModel =
        new com.antigravity.models.Race.Builder().withEntityId("race_123").build();
    when(mockActiveRace.getRaceModel()).thenReturn(mockRaceModel);
    when(mockActiveRace.getState()).thenReturn(new com.antigravity.race.states.Racing());

    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockActiveRace);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "getPredictionEvaluationRecord", io.javalin.http.Context.class);
    method.setAccessible(true);
    method.invoke(handler, mockCtx);

    org.mockito.Mockito.verify(mockCtx)
        .header("Cache-Control", "no-cache, no-store, must-revalidate");
    org.mockito.Mockito.verify(mockCtx).status(404);
  }

  @Test
  public void testGetPredictionEvaluationRecord_SetsNoCacheHeader() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    io.javalin.http.Context mockCtx = mock(io.javalin.http.Context.class);
    when(mockCtx.pathParam("id")).thenReturn("non_existent_race");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "getPredictionEvaluationRecord", io.javalin.http.Context.class);
    method.setAccessible(true);
    method.invoke(handler, mockCtx);

    org.mockito.Mockito.verify(mockCtx)
        .header("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  @Test
  public void testIsStalePredictionRecord_RaceOverNotStale() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "isStalePredictionRecord",
            DatabaseContext.class,
            RacePredictionRecord.class,
            com.antigravity.race.Race.class,
            boolean.class);
    method.setAccessible(true);

    RacePredictionRecord record = new RacePredictionRecord();
    record.setTimestamp(1000L);
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();
    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(1000);
    standings.add(dp1);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder().withTrackEntityId("track_1").build();
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    when(activeRace.getRaceModel()).thenReturn(raceModel);
    when(activeRace.getState()).thenReturn(new com.antigravity.race.states.RaceOver());

    boolean isStale = (Boolean) method.invoke(handler, null, record, activeRace, true);
    assertFalse(
        "Pre-race prediction record must remain static when race is in RaceOver state", isStale);
  }

  @Test
  public void testIsStalePredictionRecord_NotStartedStaleWhenStatsUpdated() throws Exception {
    DatabaseContext mockDbCtx = mock(DatabaseContext.class);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(mockDbCtx, mockJavalin);

    Method method =
        DatabaseTaskHandler.class.getDeclaredMethod(
            "isStalePredictionRecord",
            DatabaseContext.class,
            RacePredictionRecord.class,
            com.antigravity.race.Race.class,
            boolean.class);
    method.setAccessible(true);

    RacePredictionRecord record = new RacePredictionRecord();
    record.setTimestamp(1000L);
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();
    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(1000);
    standings.add(dp1);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder().withTrackEntityId("track_1").build();
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    when(activeRace.getRaceModel()).thenReturn(raceModel);
    when(activeRace.getState()).thenReturn(new com.antigravity.race.states.NotStarted());

    List<com.antigravity.race.RaceParticipant> activeDrivers = new ArrayList<>();
    activeDrivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Driver 1", "D1", "d_1", null)));
    when(activeRace.getDrivers()).thenReturn(activeDrivers);

    DriverTrackStats mockStats = new DriverTrackStats();
    mockStats.setDriverId("d_1");
    mockStats.setTrackId("track_1");
    mockStats.setLastUpdated(2000L);

    DatabaseService mockService = mock(DatabaseService.class);
    when(mockService.getDriverTrackStats(any(), eq("d_1"), eq("track_1"), eq(true)))
        .thenReturn(mockStats);
    DatabaseService.setInstance(mockService);

    try {
      DatabaseContext mockCtx = mock(DatabaseContext.class);
      boolean isStale = (Boolean) method.invoke(handler, mockCtx, record, activeRace, true);
      assertTrue(
          "Pre-race prediction record must be stale in NotStarted state when driver track stats updated",
          isStale);
    } finally {
      DatabaseService.setInstance(new DatabaseService());
    }
  }
}
