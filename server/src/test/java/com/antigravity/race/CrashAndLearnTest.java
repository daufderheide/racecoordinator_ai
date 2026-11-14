package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.CrashAndLearnOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceFlag;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class CrashAndLearnTest {

  private Race raceModel;
  private Track track;
  private com.antigravity.race.Race race;
  private CrashAndLearnOptions cnlOptions;

  @Before
  public void setUp() {
    cnlOptions =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withAutomatedCrashTime(5.0)
            .withMaxCrashes(3)
            .withPauseHeatOnCrash(true)
            .withAllowMultipleCrashesPerLap(true)
            .withResetCrashesEachHeat(true)
            .withResetDqEachHeat(true)
            .withHeatCrashLapPenalty(0.5)
            .withHeatTimePenalty(1.0)
            .withDqHeatScorePercentage(50.0)
            .build();

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    OverallScoring overallScoring =
        new OverallScoring(
            0,
            OverallScoring.OverallRanking.LAP_COUNT,
            OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    raceModel =
        new Race.Builder()
            .withName("CNL Test Race")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(cnlOptions)
            .build();

    List<Lane> lanes = Arrays.asList(new Lane("Red", "black", 100), new Lane("Blue", "black", 100));

    track =
        new Track.Builder()
            .entityId("track-1")
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .build();

    List<RaceParticipant> participants =
        Arrays.asList(
            new RaceParticipant(new Driver("Alice", "The Ace", "d1", "1"), "p1"),
            new RaceParticipant(new Driver("Bob", "The Bullet", "d2", "2"), "p2"));

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    race.getHeatExecutionManager().initialize(lanes.size());
  }

  @Test
  public void testAutomatedCrashDetectionAndPause() {
    race.prepareHeat();
    race.changeState(new Racing());

    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    assertEquals(0, dhd.getCrashes());

    // Tick 4.0 seconds - no crash yet
    boolean crashDetected = race.getHeatExecutionManager().checkAutomatedCrashes(4.0f);
    assertFalse(crashDetected);
    assertEquals(0, dhd.getCrashes());

    // Tick another 1.5 seconds (total 5.5s > 5.0s autoCrashTime)
    crashDetected = race.getHeatExecutionManager().checkAutomatedCrashes(1.5f);
    assertTrue(crashDetected);
    assertEquals(1, dhd.getCrashes());
    assertEquals(0.5, dhd.getPenaltyLaps(), 0.001);
    assertEquals(1.0, dhd.getPenaltyTime(), 0.001);
  }

  @Test
  public void testMultipleCrashesPerLapAllowed() {
    race.prepareHeat();
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

    // 1st crash interval
    race.getHeatExecutionManager().checkAutomatedCrashes(5.1f);
    assertEquals(1, dhd.getCrashes());

    // 2nd crash interval on the same lap (without completing a lap)
    race.getHeatExecutionManager().checkAutomatedCrashes(5.1f);
    assertEquals(2, dhd.getCrashes());

    // Complete a lap - should reset crash timer and crashesThisLap
    race.getHeatExecutionManager().onLap(0, 4.0, 1, false, true, false);
    race.getHeatExecutionManager().checkAutomatedCrashes(4.0f);
    assertEquals(2, dhd.getCrashes()); // no new crash yet
  }

  @Test
  public void testCallbuttonCreditsCrashAndPauses() {
    race.prepareHeat();
    race.changeState(new Racing());

    DriverHeatData d0 = race.getCurrentHeat().getDrivers().get(0);
    DriverHeatData d1 = race.getCurrentHeat().getDrivers().get(1);

    assertEquals(0, d0.getCrashes());
    assertEquals(0, d1.getCrashes());

    // Lane 0 hits callbutton while Racing
    race.onCallbutton(0, 0);

    // Should pause race and credit lane 0 with crash
    assertTrue(race.getState() instanceof Paused);
    assertEquals(1, d0.getCrashes());
    assertEquals(0, d1.getCrashes());

    // While paused, Lane 1 hits callbutton
    race.onCallbutton(1, 0);

    // Should NOT credit lane 1 with crash because heat was already paused
    assertEquals(0, d1.getCrashes());
  }

  @Test
  public void testDisqualificationThresholdAndLapRejection() {
    race.prepareHeat();
    race.changeState(new Racing());

    DriverHeatData d0 = race.getCurrentHeat().getDrivers().get(0);

    // Record crashes 1, 2, 3 (max is 3, so not DQ yet)
    race.recordCrash(0);
    race.recordCrash(0);
    race.recordCrash(0);
    assertEquals(3, d0.getCrashes());
    assertFalse(d0.isDisqualified());

    // 4th crash: should trigger DQ
    race.recordCrash(0);
    assertEquals(4, d0.getCrashes());
    assertTrue(d0.isDisqualified());
    assertEquals(RaceFlag.BLACK, race.getState().getLaneFlagType(race, 0));

    // Power should be turned off for DQ driver
    assertFalse(race.isLanePower(0));

    // Try to record a lap on lane 0 while DQ
    boolean counted = race.getHeatExecutionManager().onLap(0, 8.0, 1, false, true, false);
    assertFalse("Lap must be rejected when driver is DQ", counted);
    assertEquals(0, d0.getLapCount());
  }

  @Test
  public void testManualAdjustmentRemovesDq() {
    race.prepareHeat();
    DriverHeatData d0 = race.getCurrentHeat().getDrivers().get(0);

    // Give driver 4 crashes -> DQ
    race.updateDriverCrashes(race.getCurrentHeat(), d0, 4);
    assertTrue(d0.isDisqualified());
    assertEquals(2.0, d0.getPenaltyLaps(), 0.001); // 4 * 0.5
    assertEquals(4.0, d0.getPenaltyTime(), 0.001); // 4 * 1.0

    // Remove a crash (now 3 crashes <= max 3) -> should remove DQ
    race.updateDriverCrashes(race.getCurrentHeat(), d0, 3);
    assertFalse(d0.isDisqualified());
    assertEquals(1.5, d0.getPenaltyLaps(), 0.001); // 3 * 0.5
    assertEquals(3.0, d0.getPenaltyTime(), 0.001); // 3 * 1.0
  }

  @Test
  public void testResetDqAndCrashesEachHeat() {
    race.prepareHeat();
    DriverHeatData d0 = race.getCurrentHeat().getDrivers().get(0);
    race.updateDriverCrashes(race.getCurrentHeat(), d0, 4);
    assertTrue(d0.isDisqualified());

    // Prepare next heat
    race.prepareHeat();

    DriverHeatData nextD0 = race.getCurrentHeat().getDrivers().get(0);
    assertFalse("DQ should be reset at heat start", nextD0.isDisqualified());
    assertEquals("Crashes should be reset to 0", 0, nextD0.getCrashes());
  }

  @Test
  public void testDqInNoneAutoSegmentsRace_CalculatesAutoSegmentsImmediately() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.NoneAutoSegments);

    Race model =
        new Race.Builder()
            .withName("CNL AutoSegments Race")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(
                new CrashAndLearnOptions.Builder()
                    .withEnabled(true)
                    .withMaxCrashes(2)
                    .withDqHeatScorePercentage(100.0)
                    .build())
            .build();

    com.antigravity.race.Race autoRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(
                Arrays.asList(
                    new RaceParticipant(new Driver("Alice", "The Ace", "d1", "1"), "p1"),
                    new RaceParticipant(new Driver("Bob", "The Bullet", "d2", "2"), "p2")))
            .track(track)
            .isDemoMode(true)
            .build();
    autoRace.getHeatExecutionManager().initialize(2);
    autoRace.prepareHeat();
    autoRace.changeState(new Racing());

    HeatExecutionManager exec = autoRace.getHeatExecutionManager();

    // Driver 0: reaction 1.0s, lap 1: 5.0s, lap 2: 5.0s -> median = 5.0s
    exec.onLap(0, 1.0, 1, false, true, false);
    exec.onLap(0, 4.0, 1, false, true, false);
    exec.onLap(0, 5.0, 1, false, true, false);

    // Driver 1: reaction 1.0s, lap 1: 8.0s -> median = 8.0s
    exec.onLap(1, 1.0, 1, false, true, false);
    exec.onLap(1, 7.0, 1, false, true, false);

    // 2.0s elapsed on Driver 0's 3rd lap
    exec.getTimeSinceLastLap()[0] = 2.0;

    DriverHeatData d0 = autoRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(0.0, d0.getAutoCalculatedLaps(), 0.001);

    // Record 2 crashes (max crashes is 2, so 3rd triggers DQ)
    autoRace.recordCrash(0);
    autoRace.recordCrash(0);
    assertFalse(d0.isDisqualified());
    assertEquals(0.0, d0.getAutoCalculatedLaps(), 0.001);

    // 3rd crash triggers DQ
    autoRace.recordCrash(0);
    assertTrue(d0.isDisqualified());
    // Auto-segments should be calculated immediately as 2.0s / 5.0s = 0.4
    assertEquals(
        "DQ driver should immediately calculate 2.0 / 5.0 = 0.4 auto segments",
        0.4,
        d0.getAutoCalculatedLaps(),
        0.001);

    // Simulate 30 seconds passing during the rest of the heat
    exec.processTicker(30.0f);
    // Auto-segments must remain 0.4, not 0.99
    assertEquals(
        "Time passing after DQ must not inflate auto-segments to 0.99",
        0.4,
        d0.getAutoCalculatedLaps(),
        0.001);

    // End the heat (applyEndHeatAutoSegments)
    exec.applyEndHeatAutoSegments();
    assertEquals(
        "End of heat must preserve the 0.4 auto-segments calculated at DQ",
        0.4,
        d0.getAutoCalculatedLaps(),
        0.001);
  }

  @Test
  public void testDqInSingleLapAutoSegmentsRace_UsesDoNotAllowFinishApproach() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.SingleLapAutoSegments);

    Race model =
        new Race.Builder()
            .withName("CNL SingleLapAutoSegments Race")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(
                new CrashAndLearnOptions.Builder()
                    .withEnabled(true)
                    .withMaxCrashes(1)
                    .withDqHeatScorePercentage(100.0)
                    .build())
            .build();

    com.antigravity.race.Race autoRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(
                Arrays.asList(
                    new RaceParticipant(new Driver("Alice", "The Ace", "d1", "1"), "p1"),
                    new RaceParticipant(new Driver("Bob", "The Bullet", "d2", "2"), "p2")))
            .track(track)
            .isDemoMode(true)
            .build();
    autoRace.getHeatExecutionManager().initialize(2);
    autoRace.prepareHeat();
    autoRace.changeState(new Racing());

    HeatExecutionManager exec = autoRace.getHeatExecutionManager();

    // Driver 0: median = 10.0s
    exec.onLap(0, 1.0, 1, false, true, false);
    exec.onLap(0, 9.0, 1, false, true, false);
    exec.onLap(0, 10.0, 1, false, true, false);

    // 3.5s elapsed on current lap
    exec.getTimeSinceLastLap()[0] = 3.5;

    DriverHeatData d0 = autoRace.getCurrentHeat().getDrivers().get(0);

    // 1 crash (max is 1, so 2nd crash DQs)
    autoRace.recordCrash(0);
    assertFalse(d0.isDisqualified());

    // 2nd crash: triggers DQ
    autoRace.recordCrash(0);
    assertTrue(d0.isDisqualified());
    // Auto-segments should be calculated immediately using "do not allow finish" approach (3.5 /
    // 10.0 = 0.35)
    assertEquals(
        "Should calculate 3.5 / 10.0 = 0.35 auto segments on DQ",
        0.35,
        d0.getAutoCalculatedLaps(),
        0.001);
  }

  @Test
  public void testDqReversed_ResetsAutoCalculatedLaps() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.NoneAutoSegments);

    Race model =
        new Race.Builder()
            .withName("CNL Reset DQ AutoSegments Race")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(
                new CrashAndLearnOptions.Builder().withEnabled(true).withMaxCrashes(2).build())
            .build();

    com.antigravity.race.Race autoRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(
                Arrays.asList(
                    new RaceParticipant(new Driver("Alice", "The Ace", "d1", "1"), "p1"),
                    new RaceParticipant(new Driver("Bob", "The Bullet", "d2", "2"), "p2")))
            .track(track)
            .isDemoMode(true)
            .build();
    autoRace.getHeatExecutionManager().initialize(2);
    autoRace.prepareHeat();
    autoRace.changeState(new Racing());

    HeatExecutionManager exec = autoRace.getHeatExecutionManager();

    // Driver 0: median = 6.0s
    exec.onLap(0, 1.0, 1, false, true, false);
    exec.onLap(0, 5.0, 1, false, true, false);
    exec.onLap(0, 6.0, 1, false, true, false);

    exec.getTimeSinceLastLap()[0] = 3.0;

    DriverHeatData d0 = autoRace.getCurrentHeat().getDrivers().get(0);

    // Give 3 crashes -> DQ -> auto segments = 3.0 / 6.0 = 0.5
    autoRace.updateDriverCrashes(autoRace.getCurrentHeat(), d0, 3);
    assertTrue(d0.isDisqualified());
    assertEquals(0.5, d0.getAutoCalculatedLaps(), 0.001);
    assertTrue(d0.isFinished());
    assertTrue(exec.getFinishedLanes().contains(0));

    // Remove 1 crash -> 2 crashes (<= max 2) -> un-DQ
    autoRace.updateDriverCrashes(autoRace.getCurrentHeat(), d0, 2);
    assertFalse(d0.isDisqualified());
    assertEquals(0.0, d0.getAutoCalculatedLaps(), 0.001);
    assertFalse(d0.isFinished());
    assertFalse(exec.getFinishedLanes().contains(0));
  }
}
