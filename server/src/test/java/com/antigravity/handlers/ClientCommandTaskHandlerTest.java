package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.ClientCommandTaskHandler.TaskResult;
import com.antigravity.models.AnalyticsToggleRequest;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.proto.InitializeRaceResponse;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.states.NotStarted;
import com.antigravity.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.io.File;
import java.lang.reflect.Method;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.bson.conversions.Bson;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class ClientCommandTaskHandlerTest {

  private DatabaseContext databaseContext;
  private MongoDatabase mongoDatabase;
  private MongoCollection<Race> raceCollection;
  private MongoCollection<Team> teamCollection;
  private MongoCollection<Driver> driverCollection;
  private MongoCollection<Track> trackCollection;
  private Javalin app;
  private ClientCommandTaskHandler handler;
  private Context ctx;
  private Path tempDir;
  private HttpServletResponse res;

  @Before
  @SuppressWarnings("unchecked")
  public void setUp() throws Exception {
    databaseContext = mock(DatabaseContext.class);
    mongoDatabase = mock(MongoDatabase.class);
    raceCollection = mock(MongoCollection.class);
    teamCollection = mock(MongoCollection.class);
    driverCollection = mock(MongoCollection.class);
    trackCollection = mock(MongoCollection.class);
    app = mock(Javalin.class);

    when(databaseContext.getDatabase()).thenReturn(mongoDatabase);
    when(mongoDatabase.getCollection(eq("races"), eq(Race.class))).thenReturn(raceCollection);
    when(mongoDatabase.getCollection(eq("teams"), eq(Team.class))).thenReturn(teamCollection);
    when(mongoDatabase.getCollection(eq("drivers"), eq(Driver.class))).thenReturn(driverCollection);
    when(mongoDatabase.getCollection(eq("tracks"), eq(Track.class))).thenReturn(trackCollection);

    MongoCollection<RaceSaveData> saveCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection(eq("saved_races"), eq(RaceSaveData.class)))
        .thenReturn(saveCollection);
    when(mongoDatabase.getCollection(eq("demo_saved_races"), eq(RaceSaveData.class)))
        .thenReturn(saveCollection);

    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "saved_races_test");
    deleteDirectory(tempFile);
    tempFile.mkdirs();
    tempDir = tempFile.toPath();
    when(databaseContext.getDataRoot()).thenReturn(tempDir.toString() + File.separator);
    when(databaseContext.getCurrentDatabaseName()).thenReturn("testdb");

    HttpServletRequest req = mock(HttpServletRequest.class);
    res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, new HashMap<>());

    // Reset subscription manager
    ClientSubscriptionManager.setInstance(null);

    handler = new ClientCommandTaskHandler(databaseContext, app);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testInitializeRace_ExplicitDriver_ShouldNotHaveTeam() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamId = "team-1";

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            120,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);
    Team team = new Team("Test Team", "url", Arrays.asList(driverId), teamId, null);

    // 2. Mock Database interactions
    // Mock getRace
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    // Mock getAllTeams (used to build lookup map)
    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find()).thenReturn(teamIterable);
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              list.add(team);
              return list;
            })
        .when(teamIterable)
        .into(any(List.class));

    // Mock getDrivers (for the participant list)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(
            invocation -> {
              List<Driver> list = invocation.getArgument(0);
              list.add(driver);
              return list;
            })
        .when(driverIterable)
        .into(any(List.class));

    // Mock getTeams
    FindIterable<Team> specificTeamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(specificTeamIterable);
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              // Should be empty as we are only asking for driver ID in the request
              return list;
            })
        .when(specificTeamIterable)
        .into(any(List.class));

    // Create Track with lanes
    Lane lane = new Lane("red", "black", 100);
    Track track = new Track("Test Track", Arrays.asList(lane), "track-1", null);

    FindIterable<Track> trackIterable = mock(FindIterable.class);
    when(trackCollection.find(any(Bson.class))).thenReturn(trackIterable);
    when(trackIterable.first()).thenReturn(track);

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId) // Explicit driver selection!
            .setIsDemoMode(true) // Use demo mode to avoid Arduino config
            .build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull("Race should be initialized", activeRace);

    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    RaceParticipant participant = participants.get(0);

    assertEquals(driverId, participant.getDriver().getEntityId());
    assertNull("Team should NOT be present for explicit driver", participant.getTeam());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testInitializeRace_ExplicitTeam_ShouldHaveTeam() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamId = "team-1";

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            120,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    OverallScoring overallScoring = new OverallScoring();

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);
    Team team = new Team("Test Team", "url", Arrays.asList(driverId), teamId, null);

    // 2. Mock Database interactions
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find()).thenReturn(teamIterable);
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              list.add(team);
              return list;
            })
        .when(teamIterable)
        .into(any(List.class));

    // Mock getDrivers (will be called for team participants)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(
            invocation -> {
              List<Driver> list = invocation.getArgument(0);
              list.add(driver);
              return list;
            })
        .when(driverIterable)
        .into(any(List.class));

    // Mock getTeams (called for explicit team lookup)
    FindIterable<Team> specificTeamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(specificTeamIterable);
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              list.add(team);
              return list;
            })
        .when(specificTeamIterable)
        .into(any(List.class));

    // Create Track
    Lane lane = new Lane("red", "black", 100);
    Track track = new Track("Test Track", Arrays.asList(lane), "track-1", null);

    FindIterable<Track> trackIterable = mock(FindIterable.class);
    when(trackCollection.find(any(Bson.class))).thenReturn(trackIterable);
    when(trackIterable.first()).thenReturn(track);

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("t_" + teamId) // Explicit TEAM selection!
            .setIsDemoMode(true)
            .build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull("Race should be initialized", activeRace);

    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    RaceParticipant participant = participants.get(0);

    // For team selection, we expect a participant representing the team
    assertNotNull("Team should be present for explicit team", participant.getTeam());
    assertEquals(teamId, participant.getTeam().getEntityId());

    // And it should have loaded drivers
    assertNotNull("Team should have drivers loaded", participant.getTeamDrivers());
    assertEquals(1, participant.getTeamDrivers().size());
  }

  @Test
  public void testSaveRace_Success() throws Exception {
    com.antigravity.race.Race race = mock(com.antigravity.race.Race.class);
    when(race.getState()).thenReturn(new NotStarted());
    HeatScoring heatScoring = new HeatScoring();
    OverallScoring overallScoring = new OverallScoring();
    Race raceModel = new Race.Builder().withName("MyTestRace").withEntityId("race-1").build();
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getTrack()).thenReturn(new Track("Track1", new ArrayList<>(), "track1", null));
    when(race.getDrivers()).thenReturn(new ArrayList<>());
    when(race.getHeats()).thenReturn(new ArrayList<>());
    when(race.isDemoMode()).thenReturn(true);

    ClientSubscriptionManager.getInstance().setRace(race);

    handler.saveRace(ctx);

    verify(res).setStatus(200);

    // Verify it was inserted into the correct MongoCollection
    MongoCollection<RaceSaveData> saveCollection =
        mongoDatabase.getCollection("demo_saved_races", RaceSaveData.class);
    org.mockito.ArgumentCaptor<RaceSaveData> captor =
        org.mockito.ArgumentCaptor.forClass(RaceSaveData.class);
    verify(saveCollection).insertOne(captor.capture());

    RaceSaveData saved = captor.getValue();
    assertNotNull(saved);
    assertTrue(saved.getSaveName().endsWith("_MyTestRace.json"));
    assertTrue(saved.isDemoMode());
    assertFalse(saved.isAutoSave());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetSavedRaces_Success() throws Exception {
    RaceSaveData data = new RaceSaveData();
    data.setSaveName("20260101-120000_MyTestRace.json");

    MongoCollection<RaceSaveData> saveCollection =
        mongoDatabase.getCollection("saved_races", RaceSaveData.class);
    FindIterable<RaceSaveData> iterable = mock(FindIterable.class);
    when(saveCollection.find()).thenReturn(iterable);
    doAnswer(
            invocation -> {
              List<RaceSaveData> list = invocation.getArgument(0);
              list.add(data);
              return list;
            })
        .when(iterable)
        .into(any(List.class));

    handler.getSavedRaces(ctx);

    verify(res, never()).sendError(anyInt());
    verify(res, never()).setStatus(eq(500));
  }

  @Test
  public void testDeleteSavedRace_Success() throws Exception {
    MongoCollection<RaceSaveData> saveCollection =
        mongoDatabase.getCollection("saved_races", RaceSaveData.class);
    com.mongodb.client.result.DeleteResult dr =
        com.mongodb.client.result.DeleteResult.acknowledged(1);
    when(saveCollection.deleteOne(any(Bson.class))).thenReturn(dr);

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("filename", "20260101-120001_MyTestRace.json");
    try {
      Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    handler.deleteSavedRace(ctx);

    verify(res).setStatus(200);
    verify(saveCollection).deleteOne(any(Bson.class));
  }

  @Test
  public void testDeleteSavedRace_RouteRegistered() {
    verify(app)
        .delete(eq("/api/saved-races/{filename}"), any(), eq(com.antigravity.auth.Role.DIRECTOR));
  }

  @Test
  public void testSkipRace_RouteRegistered() {
    verify(app).post(eq("/api/skip-race"), any(), eq(com.antigravity.auth.Role.DIRECTOR));
  }

  @Test
  public void testSkipRace_Success() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/skip-race"), handlerCaptor.capture(), eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler skipRaceHandler = handlerCaptor.getValue();

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getState()).thenReturn(new NotStarted());
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    Context mockCtx = mock(Context.class);
    when(mockCtx.contentType(anyString())).thenReturn(mockCtx);
    when(mockCtx.result(any(byte[].class))).thenReturn(mockCtx);

    skipRaceHandler.handle(mockCtx);

    verify(mockRace).skipRace();
    verify(mockCtx).contentType("application/octet-stream");

    org.mockito.ArgumentCaptor<byte[]> resultCaptor =
        org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(mockCtx).result(resultCaptor.capture());
    com.antigravity.proto.SkipRaceResponse response =
        com.antigravity.proto.SkipRaceResponse.parseFrom(resultCaptor.getValue());
    assertTrue(response.getSuccess());
    assertEquals("Race skipped successfully", response.getMessage());
  }

  @Test
  public void testSkipRace_AlreadyOver() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/skip-race"), handlerCaptor.capture(), eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler skipRaceHandler = handlerCaptor.getValue();

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getState()).thenReturn(new com.antigravity.race.states.RaceOver());
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    Context mockCtx = mock(Context.class);
    when(mockCtx.contentType(anyString())).thenReturn(mockCtx);
    when(mockCtx.result(any(byte[].class))).thenReturn(mockCtx);

    skipRaceHandler.handle(mockCtx);

    verify(mockRace, never()).skipRace();
    verify(mockCtx).contentType("application/octet-stream");

    org.mockito.ArgumentCaptor<byte[]> resultCaptor =
        org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(mockCtx).result(resultCaptor.capture());
    com.antigravity.proto.SkipRaceResponse response =
        com.antigravity.proto.SkipRaceResponse.parseFrom(resultCaptor.getValue());
    assertFalse(response.getSuccess());
    assertEquals("Race is already over", response.getMessage());
  }

  @Test
  public void testDeleteSavedRace_Demo_Success() throws Exception {
    MongoCollection<RaceSaveData> saveCollection =
        mongoDatabase.getCollection("demo_saved_races", RaceSaveData.class);
    com.mongodb.client.result.DeleteResult dr =
        com.mongodb.client.result.DeleteResult.acknowledged(1);
    when(saveCollection.deleteOne(any(Bson.class))).thenReturn(dr);

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("filename", "20260101-120001_MyTestRace.json");
    try {
      Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    HttpServletRequest req = ctx.req;
    when(req.getParameter("demo")).thenReturn("true");

    handler.deleteSavedRace(ctx);

    verify(res).setStatus(200);
    verify(saveCollection).deleteOne(any(Bson.class));
  }

  @Test
  public void testAbortTimers_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    handler.abortTimers(ctx);

    verify(mockRace).clearAutoTimers();
    verify(mockRace).pauseRace();
    verify(res).setStatus(200);
  }

  @Test
  public void testToggleAnalytics_Localhost_IPv4_Success() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    doReturn("127.0.0.1").when(spyHandler).getRemoteAddr(any());
    doReturn("localhost").when(spyHandler).getRemoteHost(any());

    AnalyticsToggleRequest requestData = new AnalyticsToggleRequest();
    requestData.setEnabled(true);
    byte[] bodyBytes = new ObjectMapper().writeValueAsBytes(requestData);

    doReturn(bodyBytes).when(spyHandler).getBodyBytes(any());
    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(200));
    assertTrue(AnalyticsService.getInstance().isUserEnabled());
  }

  @Test
  public void testToggleAnalytics_Localhost_IPv6_Success() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    doReturn("::1").when(spyHandler).getRemoteAddr(any());
    doReturn("localhost").when(spyHandler).getRemoteHost(any());

    AnalyticsToggleRequest requestData = new AnalyticsToggleRequest();
    requestData.setEnabled(false);
    byte[] bodyBytes = new ObjectMapper().writeValueAsBytes(requestData);

    doReturn(bodyBytes).when(spyHandler).getBodyBytes(any());
    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(200));
    assertFalse(AnalyticsService.getInstance().isUserEnabled());
  }

  @Test
  public void testToggleAnalytics_RemoteIP_Forbidden() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    doReturn("8.8.8.8").when(spyHandler).getRemoteAddr(any());
    doReturn("8.8.8.8").when(spyHandler).getRemoteHost(any());

    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(403));
  }

  @Test
  public void testToggleAnalytics_LAN_IPv4_PrivateNetwork_Forbidden() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    // Test 192.168.x.x (common home network range)
    doReturn("192.168.1.100").when(spyHandler).getRemoteAddr(any());
    doReturn("192.168.1.100").when(spyHandler).getRemoteHost(any());

    AnalyticsToggleRequest requestData = new AnalyticsToggleRequest();
    requestData.setEnabled(true);
    byte[] bodyBytes = new ObjectMapper().writeValueAsBytes(requestData);

    doReturn(bodyBytes).when(spyHandler).getBodyBytes(any());
    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(403));
  }

  @Test
  public void testToggleAnalytics_LAN_IPv4_10x_PrivateNetwork_Forbidden() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    // Test 10.x.x.x (enterprise network range)
    doReturn("10.0.0.50").when(spyHandler).getRemoteAddr(any());
    doReturn("10.0.0.50").when(spyHandler).getRemoteHost(any());

    AnalyticsToggleRequest requestData = new AnalyticsToggleRequest();
    requestData.setEnabled(false);
    byte[] bodyBytes = new ObjectMapper().writeValueAsBytes(requestData);

    doReturn(bodyBytes).when(spyHandler).getBodyBytes(any());
    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(403));
  }

  @Test
  public void testToggleAnalytics_LAN_IPv4_172x_PrivateNetwork_Forbidden() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    // Test 172.16-31.x.x (another private range)
    doReturn("172.20.5.100").when(spyHandler).getRemoteAddr(any());
    doReturn("172.20.5.100").when(spyHandler).getRemoteHost(any());

    AnalyticsToggleRequest requestData = new AnalyticsToggleRequest();
    requestData.setEnabled(true);
    byte[] bodyBytes = new ObjectMapper().writeValueAsBytes(requestData);

    doReturn(bodyBytes).when(spyHandler).getBodyBytes(any());
    doNothing().when(spyHandler).setStatus(any(), anyInt());
    doNothing().when(spyHandler).setResult(any(), anyString());

    spyHandler.toggleAnalytics(mockCtx);

    verify(spyHandler).setStatus(any(), eq(403));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetAnalyticsConfig_Success() throws Exception {
    ClientCommandTaskHandler spyHandler = spy(handler);
    Context mockCtx = mock(Context.class);

    doNothing().when(spyHandler).setJson(any(), any());

    spyHandler.getAnalyticsConfig(mockCtx);

    verify(spyHandler).setJson(eq(mockCtx), any(Map.class));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testInitializeRace_DuplicateDriver_IndividualAndTeam_ShouldFail() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamId = "team-1";

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Dave", "D", driverId, null);
    Team team = new Team("Team A", "url", Arrays.asList(driverId), teamId, null);

    // 2. Mock Database interactions
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    // Drivers fetch (requested both as individual and then implicitly by
    // validation)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(
            invocation -> {
              List<Driver> list = invocation.getArgument(0);
              list.add(driver);
              return list;
            })
        .when(driverIterable)
        .into(any(List.class));

    // Teams fetch (requested explicitly in the participantIds)
    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(teamIterable);
    when(teamCollection.find())
        .thenReturn(teamIterable); // Also mock no-args find for getAllTeams()
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              list.add(team);
              return list;
            })
        .when(teamIterable)
        .into(any(List.class));

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId) // Individual
            .addDriverIds("t_" + teamId) // Team containing same individual
            .build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    InitializeRaceResponse response = InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse("Validation should fail", response.getSuccess());
    assertEquals("DUPE_INDIVIDUAL_TEAM", response.getErrorCode());
    assertEquals("Dave", response.getDriverName());
    assertEquals(1, response.getTeamNamesCount());
    assertEquals("Team A", response.getTeamNames(0));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testInitializeRace_DuplicateDriver_MultipleTeams_ShouldFail() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String teamAId = "team-A";
    String teamBId = "team-B";

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Dave", "D", driverId, null);
    Team teamA = new Team("Team A", "url", Arrays.asList(driverId), teamAId, null);
    Team teamB = new Team("Team B", "url", Arrays.asList(driverId), teamBId, null);

    // 2. Mock Database interactions
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    // Teams fetch
    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(teamIterable);
    when(teamCollection.find())
        .thenReturn(teamIterable); // Also mock no-args find for getAllTeams()
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              list.add(teamA);
              list.add(teamB);
              return list;
            })
        .when(teamIterable)
        .into(any(List.class));

    // Mock getDriver (used for Rule 2 error detail)
    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    when(driverIterable.first()).thenReturn(driver);

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("t_" + teamAId)
            .addDriverIds("t_" + teamBId)
            .build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    InitializeRaceResponse response = InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse("Validation should fail", response.getSuccess());
    assertEquals("DUPE_MULTIPLE_TEAMS", response.getErrorCode());
    assertEquals("Dave", response.getDriverName());
    assertEquals(2, response.getTeamNamesCount());
    assertTrue(response.getTeamNamesList().contains("Team A"));
    assertTrue(response.getTeamNamesList().contains("Team B"));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testInitializeRace_DeletedCustomRotation_ShouldFail() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.Custom)
            .withCustomRotationAssetId("deleted-asset-id")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Dave", "D", driverId, null);

    // 2. Mock Database interactions
    FindIterable<Race> raceIterable = mock(FindIterable.class);
    when(raceCollection.find(any(Bson.class))).thenReturn(raceIterable);
    when(raceIterable.first()).thenReturn(race);

    FindIterable<Driver> driverIterable = mock(FindIterable.class);
    when(driverCollection.find(any(Bson.class))).thenReturn(driverIterable);
    doAnswer(
            invocation -> {
              List<Driver> list = invocation.getArgument(0);
              list.add(driver);
              return list;
            })
        .when(driverIterable)
        .into(any(List.class));

    // Mock getAllTeams (empty)
    FindIterable<Team> teamIterable = mock(FindIterable.class);
    when(teamCollection.find()).thenReturn(teamIterable);

    // Mock getTeams
    FindIterable<Team> specificTeamIterable = mock(FindIterable.class);
    when(teamCollection.find(any(Bson.class))).thenReturn(specificTeamIterable);
    doAnswer(
            invocation -> {
              List<Team> list = invocation.getArgument(0);
              return list;
            })
        .when(specificTeamIterable)
        .into(any(List.class));

    // Create Track
    Lane lane = new Lane("red", "black", 100);
    Track track = new Track("Test Track", Arrays.asList(lane), "track-1", null);

    FindIterable<Track> trackIterable = mock(FindIterable.class);
    when(trackCollection.find(any(Bson.class))).thenReturn(trackIterable);
    when(trackIterable.first()).thenReturn(track);

    // Mock assets collection returning null (deleted custom rotation)
    MongoCollection<org.bson.Document> assetCollection = mock(MongoCollection.class);
    when(mongoDatabase.getCollection(eq("assets"))).thenReturn(assetCollection);
    FindIterable<org.bson.Document> assetIterable = mock(FindIterable.class);
    when(assetCollection.find(any(Bson.class))).thenReturn(assetIterable);
    when(assetIterable.first()).thenReturn(null);

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    InitializeRaceResponse response = InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse("Race initialization should fail", response.getSuccess());
    assertEquals("NO_CUSTOM_ROTATIONS", response.getErrorCode());
  }

  @Test
  public void testUpdateUserLaps_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getDrivers()).thenReturn(Arrays.asList(mockDhd));
    when(mockDhd.getAdjustedLapCount()).thenReturn(5.25);
    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = new Context(req, res, new HashMap<>());

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 1.25);

    handler.updateUserLaps(ctx, pathParams, body);

    verify(mockDhd).setUserLaps(1.25);
    verify(mockHeat).initializeStandings(any());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(res).setStatus(200);
  }

  @Test
  public void testEndRace_Success() throws Exception {
    com.antigravity.proto.EndRaceRequest request =
        com.antigravity.proto.EndRaceRequest.newBuilder().build();
    Context mockCtx = mock(Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(request.toByteArray());
    when(mockCtx.contentType(anyString())).thenReturn(mockCtx);
    when(mockCtx.result(any(byte[].class))).thenReturn(mockCtx);
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);
    when(mockCtx.result(anyString())).thenReturn(mockCtx);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("MyTestRace")
            .withEntityId("race-1")
            .build();
    when(mockRace.getRaceModel()).thenReturn(raceModel);
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    handler.endRace(mockCtx);

    verify(mockCtx).contentType("application/octet-stream");
    assertNull(
        "Race should be ended and cleared", ClientSubscriptionManager.getInstance().getRace());
  }

  private void deleteDirectory(File directory) {
    File[] allContents = directory.listFiles();
    if (allContents != null) {
      for (File file : allContents) {
        deleteDirectory(file);
      }
    }
    directory.delete();
  }
}
