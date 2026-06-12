package com.antigravity.race;

import static org.mockito.Mockito.*;

import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceFlag;
import com.antigravity.proto.RaceState;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.NotStarted;
import java.util.ArrayList;
import java.util.Collections;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class WarmupBroadcastTest {

  private com.antigravity.race.Race race;
  private com.antigravity.models.Race raceModel;
  private ProtocolDelegate mockProtocols;

  @Before
  public void setUp() {
    raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Warmup Broadcast Test")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withAutoStartTime(1.0)
            .withAutoStartWarmupTime(0.5)
            .withAutoAdvanceTime(1.0)
            .withAutoAdvanceWarmupTime(0.5)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    Track mockTrack = mock(Track.class);
    when(mockTrack.getEntityId()).thenReturn("mockTrackId");
    when(mockTrack.getObjectId()).thenReturn(new org.bson.types.ObjectId().toString());
    when(mockTrack.getName()).thenReturn("Test Track");
    Lane mockLane = new Lane("red", "black", 100);
    when(mockTrack.getLanes()).thenReturn(Collections.singletonList(mockLane));

    mockProtocols = mock(ProtocolDelegate.class);

    // Build the race
    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(new ArrayList<>())
            .track(mockTrack)
            .isDemoMode(true)
            .build();

    race.injectProtocols(mockProtocols);
  }

  @Test
  public void testAutoStartWarmupBroadcast() throws Exception {
    NotStarted state = new NotStarted();
    state.enter(race);

    // Warmup is first 0.5s of 1.0s auto-start (elapsed <= 0.5)
    // The ticker in NotStarted will call broadcastFlag(GREEN_YELLOW) which calls
    // protocols.setRaceState
    verify(mockProtocols, timeout(1000).atLeastOnce())
        .setRaceState(eq(RaceState.NOT_STARTED), eq(RaceFlag.GREEN_YELLOW), anyDouble());

    // Now wait for warmup to end (elapsed > 0.5)
    long start = System.currentTimeMillis();
    while (RaceFlag.GREEN_YELLOW == state.getFlagType(race)
        && (System.currentTimeMillis() - start) < 3000) {
      Thread.sleep(100);
    }

    // When warmup ends, it should broadcast RED
    verify(mockProtocols, timeout(2000).atLeastOnce())
        .setRaceState(eq(RaceState.NOT_STARTED), eq(RaceFlag.RED), anyDouble());
  }

  @Test
  public void testAutoAdvanceWarmupBroadcast() throws Exception {
    HeatOver state = new HeatOver();
    state.enter(race);

    // Auto-advance is 1.0s, warmup is last 0.5s (remaining <= 0.5)
    // Initial flag should be RED (remaining = 1.0 > 0.5)

    // Wait for remaining to drop to <= 0.5
    long start = System.currentTimeMillis();
    while (race.getAutoAdvanceRemaining() > 0.5 && (System.currentTimeMillis() - start) < 3000) {
      Thread.sleep(100);
    }

    // Now it should be in warmup
    verify(mockProtocols, timeout(2000).atLeastOnce())
        .setRaceState(eq(RaceState.HEAT_OVER), eq(RaceFlag.GREEN_YELLOW), anyDouble());
  }
}
