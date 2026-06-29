package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Common;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class FuelResetTest {

  private com.antigravity.race.Race race;
  private AnalogFuelOptions fuelOptions;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    fuelOptions =
        new AnalogFuelOptions(
            true, // enabled
            true, // resetFuelAtHeatStart
            false, // endHeatOnOutOfFuel
            100.0, // capacity
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0, // startLevel
            20.0, // refuelRate
            1.0, // pitStopDelay
            6.0 // referenceTime
            );

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);

    Race raceModel =
        new Race.Builder()
            .withName("Fuel Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withMinLapTime(0.0)
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    participants = new ArrayList<>();

    // Individual Driver
    Driver d1 = new Driver("Driver 1", "D1", "d1", new ObjectId());
    participants.add(new RaceParticipant(d1, "p1"));

    // Team
    List<String> teamDriverIds = new ArrayList<>();
    teamDriverIds.add("d2");
    Team team = new Team("The Team", "avatar_url", teamDriverIds, "team1", new ObjectId());
    RaceParticipant teamParticipant = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(new Driver("Driver 2", "D2", "d2", new ObjectId()));
    teamParticipant.setTeamDrivers(teamDrivers);
    participants.add(teamParticipant);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
            .entityId("track1")
            .id(new ObjectId())
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testFuelResetOnAdvanceToNextHeat() {
    // Initial state: Heat 1
    assertEquals(1, race.getCurrentHeat().getHeatNumber());

    // Simulate fuel usage in Heat 1
    for (DriverHeatData driverData : race.getCurrentHeat().getDrivers()) {
      driverData.getDriver().setFuelLevel(50.0);
    }

    // Advance to Heat 2
    Common.advanceToNextHeat(race);

    assertEquals(2, race.getCurrentHeat().getHeatNumber());

    // Heat 2 should have reset fuel levels to 100.0
    for (DriverHeatData driverData : race.getCurrentHeat().getDrivers()) {
      RaceParticipant p = driverData.getDriver();
      String name = p.isTeamParticipant() ? p.getTeam().getName() : p.getDriver().getName();
      assertEquals(
          "Fuel for " + name + " should be reset to 100.0", 100.0, p.getFuelLevel(), 0.001);
    }
  }
}
