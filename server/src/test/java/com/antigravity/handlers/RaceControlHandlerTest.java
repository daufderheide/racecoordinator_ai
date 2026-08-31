package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
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
}
