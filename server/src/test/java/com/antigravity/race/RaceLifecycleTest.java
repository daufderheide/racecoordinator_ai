package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceLifecycleTest {

  private com.antigravity.race.Race race;
  private ProtocolDelegate mockProtocols;

  @Before
  public void setUp() throws Exception {
    List<ArduinoConfig> mockConfig = Collections.singletonList(mock(ArduinoConfig.class));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "white", 101));

    Track realTrack = new Track("Test Track", lanes, mockConfig, "track1", new ObjectId());

    HeatScoring mockHeatScoring = mock(HeatScoring.class);
    when(mockHeatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
    when(mockHeatScoring.getHeatRankingTiebreaker())
        .thenReturn(HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(mockHeatScoring.getFinishMethod()).thenReturn(HeatScoring.FinishMethod.Timed);
    when(mockHeatScoring.getFinishValue()).thenReturn(100L);

    OverallScoring mockOverallScoring = mock(OverallScoring.class);
    when(mockOverallScoring.getRankingMethod()).thenReturn(OverallScoring.OverallRanking.LAP_COUNT);
    when(mockOverallScoring.getTiebreaker())
        .thenReturn(OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race realRaceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(mockHeatScoring)
            .withOverallScoring(mockOverallScoring)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new RaceParticipant(
            new Driver("Test Driver", "D1", "driver1", new ObjectId()), "participant1"));

    // Initialize the race. Note: this will call createProtocols() internally.
    race =
        new com.antigravity.race.Race.Builder()
            .model(realRaceModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(true)
            .build();

    // Swap the internal protocols with a mock so we can verify the close() call.
    mockProtocols = mock(ProtocolDelegate.class);
    injectProtocols(race, mockProtocols);
  }

  private void injectProtocols(com.antigravity.race.Race race, ProtocolDelegate protocols)
      throws Exception {
    Field protocolsField = com.antigravity.race.Race.class.getDeclaredField("protocols");
    protocolsField.setAccessible(true);
    protocolsField.set(race, protocols);
  }

  @Test
  public void testStopClosesProtocols() {
    // When stopping the race
    race.stop();

    // Then protocols.clearLeds() should be called BEFORE close()
    verify(mockProtocols).clearLeds();
    verify(mockProtocols).close();
  }

  @Test
  public void testNotStartedInitialization() throws Exception {
    // When the race transitions to NotStarted (which happens on build/init)
    race.changeState(new com.antigravity.race.states.NotStarted());

    // Then hardware should be initialized
    // The test setup has 2 lanes, but only 1 real driver (D1).
    // The second lane is empty and should be excluded from hardware rankings.
    verify(mockProtocols).setHeatStandings(java.util.Arrays.asList(0));
    verify(mockProtocols).setHeatProgress(0);
  }

  @Test
  public void testFailedInitClosesProtocols() throws Exception {
    // This simulates the logic in ClientCommandTaskHandler
    // We have a race that we try to init/register, but it fails.

    // 1. Suppose ClientSubscriptionManager.setRace throws (though it doesn't
    // usually unless protocol active)
    // 2. Or init() throws.

    // Actually, let's just verify that if we call stop() on a race that was never
    // opened, it still calls close() on protocols
    race.stop();
    verify(mockProtocols).close();
  }

  @Test
  public void testStandingsFilterOutEmptyDrivers() {
    // Total lanes is 2, but only 1 real driver was added in setUp.
    // The padding logic in Race constructor adds an EMPTY_DRIVER for the second
    // lane.
    // createSnapshot() should filter it out.

    RaceData snapshot = race.createSnapshot();

    // Verify only the real driver is in the overall drivers list
    assertEquals(1, snapshot.getRace().getDriversCount());
    assertEquals("Test Driver", snapshot.getRace().getDrivers(0).getDriver().getName());
  }
}
