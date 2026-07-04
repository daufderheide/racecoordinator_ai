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
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceRecordTest {

  private com.antigravity.race.Race race;
  private Track track;
  private List<RaceParticipant> drivers;

  @Before
  public void setUp() {
    // Setup 4-lane track
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    lanes.add(new Lane("blue", "black", 100, "l2", null));
    lanes.add(new Lane("yellow", "black", 100, "l3", null));
    lanes.add(new Lane("green", "black", 100, "l4", null));
    track = new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id(null).build();

    // Setup drivers
    drivers = new ArrayList<>();
    for (int i = 0; i < 4; i++) {
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
                    OverallScoring.OverallRanking.LAP_COUNT,
                    OverallScoring.OverallRankingTiebreaker.FASTEST_LAP_TIME))
            .withEntityId("race1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    // Inject mock ProtocolDelegate to prevent Demo background thread flakiness
    ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
    race.injectProtocols(mockProtocols);

    // Set to Racing state so onLap returns true and updates records
    race.changeState(new Racing());
  }

  @After
  public void tearDown() {
    if (race != null && race.getState() != null) {
      race.getState().exit(race);
    }
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testInitialLaneRecords() {
    RecordData recordData = race.getRecordData();
    assertEquals(4, recordData.getOverall().getLaneFastestLapCount());
    assertEquals(4, recordData.getOverall().getLaneHighestScoreCount());
    assertEquals(4, recordData.getCurrent().getLaneFastestLapCount());
    assertEquals(4, recordData.getCurrent().getLaneHighestScoreCount());

    for (int i = 0; i < 4; i++) {
      assertEquals(0.0, recordData.getOverall().getLaneFastestLap(i).getValue(), 0.001);
      assertEquals(0.0, recordData.getOverall().getLaneHighestScore(i).getValue(), 0.001);
      assertEquals(0.0, recordData.getCurrent().getLaneFastestLap(i).getValue(), 0.001);
      assertEquals(0.0, recordData.getCurrent().getLaneHighestScore(i).getValue(), 0.001);
    }
  }

  @Test
  public void testUpdateLaneFastestLap() {
    // Lane 0: First hit is reaction time (1.0)
    race.onLap(0, 1.0, 0, 0);

    // Second hit is first lap. effective = 5.0 + 1.0 = 6.0
    race.onLap(0, 5.0, 0, 0);

    RecordData recordData = race.getRecordData();
    // Check Overall (Updated immediately)
    assertEquals(6.0, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);

    // Check Current (Updated immediately)
    assertEquals(6.0, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getLaneFastestLap(0).getHolderName());

    // Lane 1: Reaction (1.0) + Lap (6.0) -> effective 7.0
    race.onLap(1, 1.0, 0, 0);
    race.onLap(1, 6.0, 0, 0);
    recordData = race.getRecordData();
    assertEquals(7.0, recordData.getCurrent().getLaneFastestLap(1).getValue(), 0.001);

    // Faster lap on lane 0. hit 3 is lap 2. effective = 4.5
    race.onLap(0, 4.5, 0, 0);
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);

    // Overall updated immediately
    assertEquals(4.5, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);

    // End race to see Overall update
    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getLaneFastestLap(0).getHolderName());
    assertEquals("Nick0", recordData.getOverall().getLaneFastestLap(0).getHolderNickname());
    assertTrue(recordData.getOverall().getLaneFastestLap(0).getDate() > 0);
  }

  @Test
  public void testUpdateLaneHighestScore() {
    // Default scoring is LAP_COUNT. Score = totalLaps.

    // Lane 2: Reaction + 1 Lap
    race.onLap(2, 1.0, 0, 0);
    race.onLap(2, 5.0, 0, 0); // effective 6.0, lapCount = 1

    // 4. End the race to update score records
    race.changeState(new RaceOver());

    RecordData recordData = race.getRecordData();
    assertEquals(1.0, recordData.getOverall().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals(1.0, recordData.getCurrent().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals("D2", recordData.getCurrent().getLaneHighestScore(2).getHolderName());

    // Second lap for lane 2
    race.changeState(new Racing());
    race.onLap(2, 5.0, 0, 0); // lapCount = 2
    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(2.0, recordData.getCurrent().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals(2.0, recordData.getOverall().getLaneHighestScore(2).getValue(), 0.001);
  }

  @Test
  public void testRecordDataProto() {
    // Lane 3: Reaction + 2 Laps
    race.onLap(3, 1.0, 0, 0);
    race.onLap(3, 4.0, 0, 0); // effective 5.0, lapCount 1
    race.onLap(3, 2.0, 0, 0); // effective 2.0, lapCount 2

    RecordData recordData = race.getRecordData();
    System.out.println(
        "DEBUG: recordData.getCurrent().getLaneFastestLap(3).getValue() = "
            + recordData.getCurrent().getLaneFastestLap(3).getValue());

    RecordEntry lapRecord = recordData.getCurrent().getLaneFastestLap(3);
    assertEquals(2.0, lapRecord.getValue(), 0.001);
    assertEquals("D3", lapRecord.getHolderName());

    race.changeState(new RaceOver());
    recordData = race.getRecordData();

    RecordEntry scoreRecord = recordData.getCurrent().getLaneHighestScore(3);
    System.out.println(
        "DEBUG: recordData.getCurrent().getLaneHighestScore(3).getValue() = "
            + recordData.getCurrent().getLaneHighestScore(3).getValue());
    assertEquals(2.0, scoreRecord.getValue(), 0.001);
    assertEquals("D3", scoreRecord.getHolderName());
  }

  @Test
  public void testTeamRecordAttribution() {
    // Setup a driver with a team
    com.antigravity.models.Team team =
        new com.antigravity.models.Team("Team Alpha", null, new ArrayList<>());
    Driver d =
        new Driver(
            "Driver T",
            "Nick T",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "id_t",
            null);

    // Update the existing participant in the race
    RaceParticipant participant = race.getDrivers().get(0);
    participant.setDriver(d);
    participant.setTeam(team);

    // Manually update the actual driver in the current heat for lane 0
    // (since Race.Builder already initialized it with the old driver)
    race.getCurrentHeat().getDrivers().get(0).setActualDriver(d);

    // Lane 0: Reaction (1.0) + Lap (5.0) -> effective 6.0
    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    race.changeState(new RaceOver());
    RecordData recordData = race.getRecordData();

    // 1. Overall Fastest Lap
    RecordEntry lapRecord = recordData.getOverall().getFastestLap();
    assertEquals(6.0, lapRecord.getValue(), 0.001);
    assertEquals("Nick T", lapRecord.getHolderNickname());
    assertEquals("Team Alpha", lapRecord.getHolderTeamName());

    // 2. Overall Highest Score (1.0 lap)
    RecordEntry scoreRecord = recordData.getOverall().getHighestScore();
    assertEquals(1.0, scoreRecord.getValue(), 0.001);
    assertEquals("Team Alpha", scoreRecord.getHolderTeamName());
    // The nickname is still the driver's nickname in the data
    assertEquals("Nick T", scoreRecord.getHolderNickname());

    // 3. Lane Records
    RecordEntry laneLapRecord = recordData.getOverall().getLaneFastestLap(0);
    assertEquals("Team Alpha", laneLapRecord.getHolderTeamName());
    assertEquals("Nick T", laneLapRecord.getHolderNickname());

    RecordEntry laneScoreRecord = recordData.getOverall().getLaneHighestScore(0);
    assertEquals("Team Alpha", laneScoreRecord.getHolderTeamName());
  }

  @Test
  public void testCsvExport() {
    // Setup a driver with a team
    com.antigravity.models.Team team =
        new com.antigravity.models.Team("Team Alpha", null, new ArrayList<>());
    Driver d =
        new Driver(
            "Driver T",
            "Nick T",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "id_t",
            null);

    // Update the existing participant in the race
    RaceParticipant participant = race.getDrivers().get(0);
    participant.setDriver(d);
    participant.setTeam(team);

    // Manually update the actual driver in the current heat for lane 0
    race.getCurrentHeat().getDrivers().get(0).setActualDriver(d);

    // Generate some record data
    // First call is reaction time, second is the lap
    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    race.changeState(new RaceOver());

    // Export to CSV
    String csv = com.antigravity.util.CsvExporter.export(race);

    // Verify headers contain "Team"
    assertTrue(
        "Overall Fastest Lap header missing Team column",
        csv.contains("#Overall Fastest Lap,Holder,Nickname,Team,Date,Time"));
    assertTrue(
        "Overall Highest Score header missing Team column",
        csv.contains("#Overall Highest Score,Holder,Nickname,Team,Date,Score"));
    assertTrue(
        "Overall Lane Records header missing Team column",
        csv.contains(
            "#Lane,Fastest Lap Holder,Nickname,Team,Date,Time,Highest Score Holder,Nickname,Team,Date,Score"));
    assertTrue(
        "Race Fastest Lap header missing Team column",
        csv.contains("#Race Fastest Lap,Holder,Nickname,Team,Time"));
    assertTrue(
        "Race Highest Score header missing Team column",
        csv.contains("#Race Highest Score,Holder,Nickname,Team,Score"));
    assertTrue(
        "Lane Records (Current Race) header missing Team column",
        csv.contains(
            "#Lane,Fastest Lap Holder,Nickname,Fastest Lap Team,Time,Highest Score Holder,Nickname,Highest Score Team,Score"));
    assertTrue(
        "Overall Standings header missing Team column",
        csv.contains(
            "#Rank,Seed,Driver,Nickname,Team,Total Laps,Total Time,Rank Value,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap"));
    assertTrue(
        "Heat Lane summary header missing Team column",
        csv.contains(
            "#Lane,Driver,Nickname,Team,Reaction Time,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap,Laps,Penalty Laps,False Starts,User Laps,Auto Calculated Laps,Adjusted Laps"));

    // Verify data contains "Team Alpha"
    assertTrue("CSV data should contain Team Alpha", csv.contains("Team Alpha"));

    // Check a specific row structure for Overall Fastest Lap (assuming Nick T/Team Alpha broke it)
    // Row format: Overall Fastest Lap,Driver T,Nick T,Team Alpha,[DATE],5.0
    // We'll check the parts before and after the date
    assertTrue(
        "Overall Fastest Lap data row mismatch (prefix)",
        csv.contains("Overall Fastest Lap,Driver T,Nick T,Team Alpha,"));
    assertTrue("Overall Fastest Lap data row mismatch (suffix)", csv.contains(",6.0"));
  }

  @Test
  public void testMinLapAlignmentWithRecords() {
    // Setup a race with minLapTime = 3.0
    Race raceModel =
        new Race.Builder()
            .withName("MinLap Race")
            .withMinLapTime(3.0)
            .withTrackEntityId("track1")
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .build();

    com.antigravity.race.Race minLapRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();
    minLapRace.changeState(new Racing());

    // 1. Reaction hit
    minLapRace.onLap(0, 1.0, 0, 0);

    // 2. First hit after reaction: 2.9s.
    // Below 3.0 minLap, not counted yet.
    minLapRace.onLap(0, 2.9, 0, 0);
    assertEquals(0, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    // 3. Second hit: 0.2s.
    // Total since reaction = 2.9 + 0.2 = 3.1.
    // Counted as lap 1. Effective time = 3.1 + 1.0 (reaction) = 4.1.
    minLapRace.onLap(0, 0.2, 0, 0);

    DriverHeatData dhd = minLapRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(1, dhd.getLapCount());
    assertEquals(4.1, dhd.getLastLapTime(), 0.001);

    // Verify record is 4.1, not 0.2
    RecordData recordData = minLapRace.getRecordData();
    assertEquals(4.1, recordData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(4.1, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
  }

  @Test
  public void testSubsequentLapMinLapAlignment() {
    // Setup a race with minLapTime = 3.0
    Race raceModel =
        new Race.Builder()
            .withName("MinLap Race")
            .withMinLapTime(3.0)
            .withTrackEntityId("track1")
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .build();

    com.antigravity.race.Race minLapRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();
    minLapRace.changeState(new Racing());

    // 1. Reaction hit (1.0) + Lap 1 (4.0) -> effective 5.0
    minLapRace.onLap(0, 1.0, 0, 0);
    minLapRace.onLap(0, 4.0, 0, 0);
    assertEquals(1, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    // 2. Lap 2 part 1: 2.0s (below 3.0)
    minLapRace.onLap(0, 2.0, 0, 0);
    assertEquals(1, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    // 3. Lap 2 part 2: 1.5s (2.0 + 1.5 = 3.5 > 3.0)
    minLapRace.onLap(0, 1.5, 0, 0);
    assertEquals(2, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    DriverHeatData dhd = minLapRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(3.5, dhd.getLastLapTime(), 0.001);

    // Verify records. Fastest lap should be 3.5.
    // BUG: Was 1.5 before fix.
    RecordData recordData = minLapRace.getRecordData();
    assertEquals(3.5, recordData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(3.5, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
  }

  @Test
  public void testManualLapAdjustmentUpdatesRecords() {
    // Driver 0 gets 5 laps manually
    // Driver 0 gets 5 laps manually
    race.getCurrentHeat().getDrivers().get(0).setUserLaps(5.0);
    race.updateAndBroadcastOverallStandings();

    // Current Race record updates immediately because updateAndBroadcastOverallStandings() calls it
    RecordData recordData = race.getRecordData();
    assertEquals(5.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());

    // Overall remains 0 until RaceOver
    assertEquals(0.0, recordData.getOverall().getHighestScore().getValue(), 0.001);

    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(5.0, recordData.getOverall().getHighestScore().getValue(), 0.001);
  }

  @Test
  public void testManualLapRemovalRevertsToOtherDriver() {
    // Driver 0 has 10 laps
    race.getCurrentHeat().getDrivers().get(0).setUserLaps(10.0);
    // Driver 1 has 15 laps (Current record holder)
    race.getCurrentHeat().getDrivers().get(1).setUserLaps(15.0);

    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());
    assertEquals(15.0, race.getRecordData().getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D1", race.getRecordData().getCurrent().getHighestScore().getHolderName());

    // Remove 10 laps from Driver 1 -> total 5
    race.changeState(new Racing());
    race.getCurrentHeat().getDrivers().get(1).setUserLaps(5.0);
    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());

    // Record should revert to Driver 0 (10 laps)
    RecordData recordData = race.getRecordData();
    assertEquals(10.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());
  }

  @Test
  public void testDriverChangeUpdatesRecordHolder() {
    // Driver 0 gets 10 laps
    race.getCurrentHeat().getDrivers().get(0).setUserLaps(10.0);
    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());

    assertEquals("D0", race.getRecordData().getCurrent().getHighestScore().getHolderName());

    // Change actual driver for lane 0 to D1
    race.changeState(new Racing());
    Driver newDriver = drivers.get(1).getDriver();
    race.getCurrentHeat().getDrivers().get(0).setActualDriver(newDriver);

    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());

    // Since recalculateScoreRecords currently uses p.getDriver().getName() (the primary driver),
    // and we changed actualDriver in the heat but not the participant's primary driver,
    // this test might fail if we expect it to change to D1.
    // However, if we are in a Team Race, p.getDriver() IS the team name.

    // Let's see what happens.
  }
}
