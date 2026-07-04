package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceLaneSwapTest {

  private com.antigravity.race.Race race;
  private RaceParticipant p1;
  private RaceParticipant p2;

  @Before
  public void setUp() throws Exception {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "white", 100));

    Track realTrack =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id(new ObjectId())
            .build();

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            100L,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);
    OverallScoring overallScoring =
        new OverallScoring(
            0,
            OverallScoring.OverallRanking.LAP_COUNT,
            OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    Race realRaceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.SingleHeatSolo)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    Driver d1 = new Driver("Driver 1", "D1", "driver1", new ObjectId());
    p1 = new RaceParticipant(d1, "participant1");
    Driver d2 = new Driver("Driver 2", "D2", "driver2", new ObjectId());
    p2 = new RaceParticipant(d2, "participant2");

    drivers.add(p1);
    drivers.add(p2);

    race =
        new com.antigravity.race.Race.Builder()
            .model(realRaceModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testSuccessfulSwap() {
    // In SingleHeatSolo, only one driver is present in the heat, others are EMPTY
    assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());
    assertEquals(
        Driver.EMPTY_DRIVER.getObjectId(),
        race.getCurrentHeat().getDrivers().get(1).getDriver().getDriver().getObjectId());

    race.changeLane(0, 1);

    assertEquals(
        Driver.EMPTY_DRIVER.getObjectId(),
        race.getCurrentHeat().getDrivers().get(0).getDriver().getDriver().getObjectId());
    assertEquals(p1, race.getCurrentHeat().getDrivers().get(1).getDriver());
  }

  @Test
  public void testSwapRejectedIfNotSoloRotation() throws Exception {
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "white", 100));
    Track realTrack =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id(new ObjectId())
            .build();

    // Rebuild race with RoundRobin
    Race roundRobinModel =
        new Race.Builder()
            .withName("Test Race")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .build();

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(p1);
    drivers.add(p2);

    com.antigravity.race.Race rrRace =
        new com.antigravity.race.Race.Builder()
            .model(roundRobinModel)
            .drivers(drivers)
            .track(realTrack)
            .isDemoMode(true)
            .build();

    assertEquals(p1, rrRace.getCurrentHeat().getDrivers().get(0).getDriver());

    rrRace.changeLane(0, 1);

    // Should NOT have swapped
    assertEquals(p1, rrRace.getCurrentHeat().getDrivers().get(0).getDriver());
  }

  @Test
  public void testSingleHeatSwapAllowedInNotStarted() {
    assertEquals(p1, race.getDrivers().get(0));
    assertEquals(p2, race.getDrivers().get(1));

    // Rebuild as SingleHeat
    Race singleHeatModel =
        new Race.Builder()
            .withName("Single Heat Race")
            .withHeatRotationType(HeatRotationType.SingleHeat)
            .build();

    com.antigravity.race.Race shRace =
        new com.antigravity.race.Race.Builder()
            .model(singleHeatModel)
            .drivers(race.getDrivers())
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    assertEquals(p1, shRace.getCurrentHeat().getDrivers().get(0).getDriver());
    assertEquals(p2, shRace.getCurrentHeat().getDrivers().get(1).getDriver());

    shRace.changeLane(0, 1);

    assertEquals(p2, shRace.getCurrentHeat().getDrivers().get(0).getDriver());
    assertEquals(p1, shRace.getCurrentHeat().getDrivers().get(1).getDriver());
  }

  @Test
  public void testSingleHeatSwapRejectedAfterStart() {
    // Rebuild as SingleHeat
    Race singleHeatModel =
        new Race.Builder()
            .withName("Single Heat Race")
            .withHeatRotationType(HeatRotationType.SingleHeat)
            .build();

    com.antigravity.race.Race shRace =
        new com.antigravity.race.Race.Builder()
            .model(singleHeatModel)
            .drivers(race.getDrivers())
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    // Start the race (transitions to Starting)
    shRace.changeState(new com.antigravity.race.states.Starting());

    shRace.changeLane(0, 1);

    // Should NOT have swapped
    assertEquals(p1, shRace.getCurrentHeat().getDrivers().get(0).getDriver());
    assertEquals(p2, shRace.getCurrentHeat().getDrivers().get(1).getDriver());
  }

  @Test
  public void testSwapRejectedWithInvalidIndices() {
    assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());

    race.changeLane(0, 5); // 5 is invalid for 2 lanes
    assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());

    race.changeLane(-1, 0);
    assertEquals(p1, race.getCurrentHeat().getDrivers().get(0).getDriver());
  }

  @Test
  public void testTeammateChangeAfterSwap() {
    // Rebuild as SingleHeat
    Race singleHeatModel =
        new Race.Builder()
            .withName("Single Heat Race")
            .withHeatRotationType(HeatRotationType.SingleHeat)
            .build();

    com.antigravity.race.Race shRace =
        new com.antigravity.race.Race.Builder()
            .model(singleHeatModel)
            .drivers(race.getDrivers())
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    // Initial state: Lane 0 has p1, Lane 1 has p2
    Driver d1 = p1.getDriver();
    Driver d2 = p2.getDriver();
    assertEquals(
        d1.getObjectId(),
        shRace.getCurrentHeat().getDrivers().get(0).getActualDriver().getObjectId());
    assertEquals(
        d2.getObjectId(),
        shRace.getCurrentHeat().getDrivers().get(1).getActualDriver().getObjectId());

    // Swap lanes
    shRace.changeLane(0, 1);

    // Now Lane 0 has p2, Lane 1 has p1
    assertEquals(
        d2.getObjectId(),
        shRace.getCurrentHeat().getDrivers().get(0).getActualDriver().getObjectId());
    assertEquals(
        d1.getObjectId(),
        shRace.getCurrentHeat().getDrivers().get(1).getActualDriver().getObjectId());

    // Change teammate for Lane 0 (which is now p2)
    Driver newDriver = new Driver("New Driver", "ND", "new_driver", new ObjectId());
    shRace.getCurrentHeat().getDrivers().get(0).setActualDriver(newDriver);

    assertEquals(
        newDriver.getObjectId(),
        shRace.getCurrentHeat().getDrivers().get(0).getActualDriver().getObjectId());
  }
}
