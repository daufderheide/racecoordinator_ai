package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.RaceParticipant;
import io.javalin.http.Context;
import java.io.File;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class DriverLaneHeatHandlerTest {

  private DatabaseContext databaseContext;
  private DriverLaneHeatHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "driver_lane_heat_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    Path tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    ClientSubscriptionManager.setInstance(null);
    handler = new DriverLaneHeatHandler(databaseContext);

    ctx = mock(Context.class);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testUpdateUserLaps_NoActiveRace_ShouldReturn404() {
    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 5.0);

    handler.updateUserLaps(ctx, pathParams, body);
    verify(ctx).status(404);
  }

  @Test
  public void testChangeLane_NoActiveRace_ShouldReturn404() {
    when(ctx.pathParam("fromLane")).thenReturn("0");
    when(ctx.pathParam("toLane")).thenReturn("1");

    handler.changeLane(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testResetLaneHeatData_NoActiveRace_ShouldReturn404() {
    when(ctx.pathParam("lane")).thenReturn("all");

    handler.resetLaneHeatData(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testChangeActualDriver_NoActiveRace_ShouldReturn404() {
    when(ctx.pathParam("lane")).thenReturn("0");
    HashMap<String, String> body = new HashMap<>();
    body.put("driverId", "d1");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.changeActualDriver(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testChangeHeatActualDriver_NoActiveRace_ShouldReturn404() {
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    HashMap<String, String> body = new HashMap<>();
    body.put("driverId", "d1");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.changeHeatActualDriver(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testUpdateHeatUserLaps_NoActiveRace_ShouldReturn404() {
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    HashMap<String, Object> body = new HashMap<>();
    body.put("userLaps", 2.5);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.updateHeatUserLaps(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testUpdateBatchUserLaps_NoActiveRace_ShouldReturn404() {
    java.util.ArrayList<Map<String, Object>> updates = new java.util.ArrayList<>();
    when(ctx.bodyAsClass(java.util.List.class)).thenReturn(updates);

    handler.updateBatchUserLaps(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testWithActiveRace_ResetAndChangeLane() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.models.Driver d2 = new com.antigravity.models.Driver("Bob", "Bobby", "d2", "2");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);

    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Lane l2 = new com.antigravity.models.Lane("blue", "white", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Arrays.asList(l1, l2))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race")
            .withEntityId("r1")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    // changeLane
    when(ctx.pathParam("fromLane")).thenReturn("0");
    when(ctx.pathParam("toLane")).thenReturn("1");
    handler.changeLane(ctx);
    verify(ctx).status(200);

    // resetLaneHeatData all
    when(ctx.pathParam("lane")).thenReturn("all");
    handler.resetLaneHeatData(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);

    // updateUserLaps on unstarted heat
    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 1.5);
    handler.updateUserLaps(ctx, pathParams, body);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(
        1.5, activeRace.getCurrentHeat().getDrivers().get(0).getUserLaps(), 0.001);

    // updateHeatUserLaps on unstarted heat
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("1");
    HashMap<String, Object> heatBody = new HashMap<>();
    heatBody.put("userLaps", 2.25);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(heatBody);
    handler.updateHeatUserLaps(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(
        2.25, activeRace.getHeats().get(0).getDrivers().get(1).getUserLaps(), 0.001);

    // updateBatchUserLaps on unstarted heat
    java.util.ArrayList<Map<String, Object>> updates = new java.util.ArrayList<>();
    Map<String, Object> u1 = new HashMap<>();
    u1.put("heatNumber", 1);
    u1.put("laneIndex", 0);
    u1.put("userLaps", 3.75);
    updates.add(u1);
    when(ctx.bodyAsClass(java.util.List.class)).thenReturn(updates);
    handler.updateBatchUserLaps(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(
        3.75, activeRace.getHeats().get(0).getDrivers().get(0).getUserLaps(), 0.001);
  }

  @Test
  public void testUpdateLapRecordStatus_NoActiveRace_ShouldReturn404() {
    ClientSubscriptionManager.getInstance().setRace(null);
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.pathParam("lapIndex")).thenReturn("0");
    HashMap<String, Object> body = new HashMap<>();
    body.put("countTowardsRecords", false);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.updateLapRecordStatus(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testUpdateLapRecordStatus_WithActiveRace_ValidationAndSuccess() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(l1))
            .build();
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race")
            .withEntityId("r1")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    // Heat not found
    when(ctx.pathParam("heatNumber")).thenReturn("99");
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.pathParam("lapIndex")).thenReturn("0");
    HashMap<String, Object> body = new HashMap<>();
    body.put("countTowardsRecords", false);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.updateLapRecordStatus(ctx);
    verify(ctx).status(404);

    // Invalid lane
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("5");
    handler.updateLapRecordStatus(ctx);
    verify(ctx).status(400);

    // Invalid lap index (no laps recorded yet)
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.pathParam("lapIndex")).thenReturn("0");
    handler.updateLapRecordStatus(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(400);

    // Add laps to driver heat data
    com.antigravity.race.DriverHeatData dhd = activeRace.getHeats().get(0).getDrivers().get(0);
    dhd.addLap(2.0, false, true);
    dhd.addLap(5.0, false, true);
    org.junit.Assert.assertEquals(2.0, dhd.getBestLapTime(), 0.001);

    // Disallow fastest lap (index 0)
    when(ctx.pathParam("lapIndex")).thenReturn("0");
    body.put("countTowardsRecords", false);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.updateLapRecordStatus(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertFalse(dhd.getLaps().get(0).isCountTowardsRecords());
    // Recalculated best lap should now be 5.0
    org.junit.Assert.assertEquals(5.0, dhd.getBestLapTime(), 0.001);
  }

  @Test
  public void testUpdateLapRecordStatus_WithCurrentHeatFallbackAndRaceOver() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(l1))
            .build();
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race")
            .withEntityId("r1")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    com.antigravity.race.DriverHeatData dhd = activeRace.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(2.0, false, true);

    // Enter RaceOver state
    activeRace.changeState(new com.antigravity.race.states.RaceOver());

    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.pathParam("lapIndex")).thenReturn("0");
    HashMap<String, Object> body = new HashMap<>();
    body.put("countTowardsRecords", false);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    handler.updateLapRecordStatus(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertFalse(dhd.getLaps().get(0).isCountTowardsRecords());
  }

  @Test
  public void testResetLaneHeatData_SpecificLaneInPractice_ShouldResetLaneAndExecutionState() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.models.Driver d2 = new com.antigravity.models.Driver("Bob", "Bobby", "d2", "2");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);

    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Lane l2 = new com.antigravity.models.Lane("blue", "white", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Arrays.asList(l1, l2))
            .build();

    com.antigravity.models.Race practiceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Practice Race")
            .withEntityId("r_practice")
            .withPractice(true)
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(practiceModel)
            .drivers(java.util.Arrays.asList(p1, p2))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    com.antigravity.race.DriverHeatData dhd = activeRace.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(2.5, false, true);
    org.junit.Assert.assertEquals(1, dhd.getLapCount());

    when(ctx.pathParam("lane")).thenReturn("0");
    handler.resetLaneHeatData(ctx);

    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(0, dhd.getLapCount());
    org.junit.Assert.assertEquals(
        0.0, activeRace.getHeatExecutionManager().getTimeSinceLastLap()[0], 0.001);
  }

  @Test
  public void testResetLaneHeatData_SpecificLaneNonPractice_ShouldReturn403() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);

    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(l1))
            .build();

    com.antigravity.models.Race nonPracticeModel =
        new com.antigravity.models.Race.Builder()
            .withName("Non Practice Race")
            .withEntityId("r_non_practice")
            .withPractice(false)
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(nonPracticeModel)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    when(ctx.pathParam("lane")).thenReturn("0");
    handler.resetLaneHeatData(ctx);

    verify(ctx).status(403);
  }

  @Test
  public void testUpdateBatchUserLaps_WithHistoryRecordId_UpdatesDatabaseAndSeason() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);

    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(l1))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("History Race")
            .withEntityId("r_hist")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .seasonEntityId("season_hist")
            .build();

    activeRace.setHistoryRecordId("hist_rec_batch");
    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    // Save initial history record
    com.antigravity.service.DatabaseService.getInstance()
        .saveRaceHistory(databaseContext, activeRace);

    // Setup season in db
    com.antigravity.repository.SqliteRepository<com.antigravity.models.Season> seasonRepo =
        new com.antigravity.repository.SqliteRepository<>(
            databaseContext, "seasons", com.antigravity.models.Season.class);
    com.antigravity.models.SeasonRaceRecord.SeasonDriverResult sdr =
        new com.antigravity.models.SeasonRaceRecord.SeasonDriverResult(
            "d1", "Alice", 1, 10.0, 0.0, 10.0);
    com.antigravity.models.SeasonRaceRecord srr =
        new com.antigravity.models.SeasonRaceRecord(
            "r_hist",
            "History Race",
            System.currentTimeMillis(),
            true,
            java.util.Collections.singletonList(sdr),
            "hist_rec_batch");
    com.antigravity.models.Season season =
        new com.antigravity.models.Season(
            "Season Hist", 0, java.util.Collections.singletonList(srr), "season_hist", null);
    seasonRepo.save(season);

    java.util.ArrayList<Map<String, Object>> updates = new java.util.ArrayList<>();
    Map<String, Object> u1 = new HashMap<>();
    u1.put("heatNumber", 1);
    u1.put("laneIndex", 0);
    u1.put("userLaps", 4.5);
    updates.add(u1);
    when(ctx.bodyAsClass(java.util.List.class)).thenReturn(updates);

    handler.updateBatchUserLaps(ctx);
    verify(ctx).status(200);

    // Verify DB history updated
    com.antigravity.models.RaceHistoryRecord histRec =
        com.antigravity.service.DatabaseService.getInstance()
            .getRaceHistoryById(databaseContext, "hist_rec_batch", true);
    org.junit.Assert.assertNotNull(histRec);
    org.junit.Assert.assertEquals(
        4.5, histRec.getHeats().get(0).getDrivers().get(0).getUserLaps(), 0.001);

    // Verify season updated in DB
    com.antigravity.models.Season updatedSeason = seasonRepo.findByEntityId("season_hist");
    org.junit.Assert.assertNotNull(updatedSeason);
    org.junit.Assert.assertEquals(1, updatedSeason.getRaces().size());
    org.junit.Assert.assertEquals(
        "hist_rec_batch", updatedSeason.getRaces().get(0).getHistoryRecordId());
  }

  @Test
  public void testUpdateUserLaps_HistoryAltered_ResolvesSeasonIdWhenUnset() {
    when(ctx.json(any())).thenReturn(ctx);
    Driver d1 = new Driver("Bob", "B", "d_bob", "1");
    RaceParticipant p1 = new RaceParticipant(d1);
    p1.setRank(1);

    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData();
    dhd.setLane(0);
    dhd.setDriver(p1);
    dhd.addLap(3.0, false, true);
    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Collections.singletonList(dhd), false);

    Track track =
        new Track.Builder()
            .name("Track")
            .lanes(java.util.Collections.singletonList(new Lane("red", "black", 100)))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Single Hist Race")
            .withEntityId("r_single_hist")
            .build();

    // Built WITHOUT seasonEntityId
    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .heats(java.util.Collections.singletonList(heat))
            .isDemoMode(true)
            .historyRecordId("hist_rec_single")
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    // Save initial history
    com.antigravity.service.DatabaseService.getInstance()
        .saveRaceHistory(databaseContext, activeRace);

    // Setup season in DB that references this history record
    com.antigravity.repository.SqliteRepository<com.antigravity.models.Season> seasonRepo =
        new com.antigravity.repository.SqliteRepository<>(
            databaseContext, "seasons", com.antigravity.models.Season.class);
    com.antigravity.models.SeasonRaceRecord.SeasonDriverResult sdr =
        new com.antigravity.models.SeasonRaceRecord.SeasonDriverResult(
            "d_bob", "Bob", 1, 10.0, 0.0, 10.0);
    com.antigravity.models.SeasonRaceRecord srr =
        new com.antigravity.models.SeasonRaceRecord(
            "r_single_hist",
            "Single Hist Race",
            System.currentTimeMillis(),
            true,
            java.util.Collections.singletonList(sdr),
            "hist_rec_single");
    com.antigravity.models.Season season =
        new com.antigravity.models.Season(
            "Season Single", 0, java.util.Collections.singletonList(srr), "season_single_1", null);
    seasonRepo.save(season);

    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 6.2);

    handler.updateUserLaps(ctx, pathParams, body);
    verify(ctx).status(200);

    // Verify season was dynamically resolved and updated
    com.antigravity.models.Season updatedSeason = seasonRepo.findByEntityId("season_single_1");
    org.junit.Assert.assertNotNull(updatedSeason);
    org.junit.Assert.assertEquals(1, updatedSeason.getRaces().size());
    org.junit.Assert.assertEquals(
        "hist_rec_single", updatedSeason.getRaces().get(0).getHistoryRecordId());
    org.junit.Assert.assertEquals("season_single_1", activeRace.getSeasonEntityId());
  }
}
