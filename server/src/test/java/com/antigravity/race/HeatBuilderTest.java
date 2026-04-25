package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class HeatBuilderTest {

  private com.antigravity.race.Race race;
  private Race raceModel;
  private Track track;
  private HeatScoring heatScoring;

  @Before
  public void setUp() {
    race = mock(com.antigravity.race.Race.class);
    raceModel = mock(Race.class);
    track = mock(Track.class);
    heatScoring = mock(HeatScoring.class);

    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getTrack()).thenReturn(track);
    when(raceModel.getHeatScoring()).thenReturn(heatScoring);

    // Mock 4 lanes
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Blue", "blue", 1));
    lanes.add(new Lane("Red", "red", 2));
    lanes.add(new Lane("White", "white", 3));
    lanes.add(new Lane("Yellow", "yellow", 4));
    when(track.getLanes()).thenReturn(lanes);

    // Default scoring
    when(heatScoring.getHeatRanking()).thenReturn(HeatScoring.HeatRanking.LAP_COUNT);
    when(heatScoring.getHeatRankingTiebreaker())
        .thenReturn(HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME);

    // Default rotation
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
  }

  @Test
  public void testRoundRobin_WithTeam() {
    // Setup drivers
    List<RaceParticipant> participants = new ArrayList<>();

    // Create 3 solo drivers
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));
    participants.add(
        new RaceParticipant(
            new Driver(
                "D2", "d2", null, null, null, null, null, null, null, null, null, "2", null)));
    participants.add(
        new RaceParticipant(
            new Driver(
                "D3", "d3", null, null, null, null, null, null, null, null, null, "3", null)));

    // Create 1 team with 2 drivers
    Team team = new Team("Team1", null, Arrays.asList("TD1", "TD2"), "t1", null);
    RaceParticipant teamParticipant = new RaceParticipant(team);

    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(
        new Driver(
            "TeamDriver1",
            "TD1",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "td1",
            null));
    teamDrivers.add(
        new Driver(
            "TeamDriver2",
            "TD2",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "td2",
            null));

    teamParticipant.setTeamDrivers(teamDrivers);
    participants.add(teamParticipant); // Add as 4th participant

    // Build heats (4 participants, 4 lanes -> 4 heats)
    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    assertEquals(4, heats.size());

    // Verify team driver rotation
    // Team is participant index 3 (0-based)

    // Heat 1 (index 0)
    Heat h1 = heats.get(0);
    checkTeamDriverInHeat(h1, "td1"); // First driver (idx 0%2 = 0)

    // Heat 2 (index 1)
    Heat h2 = heats.get(1);
    checkTeamDriverInHeat(h2, "td2"); // Second driver (idx 1%2 = 1)

    // Heat 3 (index 2)
    Heat h3 = heats.get(2);
    checkTeamDriverInHeat(h3, "td1"); // First driver (idx 2%2 = 0)

    // Heat 4 (index 3)
    Heat h4 = heats.get(3);
    checkTeamDriverInHeat(h4, "td2"); // Second driver (idx 3%2 = 1)
  }

  @Test
  public void testFriendlyRoundRobin_WithTeam() {
    // FriendlyRoundRobin swaps sitouts. With 5 participants and 4 lanes:
    // P1, P2, P3, P4 are racing, P5 sits out.
    // In next heat, P5 rotates in.

    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.FriendlyRoundRobin);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 4; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    Team team = new Team("Team1", null, Arrays.asList("TD1", "TD2"), "t1", null);
    RaceParticipant teamParticipant = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(
        new Driver(
            "TeamDriver1",
            "TD1",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "td1",
            null));
    teamDrivers.add(
        new Driver(
            "TeamDriver2",
            "TD2",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "td2",
            null));
    teamParticipant.setTeamDrivers(teamDrivers);
    participants.add(teamParticipant); // 5th participant

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    assertEquals(5, heats.size());
    // Verify team driver rotation across heats, even when sitting out
    for (int i = 0; i < heats.size(); i++) {
      String expectedDriverId = (i % 2 == 0) ? "td1" : "td2";
      checkTeamDriverInHeat(heats.get(i), expectedDriverId, true);
    }
  }

  private void checkTeamDriverInHeat(Heat heat, String expectedDriverId) {
    checkTeamDriverInHeat(heat, expectedDriverId, false);
  }

  private void checkTeamDriverInHeat(Heat heat, String expectedDriverId, boolean allowMissing) {
    boolean teamFound = false;
    for (DriverHeatData dhd : heat.getDrivers()) {
      RaceParticipant rp = dhd.getDriver();
      if (rp.getTeam() != null && "t1".equals(rp.getTeam().getEntityId())) {
        teamFound = true;
        assertNotNull("Actual driver should be set", dhd.getActualDriver());
        assertEquals(
            "Incorrect team driver in Heat " + heat.getHeatNumber(),
            expectedDriverId,
            dhd.getActualDriver().getEntityId());
      }
    }
    if (!teamFound && !allowMissing) {
      fail("Team not found in heat " + heat.getHeatNumber());
    }
  }

  @Test
  public void testSingleHeat() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeat);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 10; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // 10 participants, 4 lanes -> 3 heats (ceil(10/4))
    assertEquals(3, heats.size());

    // Heat 1 should have 4 drivers (10/3 = 3.33 -> 4, 3, 3)
    assertEquals(4, countDrivers(heats.get(0)));
    // Heat 2 should have 3 drivers
    assertEquals(3, countDrivers(heats.get(1)));
    // Heat 3 should have 3 drivers
    assertEquals(3, countDrivers(heats.get(2)));

    // Verify sequence
    assertEquals("1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("4", heats.get(0).getDrivers().get(3).getActualDriver().getEntityId());
    assertEquals("5", heats.get(1).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("7", heats.get(1).getDrivers().get(2).getActualDriver().getEntityId());
    assertEquals("8", heats.get(2).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("10", heats.get(2).getDrivers().get(2).getActualDriver().getEntityId());
  }

  @Test
  public void testSingleHeatSolo() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeatSolo);
    when(raceModel.getSoloLaneIndex()).thenReturn(0);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 3; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // 3 participants -> 3 heats
    assertEquals(3, heats.size());

    // Each heat should have 1 driver in Lane 1
    for (int i = 0; i < 3; i++) {
      Heat h = heats.get(i);
      assertEquals(1, countDrivers(h));
      assertEquals(String.valueOf(i + 1), h.getDrivers().get(0).getActualDriver().getEntityId());

      // Other lanes (index 1, 2, 3) should be empty
      for (int l = 1; l < 4; l++) {
        assertEquals(
            Driver.EMPTY_DRIVER.getEntityId(),
            h.getDrivers().get(l).getActualDriver().getEntityId());
      }
    }
  }

  @Test
  public void testSingleHeatSoloWithCustomLane() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeatSolo);
    when(raceModel.getSoloLaneIndex()).thenReturn(2); // Lane 3

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    assertEquals(1, heats.size());
    Heat h = heats.get(0);
    assertEquals(1, countDrivers(h));

    // Lane 3 (index 2) should have the driver
    assertEquals("1", h.getDrivers().get(2).getActualDriver().getEntityId());

    // Other lanes should be empty
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(), h.getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(), h.getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(), h.getDrivers().get(3).getActualDriver().getEntityId());
  }

  @Test
  public void testSingleHeat_FiveDriversFourLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeat);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 5; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // ceil(5/4) = 2 heats
    assertEquals(2, heats.size());
    // Balanced: 5/2 = 2.5 -> 3, 2
    assertEquals(3, countDrivers(heats.get(0)));
    assertEquals(2, countDrivers(heats.get(1)));
  }

  @Test
  public void testSingleHeat_TwelveDriversSixLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeat);

    // Mock 6 lanes
    List<Lane> lanes = new ArrayList<>();
    for (int i = 1; i <= 6; i++) {
      lanes.add(new Lane("Lane" + i, "color" + i, i));
    }
    when(track.getLanes()).thenReturn(lanes);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 12; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // ceil(12/6) = 2 heats
    assertEquals(2, heats.size());
    // Balanced: 12/2 = 6 -> 6, 6
    assertEquals(6, countDrivers(heats.get(0)));
    assertEquals(6, countDrivers(heats.get(1)));
  }

  @Test
  public void testSingleHeat_ElevenDriversFourLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeat);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 11; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // ceil(11/4) = 3 heats
    assertEquals(3, heats.size());
    // Balanced: 11/3 = 3.66 -> 4, 4, 3
    assertEquals(4, countDrivers(heats.get(0)));
    assertEquals(4, countDrivers(heats.get(1)));
    assertEquals(3, countDrivers(heats.get(2)));
  }

  @Test
  public void testSingleHeat_FourDriversFourLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeat);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 4; i++) {
      participants.add(
          new RaceParticipant(
              new Driver(
                  "D" + i,
                  "d" + i,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  String.valueOf(i),
                  null)));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants);

    // ceil(4/4) = 1 heat
    assertEquals(1, heats.size());
    // Balanced: 4/1 = 4 -> 4
    assertEquals(4, countDrivers(heats.get(0)));
  }

  private int countDrivers(Heat heat) {
    int count = 0;
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd.getActualDriver() != null
          && !Driver.EMPTY_DRIVER.getEntityId().equals(dhd.getActualDriver().getEntityId())) {
        count++;
      }
    }
    return count;
  }
}
