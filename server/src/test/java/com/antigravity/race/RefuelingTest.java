package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceData;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class RefuelingTest {

  private com.antigravity.race.Race race;
  private Racing racing;
  private AnalogFuelOptions fuelOptions;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    fuelOptions =
        new AnalogFuelOptions(
            true, // enabled
            false, // resetFuelAtStart
            false, // endHeatOnOutOfFuel
            100.0, // capacity
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0, // usageRate
            100.0, // startLevel
            20.0, // refuelRate (20 units per second)
            1.0, // pitStopDelay (1 second)
            6.0 // referenceTime
            );

    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            10L,
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
            .withFuelOptions(fuelOptions)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(mock(ArduinoConfig.class)))
            .entityId("track1")
            .id(new ObjectId())
            .build();

    race =
        spy(
            new com.antigravity.race.Race.Builder()
                .model(raceModel)
                .drivers(participants)
                .track(track)
                .isDemoMode(true)
                .build());
    race.getHeatExecutionManager().setRace(race);
    racing = new Racing();
    race.changeState(racing);

    // Ensure starting fuel is less than capacity for refueling tests
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(50.0);
  }

  @After
  public void tearDown() {
    if (racing != null) {
      racing.exit(race);
    }
  }

  @Test
  public void testRefuelingLogic() throws Exception {
    // 1. Enter pit with canRefuel = true
    CarData pitEntry = new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
    racing.onCarData(pitEntry);

    // Verify fuel hasn't changed yet (delay is 1.0s)
    double initialFuel = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertEquals(50.0, initialFuel, 0.001);

    // Manually trigger ticker updates to control time deterministically
    // Wait 0.5s - still in delay
    race.getHeatExecutionManager().processTicker(0.5f);
    assertEquals(50.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);

    // Wait another 0.6s - total 1.1s, refueling should have started (delay was 1.0s)
    // At 20 units/sec, in 0.1s it should have added ~2 units.
    race.getHeatExecutionManager().processTicker(0.6f);
    double fuelAfterRefuelStart =
        race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertTrue("Fuel should have increased", fuelAfterRefuelStart > 50.0);

    // Verify broadcast occurred
    ArgumentCaptor<RaceData> captor = ArgumentCaptor.forClass(RaceData.class);
    verify(race, atLeastOnce()).broadcast(captor.capture());
    boolean foundFuelUpdate = false;
    for (RaceData data : captor.getAllValues()) {
      if (data.hasCarData() && data.getCarData().getFuelLevel() > 50.0) {
        foundFuelUpdate = true;
        break;
      }
    }
    assertTrue("Should have broadcasted fuel update", foundFuelUpdate);

    // 2. Stop refueling by leaving pit
    CarData exitPit = new CarData(0, 2.0, 0.5, 0.5, true, CarLocation.Main, CarLocation.PitRow, 0);
    racing.onCarData(exitPit);
    double fuelAtExit = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();

    race.getHeatExecutionManager().processTicker(0.5f);
    assertEquals(
        "Fuel should stop increasing after leaving pit",
        fuelAtExit,
        race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(),
        0.001);

    // 3. Stop refueling by canRefuel = false
    racing.onCarData(pitEntry); // Re-enter
    race.getHeatExecutionManager().processTicker(1.2f); // Wait for delay
    double fuelReEntry = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertTrue(fuelReEntry > fuelAtExit);

    CarData cannotRefuel =
        new CarData(0, 4.0, 0.0, 0.0, false, CarLocation.PitRow, CarLocation.PitRow, 0);
    racing.onCarData(cannotRefuel);
    double fuelAtDisable = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();

    race.getHeatExecutionManager().processTicker(0.5f);
    assertEquals(
        "Fuel should stop increasing when canRefuel is false",
        fuelAtDisable,
        race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(),
        0.001);
  }

  @Test
  public void testRefuelingCapAtCapacity() throws Exception {
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(95.0);
    CarData pitEntry = new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
    racing.onCarData(pitEntry);

    // 1.0s delay + 0.5s refueling @ 20/s = 10 units. Total should be capped at 100.
    race.getHeatExecutionManager().processTicker(1.5f);

    assertEquals(
        100.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }
}
