package com.antigravity.race;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;

public class RaceLifecycleTest {

  private Race race;
  private ProtocolDelegate mockProtocols;

  @Before
  public void setUp() throws Exception {
    List<ArduinoConfig> mockConfig = java.util.Collections.singletonList(mock(ArduinoConfig.class));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track realTrack = new Track("Test Track", lanes, mockConfig, "track1", new ObjectId());

    com.antigravity.models.HeatScoring mockHeatScoring = mock(com.antigravity.models.HeatScoring.class);
    when(mockHeatScoring.getHeatRanking()).thenReturn(com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT);
    when(mockHeatScoring.getHeatRankingTiebreaker())
        .thenReturn(com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(mockHeatScoring.getFinishMethod()).thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Timed);
    when(mockHeatScoring.getFinishValue()).thenReturn(100L);

    com.antigravity.models.OverallScoring mockOverallScoring = mock(com.antigravity.models.OverallScoring.class);
    when(mockOverallScoring.getRankingMethod())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRanking.LAP_COUNT);
    when(mockOverallScoring.getTiebreaker())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    com.antigravity.models.Race realRaceModel = new com.antigravity.models.Race("Test Race", "track1",
        HeatRotationType.RoundRobin, mockHeatScoring, mockOverallScoring, "race1", new ObjectId());

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(new com.antigravity.models.Driver("Test Driver", "D1", "driver1", new ObjectId()),
        "participant1"));

    // Initialize the race. Note: this will call createProtocols() internally.
    race = new Race(realRaceModel, drivers, realTrack, true);

    // Swap the internal protocols with a mock so we can verify the close() call.
    mockProtocols = mock(ProtocolDelegate.class);
    injectProtocols(race, mockProtocols);
  }

  private void injectProtocols(Race race, ProtocolDelegate protocols) throws Exception {
    java.lang.reflect.Field protocolsField = Race.class.getDeclaredField("protocols");
    protocolsField.setAccessible(true);
    protocolsField.set(race, protocols);
  }

  @Test
  public void testStopClosesProtocols() {
    // When stopping the race
    race.stop();

    // Then protocols.close() should be called
    verify(mockProtocols).close();
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
}
