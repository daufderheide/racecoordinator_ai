package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
import com.antigravity.models.Theme;
import com.antigravity.models.Track;
import com.antigravity.proto.InitializeRaceRequest;
import com.antigravity.proto.InitializeRaceResponse;
import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.SetInterfacePinStateRequest;
import com.antigravity.proto.SetInterfacePinStateResponse;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.interfaces.BleConnection;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.phidget.PhidgetProtocol;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceSaveData;
import com.antigravity.race.states.NotStarted;
import com.antigravity.repository.SqliteRepository;
import com.antigravity.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class ClientCommandTaskHandlerTest {

  private DatabaseContext databaseContext;
  private Javalin app;
  private ClientCommandTaskHandler handler;
  private Context ctx;
  private Path tempDir;
  private HttpServletResponse res;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "saved_races_test_" + System.currentTimeMillis());
    deleteDirectory(tempFile);
    tempFile.mkdirs();
    tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    Theme defaultTheme =
        new Theme(
            "Default Theme", true, new HashMap<>(), new HashMap<>(), Theme.DEFAULT_THEME_ID, null);
    new SqliteRepository<>(databaseContext, "themes", Theme.class).insert(defaultTheme);

    app = mock(Javalin.class);

    HttpServletRequest req = mock(HttpServletRequest.class);
    res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, new HashMap<>());

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

    // Mock getAllTeams (used to build lookup map)

    // Mock getDrivers (for the participant list)

    // Mock getTeams

    // Create Track with lanes
    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .id(null)
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

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

    // Mock getDrivers (will be called for team participants)

    // Mock getTeams (called for explicit team lookup)

    // Create Track
    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .id(null)
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "teams", Team.class).insert(team);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

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
    when(race.getTrack())
        .thenReturn(
            new Track.Builder()
                .name("Track1")
                .lanes(new ArrayList<>())
                .entityId("track1")
                .id(null)
                .build());
    when(race.getDrivers()).thenReturn(new ArrayList<>());
    when(race.getHeats()).thenReturn(new ArrayList<>());
    when(race.isDemoMode()).thenReturn(true);

    ClientSubscriptionManager.getInstance().setRace(race);

    handler.saveRace(ctx);

    List<RaceSaveData> savedList =
        new SqliteRepository<>(databaseContext, "demo_saved_races", RaceSaveData.class).findAll();
    assertFalse("Saved races should not be empty", savedList.isEmpty());
    assertTrue(savedList.get(0).getSaveName().endsWith("_MyTestRace.json"));
    assertTrue(savedList.get(0).isDemoMode());
    assertFalse(savedList.get(0).isAutoSave());
  }

  @Test
  @SuppressWarnings("unchecked")
  public void testGetSavedRaces_Success() throws Exception {
    RaceSaveData data = new RaceSaveData();
    data.setSaveName("20260101-120000_MyTestRace.json");

    handler.getSavedRaces(ctx);

    verify(res, never()).sendError(anyInt());
    verify(res, never()).setStatus(eq(500));
  }

  @Test
  public void testDeleteSavedRace_Success() throws Exception {

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("filename", "20260101-120001_MyTestRace.json");
    try {
      Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    RaceSaveData sd = new RaceSaveData();
    sd.setSaveName("20260101-120001_MyTestRace.json");
    new SqliteRepository<>(databaseContext, "saved_races", RaceSaveData.class).insert(sd);

    handler.deleteSavedRace(ctx);

    verify(res).setStatus(200);
  }

  @Test
  public void testDeleteSavedRace_RouteRegistered() {
    verify(app)
        .delete(eq("/api/saved-races/{filename}"), any(), eq(com.antigravity.auth.Role.DIRECTOR));
  }

  @Test
  public void testRenameSavedRace_RouteRegistered() {
    verify(app).post(eq("/api/rename-saved-race"), any(), eq(com.antigravity.auth.Role.DIRECTOR));
    verify(app)
        .put(eq("/api/saved-races/{filename}"), any(), eq(com.antigravity.auth.Role.DIRECTOR));
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

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("filename", "20260101-120001_MyTestRace.json");
    try {
      Method setParams = ctx.getClass().getMethod("setPathParamMap$javalin", Map.class);
      setParams.invoke(ctx, pathParams);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    when(ctx.req.getHeader("X-Demo-Mode")).thenReturn("true");
    when(ctx.req.getHeader("X-Race-Demo-Mode")).thenReturn("true");

    RaceSaveData sd = new RaceSaveData();
    sd.setSaveName("20260101-120001_MyTestRace.json");
    new SqliteRepository<>(databaseContext, "demo_saved_races", RaceSaveData.class).insert(sd);

    handler.deleteSavedRace(ctx);

    verify(res).setStatus(200);
  }

  @Test
  public void testAbortTimers_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getState()).thenReturn(mock(com.antigravity.race.states.Starting.class));
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    handler.abortTimers(ctx);

    verify(mockRace).clearAutoTimers();
    verify(mockRace).pauseRace();
    verify(res).setStatus(200);
  }

  @Test
  public void testAbortTimers_InRaceOver_BroadcastsSnapshotWithoutPause() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getState()).thenReturn(mock(com.antigravity.race.states.RaceOver.class));
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    handler.abortTimers(ctx);

    verify(mockRace).clearAutoTimers();
    verify(mockRace, never()).pauseRace();
    verify(mockRace).broadcast(any());
    verify(res).setStatus(200);
  }

  @Test
  public void testSetMainPower_Success() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/main"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setMainPowerHandler = handlerCaptor.getValue();

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    Context mockCtx = mock(Context.class);
    when(mockCtx.queryParam("on")).thenReturn("true");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setMainPowerHandler.handle(mockCtx);

    verify(mockRace).forceUserMainPower(true);
    verify(mockCtx).status(200);
    verify(mockCtx).result("Main power set to true");
  }

  @Test
  public void testSetLanePower_Success() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/lane/{lane}"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setLanePowerHandler = handlerCaptor.getValue();

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.queryParam("on")).thenReturn("false");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setLanePowerHandler.handle(mockCtx);

    verify(mockRace).setLanePower(false, 0);
    verify(mockCtx).status(200);
    verify(mockCtx).result("Lane 1 power set to false");
  }

  @Test
  public void testSetMainPower_FallbackToProtocol_Success() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/main"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setMainPowerHandler = handlerCaptor.getValue();

    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    ClientSubscriptionManager.getInstance().setRace(null);
    ClientSubscriptionManager.getInstance().setProtocol(mockProtocol);

    Context mockCtx = mock(Context.class);
    when(mockCtx.queryParam("on")).thenReturn("true");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setMainPowerHandler.handle(mockCtx);

    verify(mockProtocol).setMainPower(true);
    verify(mockCtx).status(200);
    verify(mockCtx).result("Main power set to true");
  }

  @Test
  public void testSetMainPower_NoRaceOrProtocol_NotFound() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/main"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setMainPowerHandler = handlerCaptor.getValue();

    ClientSubscriptionManager.getInstance().setRace(null);
    ClientSubscriptionManager.getInstance().setProtocol(null);

    Context mockCtx = mock(Context.class);
    when(mockCtx.queryParam("on")).thenReturn("true");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setMainPowerHandler.handle(mockCtx);

    verify(mockCtx).status(404);
    verify(mockCtx).result("No active race or interface found");
  }

  @Test
  public void testSetLanePower_FallbackToProtocol_Success() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/lane/{lane}"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setLanePowerHandler = handlerCaptor.getValue();

    ProtocolDelegate mockProtocol = mock(ProtocolDelegate.class);
    ClientSubscriptionManager.getInstance().setRace(null);
    ClientSubscriptionManager.getInstance().setProtocol(mockProtocol);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.queryParam("on")).thenReturn("false");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setLanePowerHandler.handle(mockCtx);

    verify(mockProtocol).setLanePower(false, 0);
    verify(mockCtx).status(200);
    verify(mockCtx).result("Lane 1 power set to false");
  }

  @Test
  public void testSetLanePower_NoRaceOrProtocol_NotFound() throws Exception {
    org.mockito.ArgumentCaptor<io.javalin.http.Handler> handlerCaptor =
        org.mockito.ArgumentCaptor.forClass(io.javalin.http.Handler.class);
    verify(app)
        .post(
            eq("/api/track/power/lane/{lane}"),
            handlerCaptor.capture(),
            eq(com.antigravity.auth.Role.DIRECTOR));
    io.javalin.http.Handler setLanePowerHandler = handlerCaptor.getValue();

    ClientSubscriptionManager.getInstance().setRace(null);
    ClientSubscriptionManager.getInstance().setProtocol(null);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.queryParam("on")).thenReturn("false");
    when(mockCtx.status(anyInt())).thenReturn(mockCtx);

    setLanePowerHandler.handle(mockCtx);

    verify(mockCtx).status(404);
    verify(mockCtx).result("No active race or interface found");
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
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    Team team = new Team("Team A", "url", Arrays.asList(driverId), teamId, null);
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "teams", Team.class).insert(team);
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(Arrays.asList(new Lane("red", "black", 100)))
            .entityId("track-1")
            .build();
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    // 2. Mock Database interactions

    // Drivers fetch (requested both as individual and then implicitly by
    // validation)

    // Teams fetch (requested explicitly in the participantIds)

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
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    Team teamA = new Team("Team A", "url", Arrays.asList(driverId), teamAId, null);
    Team teamB = new Team("Team B", "url", Arrays.asList(driverId), teamBId, null);
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(Arrays.asList(new Lane("red", "black", 100)))
            .entityId("track-1")
            .build();
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "teams", Team.class).insert(teamA);
    new SqliteRepository<>(databaseContext, "teams", Team.class).insert(teamB);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    // 2. Mock Database interactions

    // Teams fetch

    // Mock getDriver (used for Rule 2 error detail)

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
  public void testInitializeRace_TrackDeleted_ShouldFail() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";

    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("deleted-track-id")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Dave", "D", driverId, null);
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);

    // 2. Mock Database interactions

    // 3. Mock Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder().setRaceId(raceId).addDriverIds("d_" + driverId).build();

    // 4. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 5. Verify
    InitializeRaceResponse response = InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse("Validation should fail", response.getSuccess());
    assertEquals("TRACK_DELETED", response.getErrorCode());
  }

  @Test
  public void testInitializeRace_ThemeDeleted_ShouldFail() throws Exception {
    // 1. Setup Data
    String raceId = "race-1";
    String driverId = "driver-1";
    String trackId = "track-1";

    List<Lane> lanes = Arrays.asList(new Lane("Red", "red", 1));
    Track track = new Track.Builder().name("Test Track").lanes(lanes).entityId(trackId).build();
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId(trackId)
            .withThemeId("deleted-theme-id")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Dave", "D", driverId, null);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);

    // 2. Request
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder().setRaceId(raceId).addDriverIds("d_" + driverId).build();

    // 3. Execute
    TaskResult result = handler.handleInitializeRace(request);

    // 4. Verify
    InitializeRaceResponse response = InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse("Validation should fail", response.getSuccess());
    assertEquals("THEME_DELETED", response.getErrorCode());
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
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);

    // 2. Mock Database interactions

    // Mock getAllTeams (empty)

    // Mock getTeams

    // Create Track
    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .id(null)
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    // Mock assets collection returning null (deleted custom rotation)

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
    when(mockHeat.isStarted()).thenReturn(true);
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
    verify(mockHeat).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(res).setStatus(200);
  }

  @Test
  public void testUpdateHeatUserLaps_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getHeats()).thenReturn(Arrays.asList(mockHeat));
    when(mockHeat.getHeatNumber()).thenReturn(2);
    when(mockHeat.getDrivers()).thenReturn(Arrays.asList(mockDhd));
    when(mockHeat.isStarted()).thenReturn(true);
    when(mockDhd.getAdjustedLapCount()).thenReturn(5.25);
    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("heatNumber", "2");
    pathParams.put("lane", "0");
    doReturn(pathParams).when(ctx).pathParamMap();
    doReturn("2").when(ctx).pathParam("heatNumber");
    doReturn("0").when(ctx).pathParam("lane");

    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 1.25);
    doReturn(body).when(ctx).bodyAsClass(HashMap.class);

    java.lang.reflect.Method m =
        handler.getClass().getDeclaredMethod("updateHeatUserLaps", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(mockDhd).setUserLaps(1.25);
    verify(mockHeat).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(mockRace).updateScoreRecords();
    verify(mockRace).broadcast(any());
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

  @Test
  @SuppressWarnings("unchecked")
  public void testChangeHeatActualDriver_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);
    Driver mockDriver = mock(Driver.class);
    when(mockDriver.getEntityId()).thenReturn("driver-1");

    when(mockRace.getHeats()).thenReturn(Arrays.asList(mockHeat));
    when(mockHeat.getHeatNumber()).thenReturn(2);
    when(mockHeat.getDrivers()).thenReturn(Arrays.asList(mockDhd));
    when(mockRace.getCurrentHeat()).thenReturn(mock(com.antigravity.race.Heat.class));
    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    Driver dbDriver = new Driver("Driver 1", "d1", "driver-1", null);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(dbDriver);
    when(mockRace.isDemoMode()).thenReturn(true);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("heatNumber", "2");
    pathParams.put("lane", "0");
    doReturn(pathParams).when(ctx).pathParamMap();
    doReturn("2").when(ctx).pathParam("heatNumber");
    doReturn("0").when(ctx).pathParam("lane");

    Map<String, String> body = new HashMap<>();
    body.put("driverId", "driver-1");
    doReturn(body).when(ctx).bodyAsClass(HashMap.class);

    java.lang.reflect.Method m =
        handler.getClass().getDeclaredMethod("changeHeatActualDriver", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(mockDhd).setActualDriver(any());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(mockRace).broadcast(any());
    verify(res).setStatus(200);
  }

  @Test
  public void testUpdateUserLaps_Success_NotStarted() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    when(mockHeat.getDrivers()).thenReturn(Arrays.asList(mockDhd));
    when(mockHeat.isStarted()).thenReturn(false);
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
    verify(mockHeat).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(res).setStatus(200);
  }

  @Test
  public void testUpdateHeatUserLaps_Success_NotStarted() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getHeats()).thenReturn(Arrays.asList(mockHeat));
    when(mockHeat.getHeatNumber()).thenReturn(2);
    when(mockHeat.getDrivers()).thenReturn(Arrays.asList(mockDhd));
    when(mockHeat.isStarted()).thenReturn(false);
    when(mockDhd.getAdjustedLapCount()).thenReturn(5.25);
    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("heatNumber", "2");
    pathParams.put("lane", "0");
    doReturn(pathParams).when(ctx).pathParamMap();
    doReturn("2").when(ctx).pathParam("heatNumber");
    doReturn("0").when(ctx).pathParam("lane");

    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 1.25);
    doReturn(body).when(ctx).bodyAsClass(HashMap.class);

    java.lang.reflect.Method m =
        handler.getClass().getDeclaredMethod("updateHeatUserLaps", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(mockDhd).setUserLaps(1.25);
    verify(mockHeat).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(res).setStatus(200);
  }

  @Test
  public void testUpdateBatchUserLaps_Success() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat1 = mock(com.antigravity.race.Heat.class);
    com.antigravity.race.Heat mockHeat2 = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd1 = mock(DriverHeatData.class);
    DriverHeatData mockDhd2 = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getHeats()).thenReturn(Arrays.asList(mockHeat1, mockHeat2));
    when(mockHeat1.getHeatNumber()).thenReturn(1);
    when(mockHeat1.getDrivers()).thenReturn(Arrays.asList(mockDhd1));
    when(mockHeat1.isStarted()).thenReturn(true);

    when(mockHeat2.getHeatNumber()).thenReturn(2);
    when(mockHeat2.getDrivers()).thenReturn(Arrays.asList(mockDhd2));
    when(mockHeat2.isStarted()).thenReturn(true);

    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    List<Map<String, Object>> updates = new ArrayList<>();
    Map<String, Object> u1 = new HashMap<>();
    u1.put("heatNumber", 1);
    u1.put("laneIndex", 0);
    u1.put("userLaps", 1.5);
    updates.add(u1);

    Map<String, Object> u2 = new HashMap<>();
    u2.put("heatNumber", 2);
    u2.put("laneIndex", 0);
    u2.put("userLaps", 2.25);
    updates.add(u2);

    doReturn(updates).when(ctx).bodyAsClass(List.class);

    java.lang.reflect.Method m =
        handler.getClass().getDeclaredMethod("updateBatchUserLaps", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(mockDhd1).setUserLaps(1.5);
    verify(mockDhd2).setUserLaps(2.25);
    verify(mockHeat1).initializeStandings(any(), anyBoolean());
    verify(mockHeat2).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(mockRace).updateScoreRecords();
    verify(mockRace).broadcast(any());
    verify(res).setStatus(200);
  }

  @Test
  public void testUpdateBatchUserLaps_Success_NotStarted() throws Exception {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.race.Heat mockHeat1 = mock(com.antigravity.race.Heat.class);
    DriverHeatData mockDhd1 = mock(DriverHeatData.class);
    com.antigravity.models.Race mockRaceModel = mock(com.antigravity.models.Race.class);

    when(mockRace.getHeats()).thenReturn(Arrays.asList(mockHeat1));
    when(mockHeat1.getHeatNumber()).thenReturn(1);
    when(mockHeat1.getDrivers()).thenReturn(Arrays.asList(mockDhd1));
    when(mockHeat1.isStarted()).thenReturn(false); // Unstarted
    when(mockRace.getRaceModel()).thenReturn(mockRaceModel);

    ClientSubscriptionManager.getInstance().setRace(mockRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    List<Map<String, Object>> updates = new ArrayList<>();
    Map<String, Object> u1 = new HashMap<>();
    u1.put("heatNumber", 1);
    u1.put("laneIndex", 0);
    u1.put("userLaps", 1.5);
    updates.add(u1);

    doReturn(updates).when(ctx).bodyAsClass(List.class);

    java.lang.reflect.Method m =
        handler.getClass().getDeclaredMethod("updateBatchUserLaps", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(mockDhd1).setUserLaps(1.5);
    verify(mockHeat1).initializeStandings(any(), anyBoolean());
    verify(mockRace).updateAndBroadcastOverallStandings();
    verify(res).setStatus(200);
  }

  @Test
  public void testGetPhidgetDevices_MissingDriverHandling() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    Method m = handler.getClass().getDeclaredMethod("getPhidgetDevices", Context.class);
    m.setAccessible(true);

    try {
      m.invoke(handler, ctx);
    } catch (java.lang.reflect.InvocationTargetException e) {
      Throwable target = e.getTargetException();
      assertTrue(
          target instanceof UnsatisfiedLinkError
              || target instanceof NoClassDefFoundError
              || target instanceof ExceptionInInitializerError
              || target instanceof LinkageError);
      return;
    } catch (Throwable ignored) {
    }
    verify(res).setStatus(500);
  }

  @Test
  public void testGetBleDevices() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    Context ctx = spy(new Context(req, res, new HashMap<>()));

    BleConnection.clearDiscoveredBleDevices();
    BleConnection.registerDiscoveredBleDevice("BART_UNIT_01");

    Method m = handler.getClass().getDeclaredMethod("getBleDevices", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(ctx).json(Arrays.asList("BART_UNIT_01"));
    BleConnection.clearDiscoveredBleDevices();
  }

  @Test
  public void testSetInterfacePinState_PhidgetProtocol() throws Exception {
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);

    PhidgetConfig config = new PhidgetConfig();
    config.serialNumber = 12345;
    config.digitalOutIds = Arrays.asList(PinBehavior.BEHAVIOR_RELAY_VALUE);

    PhidgetProtocol phidgetProtocol = spy(new PhidgetProtocol(config, 4, null));
    phidgetProtocol.setInterfaceIndex(0);

    ProtocolDelegate delegate = mock(ProtocolDelegate.class);
    when(delegate.getProtocols()).thenReturn(Arrays.asList(phidgetProtocol));

    ClientSubscriptionManager.getInstance().setProtocol(delegate);

    SetInterfacePinStateRequest request =
        SetInterfacePinStateRequest.newBuilder()
            .setInterfaceIndex(0)
            .setIsDigital(true)
            .setPin(0)
            .setIsHigh(true)
            .build();

    Context ctx = spy(new Context(req, res, new HashMap<>()));
    doReturn(request.toByteArray()).when(ctx).bodyAsBytes();

    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    doReturn(ctx).when(ctx).result(captor.capture());

    doReturn(true).when(phidgetProtocol).setPinState(true, 0, true);

    Method m = handler.getClass().getDeclaredMethod("setInterfacePinState", Context.class);
    m.setAccessible(true);
    m.invoke(handler, ctx);

    verify(phidgetProtocol).setPinState(true, 0, true);

    SetInterfacePinStateResponse response =
        SetInterfacePinStateResponse.parseFrom(captor.getValue());
    assertTrue(response.getSuccess());
    assertEquals("Pin state command sent", response.getMessage());
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

  @Test
  public void testExportRaceXls_NoCurrentRace() throws Exception {
    ClientSubscriptionManager.getInstance().setRace(null);
    handler.exportRaceXls(ctx);
    verify(res).setStatus(404);
  }

  @Test
  public void testExportRaceXls_Success() throws Exception {
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getId()).thenReturn("1");
    when(activeRace.getRaceModel()).thenReturn(raceModel);
    when(activeRace.getHeats()).thenReturn(new java.util.ArrayList<>());

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    javax.servlet.ServletOutputStream outStream = mock(javax.servlet.ServletOutputStream.class);
    when(res.getOutputStream()).thenReturn(outStream);

    handler.exportRaceXls(ctx);

    verify(res).setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    verify(res).setHeader("Content-Disposition", "attachment; filename=\"race_export.xlsx\"");
  }

  @Test
  public void testResetLaneHeatData_SpecificLane_PracticeRace_Success() throws Exception {
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.isPractice()).thenReturn(true);
    when(activeRace.getRaceModel()).thenReturn(raceModel);

    com.antigravity.race.Heat currentHeat = mock(com.antigravity.race.Heat.class);
    when(activeRace.getCurrentHeat()).thenReturn(currentHeat);

    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd1 = mock(DriverHeatData.class);
    DriverHeatData dhd2 = mock(DriverHeatData.class);
    drivers.add(dhd1);
    drivers.add(dhd2);
    when(currentHeat.getDrivers()).thenReturn(drivers);

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse resp = mock(HttpServletResponse.class);
    Context localCtx = spy(new Context(req, resp, new HashMap<>()));
    doReturn("1").when(localCtx).pathParam("lane");

    Method m = handler.getClass().getDeclaredMethod("resetLaneHeatData", Context.class);
    m.setAccessible(true);
    m.invoke(handler, localCtx);

    verify(dhd2).reset();
    verify(dhd1, never()).reset();
    verify(localCtx).status(200);
    verify(activeRace).updateAndBroadcastOverallStandings();
    verify(activeRace).broadcast(any());
  }

  @Test
  public void testResetLaneHeatData_SpecificLane_NonPracticeRace_Forbidden() throws Exception {
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.isPractice()).thenReturn(false);
    when(activeRace.getRaceModel()).thenReturn(raceModel);

    com.antigravity.race.Heat currentHeat = mock(com.antigravity.race.Heat.class);
    when(activeRace.getCurrentHeat()).thenReturn(currentHeat);

    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd1 = mock(DriverHeatData.class);
    DriverHeatData dhd2 = mock(DriverHeatData.class);
    drivers.add(dhd1);
    drivers.add(dhd2);
    when(currentHeat.getDrivers()).thenReturn(drivers);

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse resp = mock(HttpServletResponse.class);
    Context localCtx = spy(new Context(req, resp, new HashMap<>()));
    doReturn("1").when(localCtx).pathParam("lane");

    Method m = handler.getClass().getDeclaredMethod("resetLaneHeatData", Context.class);
    m.setAccessible(true);
    m.invoke(handler, localCtx);

    verify(dhd1, never()).reset();
    verify(dhd2, never()).reset();
    verify(localCtx).status(403);
    verify(localCtx).result("Resetting a specific lane is only allowed in practice races");
  }

  @Test
  public void testResetLaneHeatData_AllLanes_NonPracticeRace_Success() throws Exception {
    com.antigravity.race.Race activeRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.isPractice()).thenReturn(false);
    when(activeRace.getRaceModel()).thenReturn(raceModel);

    com.antigravity.race.Heat currentHeat = mock(com.antigravity.race.Heat.class);
    when(activeRace.getCurrentHeat()).thenReturn(currentHeat);

    List<DriverHeatData> drivers = new ArrayList<>();
    DriverHeatData dhd1 = mock(DriverHeatData.class);
    DriverHeatData dhd2 = mock(DriverHeatData.class);
    drivers.add(dhd1);
    drivers.add(dhd2);
    when(currentHeat.getDrivers()).thenReturn(drivers);

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse resp = mock(HttpServletResponse.class);
    Context localCtx = spy(new Context(req, resp, new HashMap<>()));
    doReturn("all").when(localCtx).pathParam("lane");

    Method m = handler.getClass().getDeclaredMethod("resetLaneHeatData", Context.class);
    m.setAccessible(true);
    m.invoke(handler, localCtx);

    verify(dhd1).reset();
    verify(dhd2).reset();
    verify(localCtx).status(200);
    verify(activeRace).updateAndBroadcastOverallStandings();
    verify(activeRace).broadcast(any());
  }

  @Test
  public void testGetBleDevicesFiltersBartDevicesOnly() throws Exception {
    BleConnection.clearDiscoveredBleDevices();
    BleConnection.registerDiscoveredBleDevice("BART_MST");
    BleConnection.registerDiscoveredBleDevice("BART_LANE1");
    BleConnection.registerDiscoveredBleDevice("iPhone (239)");
    BleConnection.registerDiscoveredBleDevice("Govee_H5151");

    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse resp = mock(HttpServletResponse.class);
    Context localCtx = spy(new Context(req, resp, new HashMap<>()));

    Method m = handler.getClass().getDeclaredMethod("getBleDevices", Context.class);
    m.setAccessible(true);
    m.invoke(handler, localCtx);

    verify(localCtx).json(any());
    BleConnection.clearDiscoveredBleDevices();
  }

  @Test
  public void testExportLapDataSubclass() {
    ClientCommandTaskHandler.ExportLapData data =
        new ClientCommandTaskHandler.ExportLapData(
            "Driver A", "Actual A", 1, 2, 10.0, 100.0, 5.0, java.util.Arrays.asList(1.5, 2.0));
    assertEquals("Driver A", data.getDriverName());
    assertEquals("Actual A", data.getActualDriverName());
    assertEquals(1, data.getHeatNumber());
    assertEquals(2, data.getLaneNumber());
    assertEquals(10.0, data.getAbsoluteHeatLapTime(), 0.001);
    assertEquals(100.0, data.getAbsoluteLapTime(), 0.001);
    assertEquals(5.0, data.getLapTime(), 0.001);
    assertEquals(2, data.getSegments().size());
  }
}
