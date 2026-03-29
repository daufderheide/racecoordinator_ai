package com.antigravity.race;

import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

import com.antigravity.models.HeatRotationType;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;

public class RaceEventListenerTest {

  private Race race;

  @Before
  public void setUp() throws Exception {
    List<ArduinoConfig> mockConfig = java.util.Collections.singletonList(mock(ArduinoConfig.class));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));

    Track track = new Track("Test Track", lanes, mockConfig, "track1", new ObjectId());

    com.antigravity.models.HeatScoring heatScoring = mock(com.antigravity.models.HeatScoring.class);
    when(heatScoring.getHeatRanking()).thenReturn(com.antigravity.models.HeatScoring.HeatRanking.LAP_COUNT);
    when(heatScoring.getHeatRankingTiebreaker())
        .thenReturn(com.antigravity.models.HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);
    when(heatScoring.getFinishMethod()).thenReturn(com.antigravity.models.HeatScoring.FinishMethod.Timed);
    when(heatScoring.getFinishValue()).thenReturn(100L);

    com.antigravity.models.OverallScoring overallScoring = mock(com.antigravity.models.OverallScoring.class);
    when(overallScoring.getRankingMethod())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRanking.LAP_COUNT);
    when(overallScoring.getTiebreaker())
        .thenReturn(com.antigravity.models.OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatRotationType(HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId("race1")
        .withId(new ObjectId())
        .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(new RaceParticipant(
        new com.antigravity.models.Driver("Test Driver", "D1", "driver1", new ObjectId()),
        "participant1"));

    race = new Race(raceModel, drivers, track, true);
  }

  @Test
  public void shouldTriggerListenerOnLap() {
    final boolean[] called = { false };

    race.addEventListener(new RaceEventListener() {
      @Override
      public void onLapCompleted(int lane, double lapTime) {
        called[0] = true;
      }

      @Override
      public void onRaceStateChanged(String oldState, String newState) {
        // ignore
      }
    });

    race.onLap(1, 1.23, 0);

    assertTrue(called[0]);
  }
}