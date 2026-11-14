package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
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

public class RaceCrashManagerTest {

  private Race raceModel;
  private Track track;
  private com.antigravity.race.Race race;
  private RaceCrashManager crashManager;

  @Before
  public void setUp() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withMaxCrashes(2)
            .withHeatCrashLapPenalty(0.25)
            .withHeatTimePenalty(0.5)
            .withDqHeatScorePercentage(75.0)
            .withResetCrashesEachHeat(false)
            .withResetDqEachHeat(false)
            .build();

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            60L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.NoneAutoSegments);

    raceModel =
        new Race.Builder()
            .withName("Crash Manager Test")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(cnl)
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
    race.getHeatExecutionManager().initialize(2);
    crashManager = new RaceCrashManager(race);
  }

  @Test
  public void testGetCrashAndLearnOptions_DefaultWhenNull() {
    Race bareModel =
        new Race.Builder()
            .withName("Bare Race")
            .withTrackEntityId("track-1")
            .withGroupOptions(new com.antigravity.models.GroupOptions())
            .build();
    com.antigravity.race.Race bareRace =
        new com.antigravity.race.Race.Builder()
            .model(bareModel)
            .drivers(Arrays.asList(new RaceParticipant(new Driver("A", "A", "a", "1"), "p1")))
            .track(track)
            .isDemoMode(true)
            .build();
    RaceCrashManager bareMgr = new RaceCrashManager(bareRace);
    assertNotNull(bareMgr.getCrashAndLearnOptions());
    assertFalse(bareMgr.isCnlEnabled());
  }

  @Test
  public void testRecordCrash_InvalidLaneIgnored() {
    race.prepareHeat();
    crashManager.recordCrash(-1);
    crashManager.recordCrash(99);
    DriverHeatData d0 = race.getCurrentHeat().getDrivers().get(0);
    assertEquals(0, d0.getCrashes());
  }

  @Test
  public void testCalculateDqAutoSegments_Success() {
    race.prepareHeat();
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(5.0, false, true);
    race.getHeatExecutionManager().getTimeSinceLastLap()[0] = 2.5;

    crashManager.calculateDqAutoSegments(dhd, 0);

    assertEquals(0.0, dhd.getAutoCalculatedLaps(), 0.001);
  }

  @Test
  public void testCalculateDqAutoSegments_LapLimitReached_Zero() {
    HeatScoring lapScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.NoneAutoSegments);

    Race lapModel =
        new Race.Builder()
            .withName("Lap Model")
            .withTrackEntityId("track-1")
            .withHeatScoring(lapScoring)
            .withOverallScoring(new OverallScoring())
            .withCrashAndLearnOptions(crashManager.getCrashAndLearnOptions())
            .build();

    com.antigravity.race.Race lapRace =
        new com.antigravity.race.Race.Builder()
            .model(lapModel)
            .drivers(Arrays.asList(new RaceParticipant(new Driver("A", "A", "a", "1"), "p1")))
            .track(track)
            .isDemoMode(true)
            .build();
    lapRace.getHeatExecutionManager().initialize(1);
    lapRace.prepareHeat();

    DriverHeatData dhd = lapRace.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(5.0, false, true);
    dhd.addLap(5.0, false, true);
    dhd.addLap(5.0, false, true); // reached limit 3
    lapRace.getHeatExecutionManager().getTimeSinceLastLap()[0] = 2.0;

    lapRace.getCrashManager().calculateDqAutoSegments(dhd, 0);
    assertEquals(0.0, dhd.getAutoCalculatedLaps(), 0.001);
  }

  @Test
  public void testRecordCrash_IncrementsCrashesAndTriggersDq() {
    race.prepareHeat();
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    assertFalse(dhd.isDisqualified());

    // maxCrashes is 2 in setUp. 1st crash:
    crashManager.recordCrash(0);
    assertEquals(1, dhd.getCrashes());
    assertEquals(0.25, dhd.getPenaltyLaps(), 0.001);
    assertEquals(0.5, dhd.getPenaltyTime(), 0.001);
    assertFalse(dhd.isDisqualified());

    // 2nd crash (equal to maxCrashes):
    crashManager.recordCrash(0);
    assertEquals(2, dhd.getCrashes());
    assertFalse(dhd.isDisqualified());

    // 3rd crash (exceeds maxCrashes): triggers DQ!
    crashManager.recordCrash(0);
    assertEquals(3, dhd.getCrashes());
    assertTrue(dhd.isDisqualified());
    assertTrue(dhd.isFinished());
    assertTrue(dhd.getDriver().isDisqualified());
    assertEquals(75.0, dhd.getDqScorePercentage(), 0.001);

    // 4th crash attempt while DQ: ignored by recordCrash
    crashManager.recordCrash(0);
    assertEquals(3, dhd.getCrashes());
  }

  @Test
  public void testUpdateDriverCrashes_NullSafe() {
    crashManager.updateDriverCrashes(race.getCurrentHeat(), null, 5);
    // Should not throw NPE
  }

  @Test
  public void testUpdateDriverCrashes_ReversesDq() {
    race.prepareHeat();
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

    // Set to 3 crashes -> DQ
    crashManager.updateDriverCrashes(race.getCurrentHeat(), dhd, 3);
    assertTrue(dhd.isDisqualified());
    assertTrue(dhd.isFinished());

    // Lower crashes to 1 -> DQ reversed!
    crashManager.updateDriverCrashes(race.getCurrentHeat(), dhd, 1);
    assertFalse(dhd.isDisqualified());
    assertFalse(dhd.isFinished());
    assertFalse(dhd.getDriver().isDisqualified());
    assertEquals(0.25, dhd.getPenaltyLaps(), 0.001);
    assertEquals(0.5, dhd.getPenaltyTime(), 0.001);
    assertEquals(100.0, dhd.getDqScorePercentage(), 0.001);
    assertEquals(0.0, dhd.getAutoCalculatedLaps(), 0.001);
  }

  @Test
  public void testInitializeHeatDrivers_ResetsDqAndCrashes() {
    CrashAndLearnOptions cnlReset =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withResetCrashesEachHeat(true)
            .withResetDqEachHeat(true)
            .withMaxCrashes(2)
            .build();

    Race resetModel =
        new Race.Builder()
            .withName("Reset Model")
            .withTrackEntityId("track-1")
            .withHeatScoring(raceModel.getHeatScoring())
            .withOverallScoring(new OverallScoring())
            .withCrashAndLearnOptions(cnlReset)
            .build();

    com.antigravity.race.Race resetRace =
        new com.antigravity.race.Race.Builder()
            .model(resetModel)
            .drivers(Arrays.asList(new RaceParticipant(new Driver("A", "A", "a", "1"), "p1")))
            .track(track)
            .isDemoMode(true)
            .build();
    resetRace.getHeatExecutionManager().initialize(1);
    resetRace.prepareHeat();

    RaceParticipant p = resetRace.getCurrentHeat().getDrivers().get(0).getDriver();
    p.setCrashes(5);
    p.setDisqualified(true);

    resetRace.getCrashManager().initializeHeatDrivers(resetRace.getCurrentHeat());

    DriverHeatData dhd = resetRace.getCurrentHeat().getDrivers().get(0);
    assertFalse(p.isDisqualified());
    assertEquals(0, p.getCrashes());
    assertFalse(dhd.isDisqualified());
    assertEquals(0, dhd.getCrashes());
  }

  @Test
  public void testResetCurrentHeat_RestoresParticipantState() {
    race.prepareHeat();
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    RaceParticipant p = dhd.getDriver();
    p.setCrashes(3);
    p.setDisqualified(true);

    crashManager.resetCurrentHeat(race.getCurrentHeat());

    assertEquals(3, dhd.getCrashes());
    assertTrue(dhd.isDisqualified());
    assertTrue(dhd.isFinished());
  }

  private com.antigravity.race.Race createTestRace(CrashAndLearnOptions cnl) {
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

    Race model =
        new Race.Builder()
            .withName("CNL Test Race")
            .withTrackEntityId("track-1")
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withCrashAndLearnOptions(cnl)
            .build();

    List<RaceParticipant> participants =
        Arrays.asList(
            new RaceParticipant(new Driver("Alice", "The Ace", "d1", "1"), "p1"),
            new RaceParticipant(new Driver("Bob", "The Bullet", "d2", "2"), "p2"));

    com.antigravity.race.Race r =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    r.getHeatExecutionManager().initialize(track.getLanes().size());
    return r;
  }

  @Test
  public void testAutomatedCrashDetectionAndPause() {
    CrashAndLearnOptions cnl =
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
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    cnlRace.changeState(new Racing());

    DriverHeatData dhd = cnlRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(0, dhd.getCrashes());

    // Tick 4.0 seconds - no crash yet
    boolean crashDetected = cnlRace.getHeatExecutionManager().checkAutomatedCrashes(4.0f);
    assertFalse(crashDetected);
    assertEquals(0, dhd.getCrashes());

    // Tick another 1.5 seconds (total 5.5s > 5.0s autoCrashTime)
    crashDetected = cnlRace.getHeatExecutionManager().checkAutomatedCrashes(1.5f);
    assertTrue(crashDetected);
    assertEquals(1, dhd.getCrashes());
    assertEquals(0.5, dhd.getPenaltyLaps(), 0.001);
    assertEquals(1.0, dhd.getPenaltyTime(), 0.001);
  }

  @Test
  public void testMultipleCrashesPerLapAllowed() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withAutomatedCrashTime(5.0)
            .withAllowMultipleCrashesPerLap(true)
            .build();
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    DriverHeatData dhd = cnlRace.getCurrentHeat().getDrivers().get(0);

    // 1st crash interval
    cnlRace.getHeatExecutionManager().checkAutomatedCrashes(5.1f);
    assertEquals(1, dhd.getCrashes());

    // 2nd crash interval on the same lap (without completing a lap)
    cnlRace.getHeatExecutionManager().checkAutomatedCrashes(5.1f);
    assertEquals(2, dhd.getCrashes());

    // Complete a lap - should reset crash timer and crashesThisLap
    cnlRace.getHeatExecutionManager().onLap(0, 4.0, 1, false, true, false);
    cnlRace.getHeatExecutionManager().checkAutomatedCrashes(4.0f);
    assertEquals(2, dhd.getCrashes()); // no new crash yet
  }

  @Test
  public void testCallbuttonCreditsCrashAndPauses() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder().withEnabled(true).withAutomatedCrashTime(5.0).build();
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    cnlRace.changeState(new Racing());

    DriverHeatData d0 = cnlRace.getCurrentHeat().getDrivers().get(0);
    DriverHeatData d1 = cnlRace.getCurrentHeat().getDrivers().get(1);

    assertEquals(0, d0.getCrashes());
    assertEquals(0, d1.getCrashes());

    // Lane 0 hits callbutton while Racing
    cnlRace.onCallbutton(0, 0);

    // Should pause race and credit lane 0 with crash
    assertTrue(cnlRace.getState() instanceof Paused);
    assertEquals(1, d0.getCrashes());
    assertEquals(0, d1.getCrashes());

    // While paused, Lane 1 hits callbutton
    cnlRace.onCallbutton(1, 0);

    // Should NOT credit lane 1 with crash because heat was already paused
    assertEquals(0, d1.getCrashes());
  }

  @Test
  public void testDisqualificationThresholdAndLapRejection() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder().withEnabled(true).withMaxCrashes(3).build();
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    cnlRace.changeState(new Racing());

    DriverHeatData d0 = cnlRace.getCurrentHeat().getDrivers().get(0);

    // Record crashes 1, 2, 3 (max is 3, so not DQ yet)
    cnlRace.recordCrash(0);
    cnlRace.recordCrash(0);
    cnlRace.recordCrash(0);
    assertEquals(3, d0.getCrashes());
    assertFalse(d0.isDisqualified());

    // 4th crash: should trigger DQ
    cnlRace.recordCrash(0);
    assertEquals(4, d0.getCrashes());
    assertTrue(d0.isDisqualified());
    assertEquals(RaceFlag.BLACK, cnlRace.getState().getLaneFlagType(cnlRace, 0));

    // Power should be turned off for DQ driver
    assertFalse(cnlRace.isLanePower(0));

    // Try to record a lap on lane 0 while DQ
    boolean counted = cnlRace.getHeatExecutionManager().onLap(0, 8.0, 1, false, true, false);
    assertFalse("Lap must be rejected when driver is DQ", counted);
    assertEquals(0, d0.getLapCount());
  }

  @Test
  public void testManualAdjustmentRemovesDq() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withMaxCrashes(3)
            .withHeatCrashLapPenalty(0.5)
            .withHeatTimePenalty(1.0)
            .build();
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    DriverHeatData d0 = cnlRace.getCurrentHeat().getDrivers().get(0);

    // Give driver 4 crashes -> DQ
    cnlRace.updateDriverCrashes(cnlRace.getCurrentHeat(), d0, 4);
    assertTrue(d0.isDisqualified());
    assertEquals(2.0, d0.getPenaltyLaps(), 0.001); // 4 * 0.5
    assertEquals(4.0, d0.getPenaltyTime(), 0.001); // 4 * 1.0

    // Remove a crash (now 3 crashes <= max 3) -> should remove DQ
    cnlRace.updateDriverCrashes(cnlRace.getCurrentHeat(), d0, 3);
    assertFalse(d0.isDisqualified());
    assertEquals(1.5, d0.getPenaltyLaps(), 0.001); // 3 * 0.5
    assertEquals(3.0, d0.getPenaltyTime(), 0.001); // 3 * 1.0
  }

  @Test
  public void testResetDqAndCrashesEachHeat() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withMaxCrashes(3)
            .withResetCrashesEachHeat(true)
            .withResetDqEachHeat(true)
            .build();
    com.antigravity.race.Race cnlRace = createTestRace(cnl);
    cnlRace.prepareHeat();
    DriverHeatData d0 = cnlRace.getCurrentHeat().getDrivers().get(0);
    cnlRace.updateDriverCrashes(cnlRace.getCurrentHeat(), d0, 4);
    assertTrue(d0.isDisqualified());

    // Prepare next heat
    cnlRace.prepareHeat();

    DriverHeatData nextD0 = cnlRace.getCurrentHeat().getDrivers().get(0);
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
    // In a CnL race with auto-segments, a DQ driver gets 0 auto segments
    assertEquals(
        "DQ driver should receive 0.0 auto segments", 0.0, d0.getAutoCalculatedLaps(), 0.001);

    // Simulate 30 seconds passing during the rest of the heat
    exec.processTicker(30.0f);
    // Auto-segments must remain 0.0, not 0.99
    assertEquals(
        "Time passing after DQ must not inflate auto-segments to 0.99",
        0.0,
        d0.getAutoCalculatedLaps(),
        0.001);

    // End the heat (applyEndHeatAutoSegments)
    exec.applyEndHeatAutoSegments();
    assertEquals(
        "End of heat must preserve 0.0 auto-segments for DQ driver",
        0.0,
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
    // Auto-segments should be 0.0 on DQ
    assertEquals(
        "Should assign 0.0 auto segments on DQ in SingleLapAutoSegments",
        0.0,
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

    // Give 3 crashes -> DQ -> auto segments = 0.0
    autoRace.updateDriverCrashes(autoRace.getCurrentHeat(), d0, 3);
    assertTrue(d0.isDisqualified());
    assertEquals(0.0, d0.getAutoCalculatedLaps(), 0.001);
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
