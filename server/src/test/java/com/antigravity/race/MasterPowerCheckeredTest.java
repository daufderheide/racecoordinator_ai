package com.antigravity.race;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.ProtocolDelegate;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class MasterPowerCheckeredTest {

  private com.antigravity.race.Race race;
  private ProtocolDelegate protocols;

  @Before
  public void setUp() {
    protocols = mock(ProtocolDelegate.class);

    Race model =
        new Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Lap,
                    1L,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.Allow))
            .build();

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "white", 100));
    Track track =
        new Track.Builder()
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("t1")
            .id(null)
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .track(track)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    race.injectProtocols(protocols);
  }

  @Test
  public void testMasterPowerDuringCheckeredFlag_AllowFinish() {
    // In this test, AllowFinish is set to Allow in setUp()

    // Initially it's NotStarted, flag is RED, power is OFF
    race.updatePowerForFlag(RaceFlag.RED);
    assertFalse("Power should be OFF for RED flag", race.isMainPower());

    // When flag is GREEN, power should be ON
    race.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Power should be ON for GREEN flag", race.isMainPower());

    // When flag is CHECKERED, power should stay ON because AllowFinish is Allow
    race.updatePowerForFlag(RaceFlag.CHECKERED);
    assertTrue(
        "Power should be ON for CHECKERED flag when Allow Finish is enabled", race.isMainPower());
  }

  @Test
  public void testMasterPowerDuringCheckeredFlag_NoAllowFinish() {
    // Create a new race with AllowFinish.None
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Lap,
                    1L,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.None))
            .build();

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "white", 100));
    Track track =
        new Track.Builder()
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("t1")
            .id(null)
            .build();

    com.antigravity.race.Race noAllowRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .track(track)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    noAllowRace.injectProtocols(protocols);

    // When flag is GREEN, power should be ON
    noAllowRace.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Power should be ON for GREEN flag", noAllowRace.isMainPower());

    // When flag is CHECKERED, power should be OFF because AllowFinish is None
    noAllowRace.updatePowerForFlag(RaceFlag.CHECKERED);
    assertFalse(
        "Power should be OFF for CHECKERED flag when Allow Finish is disabled",
        noAllowRace.isMainPower());
  }

  @Test
  public void testMasterPowerDuringCheckeredFlag_Resume() throws Exception {
    // 1. Setup a race with 2 lanes and AllowFinish = Allow
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withHeatScoring(
                new HeatScoring(
                    HeatScoring.FinishMethod.Lap,
                    3L,
                    HeatScoring.HeatRanking.LAP_COUNT,
                    HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
                    HeatScoring.AllowFinish.Allow))
            .build();

    com.antigravity.models.Lane lane0 = new com.antigravity.models.Lane("red", "white", 100);
    com.antigravity.models.Lane lane1 = new com.antigravity.models.Lane("blue", "white", 100);
    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(lane0);
    lanes.add(lane1);
    Track track =
        new Track.Builder()
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("t1")
            .id(null)
            .build();

    com.antigravity.race.Race resumeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .track(track)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    resumeRace.injectProtocols(protocols);

    // 2. Simulate Lane 0 having finished
    resumeRace.getHeatExecutionManager().getFinishedLanes().add(0);

    // 3. Trigger CHECKERED flag (simulating resume from pause)
    resumeRace.updatePowerForFlag(RaceFlag.CHECKERED);

    // 4. Verify main power is ON
    assertTrue("Main power should be ON", resumeRace.isMainPower());

    // 5. Verify Lane 0 is OFF (already finished) and Lane 1 is ON (active)
    assertFalse("Lane 0 power should be OFF (finished)", resumeRace.isLanePower(0));
    assertTrue("Lane 1 power should be ON (active)", resumeRace.isLanePower(1));
  }
}
