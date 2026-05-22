package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.CustomHeat;
import com.antigravity.models.CustomRotation;
import com.antigravity.models.GroupOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class HeatBuilderGroupTest {

  private com.antigravity.race.Race race;
  private Race raceModel;
  private Track track;
  private HeatScoring heatScoring;

  @Before
  public void setUp() {
    race = mock(com.antigravity.race.Race.class);
    raceModel = mock(Race.class);
    track = mock(Track.class);
    when(race.getRaceModel()).thenReturn(raceModel);
    when(race.getTrack()).thenReturn(track);
    heatScoring = new HeatScoring();
    when(raceModel.getHeatScoring()).thenReturn(heatScoring);

    // Mock 4 lanes
    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("Blue", "blue", 1));
    lanes.add(new Lane("Red", "red", 2));
    lanes.add(new Lane("White", "white", 3));
    lanes.add(new Lane("Yellow", "yellow", 4));
    when(track.getLanes()).thenReturn(lanes);

    // Default rotation
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.RoundRobin);
  }

  @Test
  public void testGetGroups_BasicSplit() {
    List<RaceParticipant> drivers = createDrivers(8);
    // 8 drivers, 4 lanes -> 2 groups of 4
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, false, true, false);
    assertEquals(8, groups.size());
    // Sequential distribution (balanceSeeds = false)
    // Group 0: 0, 1, 2, 3
    // Group 1: 4, 5, 6, 7
    for (int i = 0; i < 4; i++) assertEquals(0, (int) groups.get(i));
    for (int i = 4; i < 8; i++) assertEquals(1, (int) groups.get(i));
  }

  @Test
  public void testGetGroups_BalanceSeeds() {
    List<RaceParticipant> drivers = createDrivers(8);
    // balanceSeeds = true
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, true, true, false);
    assertEquals(8, groups.size());
    // Round-robin distribution
    // Group 0: 0, 2, 4, 6
    // Group 1: 1, 3, 5, 7
    assertEquals(0, (int) groups.get(0));
    assertEquals(1, (int) groups.get(1));
    assertEquals(0, (int) groups.get(2));
    assertEquals(1, (int) groups.get(3));
  }

  @Test
  public void testGetGroups_MaxGroups() {
    List<RaceParticipant> drivers = createDrivers(12);
    // 12 drivers, 4 lanes -> normally 3 groups. Max 2 groups.
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 2, false, true, false);
    // Should be 2 groups of 6
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
    // 6 drivers, 4 lanes -> normally 2 groups (3 each).
    // If allowEmptyLanes = false, it must ensure at least 4 drivers per group if possible.
    // 6 drivers / 2 groups = 3. 3 < 4. So it should reduce to 1 group.
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 10, false, false, false);
    for (int g : groups) assertEquals(0, g);
  }

  @Test
  public void testGetGroups_ForceMultiple() {
    List<RaceParticipant> drivers = createDrivers(10);
    // 10 drivers, 4 lanes -> 3 groups (3, 3, 4).
    // maxGroups = 4. forceMultiple = true. 4 is multiple of 4, 2, 1.
    // Closest multiple below 3 is 2.
    List<Integer> groups = HeatBuilder.getGroups(drivers, 4, 4, false, true, true);
    // Should be 2 groups of 5
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
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, false, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(1);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    // Group 0 (4 drivers) -> 4 heats
    // Group 1 (4 drivers) -> 4 heats
    // Total 8 heats
    assertEquals(8, heats.size());

    // First 4 heats should be Group 0
    for (int i = 0; i < 4; i++) assertEquals(0, heats.get(i).getGroup());
    // Next 4 heats should be Group 1
    for (int i = 4; i < 8; i++) assertEquals(1, heats.get(i).getGroup());
  }

  @Test
  public void testBuildHeats_RotateGroups() {
    List<RaceParticipant> drivers = createDrivers(8);
    // rotateGroupHeats = true
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, true, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(1);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    assertEquals(8, heats.size());

    // Should be interspersed: G0-H1, G1-H1, G0-H2, G1-H2, etc.
    assertEquals(0, heats.get(0).getGroup());
    assertEquals(1, heats.get(1).getGroup());
    assertEquals(0, heats.get(2).getGroup());
    assertEquals(1, heats.get(3).getGroup());
  }

  @Test
  public void testBuildHeats_WithGroupsAndTimesThrough() {
    List<RaceParticipant> drivers = createDrivers(8);
    // 8 drivers, 4 lanes -> 2 groups of 4
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, false, 0);
    when(raceModel.getGroupOptions()).thenReturn(groupOptions);
    when(raceModel.getHeatTimesThrough()).thenReturn(2);

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    // 2 groups of 4 drivers -> 4 heats per group. Total 8 heats per rotation. 2 rotations = 16
    // heats.
    assertEquals(16, heats.size());

    // First 8 heats: G0, G0, G0, G0, G1, G1, G1, G1
    for (int i = 0; i < 4; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 0", 0, heats.get(i).getGroup());
    for (int i = 4; i < 8; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 1", 1, heats.get(i).getGroup());

    // Next 8 heats (duplication): should have the same group assignments
    for (int i = 8; i < 12; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 0", 0, heats.get(i).getGroup());
    for (int i = 12; i < 16; i++)
      assertEquals("Heat " + (i + 1) + " should be Group 1", 1, heats.get(i).getGroup());
  }

  @Test
  public void testBuildHeats_CustomRotationIgnoresGroupSplitting() {
    when(raceModel.getHeatRotationType()).thenReturn(HeatRotationType.Custom);
    GroupOptions groupOptions = new GroupOptions(true, 2, false, true, false, false, 0);
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

    // Should NOT be split into groups (which would make 2 groups of 2).
    // It should generate heats from the full pool of 4 drivers, keeping the groups specified in
    // custom heats.
    assertEquals(2, heats.size());
    assertEquals(5, heats.get(0).getGroup());
    assertEquals(6, heats.get(1).getGroup());
  }

  private List<RaceParticipant> createDrivers(int count) {
    List<RaceParticipant> participants = new ArrayList<>();
    for (int i = 1; i <= count; i++) {
      participants.add(new RaceParticipant(new com.antigravity.models.Driver("D" + i, "d" + i)));
    }
    return participants;
  }
}
