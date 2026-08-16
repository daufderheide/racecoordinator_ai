package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.service.DatabaseService;
import com.antigravity.util.CsvExporter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceRecordsTest {

  private DatabaseService dbService;
  private DatabaseContext dbContext;
  private com.antigravity.race.Race race;
  private Track track;
  private List<RaceParticipant> drivers;

  @Before
  public void setUp() {
    dbService = mock(DatabaseService.class);
    DatabaseService.setInstance(dbService);
    dbContext = mock(DatabaseContext.class);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    lanes.add(new Lane("blue", "black", 100, "l2", null));
    lanes.add(new Lane("yellow", "black", 100, "l3", null));
    lanes.add(new Lane("green", "black", 100, "l4", null));
    track = new Track.Builder().name("Test Track").lanes(lanes).entityId("track1").id(null).build();

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

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
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

    ProtocolDelegate mockProtocols = mock(ProtocolDelegate.class);
    race.injectProtocols(mockProtocols);
    race.changeState(new Racing());
  }

  @After
  public void tearDown() {
    if (race != null && race.getState() != null) {
      try {
        race.getState().exit(race);
      } catch (Exception ignored) {
      }
    }
    ClientSubscriptionManager.setInstance(null);
    DatabaseService.setInstance(new DatabaseService());
  }

  @Test
  public void testRaceRecordsHydration() {
    CurrentRecords currentRecords =
        CurrentRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(4.567)
                    .setHolderName("Flash")
                    .setHolderNickname("Speedy")
                    .setHolderTeamName("Red")
                    .build())
            .build();

    com.antigravity.proto.OverallRecords overallRecords =
        com.antigravity.proto.OverallRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(4.123)
                    .setHolderName("Sonic")
                    .setHolderNickname("BlueBlur")
                    .setHolderTeamName("Sega")
                    .setDate(123456789L)
                    .build())
            .build();

    RecordData mockedRecords =
        RecordData.newBuilder().setCurrent(currentRecords).setOverall(overallRecords).build();

    when(dbService.getRaceRecords(any(DatabaseContext.class), anyString(), anyBoolean()))
        .thenReturn(mockedRecords);

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Hydration Race")
            .withEntityId("HYD_RACE_123")
            .build();

    Track testTrack =
        new Track.Builder()
            .name("Track")
            .lanes(
                Arrays.asList(
                    new Lane("#ff0000", "#ffffff", 100), new Lane("#00ff00", "#000000", 100)))
            .build();

    com.antigravity.race.Race runtimeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .databaseContext(dbContext)
            .track(testTrack)
            .drivers(new ArrayList<>())
            .isDemoMode(true)
            .build();

    RaceRecords records = runtimeRace.getRecordsManager();
    assertNotNull("RaceRecords should be initialized", records);

    RecordData exported = records.getRecordData();
    assertNotNull(exported);

    CurrentRecords current = exported.getCurrent();
    assertEquals(0.0, current.getFastestLap().getValue(), 0.001);

    com.antigravity.proto.OverallRecords overall = exported.getOverall();
    assertEquals(4.123, overall.getFastestLap().getValue(), 0.001);
    assertEquals("Sonic", overall.getFastestLap().getHolderName());
    assertEquals("BlueBlur", overall.getFastestLap().getHolderNickname());
    assertEquals("Sega", overall.getFastestLap().getHolderTeamName());
    assertEquals(123456789L, overall.getFastestLap().getDate());

    records.resetAllRecords();
    RecordData resetData = records.getRecordData();
    assertNotNull(resetData);
    assertEquals(0.0, resetData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("", resetData.getOverall().getFastestLap().getHolderName());
    assertEquals(0.0, resetData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("", resetData.getOverall().getHighestScore().getHolderName());
    assertEquals(0.0, resetData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(0.0, resetData.getCurrent().getHighestScore().getValue(), 0.001);
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
    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    RecordData recordData = race.getRecordData();
    assertEquals(0.0, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals(6.0, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getLaneFastestLap(0).getHolderName());

    race.onLap(1, 1.0, 0, 0);
    race.onLap(1, 6.0, 0, 0);
    recordData = race.getRecordData();
    assertEquals(7.0, recordData.getCurrent().getLaneFastestLap(1).getValue(), 0.001);

    race.onLap(0, 4.5, 0, 0);
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals(0.0, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);

    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getLaneFastestLap(0).getHolderName());
    assertEquals("Nick0", recordData.getOverall().getLaneFastestLap(0).getHolderNickname());
    assertTrue(recordData.getOverall().getLaneFastestLap(0).getDate() > 0);
  }

  @Test
  public void testUpdateLaneHighestScore() {
    race.onLap(2, 1.0, 0, 0);
    race.onLap(2, 5.0, 0, 0);

    race.changeState(new RaceOver());

    RecordData recordData = race.getRecordData();
    assertEquals(1.0, recordData.getOverall().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals(1.0, recordData.getCurrent().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals("D2", recordData.getCurrent().getLaneHighestScore(2).getHolderName());

    race.changeState(new Racing());
    race.onLap(2, 5.0, 0, 0);
    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(2.0, recordData.getCurrent().getLaneHighestScore(2).getValue(), 0.001);
    assertEquals(2.0, recordData.getOverall().getLaneHighestScore(2).getValue(), 0.001);
  }

  @Test
  public void testRecordDataProto() {
    race.onLap(3, 1.0, 0, 0);
    race.onLap(3, 4.0, 0, 0);
    race.onLap(3, 2.0, 0, 0);

    RecordData recordData = race.getRecordData();
    RecordEntry lapRecord = recordData.getCurrent().getLaneFastestLap(3);
    assertEquals(2.0, lapRecord.getValue(), 0.001);
    assertEquals("D3", lapRecord.getHolderName());

    race.changeState(new RaceOver());
    recordData = race.getRecordData();

    RecordEntry scoreRecord = recordData.getCurrent().getLaneHighestScore(3);
    assertEquals(2.0, scoreRecord.getValue(), 0.001);
    assertEquals("D3", scoreRecord.getHolderName());
  }

  @Test
  public void testTeamRecordAttribution() {
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

    RaceParticipant participant = race.getDrivers().get(0);
    participant.setDriver(d);
    participant.setTeam(team);

    race.getCurrentHeat().getDrivers().get(0).setActualDriver(d);

    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    race.changeState(new RaceOver());
    RecordData recordData = race.getRecordData();

    RecordEntry lapRecord = recordData.getOverall().getFastestLap();
    assertEquals(6.0, lapRecord.getValue(), 0.001);
    assertEquals("Nick T", lapRecord.getHolderNickname());
    assertEquals("Team Alpha", lapRecord.getHolderTeamName());

    RecordEntry scoreRecord = recordData.getOverall().getHighestScore();
    assertEquals(1.0, scoreRecord.getValue(), 0.001);
    assertEquals("Team Alpha", scoreRecord.getHolderTeamName());
    assertEquals("Nick T", scoreRecord.getHolderNickname());

    RecordEntry laneLapRecord = recordData.getOverall().getLaneFastestLap(0);
    assertEquals("Team Alpha", laneLapRecord.getHolderTeamName());
    assertEquals("Nick T", laneLapRecord.getHolderNickname());

    RecordEntry laneScoreRecord = recordData.getOverall().getLaneHighestScore(0);
    assertEquals("Team Alpha", laneScoreRecord.getHolderTeamName());
  }

  @Test
  public void testCsvExport() {
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

    RaceParticipant participant = race.getDrivers().get(0);
    participant.setDriver(d);
    participant.setTeam(team);

    race.getCurrentHeat().getDrivers().get(0).setActualDriver(d);

    race.onLap(0, 1.0, 0, 0);
    race.onLap(0, 5.0, 0, 0);

    race.changeState(new RaceOver());

    String csv = CsvExporter.export(race);

    assertTrue("Missing Overall Fastest Lap table", csv.contains("#Table: Overall Fastest Lap"));
    assertTrue(
        "Missing Overall Highest Score table", csv.contains("#Table: Overall Highest Score"));
    assertTrue("Missing Race Fastest Lap table", csv.contains("#Table: Race Fastest Lap"));
    assertTrue("Missing Race Highest Score table", csv.contains("#Table: Race Highest Score"));
    assertTrue("Missing Standings table", csv.contains("#Table: Standings"));
    assertTrue("Overall Fastest Lap header missing team column", csv.contains("holderTeamName"));
    assertTrue("CSV data should contain Team Alpha", csv.contains("Team Alpha"));
    assertTrue("CSV should contain Driver T", csv.contains("Driver T"));
    assertTrue("CSV should contain Nick T", csv.contains("Nick T"));
    assertTrue("CSV should contain Team Alpha", csv.contains("Team Alpha"));
    assertTrue("CSV should contain 6.0", csv.contains("6.0"));
  }

  @Test
  public void testMinLapAlignmentWithRecords() {
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
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
    minLapRace.injectProtocols(mock(ProtocolDelegate.class));
    minLapRace.changeState(new Racing());

    minLapRace.onLap(0, 1.0, 0, 0);
    minLapRace.onLap(0, 2.9, 0, 0);
    assertEquals(0, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    minLapRace.onLap(0, 0.2, 0, 0);

    DriverHeatData dhd = minLapRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(1, dhd.getLapCount());
    assertEquals(4.1, dhd.getLastLapTime(), 0.01);

    RecordData recordData = minLapRace.getRecordData();
    assertEquals(4.1, recordData.getCurrent().getFastestLap().getValue(), 0.01);
    assertEquals(4.1, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.01);
  }

  @Test
  public void testSubsequentLapMinLapAlignment() {
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
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
    minLapRace.injectProtocols(mock(ProtocolDelegate.class));
    minLapRace.changeState(new Racing());

    minLapRace.onLap(0, 1.0, 0, 0);
    minLapRace.onLap(0, 4.0, 0, 0);
    assertEquals(1, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    minLapRace.onLap(0, 2.0, 0, 0);
    assertEquals(1, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    minLapRace.onLap(0, 1.5, 0, 0);
    assertEquals(2, minLapRace.getCurrentHeat().getDrivers().get(0).getLapCount());

    DriverHeatData dhd = minLapRace.getCurrentHeat().getDrivers().get(0);
    assertEquals(3.5, dhd.getLastLapTime(), 0.001);

    RecordData recordData = minLapRace.getRecordData();
    assertEquals(3.5, recordData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(3.5, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
  }

  @Test
  public void testManualLapAdjustmentUpdatesRecords() {
    race.getCurrentHeat().getDrivers().get(0).setUserLaps(5.0);
    race.updateAndBroadcastOverallStandings();

    RecordData recordData = race.getRecordData();
    assertEquals(5.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());
    assertEquals(0.0, recordData.getOverall().getHighestScore().getValue(), 0.001);

    race.changeState(new RaceOver());
    recordData = race.getRecordData();
    assertEquals(5.0, recordData.getOverall().getHighestScore().getValue(), 0.001);
  }

  @Test
  public void testManualLapRemovalRevertsToOtherDriver() {
    race.getCurrentHeat().getDrivers().get(0).setUserLaps(10.0);
    race.getCurrentHeat().getDrivers().get(1).setUserLaps(15.0);

    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());
    assertEquals(15.0, race.getRecordData().getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D1", race.getRecordData().getCurrent().getHighestScore().getHolderName());

    race.changeState(new Racing());
    race.getCurrentHeat().getDrivers().get(1).setUserLaps(5.0);
    race.updateAndBroadcastOverallStandings();
    race.changeState(new RaceOver());

    RecordData recordData = race.getRecordData();
    assertEquals(10.0, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());
  }

  @Test
  public void testCurrentRaceRecordsUpdateImmediately_TimeBased() {
    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Test Time Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(
                new OverallScoring(
                    0,
                    OverallScoring.OverallRanking.FASTEST_LAP,
                    OverallScoring.OverallRankingTiebreaker.TOTAL_TIME))
            .withEntityId("race_time_1")
            .build();

    com.antigravity.race.Race timeRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    timeRace.injectProtocols(mock(ProtocolDelegate.class));
    timeRace.changeState(new Racing());

    timeRace.onLap(0, 1.0, 0, 0);
    timeRace.onLap(0, 5.0, 0, 0);
    timeRace.onLap(0, 4.5, 0, 0);

    RecordData recordData = timeRace.getRecordData();
    assertEquals(4.5, recordData.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getFastestLap().getHolderName());
    assertEquals(0.0, recordData.getOverall().getFastestLap().getValue(), 0.001);

    assertEquals(4.5, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());
    assertEquals(0.0, recordData.getOverall().getHighestScore().getValue(), 0.001);

    timeRace.changeState(new RaceOver());

    recordData = timeRace.getRecordData();
    assertEquals(4.5, recordData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getFastestLap().getHolderName());
    assertEquals(4.5, recordData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getHighestScore().getHolderName());
  }
}
