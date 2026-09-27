package com.antigravity.handlers;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.models.RacePredictionRecord;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class HistoryPredictionTaskHandlerTest {

  private DatabaseContext mockDbCtx;
  private Javalin mockJavalin;
  private HistoryPredictionTaskHandler handler;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    java.io.File tempFile =
        new java.io.File(tmpDir, "history_pred_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    mockDbCtx =
        new DatabaseContext("testdb", null, tempFile.toPath().toString() + java.io.File.separator);
    mockJavalin = mock(Javalin.class);
    handler = new HistoryPredictionTaskHandler(mockDbCtx, mockJavalin);
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);
  }

  @Test
  public void testRouteRegistration() {
    verify(mockJavalin).get(eq("/api/history/races"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/races/{id}"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/races/{id}/export"), any(), eq(Role.VIEWER));
    verify(mockJavalin).post(eq("/api/history/races/{id}/load"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin).post(eq("/api/history/races/{id}/lap-sections"), any(), eq(Role.DIRECTOR));
    verify(mockJavalin)
        .put(
            eq(
                "/api/history/races/{id}/heats/{heatNumber}/drivers/{lane}/laps/{lapIndex}/record-status"),
            any(),
            eq(Role.DIRECTOR));
    verify(mockJavalin).get(eq("/api/history/stats"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/history/drivers/{driverId}/stats"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/predictions/races/{id}"), any(), eq(Role.VIEWER));
    verify(mockJavalin).get(eq("/api/predictions/evaluations/{id}"), any(), eq(Role.VIEWER));
  }

  @Test
  public void testIsStalePredictionRecord_NullRecordIsStale() {
    boolean stale = handler.isStalePredictionRecord(mockDbCtx, null, null, false);
    assertTrue("Null record should be stale", stale);
  }

  @Test
  public void testIsStalePredictionRecord_ValidStandingsNotStale() {
    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();

    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(1000);
    RacePredictionRecord.DriverProjection dp2 =
        new RacePredictionRecord.DriverProjection("d_2", "Driver 2", 2, 98.0, 0.0, 0.4, 0.8);
    dp2.setTotalSimulations(1000);
    standings.add(dp1);
    standings.add(dp2);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    boolean stale = handler.isStalePredictionRecord(mockDbCtx, record, null, false);
    assertFalse("Valid standings should not be stale", stale);
  }

  @Test
  public void testGetPredictionEvaluationRecord_ActiveRaceNotOverReturns404() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("current");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    com.antigravity.race.Race mockActiveRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race mockRaceModel =
        new com.antigravity.models.Race.Builder().withEntityId("race_123").build();
    when(mockActiveRace.getRaceModel()).thenReturn(mockRaceModel);
    when(mockActiveRace.getState()).thenReturn(new com.antigravity.race.states.Racing());

    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockActiveRace);

    handler.getPredictionEvaluationRecord(mockCtx);

    verify(mockCtx).header("Cache-Control", "no-cache, no-store, must-revalidate");
    verify(mockCtx).status(404);
  }

  @Test
  public void testGetRaceHistoryList_Success() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.queryParam("scope")).thenReturn("demo");
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.getRaceHistoryList(mockCtx);
    verify(mockCtx).json(any());
  }

  @Test
  public void testGetRaceHistoryById_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("non_existent_history_id");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.getRaceHistoryById(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testExportRaceHistoryCsv_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("non_existent_history_id");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.exportRaceHistoryCsv(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testGetGlobalStatistics_Success() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.queryParam("raceId")).thenReturn("race_abc");
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.getGlobalStatistics(mockCtx);
    verify(mockCtx).json(any());
  }

  @Test
  public void testGetDriverStatistics_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("driverId")).thenReturn("unknown_driver");
    when(mockCtx.queryParam("raceId")).thenReturn("race_xyz");
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.getDriverStatistics(mockCtx);
    verify(mockCtx).json(any());
  }

  @Test
  public void testGetRacePredictionRecord_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("missing_race_prediction");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);

    handler.getRacePredictionRecord(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testIsStalePredictionRecord_VariousConditions() {
    // Missing simulations in projection
    RacePredictionRecord record = new RacePredictionRecord();
    RacePredictionRecord.PredictionSnapshot preRace = new RacePredictionRecord.PredictionSnapshot();
    List<RacePredictionRecord.DriverProjection> standings = new ArrayList<>();
    RacePredictionRecord.DriverProjection dp1 =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", 1, 100.0, 0.0, 0.6, 0.9);
    dp1.setTotalSimulations(0); // 0 simulations -> stale
    standings.add(dp1);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    assertTrue(handler.isStalePredictionRecord(mockDbCtx, record, null, false));

    // Empty lane driver in standings -> stale
    standings.clear();
    RacePredictionRecord.DriverProjection dpEmpty =
        new RacePredictionRecord.DriverProjection(
            "EMPTY_LANE", "Empty Lane", 1, 100.0, 0.0, 0.6, 0.9);
    dpEmpty.setTotalSimulations(1000);
    standings.add(dpEmpty);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    assertTrue(handler.isStalePredictionRecord(mockDbCtx, record, null, false));

    // Fallback rank -1 -> stale
    standings.clear();
    RacePredictionRecord.DriverProjection dpFallback =
        new RacePredictionRecord.DriverProjection("d_1", "Driver 1", -1, 100.0, 0.0, 0.6, 0.9);
    dpFallback.setTotalSimulations(1000);
    standings.add(dpFallback);
    preRace.setProjectedStandings(standings);
    record.setPreRace(preRace);

    assertTrue(handler.isStalePredictionRecord(mockDbCtx, record, null, false));
  }

  @Test
  public void testIsDriverTrackStatsUpdated_NullConditions() {
    assertFalse(handler.isDriverTrackStatsUpdated(null, null, null, false));
    assertFalse(handler.isDriverTrackStatsUpdated(mockDbCtx, null, null, false));

    com.antigravity.race.Race mockActiveRace = mock(com.antigravity.race.Race.class);
    when(mockActiveRace.getRaceModel()).thenReturn(null);
    assertFalse(handler.isDriverTrackStatsUpdated(mockDbCtx, null, mockActiveRace, false));
  }

  @Test
  public void testUpdateHistoryLapRecordStatus_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("missing_hist_id");
    when(mockCtx.pathParam("heatNumber")).thenReturn("1");
    when(mockCtx.pathParam("lane")).thenReturn("0");
    when(mockCtx.pathParam("lapIndex")).thenReturn("0");
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("countTowardsRecords", false);
    when(mockCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testUpdateHistoryLapRecordStatus_ValidationAndSuccess() {
    com.antigravity.models.RaceHistoryRecord history =
        new com.antigravity.models.RaceHistoryRecord();
    history.setId("hist_123");
    history.setOriginalEntityId("race_123");
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_123")
            .withName("Past Race")
            .build();
    history.setModel(raceModel);

    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData();
    dhd.setLane(0);
    dhd.addLap(2.5, false, true);
    dhd.addLap(6.0, false, true);

    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Collections.singletonList(dhd), false);
    history.setHeats(new java.util.ArrayList<>(java.util.Collections.singletonList(heat)));

    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, history);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_123");
    when(mockCtx.pathParam("heatNumber")).thenReturn("99"); // Heat not found
    when(mockCtx.pathParam("lane")).thenReturn("0");
    when(mockCtx.pathParam("lapIndex")).thenReturn("0");
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("countTowardsRecords", false);
    when(mockCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx).status(400);

    // Invalid lap index
    when(mockCtx.pathParam("heatNumber")).thenReturn("1");
    when(mockCtx.pathParam("lapIndex")).thenReturn("99");
    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx, org.mockito.Mockito.atLeastOnce()).status(400);

    // Valid lap index 0 (disallow fastest lap)
    when(mockCtx.pathParam("lapIndex")).thenReturn("0");
    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx).status(200);

    com.antigravity.models.RaceHistoryRecord updated =
        com.antigravity.service.DatabaseService.getInstance()
            .getRaceHistoryById(mockDbCtx, "hist_123", false);
    org.junit.Assert.assertNotNull(updated);
    org.junit.Assert.assertFalse(
        updated.getHeats().get(0).getDrivers().get(0).getLaps().get(0).isCountTowardsRecords());
    org.junit.Assert.assertEquals(
        6.0, updated.getHeats().get(0).getDrivers().get(0).getBestLapTime(), 0.001);
  }

  @Test
  public void testUpdateHistoryLapRecordStatus_FallbackDemoScope() {
    com.antigravity.models.RaceHistoryRecord demoHistory =
        new com.antigravity.models.RaceHistoryRecord();
    demoHistory.setId("hist_demo_404");
    demoHistory.setDemo(true);
    demoHistory.setOriginalEntityId("race_demo_1");
    demoHistory.setModel(
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_demo_1")
            .withName("Demo")
            .build());
    demoHistory.setTrack(
        new com.antigravity.models.Track.Builder()
            .name("Demo Track")
            .lanes(new java.util.ArrayList<>())
            .build());
    demoHistory.setDrivers(new java.util.ArrayList<>());
    demoHistory.setStatistics(new com.antigravity.race.RaceStatistics());

    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData();
    dhd.setLane(0);
    dhd.addLap(3.5, false, true);

    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Collections.singletonList(dhd), false);
    demoHistory.setHeats(new java.util.ArrayList<>(java.util.Collections.singletonList(heat)));

    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, demoHistory);

    // Request does not have demo param (defaults to PRODUCTION)
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_demo_404");
    when(mockCtx.pathParam("heatNumber")).thenReturn("1");
    when(mockCtx.pathParam("lane")).thenReturn("0");
    when(mockCtx.pathParam("lapIndex")).thenReturn("0");
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("countTowardsRecords", false);
    when(mockCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx).status(200);

    com.antigravity.models.RaceHistoryRecord updated =
        com.antigravity.service.DatabaseService.getInstance()
            .getRaceHistoryById(mockDbCtx, "hist_demo_404", true);
    org.junit.Assert.assertNotNull(updated);
    org.junit.Assert.assertFalse(
        updated.getHeats().get(0).getDrivers().get(0).getLaps().get(0).isCountTowardsRecords());

    // Also test getRaceHistoryById fallback
    Context mockGetCtx = mock(Context.class);
    when(mockGetCtx.pathParam("id")).thenReturn("hist_demo_404");
    handler.getRaceHistoryById(mockGetCtx);
    verify(mockGetCtx).json(any(com.antigravity.models.RaceHistoryRecord.class));
  }

  @Test
  public void testUpdateHistoryLapRecordStatus_MultipleDriversWithZeroLane() {
    com.antigravity.models.RaceHistoryRecord history =
        new com.antigravity.models.RaceHistoryRecord();
    history.setId("hist_multilane");
    history.setOriginalEntityId("race_multilane");
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_multilane")
            .withName("Multi Lane Race")
            .build();
    history.setModel(raceModel);

    // Driver 0 has 0 laps (sitout / empty lane)
    com.antigravity.race.DriverHeatData dhd0 = new com.antigravity.race.DriverHeatData();
    dhd0.setLane(0);

    // Driver 1 has 2 laps, but lane is also uninitialized (0)
    com.antigravity.race.DriverHeatData dhd1 = new com.antigravity.race.DriverHeatData();
    dhd1.setLane(0);
    dhd1.addLap(3.2, false, true);
    dhd1.addLap(3.8, false, true);

    // Driver 2 has 1 lap, lane uninitialized (0)
    com.antigravity.race.DriverHeatData dhd2 = new com.antigravity.race.DriverHeatData();
    dhd2.setLane(0);
    dhd2.addLap(4.0, false, true);

    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Arrays.asList(dhd0, dhd1, dhd2), false);
    history.setHeats(new java.util.ArrayList<>(java.util.Collections.singletonList(heat)));

    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, history);

    // Request to disallow lap 0 on lane 1 (Driver 1)
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_multilane");
    when(mockCtx.pathParam("heatNumber")).thenReturn("1");
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.pathParam("lapIndex")).thenReturn("0");
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("countTowardsRecords", false);
    when(mockCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.updateHistoryLapRecordStatus(mockCtx);
    verify(mockCtx).status(200);

    com.antigravity.models.RaceHistoryRecord updated =
        com.antigravity.service.DatabaseService.getInstance()
            .getRaceHistoryById(mockDbCtx, "hist_multilane", false);
    org.junit.Assert.assertNotNull(updated);
    // Driver 0 is untouched
    org.junit.Assert.assertTrue(updated.getHeats().get(0).getDrivers().get(0).getLaps().isEmpty());
    // Driver 1's lap 0 is now disallowed
    org.junit.Assert.assertFalse(
        updated.getHeats().get(0).getDrivers().get(1).getLaps().get(0).isCountTowardsRecords());
    // Driver 1's new best lap is 3.8
    org.junit.Assert.assertEquals(
        3.8, updated.getHeats().get(0).getDrivers().get(1).getBestLapTime(), 0.001);
  }

  @Test
  public void testLoadRaceHistory_ConflictWhenRaceRunning() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_123");
    when(mockCtx.status(409)).thenReturn(mockCtx);

    com.antigravity.race.Race mockActiveRace = mock(com.antigravity.race.Race.class);
    when(mockActiveRace.getState()).thenReturn(new com.antigravity.race.states.Racing());
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockActiveRace);

    handler.loadRaceHistory(mockCtx);
    verify(mockCtx).status(409);
  }

  @Test
  public void testLoadRaceHistory_NotFound() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("non_existent_history");
    when(mockCtx.status(404)).thenReturn(mockCtx);

    handler.loadRaceHistory(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testLoadRaceHistory_Success() {
    com.antigravity.models.RaceHistoryRecord history =
        new com.antigravity.models.RaceHistoryRecord();
    history.setId("hist_load_test");
    history.setOriginalEntityId("race_load_test");
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_load_test")
            .withName("Load Race")
            .build();
    history.setModel(raceModel);
    history.setTrack(com.antigravity.service.DatabaseService.getInstance().getFactoryTrack());
    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, history);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_load_test");
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);
    when(mockCtx.result(any(String.class))).thenReturn(mockCtx);

    handler.loadRaceHistory(mockCtx);
    verify(mockCtx).status(200);

    com.antigravity.race.Race loaded =
        com.antigravity.race.ClientSubscriptionManager.getInstance().getRace();
    org.junit.Assert.assertNotNull(loaded);
    org.junit.Assert.assertEquals("hist_load_test", loaded.getHistoryRecordId());
  }

  @Test
  public void testExportRaceHistoryCsv_Success() {
    com.antigravity.models.RaceHistoryRecord history =
        new com.antigravity.models.RaceHistoryRecord();
    history.setId("hist_export_test");
    history.setOriginalEntityId("race_export_test");
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_export_test")
            .withName("Export Race")
            .build();
    history.setModel(raceModel);
    history.setTrack(com.antigravity.service.DatabaseService.getInstance().getFactoryTrack());
    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, history);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_export_test");
    when(mockCtx.header(any(String.class), any(String.class))).thenReturn(mockCtx);
    when(mockCtx.contentType(any(String.class))).thenReturn(mockCtx);
    when(mockCtx.result(any(String.class))).thenReturn(mockCtx);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);

    handler.exportRaceHistoryCsv(mockCtx);
    verify(mockCtx).contentType("text/csv");
  }

  @Test
  public void testUpdateHistoryLapSections_EmptyUpdatesReturns400() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_updates");
    when(mockCtx.bodyAsClass(List.class)).thenReturn(new ArrayList<>());
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);
    when(mockCtx.result(any(String.class))).thenReturn(mockCtx);

    handler.updateHistoryLapSections(mockCtx);
    verify(mockCtx).status(400);
  }

  @Test
  public void testUpdateHistoryLapSections_NotFoundReturns404() {
    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_non_existent");
    List<java.util.Map<String, Object>> updates = new ArrayList<>();
    java.util.Map<String, Object> update = new java.util.HashMap<>();
    update.put("heatNumber", 1);
    updates.add(update);
    when(mockCtx.bodyAsClass(List.class)).thenReturn(updates);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);
    when(mockCtx.result(any(String.class))).thenReturn(mockCtx);

    handler.updateHistoryLapSections(mockCtx);
    verify(mockCtx).status(404);
  }

  @Test
  public void testUpdateHistoryLapSections_Success() {
    com.antigravity.models.RaceHistoryRecord history =
        new com.antigravity.models.RaceHistoryRecord();
    history.setId("hist_sections_test");
    history.setOriginalEntityId("race_sections_test");
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withEntityId("race_sections_test")
            .withName("Sections Race")
            .build();
    history.setModel(raceModel);
    history.setTrack(com.antigravity.service.DatabaseService.getInstance().getFactoryTrack());

    com.antigravity.race.RaceParticipant p =
        new com.antigravity.race.RaceParticipant(new com.antigravity.models.Driver("Dave", "D"));
    history.setDrivers(java.util.Collections.singletonList(p));

    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData();
    dhd.setLane(0);
    dhd.setDriver(p);
    dhd.addLap(3.5, false, true);

    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Collections.singletonList(dhd), false);
    history.setHeats(new java.util.ArrayList<>(java.util.Collections.singletonList(heat)));

    com.antigravity.service.DatabaseService.getInstance()
        .saveRawRaceHistoryRecord(mockDbCtx, history);

    Context mockCtx = mock(Context.class);
    when(mockCtx.pathParam("id")).thenReturn("hist_sections_test");
    List<java.util.Map<String, Object>> updates = new ArrayList<>();
    java.util.Map<String, Object> update = new java.util.HashMap<>();
    update.put("heatNumber", 1);
    update.put("lane", 0);
    update.put("userLaps", 0.75);
    updates.add(update);
    when(mockCtx.bodyAsClass(List.class)).thenReturn(updates);
    when(mockCtx.status(any(Integer.class))).thenReturn(mockCtx);
    when(mockCtx.result(any(String.class))).thenReturn(mockCtx);

    handler.updateHistoryLapSections(mockCtx);
    verify(mockCtx).status(200);

    com.antigravity.models.RaceHistoryRecord updated =
        com.antigravity.service.DatabaseService.getInstance()
            .getRaceHistoryById(mockDbCtx, "hist_sections_test", false);
    org.junit.Assert.assertNotNull(updated);
    org.junit.Assert.assertEquals(
        0.75, updated.getHeats().get(0).getDrivers().get(0).getUserLaps(), 0.001);
  }
}
