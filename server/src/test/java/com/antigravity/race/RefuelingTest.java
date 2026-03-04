package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.protocols.CarData;
import com.antigravity.protocols.CarLocation;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Racing;

public class RefuelingTest {

  private Race race;
  private Racing racing;
  private AnalogFuelOptions fuelOptions;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    fuelOptions = new AnalogFuelOptions(
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

    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        10L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Test Race", "track1", HeatRotationType.RoundRobin, heatScoring, null,
        new OverallScoring(), 0.0, fuelOptions, "race1", new ObjectId());

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    track = new Track("Test Track", lanes, mock(ArduinoConfig.class), "track1", new ObjectId());

    race = spy(new Race(raceModel, participants, track, true));
    racing = new Racing();
    race.changeState(racing);

    // Ensure starting fuel is less than capacity for refueling tests
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(50.0);
  }

  @Test
  public void testRefuelingLogic() throws Exception {
    // 1. Enter pit with canRefuel = true
    CarData pitEntry = new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
    racing.onCarData(pitEntry);

    // Verify fuel hasn't changed yet (delay is 1.0s)
    double initialFuel = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertEquals(50.0, initialFuel, 0.001);

    // Manually trigger ticker updates since we can't easily wait for the real
    // scheduler in a unit test
    // and we want to control time.
    // We'll use reflection or just wait a bit if the ticker is actually running,
    // but it's better to test the internal logic if possible.
    // Given Racing.java starts a REAL timer, let's wait a bit and check.

    // Wait 0.5s - still in delay
    Thread.sleep(600);
    assertEquals(50.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);

    // Wait another 0.6s - total 1.2s, refueling should have started (delay was
    // 1.0s)
    // At 20 units/sec, in 0.2s it should have added ~4 units.
    Thread.sleep(600);
    double fuelAfterRefuelStart = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertTrue("Fuel should have increased", fuelAfterRefuelStart > 50.0);

    // Verify broadcast occurred
    ArgumentCaptor<com.antigravity.proto.RaceData> captor = ArgumentCaptor
        .forClass(com.antigravity.proto.RaceData.class);
    verify(race, atLeastOnce()).broadcast(captor.capture());
    boolean foundFuelUpdate = false;
    for (com.antigravity.proto.RaceData data : captor.getAllValues()) {
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

    Thread.sleep(300);
    assertEquals("Fuel should stop increasing after leaving pit", fuelAtExit,
        race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.5);

    // 3. Stop refueling by canRefuel = false
    racing.onCarData(pitEntry); // Re-enter
    Thread.sleep(1200); // Wait for delay
    double fuelReEntry = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();
    assertTrue(fuelReEntry > fuelAtExit);

    CarData cannotRefuel = new CarData(0, 4.0, 0.0, 0.0, false, CarLocation.PitRow, CarLocation.PitRow, 0);
    racing.onCarData(cannotRefuel);
    double fuelAtDisable = race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel();

    Thread.sleep(300);
    assertEquals("Fuel should stop increasing when canRefuel is false", fuelAtDisable,
        race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.5);
  }

  @Test
  public void testRefuelingCapAtCapacity() throws Exception {
    race.getCurrentHeat().getDrivers().get(0).getDriver().setFuelLevel(95.0);
    CarData pitEntry = new CarData(0, 0.0, 0.0, 0.0, true, CarLocation.PitRow, CarLocation.Main, 0);
    racing.onCarData(pitEntry);

    Thread.sleep(1200); // 1.0s delay
    Thread.sleep(500); // 0.5s refueling @ 20/s = 10 units. Total should be capped at 100.

    assertEquals(100.0, race.getCurrentHeat().getDrivers().get(0).getDriver().getFuelLevel(), 0.001);
  }
}
