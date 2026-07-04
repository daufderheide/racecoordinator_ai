package com.antigravity.race;

import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.NotStarted;
import com.antigravity.race.states.Starting;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceStartHealthTest {

  private com.antigravity.race.Race race;
  private ProtocolDelegate mockProtocols;

  @Before
  public void setUp() throws Exception {
    ArduinoConfig arduinoConfig = new ArduinoConfig();
    arduinoConfig.commPort = "DEMO";
    List<ArduinoConfig> configs = Collections.singletonList(arduinoConfig);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track realTrack =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(configs)
            .entityId("track1")
            .id(new ObjectId())
            .build();

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

    race =
        new com.antigravity.race.Race.Builder()
            .model(realRaceModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(false)
            .build();

    mockProtocols = mock(ProtocolDelegate.class);
    injectProtocols(race, mockProtocols);
  }

  private void injectProtocols(com.antigravity.race.Race race, ProtocolDelegate protocols)
      throws Exception {
    race.injectProtocols(protocols);
  }

  @Test
  public void testStartRaceBlockedWhenUnhealthy() {
    // Given the protocol is unhealthy
    when(mockProtocols.isHealthy()).thenReturn(false);
    assertTrue(race.getState() instanceof NotStarted);

    // When we try to start the race
    race.startRace();

    // Then the state should still be NotStarted
    assertTrue(race.getState() instanceof NotStarted);
    // And startTimer should NOT have been called on protocols (happens in Starting state)
    verify(mockProtocols, never()).startTimer();
  }

  @Test
  public void testStartRaceAllowedWhenHealthy() {
    // Given the protocol is healthy
    when(mockProtocols.isHealthy()).thenReturn(true);
    assertTrue(race.getState() instanceof NotStarted);

    // When we try to start the race
    race.startRace();

    // Then the state should change to Starting
    assertTrue(race.getState() instanceof Starting);
  }
}
