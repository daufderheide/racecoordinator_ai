package com.antigravity.race;

import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.states.Racing;
import com.antigravity.util.CsvExporter;
import java.util.ArrayList;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class RaceTeamExportTest {

  private com.antigravity.race.Race race;
  private Driver teammateA;
  private Driver teammateB;
  private Team team;

  @Before
  public void setUp() {
    teammateA = new Driver("Teammate A", "TA", "d1", new ObjectId());
    teammateB = new Driver("Teammate B", "TB", "d2", new ObjectId());

    List<String> driverIds = new ArrayList<>();
    driverIds.add("d1");
    driverIds.add("d2");
    team = new Team("The Team", "team_avatar", driverIds, "t1", new ObjectId());

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
            .withName("Team Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .build();

    RaceParticipant teamParticipant = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(teammateA);
    teamDrivers.add(teammateB);
    teamParticipant.setTeamDrivers(teamDrivers);

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(teamParticipant);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(new ArrayList<>())
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
  public void testTeamAndTeammateExport() {
    // 1. Start the race
    race.changeState(new Racing());
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(0);

    // 2. Teammate A records a lap
    dhd.setActualDriver(teammateA);
    dhd.addLap(10.5, false);

    // 3. Teammate B records a lap
    dhd.setActualDriver(teammateB);
    dhd.addLap(12.3, false);

    // 4. Export to CSV
    String csv = CsvExporter.export(race);

    // 5. Verify #Lane row (Show actual driver, nickname, and team name)
    assertTrue(
        "CSV should contain team name in lane summary", csv.contains("1,Teammate B,TB,The Team,"));

    // 6. Verify #Lap header (Show Driver and Nickname columns)
    assertTrue(
        "CSV should contain updated #Lap header",
        csv.contains("#Lap,Driver,Nickname,Team,Lap Time,Drift"));

    // 7. Verify Lap 1 (Teammate A)
    assertTrue(
        "CSV should attribute Lap 1 to Teammate A",
        csv.contains("1,Teammate A,TA,The Team,10.5,false"));

    // 8. Verify Lap 2 (Teammate B)
    assertTrue(
        "CSV should attribute Lap 2 to Teammate B",
        csv.contains("2,Teammate B,TB,The Team,12.3,false"));
  }
}
