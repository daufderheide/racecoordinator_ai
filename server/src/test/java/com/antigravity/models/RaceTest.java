package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class RaceTest {

  @Test
  public void testRaceBuilderWithGroupOptions() {
    GroupOptions groupOptions = new GroupOptions(true, 4, true, false, true, false, 2);

    Race race = new Race.Builder().withName("Test Race").withGroupOptions(groupOptions).build();

    assertNotNull(race.getGroupOptions());
    assertTrue(race.getGroupOptions().isEnabled());
    assertEquals(4, race.getGroupOptions().getMaxGroups());
    assertTrue(race.getGroupOptions().isBalance());
    assertFalse(race.getGroupOptions().isAllowEmptyLanes());
    assertTrue(race.getGroupOptions().isForceMultipleOfMax());
    assertFalse(race.getGroupOptions().isRotateGroupHeats());
    assertEquals(2, race.getGroupOptions().getMinAdvancing());
  }

  @Test
  public void testRaceCloneWithGroupOptions() {
    GroupOptions groupOptions = new GroupOptions(true, 3, false, true, false, true, 1);
    Race original = new Race.Builder().withName("Original").withGroupOptions(groupOptions).build();

    Race cloned = new Race.Builder().from(original).build();

    assertNotNull(cloned.getGroupOptions());
    assertTrue(cloned.getGroupOptions().isEnabled());
    assertEquals(3, cloned.getGroupOptions().getMaxGroups());
    assertEquals(1, cloned.getGroupOptions().getMinAdvancing());
    assertTrue(cloned.getGroupOptions().isRotateGroupHeats());
  }

  @Test
  public void testRaceCloneWithPointsScoring() {
    PointsScoring ps = new PointsScoring(Arrays.asList(10.0), Arrays.asList(5.0));
    Race original = new Race.Builder().withName("Original").withPointsScoring(ps).build();

    Race cloned = new Race.Builder().from(original).build();

    assertNotNull(cloned.getPointsScoring());
    assertEquals(1, cloned.getPointsScoring().getPositionPoints().size());
    assertEquals(10.0, cloned.getPointsScoring().getPositionPoints().get(0), 0.001);
  }

  @Test
  public void testRaceConstructorWithNulls() {
    Race race =
        new Race.Builder()
            .withName("Race")
            .withTrackEntityId("track1")
            .withEntityId("race1")
            .build();

    assertNotNull(race.getGroupOptions());
    assertFalse(race.getGroupOptions().isEnabled());
    assertEquals(1, race.getGroupOptions().getMaxGroups());
    assertEquals(0, race.getGroupOptions().getMinAdvancing());
    assertEquals(1.5, race.getMinLapTime(), 0.001);
  }

  @Test
  public void testDefaultMinLapTime() {
    Race race = new Race.Builder().withName("Default Race").build();
    assertEquals(1.5, race.getMinLapTime(), 0.001);

    Race customMinLapRace = new Race.Builder().withName("Custom").withMinLapTime(2.5).build();
    assertEquals(2.5, customMinLapRace.getMinLapTime(), 0.001);
  }

  @Test
  public void testRaceCloneWithCrashAndLearnOptions() {
    CrashAndLearnOptions cnl =
        new CrashAndLearnOptions.Builder()
            .withEnabled(true)
            .withAutomatedCrashTime(6.0)
            .withMaxCrashes(4)
            .withHeatCrashLapPenalty(2.0)
            .build();
    Race original = new Race.Builder().withName("Original").withCrashAndLearnOptions(cnl).build();

    Race cloned = new Race.Builder().from(original).build();

    assertNotNull(cloned.getCrashAndLearnOptions());
    assertTrue(cloned.getCrashAndLearnOptions().isEnabled());
    assertEquals(6.0, cloned.getCrashAndLearnOptions().getAutomatedCrashTime(), 0.001);
    assertEquals(4, cloned.getCrashAndLearnOptions().getMaxCrashes());
    assertEquals(2.0, cloned.getCrashAndLearnOptions().getHeatCrashLapPenalty(), 0.001);
  }

  // Cars stay in their lanes, IROC (#1210)
  @Test
  public void testCarsStayInLanesIsOffByDefaultAndSurvivesCopyAndJson() throws Exception {
    assertFalse(new Race.Builder().withName("Plain").build().isCarsStayInLanes());

    Race iroc = new Race.Builder().withName("IROC").withCarsStayInLanes(true).build();
    assertTrue(new Race.Builder().from(iroc).build().isCarsStayInLanes());

    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(iroc);
    assertTrue(json.contains("\"cars_stay_in_lanes\":true"));
    assertTrue(mapper.readValue(json, Race.class).isCarsStayInLanes());
    assertTrue(
        "the camelCase name is read too",
        mapper
            .readValue("{\"@id\":1,\"name\":\"R\",\"carsStayInLanes\":true}", Race.class)
            .isCarsStayInLanes());
  }

  @Test
  public void testHotYellowRestartCountdownIsOffByDefaultAndSurvivesCopyAndJson() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    Race legacy = mapper.readValue("{\"@id\":1,\"name\":\"Old race\"}", Race.class);
    assertFalse(legacy.isHotYellowRestartCountdown());

    Race configured =
        new Race.Builder()
            .from(legacy)
            .withHotYellowEnabled(true)
            .withHotYellowRestartCountdown(true)
            .build();
    assertTrue(new Race.Builder().from(configured).build().isHotYellowRestartCountdown());
    String json = mapper.writeValueAsString(configured);
    assertTrue(json.contains("\"hot_yellow_restart_countdown\":true"));
    assertTrue(mapper.readValue(json, Race.class).isHotYellowRestartCountdown());
  }

  @Test
  public void testDriverLaneSelectionDefaultsAndSurvivesCopyAndJson() throws Exception {
    Race defaultRace = new Race.Builder().withName("Default").build();
    assertEquals(DriverLaneSelection.NONE, defaultRace.getDriverLaneSelection());

    Race customRace =
        new Race.Builder()
            .withName("Custom")
            .withDriverLaneSelection(DriverLaneSelection.HEAT_START)
            .build();
    assertEquals(DriverLaneSelection.HEAT_START, customRace.getDriverLaneSelection());

    Race copied = new Race.Builder().from(customRace).build();
    assertEquals(DriverLaneSelection.HEAT_START, copied.getDriverLaneSelection());

    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(customRace);
    assertTrue(json.contains("\"driver_lane_selection\":\"HEAT_START\""));
    assertEquals(
        DriverLaneSelection.HEAT_START,
        mapper.readValue(json, Race.class).getDriverLaneSelection());

    Race fromCamelCase =
        mapper.readValue(
            "{\"@id\":1,\"name\":\"R\",\"driverLaneSelection\":\"STEP_START\"}", Race.class);
    assertEquals(DriverLaneSelection.STEP_START, fromCamelCase.getDriverLaneSelection());

    Race fromRaceStart =
        mapper.readValue(
            "{\"@id\":1,\"name\":\"R\",\"lane_selection\":\"RACE_START\"}", Race.class);
    assertEquals(DriverLaneSelection.RACE_START, fromRaceStart.getDriverLaneSelection());
  }
}
