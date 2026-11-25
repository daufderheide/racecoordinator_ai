package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.handlers.ClientCommandTaskHandler.TaskResult;
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
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.RaceOver;
import com.antigravity.repository.SqliteRepository;
import java.io.File;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceControlHandlerTest {

  private DatabaseContext databaseContext;
  private RaceControlHandler handler;
  private Path tempDir;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "race_control_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    Theme defaultTheme =
        new Theme(
            "Default Theme",
            true,
            new java.util.HashMap<>(),
            new java.util.HashMap<>(),
            Theme.DEFAULT_THEME_ID,
            null);
    new SqliteRepository<>(databaseContext, "themes", Theme.class).insert(defaultTheme);

    ClientSubscriptionManager.setInstance(null);
    handler = new RaceControlHandler(databaseContext);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testHandleInitializeRace_ExplicitDriver() throws Exception {
    String raceId = "race-1";
    String driverId = "driver-1";

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

    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(request);
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull(activeRace);
    List<RaceParticipant> participants = activeRace.getDrivers();
    assertEquals(1, participants.size());
    assertEquals(driverId, participants.get(0).getDriver().getEntityId());
    assertNull(participants.get(0).getTeam());
  }

  private InitializeRaceRequest insertRaceAgainFixture() {
    Race race =
        new Race.Builder()
            .withName("Again Race")
            .withTrackEntityId("track-again")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withEntityId("race-again")
            .build();
    Driver driver = new Driver("Again Driver", "AD", "driver-again", null);
    Track track =
        new Track.Builder()
            .name("Again Track")
            .lanes(Arrays.asList(new Lane("red", "black", 100)))
            .entityId("track-again")
            .build();
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);
    return InitializeRaceRequest.newBuilder()
        .setRaceId("race-again")
        .addDriverIds("d_driver-again")
        .setIsDemoMode(true)
        .setRaceAgain(true)
        .build();
  }

  // https://github.com/daufderheide/racecoordinator_ai/issues/679
  @Test
  public void testHandleInitializeRace_RaceAgainWithoutRace_Returns409() throws Exception {
    InitializeRaceRequest request = insertRaceAgainFixture();
    ClientSubscriptionManager.getInstance().setRace(null);

    TaskResult result = handler.handleInitializeRace(request);

    assertEquals(409, result.status);
    assertNull(ClientSubscriptionManager.getInstance().getRace());
  }

  @Test
  public void testHandleInitializeRace_RaceAgainWhileRaceNotOver_Returns409() throws Exception {
    InitializeRaceRequest request = insertRaceAgainFixture();
    InitializeRaceRequest firstStart = request.toBuilder().setRaceAgain(false).build();
    assertEquals(200, handler.handleInitializeRace(firstStart).status);
    com.antigravity.race.Race running = ClientSubscriptionManager.getInstance().getRace();
    assertFalse(running.getState() instanceof RaceOver);

    TaskResult result = handler.handleInitializeRace(request);

    assertEquals(409, result.status);
    assertSame(running, ClientSubscriptionManager.getInstance().getRace());
  }

  @Test
  public void testHandleInitializeRace_RaceAgainWhenRaceOver_StartsNewRace() throws Exception {
    InitializeRaceRequest request = insertRaceAgainFixture();
    InitializeRaceRequest firstStart = request.toBuilder().setRaceAgain(false).build();
    assertEquals(200, handler.handleInitializeRace(firstStart).status);
    com.antigravity.race.Race finished = ClientSubscriptionManager.getInstance().getRace();
    finished.changeState(new RaceOver());

    TaskResult result = handler.handleInitializeRace(request);

    assertEquals(200, result.status);
    com.antigravity.race.Race again = ClientSubscriptionManager.getInstance().getRace();
    assertNotSame(finished, again);
    assertFalse(again.getState() instanceof RaceOver);
  }

  /** Puts the event manager on race {@code index} of a two-race event. */
  private static void setActiveEventOnRace(int index) throws Exception {
    com.antigravity.race.EventExecutionManager mgr = // fqn-collision
        com.antigravity.race.EventExecutionManager.getInstance(); // fqn-collision
    com.antigravity.models.Event event = // fqn-collision
        new com.antigravity.models.Event( // fqn-collision
            "Two Race Event",
            "",
            0.0,
            Arrays.asList(
                new com.antigravity.models.Event.EventRaceItem("race-again", 0), // fqn-collision
                new com.antigravity.models.Event.EventRaceItem("race-again", 0)), // fqn-collision
            "event-again",
            null);
    java.lang.reflect.Field active =
        com.antigravity.race.EventExecutionManager.class // fqn-collision
            .getDeclaredField("activeEvent");
    active.setAccessible(true);
    active.set(mgr, event);
    java.lang.reflect.Field idx =
        com.antigravity.race.EventExecutionManager.class // fqn-collision
            .getDeclaredField("currentRaceIndex");
    idx.setAccessible(true);
    idx.set(mgr, index);
  }

  // https://github.com/daufderheide/racecoordinator_ai/issues/679
  @Test
  public void testHandleInitializeRace_RaceAgainBetweenEventRaces_Returns409() throws Exception {
    InitializeRaceRequest request = insertRaceAgainFixture();
    InitializeRaceRequest firstStart = request.toBuilder().setRaceAgain(false).build();
    assertEquals(200, handler.handleInitializeRace(firstStart).status);
    com.antigravity.race.Race finished = ClientSubscriptionManager.getInstance().getRace();
    finished.changeState(new RaceOver());
    setActiveEventOnRace(0);
    try {
      TaskResult result = handler.handleInitializeRace(request);

      assertEquals(409, result.status);
      assertSame(finished, ClientSubscriptionManager.getInstance().getRace());
    } finally {
      com.antigravity.race.EventExecutionManager.getInstance().cancelEvent(); // fqn-collision
    }
  }

  @Test
  public void testHandleInitializeRace_RaceAgainAfterLastEventRace_IsAllowed() throws Exception {
    InitializeRaceRequest request = insertRaceAgainFixture();
    InitializeRaceRequest firstStart = request.toBuilder().setRaceAgain(false).build();
    assertEquals(200, handler.handleInitializeRace(firstStart).status);
    com.antigravity.race.Race finished = ClientSubscriptionManager.getInstance().getRace();
    finished.changeState(new RaceOver());
    setActiveEventOnRace(1);
    try {
      TaskResult result = handler.handleInitializeRace(request);

      assertEquals(200, result.status);
      assertNotSame(finished, ClientSubscriptionManager.getInstance().getRace());
    } finally {
      com.antigravity.race.EventExecutionManager.getInstance().cancelEvent(); // fqn-collision
    }
  }

  @Test
  public void testHandleInitializeRace_TeamParticipantAndEventHandling() throws Exception {
    String raceId = "race-2";
    String driverId1 = "d1";
    String driverId2 = "d2";
    String teamId = "team-1";

    Race race =
        new Race.Builder()
            .withName("Team Race")
            .withTrackEntityId("track-1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withEntityId(raceId)
            .build();
    Driver driver1 = new Driver("Driver One", "D1", driverId1, null);
    Driver driver2 = new Driver("Driver Two", "D2", driverId2, null);
    Team team = new Team("Team Red", null, Arrays.asList(driverId1, driverId2), teamId, null);

    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver1);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver2);
    new SqliteRepository<>(databaseContext, "teams", Team.class).insert(team);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("t_" + teamId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(request);
    assertEquals(200, result.status);

    // Test Nonexistent race returns 404
    InitializeRaceRequest req404 =
        InitializeRaceRequest.newBuilder().setRaceId("nonexistent_race").build();
    TaskResult res404 = handler.handleInitializeRace(req404);
    assertEquals(404, res404.status);

    // Test Nonexistent event returns 404
    InitializeRaceRequest reqEv404 =
        InitializeRaceRequest.newBuilder().setEventId("nonexistent_event").build();
    TaskResult resEv404 = handler.handleInitializeRace(reqEv404);
    assertEquals(404, resEv404.status);
  }

  @Test
  public void testRaceControlCommands_WithActiveRace() throws Exception {
    String raceId = "race-ctrl";
    String driverId = "d-ctrl";

    Race race =
        new Race.Builder()
            .withName("Control Race")
            .withTrackEntityId("track-ctrl")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Ctrl Driver", "CD", driverId, null);
    Track track =
        new Track.Builder()
            .name("Ctrl Track")
            .lanes(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "white", 100)))
            .entityId("track-ctrl")
            .build();

    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);

    // 1. Initialize race via Context
    InitializeRaceRequest initReq =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    io.javalin.http.Context ctxInit = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxInit.bodyAsBytes()).thenReturn(initReq.toByteArray());
    handler.initializeRace(ctxInit);

    // 2. Start Race
    io.javalin.http.Context ctxStart = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxStart.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxStart);
    handler.startRace(ctxStart);
    org.mockito.Mockito.verify(ctxStart).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 3. Pause Race
    io.javalin.http.Context ctxPause = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxPause.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxPause);
    handler.pauseRace(ctxPause);
    org.mockito.Mockito.verify(ctxPause).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 4. Abort Timers
    io.javalin.http.Context ctxAbort = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxAbort.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxAbort);
    handler.abortTimers(ctxAbort);
    org.mockito.Mockito.verify(ctxAbort).status(200);

    // 5. Restart Heat
    io.javalin.http.Context ctxRestart = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxRestart.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxRestart);
    handler.restartHeat(ctxRestart);
    org.mockito.Mockito.verify(ctxRestart).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 6. Skip Heat
    io.javalin.http.Context ctxSkipHeat = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxSkipHeat.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxSkipHeat);
    handler.skipHeat(ctxSkipHeat);
    org.mockito.Mockito.verify(ctxSkipHeat).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 7. Defer Heat
    io.javalin.http.Context ctxDefer = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxDefer.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxDefer);
    handler.deferHeat(ctxDefer);
    org.mockito.Mockito.verify(ctxDefer).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 8. Next Heat
    io.javalin.http.Context ctxNext = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxNext.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxNext);
    handler.nextHeat(ctxNext);
    org.mockito.Mockito.verify(ctxNext).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 9. Skip Race
    io.javalin.http.Context ctxSkipRace = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxSkipRace.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxSkipRace);
    handler.skipRace(ctxSkipRace);
    org.mockito.Mockito.verify(ctxSkipRace).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // 10. Finalize Modify Heats
    io.javalin.http.Context ctxFinalize = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxFinalize.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxFinalize);
    handler.finalizeModifyHeats(ctxFinalize);
    org.mockito.Mockito.verify(ctxFinalize).status(200);

    // 11. End Race
    io.javalin.http.Context ctxEnd = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxEnd.bodyAsBytes())
        .thenReturn(com.antigravity.proto.EndRaceRequest.getDefaultInstance().toByteArray());
    when(ctxEnd.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxEnd);
    handler.endRace(ctxEnd);
    org.mockito.Mockito.verify(ctxEnd).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testRaceControlCommands_WhenNoActiveRace_Returns404() {
    ClientSubscriptionManager.getInstance().setRace(null);

    io.javalin.http.Context ctx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctx);

    handler.startRace(ctx);
    org.mockito.Mockito.verify(ctx).status(404);

    handler.pauseRace(ctx);
    handler.abortTimers(ctx);
    handler.nextHeat(ctx);
    handler.restartHeat(ctx);
    handler.skipHeat(ctx);
    handler.skipRace(ctx);
    handler.deferHeat(ctx);
    handler.modifyHeats(ctx);
    handler.regenerateHeats(ctx);
    handler.finalizeModifyHeats(ctx);

    io.javalin.http.Context ctxOpen = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxOpen.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxOpen);
    handler.openModifyHeats(ctxOpen);
    org.mockito.Mockito.verify(ctxOpen).status(200);
  }

  @Test
  public void testOpenAndFinalizeModifyHeats_TogglesFlagOnActiveRace() throws Exception {
    Driver d1 = new Driver("D1", "D1", "d1", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    Track track =
        new Track.Builder()
            .entityId("t1")
            .lanes(Arrays.asList(new Lane("red", "black", 100)))
            .build();
    Race raceModel = new Race.Builder().withName("R1").withTrackEntityId("t1").build();
    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .track(track)
            .drivers(Arrays.asList(rp1))
            .skipHardwareInterface(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(activeRace);

    assertFalse(activeRace.isModifyHeatsOpen());

    io.javalin.http.Context ctxOpen = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxOpen.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxOpen);
    handler.openModifyHeats(ctxOpen);
    org.mockito.Mockito.verify(ctxOpen).status(200);
    assertTrue(activeRace.isModifyHeatsOpen());

    io.javalin.http.Context ctxFinalize = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxFinalize.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(ctxFinalize);
    handler.finalizeModifyHeats(ctxFinalize);
    org.mockito.Mockito.verify(ctxFinalize).status(200);
    assertFalse(activeRace.isModifyHeatsOpen());
  }

  @Test
  public void testModifyAndRegenerateHeats_WithActiveRace() throws Exception {
    Driver d1 = new Driver("D1", "D1", "d1", null);
    RaceParticipant rp1 = new RaceParticipant(d1);
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(new Lane("red", "black", 100)))
            .build();
    Race model = new Race.Builder().withName("Active Race").withEntityId("r1").build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(rp1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    // Modify heats
    com.antigravity.proto.ModifyHeatsRequest modReq =
        com.antigravity.proto.ModifyHeatsRequest.getDefaultInstance();
    io.javalin.http.Context ctxMod = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxMod.bodyAsBytes()).thenReturn(modReq.toByteArray());
    when(ctxMod.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxMod);
    handler.modifyHeats(ctxMod);
    org.mockito.Mockito.verify(ctxMod).result(org.mockito.ArgumentMatchers.any(byte[].class));

    // Regenerate heats
    com.antigravity.proto.RegenerateHeatsRequest regenReq =
        com.antigravity.proto.RegenerateHeatsRequest.getDefaultInstance();
    io.javalin.http.Context ctxRegen = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(ctxRegen.bodyAsBytes()).thenReturn(regenReq.toByteArray());
    when(ctxRegen.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(ctxRegen);
    handler.regenerateHeats(ctxRegen);
    org.mockito.Mockito.verify(ctxRegen).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testHandleInitializeRace_WithCustomThemeId() throws Exception {
    String raceId = "race-custom-theme";
    String driverId = "d-custom";
    String themeId = "theme-custom-checkered";

    java.util.Map<String, String> slots = new java.util.HashMap<>();
    slots.put("flag.heat_paused", "default_flag_checkered");
    Theme customTheme = new Theme("Custom Checkered", false, slots, null, themeId, null);
    new SqliteRepository<>(databaseContext, "themes", Theme.class).insert(customTheme);

    Race race =
        new Race.Builder()
            .withName("Custom Theme Race")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Custom Driver", "CD", driverId, null);
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

    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setThemeId(themeId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(request);
    assertEquals(200, result.status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull(activeRace);
    assertNotNull(activeRace.getTheme());
    assertEquals(themeId, activeRace.getTheme().getEntityId());
    assertEquals(
        com.antigravity.proto.RaceFlag.CHECKERED,
        activeRace
            .getTheme()
            .resolveFlag("flag.heat_paused", com.antigravity.proto.RaceFlag.YELLOW));
  }

  @Test
  public void testHandleInitializeRace_WithWhitespaceOrNonExistentThemeId() throws Exception {
    String raceId = "race-theme-fallback";
    String driverId = "d-fallback";

    Race race =
        new Race.Builder()
            .withName("Fallback Theme Race")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Fallback Driver", "FD", driverId, null);
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

    // Whitespace themeId falls back to race theme (which is default_classic_rc_ai, seeded in setUp)
    InitializeRaceRequest whitespaceReq =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setThemeId("   ")
            .setIsDemoMode(true)
            .build();

    TaskResult result1 = handler.handleInitializeRace(whitespaceReq);
    assertEquals(200, result1.status);
    com.antigravity.race.Race race1 = ClientSubscriptionManager.getInstance().getRace();
    assertNotNull(race1);

    // Non-existent/deleted themeId in request fails with THEME_DELETED
    InitializeRaceRequest nonExistentReq =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setThemeId("non-existent-theme-id")
            .setIsDemoMode(true)
            .build();

    TaskResult result2 = handler.handleInitializeRace(nonExistentReq);
    assertEquals(200, result2.status);
    com.antigravity.proto.InitializeRaceResponse resp2 =
        com.antigravity.proto.InitializeRaceResponse.parseFrom((byte[]) result2.result);
    assertFalse(resp2.getSuccess());
    assertEquals("THEME_DELETED", resp2.getErrorCode());
  }

  @Test
  public void testHandleInitializeRace_WithDeletedRaceTheme_ShouldFail() throws Exception {
    String raceId = "race-theme-deleted";
    String driverId = "d-deleted";

    Race race =
        new Race.Builder()
            .withName("Deleted Theme Race")
            .withTrackEntityId("track-1")
            .withThemeId("deleted-theme-id")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Deleted Driver", "DD", driverId, null);
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

    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(request);
    assertEquals(200, result.status);
    com.antigravity.proto.InitializeRaceResponse response =
        com.antigravity.proto.InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse(response.getSuccess());
    assertEquals("THEME_DELETED", response.getErrorCode());
  }

  @Test
  public void testHandleInitializeRace_WithThemeLookupException() throws Exception {
    String raceId = "race-theme-err";
    String driverId = "d-err";

    Race race =
        new Race.Builder()
            .withName("Err Race")
            .withTrackEntityId("track-1")
            .withEntityId(raceId)
            .build();
    Driver driver = new Driver("Err Driver", "ED", driverId, null);
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

    // Corrupt the themes table structure so themeRepo.findByEntityId throws an exception
    databaseContext.getConnection().createStatement().execute("DROP TABLE IF EXISTS themes");
    databaseContext
        .getConnection()
        .createStatement()
        .execute("CREATE TABLE themes (invalid_column INT)");

    InitializeRaceRequest req =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setThemeId("theme-will-fail-lookup")
            .setIsDemoMode(true)
            .build();

    // handleInitializeRace catches theme lookup exception, logs warning, and returns THEME_DELETED
    TaskResult result = handler.handleInitializeRace(req);
    assertEquals(200, result.status);
    com.antigravity.proto.InitializeRaceResponse response =
        com.antigravity.proto.InitializeRaceResponse.parseFrom((byte[]) result.result);
    assertFalse(response.getSuccess());
    assertEquals("THEME_DELETED", response.getErrorCode());
  }

  @Test
  public void testHandleInitializeRace_IncompatibleRace_Returns400() throws Exception {
    String raceId = "race-incompatible";
    String driverId = "driver-1";

    // Insert track and driver
    Lane lane = new Lane("red", "black", 100);
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(Arrays.asList(lane))
            .entityId("track-1")
            .build();
    Driver driver = new Driver("Test Driver", "TD", driverId, null);
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class).insert(driver);

    // Insert incompatible race (raw JSON with points_scoring)
    String rawJson =
        "{\"entity_id\":\""
            + raceId
            + "\",\"name\":\"Incompatible Points Race\",\"track_entity_id\":\"track-1\","
            + "\"points_scoring\":{\"enabled\":true},"
            + "\"_compat_meta\":{\"features\":[{\"id\":\"points\",\"criticality\":\"REQUIRED\",\"description\":\"Points Scoring\"}]}}";
    String sql = "INSERT INTO races (entity_id, json_data) VALUES (?, ?)";
    try (java.sql.PreparedStatement pstmt = databaseContext.getConnection().prepareStatement(sql)) {
      pstmt.setString(1, raceId);
      pstmt.setString(2, rawJson);
      pstmt.executeUpdate();
    }

    InitializeRaceRequest req =
        InitializeRaceRequest.newBuilder()
            .setRaceId(raceId)
            .addDriverIds("d_" + driverId)
            .setIsDemoMode(true)
            .build();

    TaskResult result = handler.handleInitializeRace(req);
    assertEquals(400, result.status);
    assertNotNull(result.result);
    org.junit.Assert.assertTrue(result.result.toString().contains("unsupported features"));
  }

  // Slotcars picked in the roster (#1210)
  @Test
  public void testHandleInitializeRace_AppliesTheCarPicks() throws Exception {
    InitializeRaceRequest base = insertRaceAgainFixture();
    new SqliteRepository<>(
            databaseContext, "cars", com.antigravity.models.Car.class) // fqn-collision
        .insert(
            new com.antigravity.models.Car.Builder() // fqn-collision
                .withName("Audi R8")
                .withEntityId("c1")
                .build());
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder(base)
            .setRaceAgain(false)
            .addCarChoices(
                com.antigravity.proto.ParticipantCarChoice.newBuilder() // fqn-collision
                    .setParticipantId("d_driver-again")
                    .setCarId("c1"))
            .build();

    assertEquals(200, handler.handleInitializeRace(request).status);

    com.antigravity.race.Race activeRace = ClientSubscriptionManager.getInstance().getRace();
    RaceParticipant p = activeRace.getDrivers().get(0);
    assertEquals("Audi R8", p.getCar().getName());
    assertEquals(
        "the first heat has the car",
        "c1",
        activeRace.getCurrentHeat().getDrivers().get(0).getCar().getEntityId());
  }

  @Test
  public void testHandleInitializeRace_IgnoresADeletedCar() throws Exception {
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder(insertRaceAgainFixture())
            .setRaceAgain(false)
            .addCarChoices(
                com.antigravity.proto.ParticipantCarChoice.newBuilder() // fqn-collision
                    .setParticipantId("d_driver-again")
                    .setCarId("gone"))
            .build();

    assertEquals(200, handler.handleInitializeRace(request).status);
    assertNull(ClientSubscriptionManager.getInstance().getRace().getDrivers().get(0).getCar());
  }

  // Cars stay in their lanes (#1210)
  private InitializeRaceRequest insertIrocFixture() {
    Race race =
        new Race.Builder()
            .withName("IROC Race")
            .withTrackEntityId("track-iroc")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCarsStayInLanes(true)
            .withEntityId("race-iroc")
            .build();
    Track track =
        new Track.Builder()
            .name("IROC Track")
            .lanes(Arrays.asList(new Lane("red", "black", 100), new Lane("white", "black", 100)))
            .entityId("track-iroc")
            .build();
    new SqliteRepository<>(databaseContext, "races", Race.class).insert(race);
    new SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .insert(new Driver("Iroc One", "I1", "driver-iroc-1", null));
    new SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .insert(new Driver("Iroc Two", "I2", "driver-iroc-2", null));
    new SqliteRepository<>(databaseContext, "tracks", Track.class).insert(track);
    new SqliteRepository<>(
            databaseContext, "cars", com.antigravity.models.Car.class) // fqn-collision
        .insert(
            new com.antigravity.models.Car.Builder() // fqn-collision
                .withName("Red car")
                .withEntityId("c-red")
                .build());
    return InitializeRaceRequest.newBuilder()
        .setRaceId("race-iroc")
        .addDriverIds("d_driver-iroc-1")
        .addDriverIds("d_driver-iroc-2")
        .setIsDemoMode(true)
        .build();
  }

  @Test
  public void testHandleInitializeRace_PutsTheCarsOnTheirLanes() throws Exception {
    InitializeRaceRequest request =
        insertIrocFixture().toBuilder().addLaneCarIds("c-red").addLaneCarIds("").build();

    assertEquals(200, handler.handleInitializeRace(request).status);

    com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
    assertEquals(2, race.getLaneCars().size());
    assertEquals("Red car", race.getLaneCar(0).getName());
    assertNull("no car on lane 2", race.getLaneCar(1));
    assertEquals(
        "whoever races lane 1 drives the red car",
        "c-red",
        race.getCurrentHeat().getDrivers().get(0).getCar().getEntityId());
    assertNull(race.getCurrentHeat().getDrivers().get(1).getCar());
  }

  @Test
  public void testHandleInitializeRace_LaneCarsIgnoreAnUnknownOrMissingCar() throws Exception {
    InitializeRaceRequest request = insertIrocFixture().toBuilder().addLaneCarIds("gone").build();

    assertEquals(200, handler.handleInitializeRace(request).status);

    com.antigravity.race.Race race = ClientSubscriptionManager.getInstance().getRace();
    assertEquals("one entry per lane", 2, race.getLaneCars().size());
    assertNull(race.getLaneCar(0));
    assertNull(race.getLaneCar(1));
  }

  @Test
  public void testHandleInitializeRace_LaneCarsOnlyForAnIrocRace() throws Exception {
    InitializeRaceRequest request =
        InitializeRaceRequest.newBuilder(insertRaceAgainFixture())
            .setRaceAgain(false)
            .addLaneCarIds("c1")
            .build();

    assertEquals(200, handler.handleInitializeRace(request).status);
    assertTrue(ClientSubscriptionManager.getInstance().getRace().getLaneCars().isEmpty());
  }
}
