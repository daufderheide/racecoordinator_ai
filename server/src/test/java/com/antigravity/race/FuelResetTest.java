package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Common;

public class FuelResetTest {

  private Race race;
  private AnalogFuelOptions fuelOptions;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    fuelOptions = new AnalogFuelOptions(
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

    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        10L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Fuel Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, fuelOptions, "race1", new ObjectId());

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
    track = new Track("Test Track", lanes, mock(ArduinoConfig.class), "track1", new ObjectId());

    race = new Race(raceModel, participants, track, true);
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
      assertEquals("Fuel for " + name + " should be reset to 100.0", 100.0, p.getFuelLevel(), 0.001);
    }
  }
}
