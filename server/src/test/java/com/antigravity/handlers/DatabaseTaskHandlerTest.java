package com.antigravity.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
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

  @org.junit.Rule
  public org.junit.rules.TemporaryFolder tempFolder = new org.junit.rules.TemporaryFolder();

  private void invoke(DatabaseTaskHandler handler, String methodName, io.javalin.http.Context ctx)
      throws Exception {
    Method m =
        DatabaseTaskHandler.class.getDeclaredMethod(methodName, io.javalin.http.Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);
  }

  @Test
  public void testDriverCrudHandlers() throws Exception {
    String rootDir = tempFolder.newFolder("db_root").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(dbCtx, mockJavalin);

    try {
      // 1. Create Driver
      io.javalin.http.Context ctxCreate = mock(io.javalin.http.Context.class);
      when(ctxCreate.body())
          .thenReturn("{\"name\":\"Lewis Hamilton\",\"nickname\":\"LH44\",\"entity_id\":\"new\"}");
      when(ctxCreate.status(anyInt())).thenReturn(ctxCreate);
      invoke(handler, "createDriver", ctxCreate);
      org.mockito.Mockito.verify(ctxCreate).status(201);

      // Duplicate Driver Name
      io.javalin.http.Context ctxDup = mock(io.javalin.http.Context.class);
      when(ctxDup.body())
          .thenReturn("{\"name\":\"Lewis Hamilton\",\"nickname\":\"LH\",\"entity_id\":\"new\"}");
      when(ctxDup.status(anyInt())).thenReturn(ctxDup);
      invoke(handler, "createDriver", ctxDup);
      org.mockito.Mockito.verify(ctxDup).status(409);

      // 2. Get Drivers
      io.javalin.http.Context ctxGet = mock(io.javalin.http.Context.class);
      handler.getDrivers(ctxGet);
      org.mockito.Mockito.verify(ctxGet).json(any());

      // 3. Update Driver
      io.javalin.http.Context ctxUpdate = mock(io.javalin.http.Context.class);
      when(ctxUpdate.pathParam("id")).thenReturn("1");
      when(ctxUpdate.body())
          .thenReturn(
              "{\"name\":\"Sir Lewis Hamilton\",\"nickname\":\"LH44\",\"entity_id\":\"1\"}");
      invoke(handler, "updateDriver", ctxUpdate);
      org.mockito.Mockito.verify(ctxUpdate).json(any());

      // Create Driver 2
      io.javalin.http.Context ctxD2 = mock(io.javalin.http.Context.class);
      when(ctxD2.body())
          .thenReturn("{\"name\":\"George Russell\",\"nickname\":\"GR63\",\"entity_id\":\"new\"}");
      when(ctxD2.status(anyInt())).thenReturn(ctxD2);
      invoke(handler, "createDriver", ctxD2);
      org.mockito.Mockito.verify(ctxD2).status(201);

      // Update Driver 1 with Driver 2's name -> should 409
      io.javalin.http.Context ctxUpdateDup = mock(io.javalin.http.Context.class);
      when(ctxUpdateDup.pathParam("id")).thenReturn("1");
      when(ctxUpdateDup.body())
          .thenReturn("{\"name\":\"George Russell\",\"nickname\":\"LH44\",\"entity_id\":\"1\"}");
      when(ctxUpdateDup.status(anyInt())).thenReturn(ctxUpdateDup);
      invoke(handler, "updateDriver", ctxUpdateDup);
      org.mockito.Mockito.verify(ctxUpdateDup).status(409);

      // 4. Delete Driver
      io.javalin.http.Context ctxDelete = mock(io.javalin.http.Context.class);
      when(ctxDelete.pathParam("id")).thenReturn("1");
      when(ctxDelete.status(anyInt())).thenReturn(ctxDelete);
      invoke(handler, "deleteDriver", ctxDelete);
      org.mockito.Mockito.verify(ctxDelete).status(204);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testTeamCrudHandlers() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_team").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(dbCtx, mockJavalin);

    try {
      // 1. Create Team
      io.javalin.http.Context ctxCreate = mock(io.javalin.http.Context.class);
      when(ctxCreate.body())
          .thenReturn(
              "{\"name\":\"Mercedes AMG\",\"driver_ids\":[\"d1\",\"d2\"],\"entity_id\":\"new\"}");
      when(ctxCreate.status(anyInt())).thenReturn(ctxCreate);
      invoke(handler, "createTeam", ctxCreate);
      org.mockito.Mockito.verify(ctxCreate).status(201);

      // Duplicate Team Name
      io.javalin.http.Context ctxDup = mock(io.javalin.http.Context.class);
      when(ctxDup.body()).thenReturn("{\"name\":\"Mercedes AMG\",\"entity_id\":\"new\"}");
      when(ctxDup.status(anyInt())).thenReturn(ctxDup);
      invoke(handler, "createTeam", ctxDup);
      org.mockito.Mockito.verify(ctxDup).status(409);

      // 2. Get Teams
      io.javalin.http.Context ctxGet = mock(io.javalin.http.Context.class);
      invoke(handler, "getTeams", ctxGet);
      org.mockito.Mockito.verify(ctxGet).json(any());

      // 3. Update Team
      io.javalin.http.Context ctxUpdate = mock(io.javalin.http.Context.class);
      when(ctxUpdate.pathParam("id")).thenReturn("1");
      when(ctxUpdate.body())
          .thenReturn(
              "{\"name\":\"Mercedes F1 Team\",\"driver_ids\":[\"d1\"],\"entity_id\":\"1\"}");
      invoke(handler, "updateTeam", ctxUpdate);
      org.mockito.Mockito.verify(ctxUpdate).json(any());

      // 4. Delete Driver cascading update to team
      handler.deleteDriver("d1");

      // 5. Delete Team
      io.javalin.http.Context ctxDelete = mock(io.javalin.http.Context.class);
      when(ctxDelete.pathParam("id")).thenReturn("1");
      when(ctxDelete.status(anyInt())).thenReturn(ctxDelete);
      invoke(handler, "deleteTeam", ctxDelete);
      org.mockito.Mockito.verify(ctxDelete).status(204);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testTrackCrudHandlers() throws Exception {
    String rootDir =
        tempFolder.newFolder("db_root_track").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(dbCtx, mockJavalin);

    try {
      // 1. Create Track
      io.javalin.http.Context ctxCreate = mock(io.javalin.http.Context.class);
      when(ctxCreate.body())
          .thenReturn(
              "{\"name\":\"Silverstone\",\"num_track_sections\":4,\"lanes\":[],\"entity_id\":\"new\"}");
      when(ctxCreate.status(anyInt())).thenReturn(ctxCreate);
      invoke(handler, "createTrack", ctxCreate);
      org.mockito.Mockito.verify(ctxCreate).status(201);

      // Duplicate Track Name
      io.javalin.http.Context ctxDup = mock(io.javalin.http.Context.class);
      when(ctxDup.body()).thenReturn("{\"name\":\"Silverstone\",\"entity_id\":\"new\"}");
      when(ctxDup.status(anyInt())).thenReturn(ctxDup);
      invoke(handler, "createTrack", ctxDup);
      org.mockito.Mockito.verify(ctxDup).status(409);

      // 2. Get Tracks
      io.javalin.http.Context ctxGet = mock(io.javalin.http.Context.class);
      handler.getTracks(ctxGet);
      org.mockito.Mockito.verify(ctxGet).json(any());

      // 3. Get Factory Track
      io.javalin.http.Context ctxFactory = mock(io.javalin.http.Context.class);
      invoke(handler, "getFactoryTrack", ctxFactory);
      org.mockito.Mockito.verify(ctxFactory).json(any());

      // 4. Update Track
      io.javalin.http.Context ctxUpdate = mock(io.javalin.http.Context.class);
      when(ctxUpdate.pathParam("id")).thenReturn("1");
      when(ctxUpdate.body())
          .thenReturn(
              "{\"name\":\"Silverstone Circuit\",\"num_track_sections\":6,\"lanes\":[],\"entity_id\":\"1\"}");
      invoke(handler, "updateTrack", ctxUpdate);
      org.mockito.Mockito.verify(ctxUpdate).json(any());

      // 5. Delete Track
      io.javalin.http.Context ctxDelete = mock(io.javalin.http.Context.class);
      when(ctxDelete.pathParam("id")).thenReturn("1");
      when(ctxDelete.status(anyInt())).thenReturn(ctxDelete);
      invoke(handler, "deleteTrack", ctxDelete);
      org.mockito.Mockito.verify(ctxDelete).status(204);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }

  @Test
  public void testEventAndSeasonCrudHandlers() throws Exception {
    String rootDir = tempFolder.newFolder("db_root_ev").getAbsolutePath() + java.io.File.separator;
    DatabaseContext dbCtx = new DatabaseContext("test_db", null, rootDir);
    Javalin mockJavalin = mock(Javalin.class);
    DatabaseTaskHandler handler = new DatabaseTaskHandler(dbCtx, mockJavalin);

    try {
      // Event: Create
      io.javalin.http.Context ctxEvCreate = mock(io.javalin.http.Context.class);
      when(ctxEvCreate.body())
          .thenReturn("{\"name\":\"British GP\",\"races\":[],\"entity_id\":\"new\"}");
      when(ctxEvCreate.status(anyInt())).thenReturn(ctxEvCreate);
      handler.handleCreateEvent(ctxEvCreate);
      org.mockito.Mockito.verify(ctxEvCreate).status(201);

      // Event: Get & GetById
      io.javalin.http.Context ctxEvGet = mock(io.javalin.http.Context.class);
      handler.getEvents(ctxEvGet);
      org.mockito.Mockito.verify(ctxEvGet).json(any());

      io.javalin.http.Context ctxEvById = mock(io.javalin.http.Context.class);
      when(ctxEvById.pathParam("id")).thenReturn("1");
      handler.getEventById(ctxEvById);
      org.mockito.Mockito.verify(ctxEvById).json(any());

      // Event: Update
      io.javalin.http.Context ctxEvUpdate = mock(io.javalin.http.Context.class);
      when(ctxEvUpdate.pathParam("id")).thenReturn("1");
      when(ctxEvUpdate.body())
          .thenReturn("{\"name\":\"British GP 2026\",\"races\":[],\"entity_id\":\"1\"}");
      handler.handleUpdateEvent(ctxEvUpdate);
      org.mockito.Mockito.verify(ctxEvUpdate).json(any());

      // Event: Delete
      io.javalin.http.Context ctxEvDelete = mock(io.javalin.http.Context.class);
      when(ctxEvDelete.pathParam("id")).thenReturn("1");
      when(ctxEvDelete.status(anyInt())).thenReturn(ctxEvDelete);
      handler.handleDeleteEvent(ctxEvDelete);
      org.mockito.Mockito.verify(ctxEvDelete).status(204);

      // Season: Create
      io.javalin.http.Context ctxSeasonCreate = mock(io.javalin.http.Context.class);
      when(ctxSeasonCreate.body())
          .thenReturn("{\"name\":\"2026 Championship\",\"events\":[],\"entity_id\":\"new\"}");
      when(ctxSeasonCreate.status(anyInt())).thenReturn(ctxSeasonCreate);
      handler.handleCreateSeason(ctxSeasonCreate);
      org.mockito.Mockito.verify(ctxSeasonCreate).status(201);

      // Season: Get & GetById
      io.javalin.http.Context ctxSeasonGet = mock(io.javalin.http.Context.class);
      handler.getSeasons(ctxSeasonGet);
      org.mockito.Mockito.verify(ctxSeasonGet).json(any());

      io.javalin.http.Context ctxSeasonById = mock(io.javalin.http.Context.class);
      when(ctxSeasonById.pathParam("id")).thenReturn("1");
      handler.getSeasonById(ctxSeasonById);
      org.mockito.Mockito.verify(ctxSeasonById).json(any());

      // Season: Standings
      io.javalin.http.Context ctxSeasonStandings = mock(io.javalin.http.Context.class);
      when(ctxSeasonStandings.pathParam("id")).thenReturn("1");
      handler.getSeasonStandings(ctxSeasonStandings);
      org.mockito.Mockito.verify(ctxSeasonStandings).json(any());

      io.javalin.http.Context ctxSeasonStandings404 = mock(io.javalin.http.Context.class);
      when(ctxSeasonStandings404.pathParam("id")).thenReturn("nonexistent");
      when(ctxSeasonStandings404.status(anyInt())).thenReturn(ctxSeasonStandings404);
      handler.getSeasonStandings(ctxSeasonStandings404);
      org.mockito.Mockito.verify(ctxSeasonStandings404).status(404);

      // Season: Update
      io.javalin.http.Context ctxSeasonUpdate = mock(io.javalin.http.Context.class);
      when(ctxSeasonUpdate.pathParam("id")).thenReturn("1");
      when(ctxSeasonUpdate.body())
          .thenReturn("{\"name\":\"2026 World Championship\",\"events\":[],\"entity_id\":\"1\"}");
      handler.handleUpdateSeason(ctxSeasonUpdate);
      org.mockito.Mockito.verify(ctxSeasonUpdate).json(any());

      // Season: Delete
      io.javalin.http.Context ctxSeasonDelete = mock(io.javalin.http.Context.class);
      when(ctxSeasonDelete.pathParam("id")).thenReturn("1");
      when(ctxSeasonDelete.status(anyInt())).thenReturn(ctxSeasonDelete);
      handler.handleDeleteSeason(ctxSeasonDelete);
      org.mockito.Mockito.verify(ctxSeasonDelete).status(204);
    } finally {
      if (dbCtx.getConnection() != null) {
        dbCtx.getConnection().close();
      }
    }
  }
}
