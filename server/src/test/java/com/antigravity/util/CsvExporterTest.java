package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class CsvExporterTest {

  private com.antigravity.race.Race race;
  private Driver driver;

  @Before
  public void setUp() {
    driver = new Driver("Test Driver", "TD", "d1", "1");

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
            .withName("Decimal Format Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .build();

    RaceParticipant participant = new RaceParticipant(driver);
    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(participant);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
            .entityId("track1")
            .id("1")
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(true)
            .build();
    race.injectProtocols(org.mockito.Mockito.mock(ProtocolDelegate.class));
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
  }

  @Test
  public void testDecimalPaddingThreeDecimalPlaces() {
    race.changeState(new Racing());
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(4.5, false, true);
    dhd.addLap(10.0, false, true);
    dhd.addLap(5.4819876, false, true);

    String csv = CsvExporter.export(race);

    assertTrue("CSV should contain padded lap time 4.500", csv.contains("4.500"));
    assertTrue("CSV should contain padded lap time 10.000", csv.contains("10.000"));
    assertTrue("CSV should contain rounded lap time 5.482", csv.contains("5.482"));
    assertTrue("CSV should contain consistencyScore", csv.contains("consistencyScore"));
  }

  @Test
  public void testExportWithNullAndEmptyRace() {
    String nullCsv = CsvExporter.export(null);
    assertNotNull(nullCsv);
    assertTrue(nullCsv.contains("#Section,Race Record Data"));

    com.antigravity.race.Race emptyRace =
        new com.antigravity.race.Race.Builder()
            .model(race.getRaceModel())
            .drivers(Collections.emptyList())
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    String emptyCsv = CsvExporter.export(emptyRace);
    assertNotNull(emptyCsv);
    assertTrue(emptyCsv.contains("#Section,Overall Standings"));
  }

  @Test
  public void testExportWithRecords() {
    race.changeState(new Racing());
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    race.getRecordsManager().onLap(dhd, 3.456, 0);

    String csv = CsvExporter.export(race);
    assertNotNull(csv);
    assertTrue(csv.contains("Race Fastest Lap"));
  }

  @Test
  public void testExportWithTeamParticipant() {
    Driver d1 = new Driver("Team Member 1", "TM1", "tm1", "101");
    Driver d2 = new Driver("Team Member 2", "TM2", "tm2", "102");
    Team team =
        new Team("Red Bull Racing", "avatar.png", Arrays.asList("tm1", "tm2"), "team1", "t1");

    RaceParticipant teamParticipant = new RaceParticipant(team);
    teamParticipant.setTeamDrivers(Arrays.asList(d1, d2));

    Race raceModel =
        new Race.Builder()
            .withName("Team Race")
            .withTrackEntityId("track1")
            .withEntityId("race_team_1")
            .build();

    com.antigravity.race.Race teamRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(Collections.singletonList(teamParticipant))
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    String csv = CsvExporter.export(teamRace);
    assertTrue(csv.contains("Red Bull Racing"));
  }

  @Test
  public void testModelEvaluationRowAndPredictionRowAccessors() {
    CsvExporter.ModelEvaluationRow eval = new CsvExporter.ModelEvaluationRow();
    eval.brierScore = 0.123;
    eval.rankMae = 1.45;
    eval.lapProjectionMae = 2.34;

    assertEquals(0.123, eval.getBrierScore(), 0.001);
    assertEquals(1.45, eval.getRankMae(), 0.001);
    assertEquals(2.34, eval.getLapProjectionMae(), 0.001);

    CsvExporter.PredictionRow pred = new CsvExporter.PredictionRow();
    pred.projectedRank = "1";
    pred.driverName = "Alice";
    pred.winProbability = "75%";
    pred.podiumProbability = "95%";
    pred.projectedLaps = "50.5";

    assertEquals("1", pred.getProjectedRank());
    assertEquals("Alice", pred.getDriverName());
    assertEquals("75%", pred.getWinProbability());
    assertEquals("95%", pred.getPodiumProbability());
    assertEquals("50.5", pred.getProjectedLaps());

    CsvExporter.HeatListRow heatRow = new CsvExporter.HeatListRow();
    heatRow.heatNumber = 1;
    heatRow.laneNumber = 2;
    heatRow.driverName = "Bob";
    heatRow.driverNickname = "Bobby";
    heatRow.teamName = "Scuderia";

    assertEquals(1, heatRow.getHeatNumber());
    assertEquals(2, heatRow.getLaneNumber());
    assertEquals("Bob", heatRow.getDriverName());
    assertEquals("Bobby", heatRow.getDriverNickname());
    assertEquals("Scuderia", heatRow.getTeamName());
  }

  @Test
  public void testCsvEscaping() {
    Driver specialDriver =
        new Driver("Driver, with \"Quotes\"\nAnd Newline", "D,Q", "d_special", "100");
    RaceParticipant participant = new RaceParticipant(specialDriver);

    com.antigravity.race.Race specialRace =
        new com.antigravity.race.Race.Builder()
            .model(race.getRaceModel())
            .drivers(Collections.singletonList(participant))
            .track(race.getTrack())
            .isDemoMode(true)
            .build();

    String csv = CsvExporter.export(specialRace);
    assertNotNull(csv);
    assertTrue(csv.contains("\"Driver, with \"\"Quotes\"\"\nAnd Newline\""));
  }

  @Test
  public void testDriverStatisticsExport() {
    race.changeState(new Racing());
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);
    dhd.addLap(4.0, false, true);
    dhd.addLap(5.0, false, true);

    String csv = CsvExporter.export(race);
    assertNotNull(csv);
    assertTrue(
        "CSV should contain Section Driver Statistics", csv.contains("#Section,Driver Statistics"));
    assertTrue(
        "CSV should contain Table Driver Statistics", csv.contains("#Table: Driver Statistics"));
    assertTrue("CSV should contain consistencyScore header", csv.contains("consistencyScore"));
  }

  @Test
  public void testDriverStatisticRowGetters() {
    CsvExporter.DriverStatisticRow row = new CsvExporter.DriverStatisticRow();
    row.driverName = "Dave";
    row.laneName = "Lane 1";
    row.laneNumber = 1;
    row.totalLaps = 10.0;
    row.totalTime = 50.0;
    row.averageLapTime = 5.0;
    row.medianLapTime = 4.9;
    row.bestLapTime = 4.5;
    row.standardDeviation = 0.2;
    row.consistencyScore = 96.0;
    row.averageTop5 = 4.7;
    row.averageTop10 = 4.9;
    row.averageTop15 = 5.0;
    row.top2Consecutive = 9.2;
    row.top3Consecutive = 13.9;

    assertEquals("Dave", row.getDriverName());
    assertEquals("Lane 1", row.getLaneName());
    assertEquals(1, row.getLaneNumber());
    assertEquals(10.0, row.getTotalLaps(), 0.001);
    assertEquals(50.0, row.getTotalTime(), 0.001);
    assertEquals(5.0, row.getAverageLapTime(), 0.001);
    assertEquals(4.9, row.getMedianLapTime(), 0.001);
    assertEquals(4.5, row.getBestLapTime(), 0.001);
    assertEquals(0.2, row.getStandardDeviation(), 0.001);
    assertEquals(96.0, row.getConsistencyScore(), 0.001);
    assertEquals(4.7, row.getAverageTop5(), 0.001);
    assertEquals(4.9, row.getAverageTop10(), 0.001);
    assertEquals(5.0, row.getAverageTop15(), 0.001);
    assertEquals(9.2, row.getTop2Consecutive(), 0.001);
    assertEquals(13.9, row.getTop3Consecutive(), 0.001);
  }
}
