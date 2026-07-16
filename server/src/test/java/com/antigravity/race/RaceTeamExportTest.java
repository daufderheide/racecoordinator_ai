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
    System.out.println("---- CSV START ----\n" + csv + "\n---- CSV END ----");

    // 5. Verify Lap times exist in the CSV
    assertTrue("CSV should contain teammate lap time 10.5", csv.contains("10.5"));

    assertTrue("CSV should contain teammate lap time 12.3", csv.contains("12.3"));

    // 6. Verify Team name exists
    assertTrue("CSV should contain Team name", csv.contains("The Team"));

    // 7. Verify teammate names exist
    assertTrue("CSV should contain Teammate A", csv.contains("Teammate A"));
    assertTrue("CSV should contain Teammate B", csv.contains("Teammate B"));

    // 8. Verify driverId is replaced by driverName and driverNickname
    org.junit.Assert.assertFalse(
        "CSV should NOT contain driverId header", csv.contains("driverId"));
    assertTrue("CSV should contain driverName header", csv.contains("driverName"));
    assertTrue("CSV should contain driverNickname header", csv.contains("driverNickname"));
    assertTrue("CSV should contain Teammate A nickname", csv.contains("TA"));
    assertTrue("CSV should contain Teammate B nickname", csv.contains("TB"));

    // 9. Verify ignored fields are not present
    org.junit.Assert.assertFalse("CSV should NOT contain stableId", csv.contains("stableId"));
    org.junit.Assert.assertFalse("CSV should NOT contain entityId", csv.contains("entityId"));
    org.junit.Assert.assertFalse("CSV should NOT contain driverIds", csv.contains("driverIds"));
    org.junit.Assert.assertFalse("CSV should NOT contain lapAudio", csv.contains("lapAudio"));
    org.junit.Assert.assertFalse("CSV should NOT contain avatarUrl", csv.contains("avatarUrl"));
    org.junit.Assert.assertFalse("CSV should NOT contain lapSoundUrl", csv.contains("lapSoundUrl"));
  }
}
