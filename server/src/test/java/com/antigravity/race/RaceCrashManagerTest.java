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

    assertEquals(0.5, dhd.getAutoCalculatedLaps(), 0.001);
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
}
