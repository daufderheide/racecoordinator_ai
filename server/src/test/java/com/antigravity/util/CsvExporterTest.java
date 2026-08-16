package com.antigravity.util;

import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
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
    // Add lap times: 4.5 should format as 4.500, 10.0 should format as 10.000, 5.4819876 -> 5.482
    dhd.addLap(4.5, false, true);
    dhd.addLap(10.0, false, true);
    dhd.addLap(5.4819876, false, true);

    String csv = CsvExporter.export(race);

    assertTrue("CSV should contain padded lap time 4.500", csv.contains("4.500"));
    assertTrue("CSV should contain padded lap time 10.000", csv.contains("10.000"));
    assertTrue("CSV should contain rounded lap time 5.482", csv.contains("5.482"));
  }

  @Test
  public void testModelEvaluationRowAndPredictionRowAccessors() {
    CsvExporter.ModelEvaluationRow eval = new CsvExporter.ModelEvaluationRow();
    eval.brierScore = 0.123;
    eval.rankMae = 1.45;
    eval.lapProjectionMae = 2.34;

    org.junit.Assert.assertEquals(0.123, eval.getBrierScore(), 0.001);
    org.junit.Assert.assertEquals(1.45, eval.getRankMae(), 0.001);
    org.junit.Assert.assertEquals(2.34, eval.getLapProjectionMae(), 0.001);

    CsvExporter.PredictionRow pred = new CsvExporter.PredictionRow();
    pred.projectedRank = "1";
    pred.driverName = "Alice";
    pred.winProbability = "75%";
    pred.podiumProbability = "95%";
    pred.projectedLaps = "50.5";

    org.junit.Assert.assertEquals("1", pred.getProjectedRank());
    org.junit.Assert.assertEquals("Alice", pred.getDriverName());
    org.junit.Assert.assertEquals("75%", pred.getWinProbability());
    org.junit.Assert.assertEquals("95%", pred.getPodiumProbability());
    org.junit.Assert.assertEquals("50.5", pred.getProjectedLaps());
  }
}
