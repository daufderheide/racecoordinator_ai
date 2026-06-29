package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RecordData;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class RaceRecordTimeBasedTest {

  private com.antigravity.race.Race race;
  private List<RaceParticipant> drivers;
  private Track track;

  @Before
  public void setUp() {
    // Setup 2-lane track
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    lanes.add(new Lane("blue", "black", 100, "l2", null));
    track = new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id(null).build();

    // Setup drivers
    drivers = new ArrayList<>();
    for (int i = 0; i < 2; i++) {
      Driver d =
          new Driver(
              "D" + i,
              "Nick" + i,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              "id" + i,
              null);
      drivers.add(new RaceParticipant(d));
    }

    Race raceModel =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.FASTEST_LAP,
                    OverallScoring.OverallRankingTiebreaker.TOTAL_TIME))
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();
  }

  @Test
  public void testCurrentRaceRecordsUpdateImmediately() {
    // 1. Start racing
    race.changeState(new Racing());

    // 2. Add some laps
    // Lane 0: Reaction 1.0, Lap 1: 5.0, Lap 2: 4.5
    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0); // effective 4.5 (best lap time is 4.5)
    race.onLap(0, 4.5, 0, 0);

    // 3. Verify Current Race Fastest Lap updated immediately
    RecordData recordData = race.getRecordData();
    assertEquals(4.5, recordData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getFastestLap().getHolderName());

    // 4. Verify Overall Fastest Lap updated immediately
    assertEquals(4.5, recordData.getOverall().getFastestLap().getValue(), 0.001);

    // 5. Verify Current Race Highest Score (which is Fastest Lap in this race) updated immediately
    assertEquals(4.5, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());

    // 6. Verify Overall Highest Score is still 0 (deferred until RaceOver)
    assertEquals(0.0, recordData.getOverall().getHighestScore().getValue(), 0.001);

    // 7. End the race
    race.changeState(new RaceOver());

    // 8. Verify Overall records ARE updated after race ends
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getFastestLap().getHolderName());

    assertEquals(4.5, recordData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getHighestScore().getHolderName());
  }

  @Test
  public void testLapCountRecordsUpdateImmediatelyForCurrentRace() {
    // 1. Change scoring to LAP_COUNT
    Race raceModel =
        new Race.Builder()
            .withName("Test Race Laps")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.LAP_COUNT,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .withEntityId("race2")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .demoConfig(
                com.antigravity.proto.DemoConfig.newBuilder()
                    .setMinReactionTimeMs(9999999)
                    .setMaxReactionTimeMs(9999999)
                    .setMinLapTimeMs(9999999)
                    .setMaxLapTimeMs(9999999)
                    .build())
            .build();

    race.changeState(new Racing());

    // 2. Add some laps
    // Lane 0: Reaction + 3 Laps (Total 3)
    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    // 3. Verify Current Highest Score (Laps) updated immediately
    RecordData recordData = race.getRecordData();
    assertEquals(3.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());

    // 4. Overall still 0
    assertEquals(0.0, recordData.getOverall().getHighestScore().getValue(), 0.001);

    // 5. Lane 1 gets 5 laps
    race.onLap(1, 1.0, 0, 0);
    race.onLap(1, 5.0, 0, 0);
    race.onLap(1, 5.0, 0, 0);
    race.onLap(1, 5.0, 0, 0);
    race.onLap(1, 5.0, 0, 0);
    race.onLap(1, 5.0, 0, 0);

    // 6. Verify Current updated to 5.0
    recordData = race.getRecordData();
    assertEquals(5.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D1", recordData.getCurrent().getHighestScore().getHolderName());

    // 7. End race and verify Overall
    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(5.0, recordData.getOverall().getHighestScore().getValue(), 0.001);
  }
}
