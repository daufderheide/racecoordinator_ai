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
            "getGapPosition",
            "getConsistencyScore",
            "getStandardDeviation",
            "getAverageTop5",
            "getAverageTop10",
            "getAverageTop15",
            "getTop2Consecutive",
            "getTop3Consecutive");

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
  public void testRaceExposesUnifiedProperties() throws Exception {
    Class<?> clazz = Race.class;

    List<String> requiredGetters =
        Arrays.asList(
            "getName",
            "getTrackName",
            "getStartTime",
            "getTrack",
            "getRaceModel",
            "getDrivers",
            "getHeats",
            "getLaneCount");

    for (String getterName : requiredGetters) {
      Method m = clazz.getMethod(getterName);
      assertNotNull("Expected Race to have method: " + getterName, m);
    }
  }

  @Test
  public void testTrackExposesUnifiedProperties() throws Exception {
    Class<?> clazz = com.antigravity.models.Track.class;

    List<String> requiredGetters =
        Arrays.asList("getName", "getNumTrackSections", "getLanes", "getLaneCount");

    for (String getterName : requiredGetters) {
      Method m = clazz.getMethod(getterName);
      assertNotNull("Expected Track to have method: " + getterName, m);
    }
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
            "race.trackName",
            "race.startTime",
            "race.track.name",
            "race.track.getNumTrackSections()",
            "race.track.getLaneCount()");

    for (String expr : expressions) {
      String curly = "{" + expr + "}";
      String dollarCurly = "${" + expr + "}";
      assertEquals(dollarCurly, RaceStatisticsUtils.normalizeTemplateVariables(curly));
      assertEquals(dollarCurly, RaceStatisticsUtils.normalizeTemplateVariables(dollarCurly));
    }
  }

  @Test
  public void testJxlsTrackExpressions() throws Exception {
    org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook();
    org.apache.poi.xssf.usermodel.XSSFSheet sheet = wb.createSheet("Test");
    org.apache.poi.xssf.usermodel.XSSFDrawing drawing = sheet.createDrawingPatriarch();
    org.apache.poi.xssf.usermodel.XSSFClientAnchor anchor =
        new org.apache.poi.xssf.usermodel.XSSFClientAnchor();
    org.apache.poi.xssf.usermodel.XSSFComment comment = drawing.createCellComment(anchor);
    comment.setString(
        new org.apache.poi.xssf.usermodel.XSSFRichTextString("jx:area(lastCell=\"B1\")"));

    org.apache.poi.xssf.usermodel.XSSFRow row = sheet.createRow(0);
    org.apache.poi.xssf.usermodel.XSSFCell cell0 = row.createCell(0);
    cell0.setCellValue("${race.track.getNumTrackSections()}");
    cell0.setCellComment(comment);

    row.createCell(1).setCellValue("${race.getNumTrackSections()}");

    java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
    wb.write(bos);
    byte[] templateBytes = bos.toByteArray();

    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder().numTrackSections(42).build();
    Race race = org.mockito.Mockito.mock(Race.class);
    org.mockito.Mockito.when(race.getTrack()).thenReturn(track);
    org.mockito.Mockito.when(race.getNumTrackSections()).thenReturn(42);

    org.jxls.common.Context context = new org.jxls.common.Context();
    context.putVar("race", race);

    java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
    org.jxls.util.JxlsHelper.getInstance()
        .processTemplate(new java.io.ByteArrayInputStream(templateBytes), out, context);

    org.apache.poi.xssf.usermodel.XSSFWorkbook resultWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(out.toByteArray()));
    org.apache.poi.xssf.usermodel.XSSFSheet resultSheet = resultWb.getSheet("Test");
    org.apache.poi.xssf.usermodel.XSSFRow resultRow = resultSheet.getRow(0);

    for (int i = 0; i < 2; i++) {
      org.apache.poi.xssf.usermodel.XSSFCell c = resultRow.getCell(i);
      assertNotNull("Cell " + i + " must not be null", c);
      assertEquals(42.0, c.getNumericCellValue(), 0.001);
    }
  }
}
