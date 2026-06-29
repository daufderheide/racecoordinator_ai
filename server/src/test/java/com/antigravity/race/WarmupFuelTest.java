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
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class WarmupFuelTest {

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
            .withName("Warmup Fuel Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(new OverallScoring())
            .withMinLapTime(0.0)
            .withFuelOptions(fuelOptions)
            .withAutoStartTime(60.0)
            .withAutoStartWarmupTime(10.0)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

    participants = new ArrayList<>();
    Driver d1 = new Driver("Driver 1", "D1", "d1", new ObjectId());
    participants.add(new RaceParticipant(d1, "p1"));

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
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testFuelInitializationInConstructor() {
    // This tests that initializeFuelLevels() was called BEFORE NotStarted.enter()
    // or at least that it was called in the constructor correctly.
    // Given my change to move it before state.enter(), this should be solid.
    RaceParticipant p = race.getDrivers().get(0);
    assertEquals("Initial fuel should be 100.0", 100.0, p.getFuelLevel(), 0.001);
  }

  @Test
  public void testInitialFuelLevelSetOnNotStartedEnter() {
    // When NotStarted.enter() is called (which happens in Race constructor),
    // it now calls prepareHeat() if autoStartTime > 0.
    // This should set the initialFuelLevel in DriverHeatData.
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    assertEquals(
        "Initial fuel level in HeatData should be 100.0", 100.0, dhd.getInitialFuelLevel(), 0.001);
  }

  @Test
  public void testFuelRestoreAfterWarmup() {
    // Simulate fuel consumption during warmup
    RaceParticipant p = race.getDrivers().get(0);
    p.setFuelLevel(85.0);

    // At the end of warmup, NotStarted calls race.resetCurrentHeat()
    // which calls restoreHeatFuel().
    race.resetCurrentHeat();

    assertEquals(
        "Fuel should be restored to 100.0 after warmup reset", 100.0, p.getFuelLevel(), 0.001);
  }

  @Test
  public void testNoResetIfResetAtStartIsFalse() {
    // Rebuild race with resetFuelAtHeatStart = false
    AnalogFuelOptions noResetOptions =
        new AnalogFuelOptions(
            true,
            false,
            false,
            100.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            4.0,
            75.0,
            20.0,
            1.0,
            6.0);

    Race raceModel =
        new Race.Builder()
            .withName("No Reset Test")
            .withFuelOptions(noResetOptions)
            .withAutoStartTime(60.0)
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(race.getRaceModel().getHeatScoring())
            .withOverallScoring(new OverallScoring())
            .build();

    // Set an initial level manually before race starts
    participants.get(0).setFuelLevel(75.0);

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();

    // prepareHeat() is called in NotStarted.enter()
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    assertEquals(
        "Initial fuel level should be captured as 75.0", 75.0, dhd.getInitialFuelLevel(), 0.001);

    // Consume some more
    participants.get(0).setFuelLevel(70.0);
    race.resetCurrentHeat();

    assertEquals(
        "Fuel should be restored to 75.0 (the level at the start of the heat)",
        75.0,
        participants.get(0).getFuelLevel(),
        0.001);
  }
}
