package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.OverallRecords;
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

    OverallRecords overallRecords =
        OverallRecords.newBuilder()
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

    OverallRecords overall = exported.getOverall();
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
    assertEquals(6.0, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getLaneFastestLap(0).getHolderName());
    assertEquals(6.0, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getLaneFastestLap(0).getHolderName());

    race.onLap(1, 1.0, 0, 0);
    race.onLap(1, 6.0, 0, 0);
    recordData = race.getRecordData();
    assertEquals(7.0, recordData.getCurrent().getLaneFastestLap(1).getValue(), 0.001);
    assertEquals(7.0, recordData.getOverall().getLaneFastestLap(1).getValue(), 0.001);

    race.onLap(0, 4.5, 0, 0);
    recordData = race.getRecordData();
    assertEquals(4.5, recordData.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals(4.5, recordData.getOverall().getLaneFastestLap(0).getValue(), 0.001);

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
    assertEquals(5.0, recordData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getHighestScore().getHolderName());

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
    assertEquals(4.5, recordData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getFastestLap().getHolderName());

    assertEquals(4.5, recordData.getCurrent().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getCurrent().getHighestScore().getHolderName());
    assertEquals(4.5, recordData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getHighestScore().getHolderName());

    timeRace.changeState(new RaceOver());

    recordData = timeRace.getRecordData();
    assertEquals(4.5, recordData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getFastestLap().getHolderName());
    assertEquals(4.5, recordData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", recordData.getOverall().getHighestScore().getHolderName());
  }

  @Test
  public void testLaneRecordsUpdate() {
    race.changeState(new Racing());

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(4.2, false, true);
    race.getRecordsManager().onLap(dhd0, 4.2, 0);

    DriverHeatData dhd1 = race.getCurrentHeat().getDrivers().get(1);
    dhd1.addLap(4.8, false, true);
    race.getRecordsManager().onLap(dhd1, 4.8, 1);

    RecordData data = race.getRecordData();
    assertNotNull(data.getCurrent());
    assertTrue(data.getCurrent().getLaneFastestLapCount() >= 2);
    assertEquals(4.2, data.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals(4.8, data.getCurrent().getLaneFastestLap(1).getValue(), 0.001);

    race.changeState(new RaceOver());
    RecordData finalData = race.getRecordData();
    assertEquals(4.2, finalData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
  }

  @Test
  public void testHeatNumberTrackingInRecords() {
    race.changeState(new Racing());
    int currentHeat = race.getCurrentHeat().getHeatNumber();

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(3.85, false, true);
    race.getRecordsManager().onLap(dhd0, 3.85, 0);

    DriverHeatData dhd1 = race.getCurrentHeat().getDrivers().get(1);
    dhd1.addLap(4.15, false, true);
    race.getRecordsManager().onLap(dhd1, 4.15, 1);

    RecordData data = race.getRecordData();
    assertEquals(3.85, data.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(currentHeat, data.getCurrent().getFastestLap().getHeatNumber());
    assertEquals(currentHeat, data.getCurrent().getHeatFastestLap().getHeatNumber());
    assertEquals(3.85, data.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals(currentHeat, data.getCurrent().getLaneFastestLap(0).getHeatNumber());
    assertEquals(4.15, data.getCurrent().getLaneFastestLap(1).getValue(), 0.001);
    assertEquals(currentHeat, data.getCurrent().getLaneFastestLap(1).getHeatNumber());

    // Verify recalculation preserves heat numbers
    race.getRecordsManager().recalculateScoreRecords();
    RecordData recalculated = race.getRecordData();
    assertEquals(currentHeat, recalculated.getCurrent().getFastestLap().getHeatNumber());
    assertEquals(currentHeat, recalculated.getCurrent().getLaneFastestLap(0).getHeatNumber());
    assertEquals(currentHeat, recalculated.getCurrent().getLaneFastestLap(1).getHeatNumber());

    // Verify loadCurrentRaceRecords preserves heat numbers
    RaceRecords newRecords = new RaceRecords(race);
    newRecords.loadCurrentRaceRecords(data.getCurrent());
    RecordData loaded = newRecords.getRecordData();
    assertEquals(currentHeat, loaded.getCurrent().getFastestLap().getHeatNumber());
    assertEquals(currentHeat, loaded.getCurrent().getHeatFastestLap().getHeatNumber());
    assertEquals(currentHeat, loaded.getCurrent().getLaneFastestLap(0).getHeatNumber());
  }

  @Test
  public void testDisallowLapRecalculatesHeatRaceAndOverallRecords() {
    race.changeState(new Racing());

    // Inject baseline overall records of 5.0s
    RecordEntry baselineEntry =
        RecordEntry.newBuilder()
            .setValue(5.0)
            .setHolderName("Old Legend")
            .setHolderNickname("Legend")
            .setDate(1000L)
            .build();
    OverallRecords baselineOverall =
        OverallRecords.newBuilder().setFastestLap(baselineEntry).build();
    race.getRecordsManager().loadOverallRaceRecords(baselineOverall);

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    // Erroneous lap glitch of 2.0s
    dhd0.addLap(2.0, false, true);
    race.getRecordsManager().onLap(dhd0, 2.0, 0);

    DriverHeatData dhd1 = race.getCurrentHeat().getDrivers().get(1);
    // Legitimate fast lap of 4.5s
    dhd1.addLap(4.5, false, true);
    race.getRecordsManager().onLap(dhd1, 4.5, 1);

    RecordData dataWithGlitch = race.getRecordData();
    assertEquals(2.0, dataWithGlitch.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(2.0, dataWithGlitch.getCurrent().getHeatFastestLap().getValue(), 0.001);
    assertEquals(2.0, dataWithGlitch.getCurrent().getLaneFastestLap(0).getValue(), 0.001);

    // Disallow the 2.0s glitch lap
    dhd0.getLaps().get(0).setCountTowardsRecords(false);
    dhd0.recalculateBestLapTime();

    // Recalculate records
    race.getRecordsManager().recalculateScoreRecords();

    RecordData dataAfterDisallow = race.getRecordData();
    // Fastest race & heat lap should now be 4.5s
    assertEquals(4.5, dataAfterDisallow.getCurrent().getFastestLap().getValue(), 0.001);
    assertEquals(4.5, dataAfterDisallow.getCurrent().getHeatFastestLap().getValue(), 0.001);
    // Lane 0 should no longer have 2.0s
    assertEquals(0.0, dataAfterDisallow.getCurrent().getLaneFastestLap(0).getValue(), 0.001);
    // Lane 1 should be 4.5s
    assertEquals(4.5, dataAfterDisallow.getCurrent().getLaneFastestLap(1).getValue(), 0.001);

    // After race over, overall record should be 4.5s (beats baseline 5.0s)
    race.changeState(new RaceOver());
    RecordData finalData = race.getRecordData();
    assertEquals(4.5, finalData.getOverall().getFastestLap().getValue(), 0.001);

    // If we now also disallow the 4.5s lap, overall record should cleanly revert to baseline 5.0s
    dhd1.getLaps().get(0).setCountTowardsRecords(false);
    dhd1.recalculateBestLapTime();
    race.getRecordsManager().recalculateScoreRecords();

    RecordData revertedData = race.getRecordData();
    assertEquals(5.0, revertedData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("Old Legend", revertedData.getOverall().getFastestLap().getHolderName());
  }

  @Test
  public void testOverallRecordsUpdateImmediatelyDuringRace() {
    race.changeState(new Racing());

    RecordEntry baselineLap =
        RecordEntry.newBuilder()
            .setValue(5.0)
            .setHolderName("Baseline Driver")
            .setHolderNickname("Base")
            .setDate(1000L)
            .build();
    RecordEntry baselineScore =
        RecordEntry.newBuilder()
            .setValue(50.0)
            .setHolderName("Baseline Driver")
            .setHolderNickname("Base")
            .setDate(1000L)
            .build();
    List<RecordEntry> baselineLaneLaps =
        Arrays.asList(
            RecordEntry.newBuilder().setValue(5.2).setDate(1000L).build(),
            RecordEntry.newBuilder().setValue(5.4).setDate(1000L).build());
    List<RecordEntry> baselineLaneScores =
        Arrays.asList(
            RecordEntry.newBuilder().setValue(45.0).setDate(1000L).build(),
            RecordEntry.newBuilder().setValue(48.0).setDate(1000L).build());

    OverallRecords baselineOverall =
        OverallRecords.newBuilder()
            .setFastestLap(baselineLap)
            .setHighestScore(baselineScore)
            .addAllLaneFastestLap(baselineLaneLaps)
            .addAllLaneHighestScore(baselineLaneScores)
            .build();
    race.getRecordsManager().loadOverallRaceRecords(baselineOverall);

    RecordData initialData = race.getRecordData();
    assertEquals(5.0, initialData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals(50.0, initialData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals(5.2, initialData.getOverall().getLaneFastestLap(0).getValue(), 0.001);

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(4.2, false, true);
    race.getRecordsManager().onLap(dhd0, 4.2, 0);

    dhd0.setUserLaps(60.0);
    race.updateAndBroadcastOverallStandings();

    assertTrue(race.getState() instanceof Racing);
    RecordData runningData = race.getRecordData();

    assertEquals(4.2, runningData.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", runningData.getOverall().getFastestLap().getHolderName());
    assertTrue(runningData.getOverall().getFastestLap().getDate() >= 1000L);
    assertEquals(
        race.getCurrentHeat().getHeatNumber(),
        runningData.getCurrent().getFastestLap().getHeatNumber());

    assertEquals(4.2, runningData.getOverall().getLaneFastestLap(0).getValue(), 0.001);
    assertEquals("D0", runningData.getOverall().getLaneFastestLap(0).getHolderName());

    assertEquals(61.0, runningData.getOverall().getHighestScore().getValue(), 0.001);
    assertEquals("D0", runningData.getOverall().getHighestScore().getHolderName());

    assertEquals(61.0, runningData.getOverall().getLaneHighestScore(0).getValue(), 0.001);
    assertEquals("D0", runningData.getOverall().getLaneHighestScore(0).getHolderName());
  }

  @Test
  public void testOverallRecordsRevertToBaselineWhenLapDisallowedDuringRace() {
    race.changeState(new Racing());

    RecordEntry baselineLap =
        RecordEntry.newBuilder()
            .setValue(5.0)
            .setHolderName("Baseline Champ")
            .setHolderNickname("Champ")
            .setDate(12345L)
            .build();
    OverallRecords baselineOverall = OverallRecords.newBuilder().setFastestLap(baselineLap).build();
    race.getRecordsManager().loadOverallRaceRecords(baselineOverall);

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(3.5, false, true);
    race.getRecordsManager().onLap(dhd0, 3.5, 0);

    RecordData dataWithRecord = race.getRecordData();
    assertEquals(3.5, dataWithRecord.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("D0", dataWithRecord.getOverall().getFastestLap().getHolderName());

    assertTrue(race.getState() instanceof Racing);
    dhd0.getLaps().get(0).setCountTowardsRecords(false);
    dhd0.recalculateBestLapTime();
    race.getRecordsManager().recalculateScoreRecords();

    RecordData dataReverted = race.getRecordData();
    assertEquals(5.0, dataReverted.getOverall().getFastestLap().getValue(), 0.001);
    assertEquals("Baseline Champ", dataReverted.getOverall().getFastestLap().getHolderName());
    assertEquals(12345L, dataReverted.getOverall().getFastestLap().getDate());
  }

  @Test
  public void testRecordsNotPersistedToDatabaseDuringRace() {
    ClientSubscriptionManager mockCsm = mock(ClientSubscriptionManager.class);
    when(mockCsm.getDatabaseContext()).thenReturn(dbContext);
    ClientSubscriptionManager.setInstance(mockCsm);

    race.changeState(new Racing());

    DriverHeatData dhd0 = race.getCurrentHeat().getDrivers().get(0);
    dhd0.addLap(3.8, false, true);
    race.getRecordsManager().onLap(dhd0, 3.8, 0);
    race.updateScoreRecords();

    assertEquals(3.8, race.getRecordData().getOverall().getFastestLap().getValue(), 0.001);
    verify(dbService, never()).saveRaceRecords(any(), any());

    race.changeState(new RaceOver());
    verify(dbService).saveRaceRecords(dbContext, race);
  }
}
