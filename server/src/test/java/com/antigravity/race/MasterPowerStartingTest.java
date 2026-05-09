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
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class MasterPowerStartingTest {

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
    Track track = new Track("Track", lanes, new ArrayList<>(), "t1", null);

    race =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .track(track)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    // Use reflection to set the protocols field
    try {
      java.lang.reflect.Field field = com.antigravity.race.Race.class.getDeclaredField("protocols");
      field.setAccessible(true);
      field.set(race, protocols);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void testMasterPowerDuringNotStartedState() {
    // Initially it's NotStarted, flag is RED, power should be OFF
    assertFalse("Master power should be OFF during NotStarted state", race.isMainPower());
  }

  @Test
  public void testMasterPowerDuringStartingState() {
    // Explicitly transition to Starting state
    race.changeState(new Starting());

    // Verify power is OFF
    assertFalse("Master power should be OFF during Starting state", race.isMainPower());
  }

  @Test
  public void testMasterPowerDuringGreenFlag() {
    // When flag is GREEN, power should be ON
    race.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Master power should be ON for GREEN flag", race.isMainPower());
  }

  @Test
  public void testMasterPowerAfterWarmupEnds() {
    // Start with warmup (GREEN_YELLOW)
    race.updatePowerForFlag(RaceFlag.GREEN_YELLOW);
    assertTrue("Master power should be ON during warmup", race.isMainPower());

    // Verify it attempted to turn on lane power for all lanes
    for (int i = 0; i < race.getTrack().getLanes().size(); i++) {
      org.mockito.Mockito.verify(protocols).setLanePower(true, i);
    }

    // End warmup (RED)
    race.updatePowerForFlag(RaceFlag.RED);
    assertFalse("Master power should be OFF after warmup ends", race.isMainPower());
  }

  @Test
  public void testMasterPowerDuringPausedState() {
    // Start racing (GREEN)
    race.updatePowerForFlag(RaceFlag.GREEN);
    assertTrue("Master power should be ON during racing", race.isMainPower());

    // Pause race (YELLOW)
    race.updatePowerForFlag(RaceFlag.YELLOW);
    assertFalse("Master power should be OFF when paused (YELLOW flag)", race.isMainPower());
  }
}
