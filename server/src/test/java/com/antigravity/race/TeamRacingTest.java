package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.protocols.ProtocolDelegate;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.race.states.Racing;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.bson.types.ObjectId;
import org.junit.Before;
import org.junit.Test;

public class TeamRacingTest {

  private com.antigravity.race.Race race;
  private HeatScoring heatScoring;
  private List<RaceParticipant> participants;
  private Track track;

  @Before
  public void setUp() {
    heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Lap,
            3L,
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
            .withName("Team Test Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withOverallScoring(overallScoring)
            .withEntityId("race1")
            .withId(new ObjectId())
            .build();

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
    track =
        new Track.Builder()
            .name("Test Track")
            .lanes(lanes)
            .arduinoConfigs(Collections.singletonList(new ArduinoConfig()))
            .entityId("track1")
            .id(new ObjectId())
            .build();

    race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(participants)
            .track(track)
            .isDemoMode(false)
            .build();

    // Disable ALL background protocols (Arduino/Demo) so they don't interfere with
    // the manual lap test injections
    ProtocolDelegate delegate = new ProtocolDelegate(new ArrayList<>());
    delegate.setListener(race);
    race.injectProtocols(delegate);
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
    racing.onLap(0, 1.0, 1, false); // Reaction
    racing.onLap(0, 5.0, 1, false); // Lap 1

    assertNotNull(race.getCurrentHeat().getDrivers().get(0).getLaps());
  }

  @Test
  public void testTeamDriverRotation_CreditsCorrectDriver() {
    Racing racing = new Racing();
    race.changeState(racing);

    DriverHeatData teamHeatData = race.getCurrentHeat().getDrivers().get(0);

    // 0. Reaction time (first trigger)
    racing.onLap(0, 1.0, 1, false);

    // 1. Set Actual Driver to Driver 1
    Driver driver1 = new Driver("Driver 1", "D1", "d1", new ObjectId());
    teamHeatData.setActualDriver(driver1);

    // Simulate lap 1
    racing.onLap(0, 5.0, 1, false);

    // 2. Set Actual Driver to Driver 2
    Driver driver2 = new Driver("Driver 2", "D2", "d2", new ObjectId());
    teamHeatData.setActualDriver(driver2);

    // Simulate lap 2
    racing.onLap(0, 6.0, 1, false);

    // 3. Verify
    List<DriverHeatData.LapData> laps = teamHeatData.getLaps();
    assertEquals("Should record 2 laps total", 2, laps.size());
    assertEquals("Lap 1 should credit driver 1", "d1", laps.get(0).getDriverId());
    assertEquals("Lap 2 should credit driver 2", "d2", laps.get(1).getDriverId());
  }
}
