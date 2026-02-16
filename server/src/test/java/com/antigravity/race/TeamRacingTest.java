package com.antigravity.race;

import static org.junit.Assert.assertNotNull;
import static org.mockito.Mockito.mock;

import java.util.ArrayList;
import java.util.List;

import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Track;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Racing;

public class TeamRacingTest {

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

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race(
        "Team Test Race",
        "track1",
        HeatRotationType.RoundRobin,
        heatScoring,
        overallScoring,
        "race1",
        new ObjectId());

    participants = new ArrayList<>();

    // Create a team with 2 drivers
    List<String> teamDriverIds = new ArrayList<>();
    teamDriverIds.add("d1");
    teamDriverIds.add("d2");
    // CRITICAL: Test with potential nulls if that's what's happening,
    // but first let's try a "normal" team setup which is reported to crash.
    Team team = new Team("The Team", "avatar_url", teamDriverIds, "team1", new ObjectId());

    RaceParticipant teamParticipant = new RaceParticipant(team);
    // Mimic ClientCommandTaskHandler behavior: populate team drivers
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(new Driver("Driver 1", "D1", "d1", new ObjectId()));
    teamDrivers.add(new Driver("Driver 2", "D2", "d2", new ObjectId()));
    teamParticipant.setTeamDrivers(teamDrivers);

    participants.add(teamParticipant);
    participants.add(new RaceParticipant(new Driver("Driver 3", "D3", "d3", new ObjectId()), "p3"));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100));
    lanes.add(new Lane("blue", "black", 100));
    track = new Track("Test Track", lanes, mock(ArduinoConfig.class), "track1", new ObjectId());

    race = new Race(raceModel, participants, track, true);
  }

  @Test
  public void testTeamOnLap_DoesNotCrash() {
    Racing racing = new Racing();
    // Simulate what happens in Race.java when changing to Racing state
    race.changeState(racing);

    // In actual app, Racing.enter(race) is called which starts a ticker.
    // For unit test, we just call onLap manually.

    System.out.println("Starting team onLap test...");
    // Team (Lane 0) completes a lap
    // This should trigger handleLapTime -> heatStandings.onLap ->
    // calculateStandings
    racing.onLap(0, 1.0, 1); // Reaction
    racing.onLap(0, 5.0, 1); // Lap 1

    assertNotNull(race.getCurrentHeat().getDrivers().get(0).getLaps());
  }
}
