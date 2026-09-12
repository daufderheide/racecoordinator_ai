package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class TemplateVariableParityTest {

  @Test
  public void testRaceParticipantExposesUnifiedProperties() throws Exception {
    Class<?> clazz = RaceParticipant.class;

    List<String> requiredGetters =
        Arrays.asList(
            "getRank",
            "getDriver",
            "getTotalLaps",
            "getTotalTime",
            "getBestLapTime",
            "getAverageLapTime",
            "getMedianLapTime",
            "getGapLeader",
            "getGapPosition",
            "getLaneLaps",
            "getPositionPoints",
            "getOverallBonusPoints",
            "getHeatPositionPoints",
            "getHeatBonusPoints",
            "getTotalPoints");

    for (String getterName : requiredGetters) {
      Method m = clazz.getMethod(getterName);
      assertNotNull("Expected RaceParticipant to have method: " + getterName, m);
    }
  }

  @Test
  public void testDriverHeatDataExposesUnifiedProperties() throws Exception {
    Class<?> clazz = DriverHeatData.class;

    List<String> requiredGetters =
        Arrays.asList(
            "getActualDriver",
            "getDriver",
            "getLane",
            "getAdjustedLapCount",
            "getTotalTime",
            "getBestLapTime",
            "getAverageLapTime",
            "getMedianLapTime",
            "getGapLeader",
            "getGapPosition");

    for (String getterName : requiredGetters) {
      Method m = clazz.getMethod(getterName);
      assertNotNull("Expected DriverHeatData to have method: " + getterName, m);
    }
  }

  @Test
  public void testHeatExposesUnifiedProperties() throws Exception {
    Class<?> clazz = Heat.class;

    List<String> requiredGetters =
        Arrays.asList("getHeatNumber", "getGroup", "getDrivers", "getColumnHeaders", "getLapRows");

    for (String getterName : requiredGetters) {
      Method m = clazz.getMethod(getterName);
      assertNotNull("Expected Heat to have method: " + getterName, m);
    }

    Method laneDriverMethod = clazz.getMethod("getDriverNameOnLane", int.class);
    assertNotNull(laneDriverMethod);
  }

  @Test
  public void testVariableSyntaxEquivalence() {
    List<String> expressions =
        Arrays.asList(
            "driver.rank",
            "driver.totalLaps",
            "driver.totalTime",
            "driver.bestLapTime",
            "driver.averageLapTime",
            "driver.medianLapTime",
            "driver.gapLeader",
            "driver.gapPosition",
            "driver.laneLaps[0]",
            "heatDriver.lane",
            "heatDriver.adjustedLapCount",
            "heatDriver.totalTime",
            "heatDriver.bestLapTime",
            "heat.heatNumber",
            "race.name",
            "race.trackName");

    for (String expr : expressions) {
      String curly = "{" + expr + "}";
      String dollarCurly = "${" + expr + "}";
      assertEquals(dollarCurly, RaceStatisticsUtils.normalizeTemplateVariables(curly));
      assertEquals(dollarCurly, RaceStatisticsUtils.normalizeTemplateVariables(dollarCurly));
    }
  }
}
