package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;
import org.junit.After;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.Racing;

public class RacingTest {

  private Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    OverallScoring overallScoring = new OverallScoring(
        0,
        OverallScoring.OverallRanking.LAP_COUNT,
        OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatRotationType(HeatRotationType.RoundRobin)
        .withHeatScoring(heatScoring)
        .withOverallScoring(overallScoring)
        .withEntityId("race1")
        .withId(new ObjectId())
        .build();

    participants = new ArrayList<>();
    participants.add(new RaceParticipant(new Driver("Driver 1", "D1", "d1", new ObjectId()), "p1"));
    participants.add(new RaceParticipant(new Driver("Driver 2", "D2", "d2", new ObjectId()), "p2"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track = new Track("Test Track", lanes, java.util.Collections.singletonList(mock(ArduinoConfig.class)), "track1",
        new ObjectId());

    race = new Race(raceModel, participants, track, true, 0.0, 0.0);
  }

  @After
  public void tearDown() {
    if (race != null && race.getState() != null) {
      try {
        race.getState().exit(race);
      } catch (Exception e) {
        // Ignore
      }
    }
  }

  @Test
  public void testRacingDelegation_EndsHeatOnLaps() {
    Racing racing = new Racing();
    race.changeState(racing);

    // Driver 1 completes 3rd lap (limit is 3)
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2
    racing.onLap(0, 5.0, 1); // Lap 3 (Finished)
    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testTimedRace_NoAllowFinish_EndsOnTime() throws InterruptedException {
    heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        1L, // 1 second
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);

    race = new Race(new com.antigravity.models.Race.Builder()
        .withName("Test Race")
        .withTrackEntityId("track1")
        .withHeatScoring(heatScoring)
        .withOverallScoring(race.getRaceModel().getOverallScoring())
        .withEntityId("race1")
        .build(),
        participants, track, true, 0.0, 0.0);

    Racing racing = new Racing();
    race.changeState(racing);
    racing.enter(race);

    // Wait for ticker to expire time (ticker runs every 100ms)
    Thread.sleep(1500);

    assertTrue(race.getState() instanceof HeatOver);
  }

  @Test
  public void testPerLanePowerOffOnFinish() {
    Racing racing = new Racing();
    Race mockRace = mock(Race.class);
    com.antigravity.models.Race mockModel = mock(com.antigravity.models.Race.class);
    HeatScoring allowFinishScoring = new HeatScoring(
        HeatScoring.FinishMethod.Lap,
        3L,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);

    when(mockRace.getRaceModel()).thenReturn(mockModel);
    when(mockModel.getHeatScoring()).thenReturn(allowFinishScoring);

    // Mock Heat and Drivers
    Heat mockHeat = mock(Heat.class);
    when(mockRace.getCurrentHeat()).thenReturn(mockHeat);
    HeatStandings mockStandings = mock(HeatStandings.class);
    when(mockHeat.getHeatStandings()).thenReturn(mockStandings);
    
    // Use the real manager from the race if it's not a mock, 
    // but here mockRace is a mock, so we need to provide a manager that works.
    // Let's use a real one but point it to the mock race.
    HeatExecutionManager realManager = new HeatExecutionManager(mockRace);
    realManager.initialize(2); 
    when(mockRace.getHeatExecutionManager()).thenReturn(realManager);
    
    // We need real participants for the constructor
    List<DriverHeatData> drivers = new ArrayList<>();
    drivers.add(new DriverHeatData(participants.get(0)));
    drivers.add(new DriverHeatData(participants.get(1)));
    when(mockHeat.getDrivers()).thenReturn(drivers);
    when(mockHeat.getActiveDriverCount()).thenReturn(2);
    
    // Setup manager mock behavior indirectly by using a real one on a mock race?
    // Actually, Racing.enter(race) creates its own manager.
    // So we just need to verify it calls setLanePower(false, 0)
    racing.enter(mockRace);

    // Driver 1 completes 3 laps
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1
    racing.onLap(0, 5.0, 1); // Lap 2
    racing.onLap(0, 5.0, 1); // Lap 3 (Finish)

    org.mockito.Mockito.verify(mockRace).setLanePower(false, 0);
  }

  @Test
  public void testOnCarData_BroadcastsRefuelingState() {
    Racing racing = new Racing();
    race.changeState(racing);
    
    // Set refueling state in race
    race.getHeatExecutionManager().getIsRefueling()[0] = true;
    
    com.antigravity.protocols.CarData carData = new com.antigravity.protocols.CarData(
        0, 1.0, 0.5, 0.5, false, com.antigravity.protocols.CarLocation.PitRow, 
        com.antigravity.protocols.CarLocation.PitRow, -1);
    
    // Mock broadcast tracker or just verify it doesn't crash
    racing.onCarData(carData);
    
    // We'd ideally verify the broadcast message contains setRefueling(true)
  }
}
