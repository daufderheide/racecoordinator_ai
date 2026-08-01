package com.antigravity.race.prediction;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.RacePredictionRecord.DriverProjection;
import com.antigravity.models.RacePredictionRecord.PredictionSnapshot;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;

public class PredictionEngineTest {

  private PredictionEngine engine;
  private List<RaceParticipant> participants;
  private List<Heat> heats;
  private Map<String, DriverTrackStats> statsMap;

  @Before
  public void setUp() {
    engine = new PredictionEngine(12345L);

    participants = new ArrayList<>();
    heats = new ArrayList<>();
    statsMap = new HashMap<>();

    Driver d1 = new Driver("Alice", "Alice", "d1", null);
    Driver d2 = new Driver("Bob", "Bob", "d2", null);

    RaceParticipant rp1 = new RaceParticipant(d1);
    RaceParticipant rp2 = new RaceParticipant(d2);

    participants.add(rp1);
    participants.add(rp2);

    DriverHeatData dhd1 = new DriverHeatData(rp1);
    dhd1.setLane(0);

    DriverHeatData dhd2 = new DriverHeatData(rp2);
    dhd2.setLane(1);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(dhd1);
    heatDrivers.add(dhd2);

    heats.add(new Heat(1, heatDrivers, false));

    DriverTrackStats stats1 = new DriverTrackStats();
    stats1.setDriverId("d1");
    stats1.setTrackId("t1");
    stats1.setOverallMedianLapTime(4.0);

    DriverTrackStats stats2 = new DriverTrackStats();
    stats2.setDriverId("d2");
    stats2.setTrackId("t1");
    stats2.setOverallMedianLapTime(4.5);

    statsMap.put("d1", stats1);
    statsMap.put("d2", stats2);
  }

  @Test
  public void testPreRacePredictionProbabilitiesSumToOne() {
    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(null, participants, heats, statsMap);

    assertNotNull(snapshot);
    assertEquals(2, snapshot.getProjectedStandings().size());

    double sumWin = 0.0;
    for (double winProb : snapshot.getWinProbabilities().values()) {
      sumWin += winProb;
    }
    assertEquals(1.0, sumWin, 0.05);

    assertTrue(snapshot.getWinProbabilities().get("d1") > snapshot.getWinProbabilities().get("d2"));
  }

  @Test
  public void testRealtimePredictionUpdate() {
    Map<String, com.antigravity.race.prediction.PredictionEngine.DriverHeatState> actualLapsSoFar =
        new HashMap<>();
    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d1State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 20.0;
    actualLapsSoFar.put("d1", d1State);

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d2State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d2State.totalLapsCompleted = 15.0;
    actualLapsSoFar.put("d2", d2State);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(null, participants, heats, statsMap, 0, actualLapsSoFar);

    assertNotNull(snapshot);
    assertTrue(snapshot.getWinProbabilities().get("d1") > snapshot.getWinProbabilities().get("d2"));
  }

  @Test
  public void testEvaluatePredictionAccuracy() {
    PredictionSnapshot preRaceSnapshot =
        engine.generatePreRacePrediction(null, participants, heats, statsMap);

    List<DriverProjection> actualStandings = new ArrayList<>();
    actualStandings.add(new DriverProjection("d1", "Alice", 1, 45.0, 180.0, 1.0, 1.0));
    actualStandings.add(new DriverProjection("d2", "Bob", 2, 40.0, 180.0, 0.0, 1.0));

    PredictionEvaluationRecord eval =
        engine.evaluatePredictionAccuracy("race_101", preRaceSnapshot, actualStandings);

    assertNotNull(eval);
    assertEquals("race_101", eval.getRaceId());
    assertTrue(eval.getBrierScore() >= 0.0);
    assertEquals(0.0, eval.getRankMae(), 0.001);
  }

  @Test
  public void testPreRacePredictionDeterministicSeeding() {
    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getEntityId()).thenReturn("race_seed_deterministic_123");

