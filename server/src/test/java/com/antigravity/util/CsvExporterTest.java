package com.antigravity.util;

import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.List;
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
}
