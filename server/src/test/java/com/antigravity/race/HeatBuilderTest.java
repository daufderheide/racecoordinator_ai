package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.Driver;
import com.antigravity.models.GroupOptions;
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
    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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
  public void testSingleHeatSoloAllLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.SingleHeatSoloAllLanes);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 2; i++) {
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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    // 2 participants -> 2 heats
    assertEquals(2, heats.size());

    // Each heat should assign the participant to all 4 lanes
    for (int hIdx = 0; hIdx < 2; hIdx++) {
      Heat h = heats.get(hIdx);
      assertEquals(4, countDrivers(h));
      for (int l = 0; l < 4; l++) {
        assertEquals(
            String.valueOf(hIdx + 1), h.getDrivers().get(l).getActualDriver().getEntityId());
      }
    }
  }

  @Test
  public void testSingleHeatSoloAllLanesAccumulate() {
    when(raceModel.getHeatRotationType())
        .thenReturn(HeatRotationType.SingleHeatSoloAllLanesAccumulate);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 2; i++) {
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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    // 2 participants -> 2 heats
    assertEquals(2, heats.size());

    // Each heat should assign the participant to all 4 lanes
    for (int hIdx = 0; hIdx < 2; hIdx++) {
      Heat h = heats.get(hIdx);
      assertEquals(4, countDrivers(h));
      for (int l = 0; l < 4; l++) {
        assertEquals(
            String.valueOf(hIdx + 1), h.getDrivers().get(l).getActualDriver().getEntityId());
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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    // ceil(4/4) = 1 heat
    assertEquals(1, heats.size());
    // Balanced: 4/1 = 4 -> 4
    assertEquals(4, countDrivers(heats.get(0)));
  }

  @Test
  public void testCustomRoundRobin() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Integer> customSequence = Arrays.asList(4, 3, 2, 1); // Reverse rotation
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

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

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(4, heats.size());

    // Heat 1 (index 0): (0+0)%4 = 0 -> sequence[0]=4 -> Lane 4
    // Driver 1 should be in Lane 4 (index 3)
    assertEquals("1", heats.get(0).getDrivers().get(3).getActualDriver().getEntityId());

    // Heat 2 (index 1): (1+0)%4 = 1 -> sequence[1]=3 -> Lane 3
    // Driver 1 should be in Lane 3 (index 2)
    assertEquals("1", heats.get(1).getDrivers().get(2).getActualDriver().getEntityId());

    // Heat 3 (index 2): (2+0)%4 = 2 -> sequence[2]=2 -> Lane 2
    // Driver 1 should be in Lane 2 (index 1)
    assertEquals("1", heats.get(2).getDrivers().get(1).getActualDriver().getEntityId());

    // Heat 4 (index 3): (3+0)%4 = 3 -> sequence[3]=1 -> Lane 1
    // Driver 1 should be in Lane 1 (index 0)
    assertEquals("1", heats.get(3).getDrivers().get(0).getActualDriver().getEntityId());
  }

  @Test
  public void testCustomRoundRobin_FewerDriversThanTrackLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Lane> sixLanes = new ArrayList<>();
    for (int i = 1; i <= 6; i++) {
      sixLanes.add(new Lane("Lane " + i, "color" + i, i));
    }
    when(track.getLanes()).thenReturn(sixLanes);

    List<Integer> customSequence = Arrays.asList(2, 3, 4, 5);
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 4; i++) {
      Driver driver =
          new Driver(
              "Driver " + i,
              "D" + i,
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
              null);
      participants.add(new RaceParticipant(driver));
    }

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(4, heats.size());

    // Heat 1: L1=Empty, L2=D1, L3=D2, L4=D3, L5=D4, L6=Empty
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("1", heats.get(0).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("2", heats.get(0).getDrivers().get(2).getActualDriver().getEntityId());
    assertEquals("3", heats.get(0).getDrivers().get(3).getActualDriver().getEntityId());
    assertEquals("4", heats.get(0).getDrivers().get(4).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(0).getDrivers().get(5).getActualDriver().getEntityId());

    // Heat 2: L1=Empty, L2=D4, L3=D1, L4=D2, L5=D3, L6=Empty
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(1).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("4", heats.get(1).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("1", heats.get(1).getDrivers().get(2).getActualDriver().getEntityId());
    assertEquals("2", heats.get(1).getDrivers().get(3).getActualDriver().getEntityId());
    assertEquals("3", heats.get(1).getDrivers().get(4).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(1).getDrivers().get(5).getActualDriver().getEntityId());

    // Heat 3: L1=Empty, L2=D3, L3=D4, L4=D1, L5=D2, L6=Empty
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(2).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("3", heats.get(2).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("4", heats.get(2).getDrivers().get(2).getActualDriver().getEntityId());
    assertEquals("1", heats.get(2).getDrivers().get(3).getActualDriver().getEntityId());
    assertEquals("2", heats.get(2).getDrivers().get(4).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(2).getDrivers().get(5).getActualDriver().getEntityId());

    // Heat 4: L1=Empty, L2=D2, L3=D3, L4=D4, L5=D1, L6=Empty
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(3).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("2", heats.get(3).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("3", heats.get(3).getDrivers().get(2).getActualDriver().getEntityId());
    assertEquals("4", heats.get(3).getDrivers().get(3).getActualDriver().getEntityId());
    assertEquals("1", heats.get(3).getDrivers().get(4).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(3).getDrivers().get(5).getActualDriver().getEntityId());
  }

  @Test
  public void testCustomRoundRobin_WithPaddedEmptyDrivers() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Lane> sixLanes = new ArrayList<>();
    for (int i = 1; i <= 6; i++) {
      sixLanes.add(new Lane("Lane " + i, "color" + i, i));
    }
    when(track.getLanes()).thenReturn(sixLanes);

    List<Integer> customSequence = Arrays.asList(2, 3, 4, 5);
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= 4; i++) {
      Driver driver =
          new Driver(
              "Driver " + i,
              "D" + i,
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
              null);
      participants.add(new RaceParticipant(driver));
    }
    participants.add(new RaceParticipant(Driver.EMPTY_DRIVER));
    participants.add(new RaceParticipant(Driver.EMPTY_DRIVER));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(4, heats.size());
    assertEquals("4", heats.get(1).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("1", heats.get(1).getDrivers().get(2).getActualDriver().getEntityId());
  }

  @Test(expected = IllegalArgumentException.class)
  public void testCustomRoundRobin_DuplicateLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Integer> customSequence = Arrays.asList(1, 2, 2, 4); // Duplicate lane 2
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));

    HeatBuilder.buildHeats(race, participants, new ArrayList<>());
  }

  @Test(expected = IllegalArgumentException.class)
  public void testCustomRoundRobin_NullLane() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Integer> customSequence = Arrays.asList(1, null, 3);
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));

    HeatBuilder.buildHeats(race, participants, new ArrayList<>());
  }

  @Test
  public void testCustomRoundRobin_MultipleZeros() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Integer> customSequence =
        Arrays.asList(1, 0, 2, 0); // Zeros (sit-outs) allowed multiple times
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());
    assertEquals(4, heats.size());

    // Heat 1: Lane 1
    assertEquals("1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    // Heat 2: Sit out (Lane 0)
    assertEquals(0, countDrivers(heats.get(1)));
    // Heat 3: Lane 2
    assertEquals("1", heats.get(2).getDrivers().get(1).getActualDriver().getEntityId());
    // Heat 4: Sit out
    assertEquals(0, countDrivers(heats.get(3)));
  }

  @Test
  public void testCustomRoundRobin_OutOfBoundsLanes() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.CustomRoundRobin);
    List<Integer> customSequence = Arrays.asList(1, 99); // 99 is out of bounds for 4-lane track
    when(raceModel.getCustomRotationSequence()).thenReturn(customSequence);

    List<RaceParticipant> participants = new ArrayList<>();
    participants.add(
        new RaceParticipant(
            new Driver(
                "D1", "d1", null, null, null, null, null, null, null, null, null, "1", null)));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());
    assertEquals(2, heats.size());

    // Heat 1: Lane 1
    assertEquals("1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    // Heat 2: Lane 99 -> skipped
    assertEquals(0, countDrivers(heats.get(1)));
  }

  @Test
  public void testCustomRotation() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);

    CustomRotation rot4 =
        new CustomRotation(
            4,
            Arrays.asList(
                new CustomHeat(Arrays.asList(1, 2, 3, 4), 1),
                new CustomHeat(Arrays.asList(4, 3, 2, 1), 2)));
    CustomRotation rot6 =
        new CustomRotation(
            6,
            Arrays.asList(
                new CustomHeat(Arrays.asList(1, 0, 2, 0), 0),
                new CustomHeat(Arrays.asList(0, 3, 0, 4), 0)));

    List<CustomRotation> customRotations = Arrays.asList(rot4, rot6);

    // Test with 4 drivers (Exact match)
    List<RaceParticipant> drivers4 = createDrivers(4);
    List<Heat> heats4 = HeatBuilder.buildHeats(race, drivers4, customRotations);
    assertEquals(2, heats4.size());
    assertEquals("1", heats4.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("2", heats4.get(0).getDrivers().get(1).getActualDriver().getEntityId());
    assertEquals("4", heats4.get(1).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals(1, heats4.get(0).getGroup());
    assertEquals(2, heats4.get(1).getGroup());

    // Test with 5 drivers (Closest above -> 6)
    List<RaceParticipant> drivers5 = createDrivers(5);
    List<Heat> heats5 = HeatBuilder.buildHeats(race, drivers5, customRotations);
    assertEquals(2, heats5.size());
    assertEquals("1", heats5.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats5.get(0).getDrivers().get(1).getActualDriver().getEntityId()); // value 0
    assertEquals("2", heats5.get(0).getDrivers().get(2).getActualDriver().getEntityId()); // value 2
    assertEquals(0, heats5.get(0).getGroup());
    assertEquals(0, heats5.get(1).getGroup());

    // Test with 7 drivers (Closest below -> 6)
    List<RaceParticipant> drivers7 = createDrivers(7);
    List<Heat> heats7 = HeatBuilder.buildHeats(race, drivers7, customRotations);
    assertEquals(2, heats7.size());
    assertEquals("1", heats7.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("2", heats7.get(0).getDrivers().get(2).getActualDriver().getEntityId());
  }

  @Test
  public void testCustomRotation_WithTeam() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);

    // Create a team with 2 drivers
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

    // 1 participant (the team)
    List<RaceParticipant> participants = Arrays.asList(teamParticipant);

    // Custom rotation for 1 driver, 2 heats, driver in lane 1 both times
    CustomRotation rot1 =
        new CustomRotation(
            1,
            Arrays.asList(
                new CustomHeat(Arrays.asList(1, 0, 0, 0)),
                new CustomHeat(Arrays.asList(1, 0, 0, 0))));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, Arrays.asList(rot1));

    assertEquals(2, heats.size());

    // Heat 1: First team driver
    assertEquals("td1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    // Heat 2: Second team driver
    assertEquals("td2", heats.get(1).getDrivers().get(0).getActualDriver().getEntityId());
  }

  @Test
  public void testCustomRotation_WithSitOut() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);

    List<RaceParticipant> participants = createDrivers(2);

    // Custom rotation for 2 drivers, 2 heats
    // Heat 1: D1 in Lane 1, D2 sits out (0)
    // Heat 2: D1 sits out (0), D2 in Lane 2
    CustomRotation rot =
        new CustomRotation(
            2,
            Arrays.asList(
                new CustomHeat(Arrays.asList(1, 0, 0, 0)),
                new CustomHeat(Arrays.asList(0, 2, 0, 0))));

    List<Heat> heats = HeatBuilder.buildHeats(race, participants, Arrays.asList(rot));

    assertEquals(2, heats.size());

    // Heat 1
    assertEquals("1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(0).getDrivers().get(1).getActualDriver().getEntityId());

    // Heat 2
    assertEquals(
        Driver.EMPTY_DRIVER.getEntityId(),
        heats.get(1).getDrivers().get(0).getActualDriver().getEntityId());
    assertEquals("2", heats.get(1).getDrivers().get(1).getActualDriver().getEntityId());
  }

  @Test
  public void testHeatTimesThrough() {
    when(raceModel.getHeatTimesThrough()).thenReturn(2);

    List<RaceParticipant> participants = createDrivers(2);
    // 4 lanes -> 4 heats per rotation. 2 rotations = 8 heats.
    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(8, heats.size());

    // Verify numbering
    for (int i = 0; i < 8; i++) {
      assertEquals(i + 1, heats.get(i).getHeatNumber());
    }

    // Verify duplication (Heat 1 should be same as Heat 5 in terms of driver positions)
    for (int i = 0; i < 4; i++) {
      List<DriverHeatData> d1 = heats.get(i).getDrivers();
      List<DriverHeatData> d2 = heats.get(i + 4).getDrivers();
      assertEquals(d1.size(), d2.size());
      for (int l = 0; l < d1.size(); l++) {
        assertEquals(
            d1.get(l).getActualDriver().getEntityId(), d2.get(l).getActualDriver().getEntityId());
      }
    }
  }

  @Test
  public void testReverseHeats() {
    when(raceModel.isReverseHeats()).thenReturn(true);

    List<RaceParticipant> participants = createDrivers(4);
    // 4 drivers, 4 lanes -> 4 heats.
    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(4, heats.size());

    // Heat 1 (originally Heat 4)
    assertEquals(1, heats.get(0).getHeatNumber());
    // In standard RoundRobin with 4 drivers/4 lanes, Heat 4 (index 3) has Driver 4 in Lane 1 (index
    // 0)
    // Rotation sequence: [1, 2, 3, 4]
    // Driver 4 (index 3): (3+3)%4 = 2. Sequence[2] = 3. So Driver 4 in Lane 3?
    // Wait, let's check getRoundRobinHeats logic:
    // for (int d = 0; d < drivers.size(); d++) {
    //   int v = (h + d) % numHeats;
    //   int lane = rotationSequence.get(v);
    // h=3 (Heat 4), d=3 (Driver 4). v=(3+3)%4 = 2. rotationSequence.get(2) = 3.
    // So Driver 4 in Lane 3 (index 2).

    // Let's check Driver 1 in Heat 1 vs Heat 4.
    // Heat 1 (h=0), Driver 1 (d=0). v=0. lane=1 (index 0).
    // Heat 4 (h=3), Driver 1 (d=0). v=3. lane=4 (index 3).

    // If reversed, Heat 1 is old Heat 4.
    assertEquals("1", heats.get(0).getDrivers().get(3).getActualDriver().getEntityId());
  }

  @Test
  public void testHeatTimesThrough_WithTeam() {
    when(raceModel.getHeatTimesThrough()).thenReturn(2);

    // Create 1 team with 2 drivers
    Team team = new Team("Team1", null, Arrays.asList("TD1", "TD2"), "t1", null);
    RaceParticipant teamParticipant = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(new Driver("TD1", "TD1", "td1", null));
    teamDrivers.add(new Driver("TD2", "TD2", "td2", null));
    teamParticipant.setTeamDrivers(teamDrivers);

    List<RaceParticipant> participants = Arrays.asList(teamParticipant);

    // 4 lanes -> 4 heats per rotation. 2 rotations = 8 heats.
    List<Heat> heats = HeatBuilder.buildHeats(race, participants, new ArrayList<>());

    assertEquals(8, heats.size());

    // Team driver rotation should continue
    // Heat 1: td1 (0%2) in Lane 1 (index 0)
    assertEquals("td1", heats.get(0).getDrivers().get(0).getActualDriver().getEntityId());
    // Heat 2: td2 (1%2) in Lane 2 (index 1)
    assertEquals("td2", heats.get(1).getDrivers().get(1).getActualDriver().getEntityId());
    // Heat 5: td1 (4%2) in Lane 1 (index 0)
    assertEquals("td1", heats.get(4).getDrivers().get(0).getActualDriver().getEntityId());
  }

  @Test
  public void testGetGroups_BasicSplit() {
    List<RaceParticipant> drivers = createDrivers(8);
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, false, true, false);
    assertEquals(8, groups.size());
    for (int i = 0; i < 4; i++) assertEquals(0, (int) groups.get(i));
    for (int i = 4; i < 8; i++) assertEquals(1, (int) groups.get(i));
  }

  @Test
  public void testGetGroups_BalanceSeeds() {
    List<RaceParticipant> drivers = createDrivers(8);
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, true, true, false);
    assertEquals(8, groups.size());
    assertEquals(0, (int) groups.get(0));
    assertEquals(1, (int) groups.get(1));
    assertEquals(0, (int) groups.get(2));
    assertEquals(1, (int) groups.get(3));
  }

  @Test
  public void testGetGroups_MaxGroups() {
    List<RaceParticipant> drivers = createDrivers(12);
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 2, false, true, false);
    int g0Count = 0;
    int g1Count = 0;
    for (int g : groups) {
      if (g == 0) g0Count++;
      if (g == 1) g1Count++;
    }
    assertEquals(6, g0Count);
    assertEquals(6, g1Count);
  }

  @Test
  public void testGetGroups_NoEmptyLanes() {
    List<RaceParticipant> drivers = createDrivers(6);
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, false, false, false);
    for (int g : groups) assertEquals(0, g);
  }

  @Test
  public void testGetGroups_ForceMultiple() {
    List<RaceParticipant> drivers = createDrivers(10);
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 4, false, true, true);
    int g0Count = 0;
    int g1Count = 0;
    for (int g : groups) {
      if (g == 0) g0Count++;
      if (g == 1) g1Count++;
    }
    assertEquals(5, g0Count);
    assertEquals(5, g1Count);
  }

  @Test
  public void testBuildHeats_WithGroups() {
    List<RaceParticipant> drivers = createDrivers(8);
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, false, true, false, false, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(1);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    assertEquals(8, heats.size());
    for (int i = 0; i < 4; i++) assertEquals(0, heats.get(i).getGroup());
    for (int i = 4; i < 8; i++) assertEquals(1, heats.get(i).getGroup());
  }

  @Test
  public void testBuildHeats_RotateGroups() {
    List<RaceParticipant> drivers = createDrivers(8);
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, false, true, false, true, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(1);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    assertEquals(8, heats.size());
    assertEquals(0, heats.get(0).getGroup());
    assertEquals(1, heats.get(1).getGroup());
    assertEquals(0, heats.get(2).getGroup());
    assertEquals(1, heats.get(3).getGroup());
  }

  @Test
  public void testBuildHeats_WithGroupsAndTimesThrough() {
    List<RaceParticipant> drivers = createDrivers(8);
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, false, true, false, false, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(2);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    assertEquals(16, heats.size());
    for (int i = 0; i < 4; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 0", 0, heats.get(i).getGroup());
    for (int i = 4; i < 8; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 1", 1, heats.get(i).getGroup());
    for (int i = 8; i < 12; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 0", 0, heats.get(i).getGroup());
    for (int i = 12; i < 16; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 1", 1, heats.get(i).getGroup());
  }

  @Test
  public void testBuildHeats_CustomRotationIgnoresGroupSplitting() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);
    com.antigravity.models.GroupOptions groupOptions =
        new com.antigravity.models.GroupOptions(true, 2, false, true, false, false, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(1);

    CustomRotation rot4 =
        new CustomRotation(
            4,
            Arrays.asList(
                new CustomHeat(Arrays.asList(1, 2, 3, 4), 5),
                new CustomHeat(Arrays.asList(4, 3, 2, 1), 6)));

    List<RaceParticipant> drivers = createDrivers(4);
    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, Arrays.asList(rot4));

    assertEquals(2, heats.size());
    assertEquals(5, heats.get(0).getGroup());
    assertEquals(6, heats.get(1).getGroup());
  }

  private List<RaceParticipant> createDrivers(int count) {
    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= count; i++) {
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
    return participants;
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

  private List<RaceParticipant> createStepUpDrivers(int count) {
    List<RaceParticipant> drivers = new ArrayList<>();
    for (int i = 1; i <= count; i++) {
      Driver d = new Driver("d" + i, "Driver " + i);
      RaceParticipant p = new RaceParticipant(d);
      p.setSeed(i);
      drivers.add(p);
    }
    return drivers;
  }

  @Test
  public void testStepUp_4Lanes_5Drivers_StepUp1() {
    when(raceModel.getStepUp()).thenReturn(1);
    List<RaceParticipant> drivers = createStepUpDrivers(5);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);
    assertFalse(heats.isEmpty());

    List<Heat> step1Heats = new ArrayList<>();
    List<Heat> step2Heats = new ArrayList<>();
    for (Heat h : heats) {
      if (h.getStep() == 1) {
        step1Heats.add(h);
      } else if (h.getStep() == 2) {
        step2Heats.add(h);
      }
    }

    assertFalse(step1Heats.isEmpty());
    assertFalse(step2Heats.isEmpty());

    Heat lastStep1Heat = step1Heats.get(step1Heats.size() - 1);
    assertTrue(lastStep1Heat.isStepUpBoundary());

    for (Heat h : step1Heats) {
      for (DriverHeatData dhd : h.getDrivers()) {
        if (dhd.getDriver() != null && !dhd.getDriver().isEmptyParticipant()) {
          assertFalse(dhd.getDriver().isStepUp());
        }
      }
    }

    for (Heat h : step2Heats) {
      int stepUpCount = 0;
      for (DriverHeatData dhd : h.getDrivers()) {
        if (dhd.getDriver() != null && dhd.getDriver().isStepUp()) {
          stepUpCount++;
        }
      }
      assertEquals(1, stepUpCount);
    }
  }

  @Test
  public void testStepUp_4Lanes_7Drivers_StepUp1() {
    when(raceModel.getStepUp()).thenReturn(1);
    List<RaceParticipant> drivers = createStepUpDrivers(7);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);

    for (Heat h : heats) {
      assertTrue(h.getStep() == 1 || h.getStep() == 2);
    }
  }

  @Test
  public void testStepUp_4Lanes_8Drivers_StepUp1() {
    when(raceModel.getStepUp()).thenReturn(1);
    List<RaceParticipant> drivers = createStepUpDrivers(8);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);

    int maxStep = 0;
    int boundaryCount = 0;
    for (Heat h : heats) {
      if (h.getStep() > maxStep) {
        maxStep = h.getStep();
      }
      if (h.isStepUpBoundary()) {
        boundaryCount++;
      }
    }
    assertEquals(3, maxStep);
    assertEquals(2, boundaryCount);
  }

  @Test
  public void testStepUp_4Lanes_6Drivers_StepUp2() {
    when(raceModel.getStepUp()).thenReturn(2);
    List<RaceParticipant> drivers = createStepUpDrivers(6);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);

    for (Heat h : heats) {
      if (h.getStep() == 2) {
        int stepUpCount = 0;
        for (DriverHeatData dhd : h.getDrivers()) {
          if (dhd.getDriver() != null && dhd.getDriver().isStepUp()) {
            stepUpCount++;
          }
        }
        assertEquals(2, stepUpCount);
      }
    }
  }

  @Test
  public void testStepUp_DriversEqualOrLessThanLanes_NoStepUp() {
    when(raceModel.getStepUp()).thenReturn(1);
    List<RaceParticipant> drivers = createStepUpDrivers(4);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);

    for (Heat h : heats) {
      assertEquals(0, h.getStep());
      assertFalse(h.isStepUpBoundary());
    }
  }

  @Test
  public void testStepUp_GroupRace() {
    when(raceModel.getStepUp()).thenReturn(1);
    GroupOptions groupOptions = mock(GroupOptions.class);
    when(groupOptions.isEnabled()).thenReturn(true);
    when(groupOptions.getMaxGroups()).thenReturn(2);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);

    List<RaceParticipant> drivers = createStepUpDrivers(10);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);

    boolean foundGroup0 = false;
    boolean foundGroup1 = false;
    for (Heat h : heats) {
      if (h.getGroup() == 0) foundGroup0 = true;
      if (h.getGroup() == 1) foundGroup1 = true;
      assertTrue(h.getStep() >= 1);
    }
    assertTrue(foundGroup0);
    assertTrue(foundGroup1);
  }

  @Test
  public void testStepUp_GroupRace_RotateGroupHeats_InterleavesEachStep() {
    when(raceModel.getStepUp()).thenReturn(1);
    GroupOptions groupOptions = mock(GroupOptions.class);
    when(groupOptions.isEnabled()).thenReturn(true);
    when(groupOptions.getMaxGroups()).thenReturn(2);
    when(groupOptions.isRotateGroupHeats()).thenReturn(true);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);

    List<RaceParticipant> drivers = createStepUpDrivers(10);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
    assertNotNull(heats);
    assertFalse(heats.isEmpty());

    // Verify step synchronization: once Step 2 starts, no Step 1 heats appear
    boolean step2Started = false;
    for (Heat h : heats) {
      if (h.getStep() == 2) {
        step2Started = true;
      }
      if (step2Started) {
        assertNotEquals("Step 1 heat appeared after Step 2 started", 1, h.getStep());
      }
    }

    // Verify interleaving within Step 1 and Step 2
    List<Heat> step1Heats = new ArrayList<>();
    List<Heat> step2Heats = new ArrayList<>();
    for (Heat h : heats) {
      if (h.getStep() == 1) {
        step1Heats.add(h);
      } else if (h.getStep() == 2) {
        step2Heats.add(h);
      }
    }

    assertFalse(step1Heats.isEmpty());
    assertFalse(step2Heats.isEmpty());

    // Check that groups alternate within step 1
    for (int i = 0; i < step1Heats.size() - 1; i++) {
      assertNotEquals(
          "Adjacent heats within step 1 should belong to different groups",
          step1Heats.get(i).getGroup(),
          step1Heats.get(i + 1).getGroup());
    }

    // Check that groups alternate within step 2
    for (int i = 0; i < step2Heats.size() - 1; i++) {
      assertNotEquals(
          "Adjacent heats within step 2 should belong to different groups",
          step2Heats.get(i).getGroup(),
          step2Heats.get(i + 1).getGroup());
    }

    // Both groups have a boundary in step 1
    long step1Boundaries = step1Heats.stream().filter(Heat::isStepUpBoundary).count();
    assertEquals(2, step1Boundaries);
  }

  @Test(expected = IllegalArgumentException.class)
  public void testStepUp_ExceedsLanesMinusOne_ThrowsException() {
    when(raceModel.getStepUp()).thenReturn(4); // 4 lanes, max stepUp is 3
    List<RaceParticipant> drivers = createStepUpDrivers(6);
    HeatBuilder.buildHeats(race, drivers, new ArrayList<>());
  }

  @Test
  public void testCustomRotationWithStepUpsAndBoundaries() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);

    // Rotation with 4 regular drivers and step-ups in step 2
    CustomHeat h1 = new CustomHeat(Arrays.asList(1, 2, 3, 4), 0, false, 1);
    CustomHeat h2 = new CustomHeat(Arrays.asList(4, 3, 2, 1), 0, true, 1);
    CustomHeat h3 = new CustomHeat(Arrays.asList(-1, -2, 1, 2), 0, false, 2);

    CustomRotation rot = new CustomRotation(4, Arrays.asList(h1, h2, h3));
    List<RaceParticipant> drivers = createDrivers(4);
    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, Arrays.asList(rot));

    assertEquals(3, heats.size());
    assertEquals(1, heats.get(0).getStep());
    assertFalse(heats.get(0).isStepUpBoundary());
    assertEquals(1, heats.get(1).getStep());
    assertTrue(heats.get(1).isStepUpBoundary());
    assertEquals(2, heats.get(2).getStep());
    assertFalse(heats.get(2).isStepUpBoundary());

    // Lane 0 and 1 of heat 3 have step-ups
    assertTrue(heats.get(2).getDrivers().get(0).getDriver().isStepUpParticipant());
    assertEquals(1, heats.get(2).getDrivers().get(0).getStepUpLaneIndex());
    assertTrue(heats.get(2).getDrivers().get(1).getDriver().isStepUpParticipant());
    assertEquals(2, heats.get(2).getDrivers().get(1).getStepUpLaneIndex());
    assertFalse(heats.get(2).getDrivers().get(2).getDriver().isStepUpParticipant());
  }

  @Test
  public void testCustomRotationWithGroupsAndStepUps() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);

    // Group 1: Heat 1 (step 1 boundary), Heat 3 (step 2)
    // Group 2: Heat 2 (step 1 boundary), Heat 4 (step 2)
    CustomHeat h1 = new CustomHeat(Arrays.asList(1, 2, 0, 0), 1, true, 0); // group 1
    CustomHeat h2 = new CustomHeat(Arrays.asList(3, 4, 0, 0), 2, true, 0); // group 2
    CustomHeat h3 = new CustomHeat(Arrays.asList(-1, 0, 0, 0), 1, false, 0); // group 1 step 2
    CustomHeat h4 = new CustomHeat(Arrays.asList(-1, 0, 0, 0), 2, false, 0); // group 2 step 2

    CustomRotation rot = new CustomRotation(4, Arrays.asList(h1, h2, h3, h4));
    List<RaceParticipant> drivers = createDrivers(4);
    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, Arrays.asList(rot));

    assertEquals(4, heats.size());
    // Steps computed automatically per group:
    assertEquals(1, heats.get(0).getStep());
    assertTrue(heats.get(0).isStepUpBoundary());
    assertEquals(1, heats.get(1).getStep());
    assertTrue(heats.get(1).isStepUpBoundary());
    assertEquals(2, heats.get(2).getStep());
    assertEquals(2, heats.get(3).getStep());
    assertTrue(heats.get(2).getDrivers().get(0).getDriver().isStepUpParticipant());
    assertTrue(heats.get(3).getDrivers().get(0).getDriver().isStepUpParticipant());
  }
}