    PredictionSnapshot snapshot1 =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);
    PredictionSnapshot snapshot2 =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);
    PredictionSnapshot snapshot3 =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);

    assertNotNull(snapshot1);
    assertNotNull(snapshot2);
    assertNotNull(snapshot3);

    assertEquals(snapshot1.getWinProbabilities(), snapshot2.getWinProbabilities());
    assertEquals(snapshot2.getWinProbabilities(), snapshot3.getWinProbabilities());

    assertEquals(
        snapshot1.getProjectedStandings().get(0).getProjectedLaps(),
        snapshot2.getProjectedStandings().get(0).getProjectedLaps(),
        0.001);
  }

  @Test
  public void testUniqueProjectedRanksDense() {
    Driver d3 = new Driver("Charlie", "Charlie", "d3", null);
    Driver d4 = new Driver("Dave", "Dave", "d4", null);
    RaceParticipant rp3 = new RaceParticipant(d3);
    RaceParticipant rp4 = new RaceParticipant(d4);

    participants.add(rp3);
    participants.add(rp4);

    DriverHeatData dhd3 = new DriverHeatData(rp3);
    dhd3.setLane(2);
    DriverHeatData dhd4 = new DriverHeatData(rp4);
    dhd4.setLane(3);

    heats.get(0).getDrivers().add(dhd3);
    heats.get(0).getDrivers().add(dhd4);

    DriverTrackStats stats3 = new DriverTrackStats();
    stats3.setDriverId("d3");
    stats3.setTrackId("t1");
    stats3.setOverallMedianLapTime(4.2);
    statsMap.put("d3", stats3);

    DriverTrackStats stats4 = new DriverTrackStats();
    stats4.setDriverId("d4");
    stats4.setTrackId("t1");
    stats4.setOverallMedianLapTime(4.8);
    statsMap.put("d4", stats4);

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getEntityId()).thenReturn("race_dense_ranks");

    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);
    assertNotNull(snapshot);
    assertEquals(4, snapshot.getProjectedStandings().size());

    List<Integer> ranks = new ArrayList<>();
    for (DriverProjection dp : snapshot.getProjectedStandings()) {
      ranks.add(dp.getProjectedRank());
    }

    assertEquals(4, ranks.size());
    assertTrue(ranks.contains(1));
    assertTrue(ranks.contains(2));
    assertTrue(ranks.contains(3));
    assertTrue(ranks.contains(4));
  }

  @Test
  public void testEmptyLaneExclusionAndWinProbSum() {
    RaceParticipant emptyParticipant = new RaceParticipant(Driver.EMPTY_DRIVER);
    participants.add(emptyParticipant);

    DriverHeatData dhdEmpty = new DriverHeatData(emptyParticipant);
    dhdEmpty.setLane(2);
    heats.get(0).getDrivers().add(dhdEmpty);

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getEntityId()).thenReturn("race_empty_lane");

    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(raceModel, participants, heats, statsMap);
    assertNotNull(snapshot);

    assertEquals(2, snapshot.getProjectedStandings().size());

    double sumWin = 0.0;
    for (double winProb : snapshot.getWinProbabilities().values()) {
      sumWin += winProb;
    }
    assertEquals(1.0, sumWin, 0.05);
  }

  @Test
  public void testTeamParticipantPrediction() {
    com.antigravity.models.Team team =
        new com.antigravity.models.Team("The Racers", null, new ArrayList<>(), "team_1", null);
    RaceParticipant teamParticipant = new RaceParticipant(team);

    List<RaceParticipant> teamParticipants = new ArrayList<>();
    teamParticipants.add(teamParticipant);

    DriverHeatData dhdTeam = new DriverHeatData(teamParticipant);
    dhdTeam.setLane(0);
    Driver dActual = new Driver("Actual Driver", "Actual", "d1", null);
    dhdTeam.setActualDriver(dActual);

    List<DriverHeatData> teamHeatDrivers = new ArrayList<>();
    teamHeatDrivers.add(dhdTeam);

    List<Heat> teamHeats = new ArrayList<>();
    teamHeats.add(new Heat(1, teamHeatDrivers, false));

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    when(raceModel.getEntityId()).thenReturn("race_team_test");

    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(raceModel, teamParticipants, teamHeats, statsMap);
    assertNotNull(snapshot);
    assertEquals(1, snapshot.getProjectedStandings().size());
    assertEquals("team_1", snapshot.getProjectedStandings().get(0).getDriverId());
    assertEquals("The Racers", snapshot.getProjectedStandings().get(0).getDriverName());
  }

  @Test
  public void testEmpiricalPaceBlending_WithHistory() {
    Map<String, com.antigravity.race.prediction.PredictionEngine.DriverHeatState> actualLapsSoFar =
        new HashMap<>();

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d1State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 5.0;
    d1State.currentHeatElapsedSec = 20.0;
    d1State.currentHeatLapTimes = java.util.Arrays.asList(4.1, 4.2, 4.0, 4.15, 4.05);
    actualLapsSoFar.put("d1", d1State);

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d2State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    actualLapsSoFar.put("d2", d2State);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(null, participants, heats, statsMap, 0, actualLapsSoFar);

    assertNotNull(snapshot);
    assertTrue(snapshot.getProjectedStandings().size() > 0);
  }

  @Test
  public void testEmpiricalPaceBlending_NoHistory() {
    Map<String, com.antigravity.race.prediction.PredictionEngine.DriverHeatState> actualLapsSoFar =
        new HashMap<>();

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d3State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d3State.totalLapsCompleted = 3.0;
    d3State.currentHeatElapsedSec = 15.0;
    d3State.currentHeatLapTimes = java.util.Arrays.asList(3.9, 3.8, 3.95);
    actualLapsSoFar.put("d3", d3State);

    Driver d3 = new Driver("Eve", "Eve", "d3", null);
    RaceParticipant rp3 = new RaceParticipant(d3);
    List<RaceParticipant> newParticipants = new ArrayList<>(participants);
    newParticipants.add(rp3);

    DriverHeatData dhd3 = new DriverHeatData(rp3);
    dhd3.setLane(2);
    List<DriverHeatData> newHeatDrivers = new ArrayList<>(heats.get(0).getDrivers());
    newHeatDrivers.add(dhd3);
    List<Heat> newHeats = new ArrayList<>();
    newHeats.add(new Heat(1, newHeatDrivers, false));

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            null, newParticipants, newHeats, statsMap, 0, actualLapsSoFar);

    assertNotNull(snapshot);
    boolean d3Found = false;
    for (DriverProjection dp : snapshot.getProjectedStandings()) {
      if ("d3".equals(dp.getDriverId())) {
        d3Found = true;
        break;
      }
    }
    assertTrue(d3Found);
  }

  @Test
  public void testCurrentHeatElapsedSec() {
    Map<String, com.antigravity.race.prediction.PredictionEngine.DriverHeatState> actualLapsSoFar =
        new HashMap<>();

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d1State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 40.0;
    d1State.currentHeatElapsedSec = 179.0;
    actualLapsSoFar.put("d1", d1State);

    com.antigravity.race.prediction.PredictionEngine.DriverHeatState d2State =
        new com.antigravity.race.prediction.PredictionEngine.DriverHeatState();
    d2State.totalLapsCompleted = 30.0;
    d2State.currentHeatElapsedSec = 179.0;
    actualLapsSoFar.put("d2", d2State);

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    com.antigravity.models.HeatScoring scoring = mock(com.antigravity.models.HeatScoring.class);
    when(raceModel.getHeatScoring()).thenReturn(scoring);
    when(scoring.getFinishMethod())
        .thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Timed);
    when(scoring.getFinishValue()).thenReturn(180L);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            raceModel, participants, heats, statsMap, 0, actualLapsSoFar);

    assertNotNull(snapshot);

    double d1ProjLaps = 0;
    for (DriverProjection dp : snapshot.getProjectedStandings()) {
      if ("d1".equals(dp.getDriverId())) {
        d1ProjLaps = dp.getProjectedLaps();
      }
    }

    assertTrue(d1ProjLaps >= 40.0 && d1ProjLaps < 42.0);
  }

  @Test
  public void testFallbackLapTimeAveraging() {
    // Driver 1 has data
    DriverTrackStats d1Stats = new DriverTrackStats();
    d1Stats.setDriverId("d1");
    d1Stats.setOverallMedianLapTime(4.0); // 4.0s median
    statsMap.put("d1", d1Stats);

    // Driver 2 has no data
    // Driver 2 is already in participants since setup adds d1 and d2

    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(null, participants, heats, statsMap);

    assertNotNull(snapshot);
    // 3 minute heat / 4.0s = 45 laps per heat. 4 heats = 180 laps.
    // Driver 1 should get ~180 laps
    // Driver 2 should use fallback, which is average of all drivers with data = 4.0s
    // So Driver 2 should ALSO get ~180 laps!

    DriverProjection d1Proj =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d1"))
            .findFirst()
            .orElse(null);
    DriverProjection d2Proj =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d2"))
            .findFirst()
            .orElse(null);

    assertNotNull(d1Proj);
    assertNotNull(d2Proj);
    assertTrue(
        "d1 projected laps: " + d1Proj.getProjectedLaps(),
        Math.abs(d1Proj.getProjectedLaps() - 15.0) < 0.1);
    assertTrue(
        "d2 projected laps: " + d2Proj.getProjectedLaps(),
        Math.abs(d2Proj.getProjectedLaps() - 15.0) < 0.1);
  }

  @Test
  public void testColdStartNoData() {
    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(null, participants, heats, new HashMap<>());

    assertNotNull(snapshot);

    for (DriverProjection dp : snapshot.getProjectedStandings()) {
      assertEquals(-1.0, dp.getWinProbability(), 0.001);
      assertEquals(-1.0, dp.getProjectedLaps(), 0.001);
      assertEquals(-1, dp.getProjectedRank());
    }
  }

  @Test
  public void testColdStartWithOneLap() {
    Map<String, PredictionEngine.DriverHeatState> driverHeatStates = new HashMap<>();

    PredictionEngine.DriverHeatState state = new PredictionEngine.DriverHeatState();
    state.totalLapsCompleted = 0;
    state.currentHeatLapTimes = new ArrayList<>();
    state.currentHeatLapTimes.add(5.5); // One lap!
    state.currentHeatElapsedSec = 5.5;

    driverHeatStates.put("d1", state);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            null, participants, heats, new HashMap<>(), 0, driverHeatStates);

    assertNotNull(snapshot);

    for (DriverProjection dp : snapshot.getProjectedStandings()) {
      System.out.println(
          "Driver "
              + dp.getDriverId()
              + " winProb: "
              + dp.getWinProbability()
              + " laps: "
              + dp.getProjectedLaps());
    }
  }

  @Test
  public void testWinProbabilityCappedAt99() {
    Map<String, PredictionEngine.DriverHeatState> actualLapsSoFar = new HashMap<>();

    // Driver 1 is massively ahead, should win 100% of simulations
    PredictionEngine.DriverHeatState d1State = new PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 100.0;
    actualLapsSoFar.put("d1", d1State);

    PredictionEngine.DriverHeatState d2State = new PredictionEngine.DriverHeatState();
    d2State.totalLapsCompleted = 0.0;
    actualLapsSoFar.put("d2", d2State);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(null, participants, heats, statsMap, 0, actualLapsSoFar);

    assertNotNull(snapshot);
    // Because there is more than 1 participant, max win prob is capped at 0.99
    assertEquals(0.99, snapshot.getWinProbabilities().get("d1"), 0.001);
  }

  @Test
  public void testPendingLapTimeCreditedInTimedRace() {
    Map<String, PredictionEngine.DriverHeatState> actualLapsSoFar = new HashMap<>();

    // Both drivers have completed 10 laps in 100 seconds
    PredictionEngine.DriverHeatState d1State = new PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 10.0;
    d1State.currentHeatLapsCompleted = 10.0;
    d1State.currentHeatElapsedSec = 100.0;
    // But d1 has spent 4s on the current lap
    d1State.currentHeatPendingLapTime = 4.0;
    actualLapsSoFar.put("d1", d1State);

    PredictionEngine.DriverHeatState d2State = new PredictionEngine.DriverHeatState();
    d2State.totalLapsCompleted = 10.0;
    d2State.currentHeatLapsCompleted = 10.0;
    d2State.currentHeatElapsedSec = 100.0;
    // d2 has only spent 1s on the current lap
    d2State.currentHeatPendingLapTime = 1.0;
    actualLapsSoFar.put("d2", d2State);

    // Give them identical stats
    statsMap.get("d1").setOverallMedianLapTime(5.0);
    statsMap.get("d2").setOverallMedianLapTime(5.0);

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    com.antigravity.models.HeatScoring scoring = mock(com.antigravity.models.HeatScoring.class);
    when(raceModel.getHeatScoring()).thenReturn(scoring);
    when(scoring.getFinishMethod())
        .thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Timed);
    when(scoring.getFinishValue()).thenReturn(180L);

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            raceModel, participants, heats, statsMap, 0, actualLapsSoFar);

    // Driver 1 should get more simulated laps because they have a larger pending lap time credit
    double d1Laps =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d1"))
            .findFirst()
            .get()
            .getProjectedLaps();
    double d2Laps =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d2"))
            .findFirst()
            .get()
            .getProjectedLaps();

    assertTrue("Driver 1 should project more laps due to pending time", d1Laps > d2Laps);
    assertTrue(
        "Driver 1 should have a higher win probability",
        snapshot.getWinProbabilities().get("d1") > snapshot.getWinProbabilities().get("d2"));
  }

  @Test
  public void testPendingLapTimeCreditedInLapRace() {
    Map<String, PredictionEngine.DriverHeatState> actualLapsSoFar = new HashMap<>();

    PredictionEngine.DriverHeatState d1State = new PredictionEngine.DriverHeatState();
    d1State.totalLapsCompleted = 10.0;
    d1State.currentHeatLapsCompleted = 10.0;
    d1State.currentHeatElapsedSec = 100.0;
    d1State.currentHeatPendingLapTime = 4.0;
    actualLapsSoFar.put("d1", d1State);

    PredictionEngine.DriverHeatState d2State = new PredictionEngine.DriverHeatState();
    d2State.totalLapsCompleted = 10.0;
    d2State.currentHeatLapsCompleted = 10.0;
    d2State.currentHeatElapsedSec = 100.0;
    d2State.currentHeatPendingLapTime = 1.0;
    actualLapsSoFar.put("d2", d2State);

    statsMap.get("d1").setOverallMedianLapTime(5.0);
    statsMap.get("d2").setOverallMedianLapTime(5.0);

    com.antigravity.models.Race raceModel = mock(com.antigravity.models.Race.class);
    com.antigravity.models.HeatScoring scoring = mock(com.antigravity.models.HeatScoring.class);
    when(raceModel.getHeatScoring()).thenReturn(scoring);
    when(scoring.getFinishMethod()).thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Lap);
    when(scoring.getFinishValue()).thenReturn(20L); // Race to 20 laps

    PredictionSnapshot snapshot =
        engine.generateRealtimePrediction(
            raceModel, participants, heats, statsMap, 0, actualLapsSoFar);

    // In a Lap race, both drivers finish with exactly 20 laps
    double d1Laps =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d1"))
            .findFirst()
            .get()
            .getProjectedLaps();
    double d2Laps =
        snapshot.getProjectedStandings().stream()
            .filter(p -> p.getDriverId().equals("d2"))
            .findFirst()
            .get()
            .getProjectedLaps();

    assertEquals(20.0, d1Laps, 0.001);
    assertEquals(20.0, d2Laps, 0.001);

    // But Driver 1 finishes in less time, so they win
    assertTrue(
        "Driver 1 should win the lap race",
        snapshot.getWinProbabilities().get("d1") > snapshot.getWinProbabilities().get("d2"));
  }

  @Test
  public void testPredictionIncludesNewDriversNotYetRunInHeats() {
    List<RaceParticipant> updatedParticipants = new ArrayList<>(participants);
    for (int i = 3; i <= 22; i++) {
      Driver d = new Driver("Driver " + i, "D" + i, "d" + i, null);
      updatedParticipants.add(new RaceParticipant(d));
    }

    PredictionSnapshot snapshot =
        engine.generatePreRacePrediction(null, updatedParticipants, heats, statsMap);

    assertNotNull(snapshot);
    assertEquals(22, snapshot.getProjectedStandings().size());

    for (int i = 1; i <= 22; i++) {
      String id = "d" + i;
      assertTrue(
          "Win probabilities should include " + id, snapshot.getWinProbabilities().containsKey(id));
    }
  }
}
