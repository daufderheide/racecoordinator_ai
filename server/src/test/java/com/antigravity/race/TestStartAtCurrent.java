package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class TestStartAtCurrent {
  private com.antigravity.race.Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;
  private HeatExecutionManager executionManager;

  @Before
  public void setUp() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    OverallScoring overallScoring =
        new OverallScoring(
            0,
            OverallScoring.OverallRanking.LAP_COUNT,
            OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .withId("1")
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", "1"), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", "1"), "p2"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
            .entityId("track1")
            .id("1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .demoConfig(
                com.antigravity.proto.DemoConfig.newBuilder()
                    .setMinReactionTimeMs(3600000)
                    .setMaxReactionTimeMs(3600000)
                    .setMinLapTimeMs(3600000)
                    .setMaxLapTimeMs(3600000)
                    .build())
            .build();
    executionManager = race.getHeatExecutionManager();
    executionManager.initialize(track.getLanes().size());
  }

  @Test
  public void testStartAtCurrent_CarryOverTime() {
    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withStartAtCurrent(true)
            .withStartBehindSensor(true)
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .demoConfig(
                com.antigravity.proto.DemoConfig.newBuilder()
                    .setMinReactionTimeMs(3600000)
                    .setMaxReactionTimeMs(3600000)
                    .setMinLapTimeMs(3600000)
                    .setMaxLapTimeMs(3600000)
                    .build())
            .build();

    // In round-robin with 2 lanes, 2 drivers, we get 2 heats
    assertTrue(race.getHeats().size() >= 2);

    // Simulate Heat 0 (First Heat)
    race.setCurrentHeat(race.getHeats().get(0));
    race.prepareHeat();
    race.changeState(new com.antigravity.race.states.Racing());
    executionManager = race.getHeatExecutionManager();

    // Driver 1 is on Lane 0
    DriverHeatData dhdHeat0_L0 = race.getCurrentHeat().getDrivers().get(0);
    String driverId = dhdHeat0_L0.getDriver().getStableId();

    // Reaction time
    executionManager.onLap(0, 1.0, 1, false, false, false);

    // Drive for 4.5 seconds (accumulate timeSinceLastLap)
    executionManager.processTicker(4.5f);
    assertEquals(4.5, executionManager.getTimeSinceLastLap()[0], 0.001);

    // End heat 0
    race.changeState(new HeatOver());
    assertEquals("carryOverTime should be saved", 4.5, dhdHeat0_L0.getCarryOverTime(), 0.001);

    // Simulate Heat 1 (Second Heat)
    race.setCurrentHeat(race.getHeats().get(1));
    race.prepareHeat();
    race.changeState(new com.antigravity.race.states.Racing());
    executionManager = race.getHeatExecutionManager();

    // Find the same driver in Heat 1
    int driverLaneInHeat1 = -1;
    DriverHeatData dhdHeat1_L = null;
    for (int i = 0; i < race.getCurrentHeat().getDrivers().size(); i++) {
      DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(i);
      if (dhd != null
          && dhd.getDriver() != null
          && dhd.getDriver().getStableId().equals(driverId)) {
        driverLaneInHeat1 = i;
        dhdHeat1_L = dhd;
        break;
      }
    }
    assertTrue("Driver should be found in heat 1", driverLaneInHeat1 != -1);

    assertEquals(
        "pendingLapTime should be loaded from carryOverTime",
        4.5,
        dhdHeat1_L.getPendingLapTime(),
        0.001);
    assertEquals(
        "timeSinceLastLap should be loaded",
        4.5,
        executionManager.getTimeSinceLastLap()[driverLaneInHeat1],
        0.001);

    // Complete first lap in heat 1 in 1.5 seconds.
    // Reaction time logic should be bypassed (returns false for
    // isFirstHeatForDriver).
    executionManager.onLap(driverLaneInHeat1, 1.5, 1, false, false, false);

    assertEquals(1, dhdHeat1_L.getLapCount());
    // Lap time should be 4.5 + 1.5 = 6.0
    assertEquals(6.0, dhdHeat1_L.getLaps().get(0).getLapTime(), 0.001);
  }
}
