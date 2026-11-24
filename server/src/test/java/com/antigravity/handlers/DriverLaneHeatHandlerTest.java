package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import io.javalin.http.Context;
import java.io.File;
import java.nio.file.Path;
import java.util.Arrays;
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
    // two slotcars for the car swap tests (#1210)
    SqliteRepository<Car> cars = new SqliteRepository<>(databaseContext, "cars", Car.class);
    cars.insert(new Car.Builder().withName("Audi R8").withEntityId("c1").build());
    cars.insert(new Car.Builder().withName("Ford GT40").withEntityId("c2").build());
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
  public void testUpdateUserTime_DirectAndBatch() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.models.Driver d2 = new com.antigravity.models.Driver("Bob", "Bobby", "d2", "2");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Lane l2 = new com.antigravity.models.Lane("white", "black", 101);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(java.util.Arrays.asList(l1, l2))
            .build();
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race Time")
            .withEntityId("r_time")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2))
            .track(track)
            .isDemoMode(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(activeRace);

    com.antigravity.race.DriverHeatData dhd0 = activeRace.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(5.0, false, true);
    dhd0.addLap(6.0, false, true);

    // updateUserTime on current heat
    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    when(ctx.pathParamMap()).thenReturn(pathParams);
    HashMap<String, Object> body = new HashMap<>();
    body.put("userTime", 2.5);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    handler.updateUserTime(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(2.5, dhd0.getUserTime(), 0.001);
    org.junit.Assert.assertEquals(13.5, dhd0.getTotalTime(), 0.001);

    // updateHeatUserTime on heat 1, lane 1
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("1");
    HashMap<String, Object> heatBody = new HashMap<>();
    heatBody.put("userTime", -1.0);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(heatBody);
    handler.updateHeatUserTime(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(
        -1.0, activeRace.getHeats().get(0).getDrivers().get(1).getUserTime(), 0.001);

    // updateBatchUserTime
    java.util.ArrayList<Map<String, Object>> updates = new java.util.ArrayList<>();
    Map<String, Object> u1 = new HashMap<>();
    u1.put("heatNumber", 1);
    u1.put("laneIndex", 0);
    u1.put("userTime", 4.25);
    updates.add(u1);
    when(ctx.bodyAsClass(java.util.List.class)).thenReturn(updates);
    handler.updateBatchUserTime(ctx);
    verify(ctx, org.mockito.Mockito.atLeastOnce()).status(200);
    org.junit.Assert.assertEquals(4.25, dhd0.getUserTime(), 0.001);
    org.junit.Assert.assertEquals(15.25, dhd0.getTotalTime(), 0.001);
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

  @Test
  public void testChangeActualDriver_TeamRace_RequirePitStop_Enforcement() {
    Driver d1 = new Driver("Alice", "Ally", "d1", "1");
    Driver d2 = new Driver("Bob", "Bobby", "d2", "2");
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .save(d1);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .save(d2);

    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Lane l2 = new com.antigravity.models.Lane("white", "black", 101);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(java.util.Arrays.asList(l1, l2))
            .build();

    com.antigravity.models.TeamOptions teamOptions =
        new com.antigravity.models.TeamOptions(null, null, null, null, true);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Team Race Pit Stop")
            .withTeamOptions(teamOptions)
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2))
            .track(track)
            .isDemoMode(true)
            .build();
    activeRace.changeState(new com.antigravity.race.states.Racing());
    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    com.antigravity.race.DriverHeatData dhd0 = activeRace.getCurrentHeat().getDrivers().get(0);

    when(ctx.pathParam("lane")).thenReturn("0");
    HashMap<String, String> body = new HashMap<>();
    body.put("driverId", "d2");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    // 1. On main track, cannot refuel -> 403
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.Main);
    dhd0.setCanRefuel(false);
    handler.changeActualDriver(ctx);
    verify(ctx).status(403);
    verify(ctx).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");

    // 2. In pit row, but cannot refuel -> 403
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.PitRow);
    dhd0.setCanRefuel(false);
    handler.changeActualDriver(ctx);
    verify(ctx).status(403);
    verify(ctx).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");

    // 3. In pit row AND can refuel -> 200
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.PitRow);
    dhd0.setCanRefuel(true);
    handler.changeActualDriver(ctx);
    verify(ctx).status(200);

    // 4. In pit bay AND can refuel -> 200
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
    when(ctx.pathParam("lane")).thenReturn("0");
    body.put("driverId", "d1");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.PitBayBase);
    dhd0.setCanRefuel(true);
    handler.changeActualDriver(ctx);
    verify(ctx).status(200);
  }

  @Test
  public void testChangeHeatActualDriver_TeamRace_RequirePitStop_Enforcement() {
    Driver d1 = new Driver("Alice", "Ally", "d1", "1");
    Driver d2 = new Driver("Bob", "Bobby", "d2", "2");
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .save(d1);
    new com.antigravity.repository.SqliteRepository<>(databaseContext, "drivers", Driver.class)
        .save(d2);

    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Lane l2 = new com.antigravity.models.Lane("white", "black", 101);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(java.util.Arrays.asList(l1, l2))
            .build();

    com.antigravity.models.TeamOptions teamOptions =
        new com.antigravity.models.TeamOptions(null, null, null, null, true);
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Team Race Pit Stop Heat")
            .withTeamOptions(teamOptions)
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2))
            .track(track)
            .isDemoMode(true)
            .build();
    activeRace.changeState(new com.antigravity.race.states.Racing());
    ClientSubscriptionManager.getInstance().setRace(activeRace);
    ClientSubscriptionManager.getInstance().setDatabaseContext(databaseContext);

    com.antigravity.race.DriverHeatData dhd0 = activeRace.getCurrentHeat().getDrivers().get(0);

    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    HashMap<String, String> body = new HashMap<>();
    body.put("driverId", "d2");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);

    // 1. Not in pit -> 403
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.Main);
    dhd0.setCanRefuel(false);
    handler.changeHeatActualDriver(ctx);
    verify(ctx).status(403);
    verify(ctx).result("RD_ERR_DRIVER_CHANGE_NOT_IN_PIT");

    // 2. In pit and can refuel -> 200
    org.mockito.Mockito.reset(ctx);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
    when(ctx.pathParam("heatNumber")).thenReturn("1");
    when(ctx.pathParam("lane")).thenReturn("0");
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    dhd0.setCurrentLocation(com.antigravity.protocols.CarLocation.PitRow);
    dhd0.setCanRefuel(true);
    handler.changeHeatActualDriver(ctx);
    verify(ctx).status(200);
  }

  // ---- Quick car swap on race day (#1210) ----

  private final Driver ann = new Driver("Ann", "A", "d1", "1");
  private final Driver bob = new Driver("Bob", "B", "d2", "2");

  private Race startRace(RaceParticipant... participants) {
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "white", 100)))
            .build();
    com.antigravity.models.Race model = // fqn-collision
        new com.antigravity.models.Race.Builder() // fqn-collision
            .withName("Race")
            .withEntityId("r1")
            .build();
    Race race =
        new Race.Builder()
            .model(model)
            .drivers(Arrays.asList(participants))
            .track(track)
            .isDemoMode(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(race);
    return race;
  }

  private void swap(int lane, String carId) {
    when(ctx.pathParam("lane")).thenReturn(String.valueOf(lane));
    HashMap<String, String> body = new HashMap<>();
    body.put("carId", carId);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    handler.changeCar(ctx);
  }

  private int laneOf(Race race, RaceParticipant p) {
    for (int i = 0; i < race.getCurrentHeat().getDrivers().size(); i++) {
      if (race.getCurrentHeat().getDrivers().get(i).getDriver() == p) return i;
    }
    throw new AssertionError("not in the heat");
  }

  @Test
  public void returns404WithoutARace() {
    swap(0, "c1");
    verify(ctx).status(404);
  }

  @Test
  public void givesTheRacerAnotherCarBetweenHeats() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    int lane = laneOf(race, p1);

    swap(lane, "c2");

    verify(ctx).status(200);
    assertEquals("c2", p1.getCar().getEntityId());
    DriverHeatData heat = race.getCurrentHeat().getDrivers().get(lane);
    assertEquals("Ford GT40", heat.getCar().getName());
  }

  @Test
  public void anEmptyCarIdRemovesTheCar() {
    RaceParticipant p1 = new RaceParticipant(ann);
    p1.setCar(new Car.Builder().withName("Audi R8").withEntityId("c1").build());
    Race race = startRace(p1, new RaceParticipant(bob));
    swap(laneOf(race, p1), "");
    verify(ctx).status(200);
    assertNull(p1.getCar());
  }

  @Test
  public void refusesAnUnknownCar() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    swap(laneOf(race, p1), "nope");
    verify(ctx).status(404);
    verify(ctx).result("RD_ERR_CAR_NOT_FOUND");
  }

  @Test
  public void refusesABadLane() {
    startRace(new RaceParticipant(ann), new RaceParticipant(bob));
    swap(7, "c1");
    verify(ctx).status(400);
  }

  @Test
  public void keepsTheCarOfAHeatThatHasRun() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    int lane = laneOf(race, p1);
    swap(lane, "c1");
    race.setHasRacedInCurrentHeat(true);

    swap(lane, "c2");

    assertEquals("the next heats get the new car", "c2", p1.getCar().getEntityId());
    assertEquals(
        "the heat that ran keeps its car",
        "c1",
        race.getCurrentHeat().getDrivers().get(lane).getCar().getEntityId());
  }

  @Test
  public void changesTheCarOfTheTeamDriverOnTheLane() {
    Team team = new Team("Ferrari", null, Arrays.asList("d1", "d2"), "t1", "1");
    RaceParticipant tp = new RaceParticipant(team);
    tp.setTeamDrivers(Arrays.asList(ann, bob));
    tp.setCarPerDriver(true);
    Race race = startRace(tp, new RaceParticipant(bob));
    int lane = laneOf(race, tp);
    Driver onLane = race.getCurrentHeat().getDrivers().get(lane).getActualDriver();

    swap(lane, "c1");

    verify(ctx).status(200);
    assertEquals("c1", tp.carFor(onLane).getEntityId());
    assertNull("the shared car stays unset", tp.getCar());
  }

  // ---- Cars stay in their lanes, IROC (#1210) ----
  private Race startIrocRace(RaceParticipant... participants) {
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "white", 100)))
            .build();
    com.antigravity.models.Race model = // fqn-collision
        new com.antigravity.models.Race.Builder() // fqn-collision
            .withName("IROC")
            .withEntityId("r-iroc")
            .withCarsStayInLanes(true)
            .build();
    Race race =
        new Race.Builder()
            .model(model)
            .drivers(Arrays.asList(participants))
            .track(track)
            .isDemoMode(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(race);
    return race;
  }

  @Test
  public void inAnIrocRaceTheSwapPutsTheCarOnTheLane() {
    RaceParticipant p = new RaceParticipant(ann);
    p.setCar(new Car.Builder().withName("Own").withEntityId("own").build());
    Race race = startIrocRace(p, new RaceParticipant(bob));
    swap(1, "c2");
    verify(ctx).status(200);
    assertEquals("c2", race.getLaneCar(1).getEntityId());
    assertEquals("c2", race.getCurrentHeat().getDrivers().get(1).getCar().getEntityId());
    assertEquals("the racer's own car is untouched", "own", p.getCar().getEntityId());
  }

  @Test
  public void inAnIrocRaceAnEmptyLaneCanGetACar() {
    Race race = startIrocRace(new RaceParticipant(ann));
    int emptyLane =
        race.getCurrentHeat().getDrivers().get(0).getDriver().getDriver() == ann ? 1 : 0;
    swap(emptyLane, "c1");
    verify(ctx).status(200);
    assertEquals("c1", race.getLaneCar(emptyLane).getEntityId());
  }

  @Test
  public void inAnIrocRaceAnEmptyCarIdTakesTheCarOffTheLane() {
    Race race = startIrocRace(new RaceParticipant(ann), new RaceParticipant(bob));
    swap(0, "c1");
    swap(0, "");
    assertNull(race.getLaneCar(0));
    assertNull(race.getCurrentHeat().getDrivers().get(0).getCar());
  }
}
