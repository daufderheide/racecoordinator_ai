package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class RaceStatisticsUtilsTest {

  @Test
  public void testMedianCalculationOddAndEven() {
    List<Double> odd = Arrays.asList(5.0, 4.0, 6.0);
    assertEquals(5.0, RaceStatisticsUtils.calculateMedian(odd), 0.0001);

    List<Double> even = Arrays.asList(5.0, 4.0, 6.0, 7.0);
    assertEquals(5.5, RaceStatisticsUtils.calculateMedian(even), 0.0001);
  }

  @Test
  public void testStdDevAndConsistency() {
    List<Double> laps = Arrays.asList(5.0, 5.0, 5.0, 5.0);
    double avg = 5.0;
    double stdDev = RaceStatisticsUtils.calculateStdDev(laps, avg);
    assertEquals(0.0, stdDev, 0.0001);

    double consistency = RaceStatisticsUtils.calculateConsistencyScore(stdDev, avg);
    assertEquals(1.0, consistency, 0.0001);
  }

  @Test
  public void testAverageTopN() {
    List<Double> laps = Arrays.asList(6.0, 5.0, 4.0, 7.0, 8.0, 9.0);
    // Sorted: 4.0, 5.0, 6.0, 7.0, 8.0, 9.0
    // Top 3 avg: (4 + 5 + 6)/3 = 5.0
    assertEquals(5.0, RaceStatisticsUtils.calculateAverageTopN(laps, 3), 0.0001);
  }

  @Test
  public void testTopKConsecutive() {
    List<Double> laps = Arrays.asList(6.0, 5.0, 4.0, 7.0, 4.5, 4.2, 8.0);
    // Sliding 2-consecutive: (6+5=11), (5+4=9), (4+7=11), (7+4.5=11.5), (4.5+4.2=8.7), (4.2+8=12.2)
    // Min 2-consecutive = 8.7
    assertEquals(8.7, RaceStatisticsUtils.calculateTopKConsecutive(laps, 2), 0.0001);
  }

  @Test
  public void testEmptyListFallback() {
    assertEquals(0.0, RaceStatisticsUtils.calculateMedian(Collections.emptyList()), 0.0001);
    assertEquals(0.0, RaceStatisticsUtils.calculateStdDev(Collections.emptyList(), 0.0), 0.0001);
    assertEquals(0.0, RaceStatisticsUtils.calculateAverageTopN(Collections.emptyList(), 5), 0.0001);
    assertEquals(
        0.0, RaceStatisticsUtils.calculateTopKConsecutive(Collections.emptyList(), 2), 0.0001);
  }

  @Test
  public void testSingleLapStatistics() {
    List<Double> singleLap = Collections.singletonList(5.432);
    DriverAnalysisSummary.LaneStats stats =
        RaceStatisticsUtils.calculateLaneStats("Lane 1", 1, 1.0, singleLap);

    assertEquals(1.0, stats.getTotalLaps(), 0.0001);
    assertEquals(5.432, stats.getTotalTime(), 0.0001);
    assertEquals(5.432, stats.getAverageLapTime(), 0.0001);
    assertEquals(5.432, stats.getMedianLapTime(), 0.0001);
    assertEquals(5.432, stats.getBestLapTime(), 0.0001);
    assertEquals(0.0, stats.getStandardDeviation(), 0.0001);
    assertEquals(1.0, stats.getConsistencyScore(), 0.0001);
    assertEquals(5.432, stats.getAverageTop5(), 0.0001);
    assertEquals(5.432, stats.getAverageTop10(), 0.0001);
    assertEquals(5.432, stats.getAverageTop15(), 0.0001);
    assertEquals(0.0, stats.getTop2Consecutive(), 0.0001);
    assertEquals(0.0, stats.getTop3Consecutive(), 0.0001);
  }

  @Test
  public void testZeroMeanConsistencyFallback() {
    assertEquals(0.0, RaceStatisticsUtils.calculateConsistencyScore(0.5, 0.0), 0.0001);
    assertEquals(0.0, RaceStatisticsUtils.calculateConsistencyScore(0.5, -1.0), 0.0001);
  }

  @Test
  public void testDetermineTrackLanes() {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    Track mockTrack = mock(Track.class);
    Lane l1 = mock(Lane.class);
    Lane l2 = mock(Lane.class);
    Lane l3 = mock(Lane.class);
    Lane l4 = mock(Lane.class);
    List<Lane> lanes = Arrays.asList(l1, l2, l3, l4);
    when(mockTrack.getLanes()).thenReturn(lanes);
    when(mockRace.getTrack()).thenReturn(mockTrack);

    int numLanes = RaceStatisticsUtils.determineTrackLanes(mockRace, null);
    assertEquals(4, numLanes);
  }

  @Test
  public void testPrepareExportData() {
    Driver d1 = new Driver("Driver 1", "d1");
    RaceParticipant p1 = new RaceParticipant(d1);
    List<RaceParticipant> drivers = Collections.singletonList(p1);

    DriverHeatData dhd1 = new DriverHeatData(p1, d1);
    dhd1.getLaps().add(new DriverHeatData.LapData(5.0, "d1", null, false));
    dhd1.getLaps().add(new DriverHeatData.LapData(5.2, "d1", null, false));

    Heat heat1 = new Heat(1, Collections.singletonList(dhd1), false);
    List<Heat> heats = Collections.singletonList(heat1);

    List<DriverAnalysisSummary> summaries = new ArrayList<>();
    List<String> sheetNames = new ArrayList<>();

    RaceStatisticsUtils.prepareExportData(null, drivers, heats, summaries, sheetNames);

    assertEquals(1, summaries.size());
    assertEquals("Driver 1", sheetNames.get(0));
    DriverAnalysisSummary summary = summaries.get(0);
    assertEquals("Driver 1", summary.getDriverName());
    assertEquals(2, summary.getLaneStats().size());
    DriverAnalysisSummary.LaneStats lane1Stats = summary.getLaneStats().get(0);
    assertEquals("Lane 1", lane1Stats.getLaneName());
    assertEquals(2.0, lane1Stats.getTotalLaps(), 0.0001);
    assertEquals(10.2, lane1Stats.getTotalTime(), 0.0001);
    assertEquals(5.1, lane1Stats.getAverageLapTime(), 0.0001);
    assertEquals(5.0, lane1Stats.getBestLapTime(), 0.0001);
  }

  @Test
  public void testSanitizeWorkbookTemplate() {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    InputStream sanitizedIs = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs);
    assertNotNull(sanitizedIs);
  }

  @Test
  public void testExportRealRaceFile() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);

    Driver d1 = new Driver("Lotus 98T #12", "d1");
    Driver d2 = new Driver("Williams FW11", "d2");
    RaceParticipant p1 = new RaceParticipant(d1);
    RaceParticipant p2 = new RaceParticipant(d2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2);

    DriverHeatData dhd1 = new DriverHeatData(p1, d1);
    dhd1.getLaps().add(new DriverHeatData.LapData(5.481, "d1", null, false));
    DriverHeatData dhd2 = new DriverHeatData(p2, d2);
    dhd2.getLaps().add(new DriverHeatData.LapData(5.612, "d2", null, false));

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    heat1.setStarted(true);
    Heat heat2 = new Heat(2, Arrays.asList(dhd2, dhd1), false);
    heat2.setStarted(false); // Unrun heat!
    List<Heat> heats = Arrays.asList(heat1, heat2);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race modelRace = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(modelRace);
    when(modelRace.getName()).thenReturn("Sample Race");

    Track mockTrack = mock(Track.class);
    Lane l1 = new Lane("#ef4444", "white", 100);
    Lane l2 = new Lane("#3b82f6", "white", 100);
    when(mockTrack.getLanes()).thenReturn(Arrays.asList(l1, l2));
    when(mockRace.getTrack()).thenReturn(mockTrack);
    when(mockRace.getDrivers()).thenReturn(drivers);
    when(mockRace.getHeats()).thenReturn(heats);
    when(mockRace.getCurrentHeat()).thenReturn(heat1);

    List<Heat> runHeats = new ArrayList<>();
    List<String> heatSheetNames = new ArrayList<>();
    for (Heat h : heats) {
      if (h.isStarted()
          || (mockRace.getCurrentHeat() != null
              && h.getHeatNumber() <= mockRace.getCurrentHeat().getHeatNumber())) {
        runHeats.add(h);
        heatSheetNames.add("Heat " + h.getHeatNumber());
      }
    }

    List<DriverAnalysisSummary> driverSummaries = new ArrayList<>();
    List<String> driverSheetNames = new ArrayList<>();
    RaceStatisticsUtils.prepareExportData(
        mockRace, drivers, runHeats, driverSummaries, driverSheetNames);

    int numLanes = RaceStatisticsUtils.determineTrackLanes(mockRace, runHeats);
    InputStream sanitizedIs =
        RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, numLanes, mockRace);

    org.jxls.common.Context jxlsContext = new org.jxls.common.Context();
    jxlsContext.putVar("race", mockRace);
    jxlsContext.putVar("standings", drivers);
    jxlsContext.putVar("heats", runHeats);
    jxlsContext.putVar("heatSheetNames", RaceStatisticsUtils.makeSheetNamesUnique(heatSheetNames));
    jxlsContext.putVar("allHeats", heats);
    jxlsContext.putVar("driverSummaries", driverSummaries);
    jxlsContext.putVar("driverSheetNames", driverSheetNames);

    ByteArrayOutputStream os = new ByteArrayOutputStream();
    org.jxls.util.JxlsHelper.getInstance().processTemplate(sanitizedIs, os, jxlsContext);

    byte[] outBytes = os.toByteArray();

    // Now open resultBytes with POI, remove all cell comments and VML drawing relations, and write
    // out clean bytes
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook resultWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(outBytes))) {
      RaceStatisticsUtils.removeAllCommentsAndVmlDrawings(resultWb);
      ByteArrayOutputStream cleanOs = new ByteArrayOutputStream();
      resultWb.write(cleanOs);
      outBytes = cleanOs.toByteArray();
    }

    java.io.File targetDir = new java.io.File("target_dist");
    if (!targetDir.exists()) targetDir.mkdirs();
    java.io.File outFile = new java.io.File(targetDir, "test_race_export_clean.xlsx");
    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile)) {
      fos.write(outBytes);
    }

    // Verify POI reads the output file cleanly
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook resultWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(outBytes))) {
      assertEquals(6, resultWb.getNumberOfSheets());
      assertEquals("Race Information", resultWb.getSheetName(0));
      assertEquals("Overall Standings", resultWb.getSheetName(1));
      assertEquals("Heat List", resultWb.getSheetName(2));
      assertEquals("Heat 1", resultWb.getSheetName(3));
      assertEquals("Lotus 98T #12", resultWb.getSheetName(4));
      assertEquals("Williams FW11", resultWb.getSheetName(5));

      for (int i = 0; i < resultWb.getNumberOfSheets(); i++) {
        org.apache.poi.xssf.usermodel.XSSFSheet sheet = resultWb.getSheetAt(i);
        for (org.apache.poi.ss.usermodel.Row row : sheet) {
          if (row == null) continue;
          for (org.apache.poi.ss.usermodel.Cell cell : row) {
            if (cell != null) {
              assertNull(
                  "Sheet " + sheet.getSheetName() + " cell should not have a comment",
                  cell.getCellComment());
            }
          }
        }
      }
    }
  }

  @Test
  public void testRemoveAllCommentsAndVmlDrawings() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(rawIs)) {
      RaceStatisticsUtils.removeAllCommentsAndVmlDrawings(wb);
      for (int i = 0; i < wb.getNumberOfSheets(); i++) {
        org.apache.poi.xssf.usermodel.XSSFSheet sheet = wb.getSheetAt(i);
        for (org.apache.poi.ss.usermodel.Row row : sheet) {
          if (row == null) continue;
          for (org.apache.poi.ss.usermodel.Cell cell : row) {
            if (cell != null) {
              assertNull(
                  "Sheet " + sheet.getSheetName() + " cell should not have a comment",
                  cell.getCellComment());
            }
          }
        }
        for (org.apache.poi.ooxml.POIXMLDocumentPart.RelationPart rp : sheet.getRelationParts()) {
          String type = rp.getRelationship().getRelationshipType();
          assertFalse("Relation type should not contain comments", type.contains("comments"));
          assertFalse("Relation type should not contain vmlDrawing", type.contains("vmlDrawing"));
        }
      }
    }
  }

  @Test
  public void testTemplateHasNoInvalidDrawings() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(rawIs)) {
      for (int i = 0; i < wb.getNumberOfSheets(); i++) {
        org.apache.poi.xssf.usermodel.XSSFSheet sheet = wb.getSheetAt(i);
        for (org.apache.poi.ooxml.POIXMLDocumentPart.RelationPart rp : sheet.getRelationParts()) {
          String target = rp.getRelationship().getTargetURI().toString();
          assertFalse(
              "Relationship target should not be drawing1 on non-drawing sheets: "
                  + sheet.getSheetName(),
              target.contains("drawing1.xml") && !sheet.getSheetName().equals("Race Information"));
        }
      }

      // After removing comments and VML drawings, all legacy drawings must be cleared
      RaceStatisticsUtils.removeAllCommentsAndVmlDrawings(wb);
      for (int i = 0; i < wb.getNumberOfSheets(); i++) {
        org.apache.poi.xssf.usermodel.XSSFSheet sheet = wb.getSheetAt(i);
        assertFalse(
            "Legacy drawing should be cleared on sheet " + sheet.getSheetName(),
            sheet.getCTWorksheet().isSetLegacyDrawing());
      }
    }
  }

  @Test
  public void testHeatListSheetOrderAndStructure() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(rawIs)) {
      assertEquals("Overall Standings", wb.getSheetName(1));
      assertEquals("Heat List", wb.getSheetName(2));

      org.apache.poi.ss.usermodel.Sheet heatListSheet = wb.getSheetAt(2);
      org.apache.poi.ss.usermodel.Row row3 = heatListSheet.getRow(3);
      assertEquals("Heat", row3.getCell(0).getStringCellValue());
      assertEquals("Lane 1", row3.getCell(1).getStringCellValue());
      assertEquals("Lane 2", row3.getCell(2).getStringCellValue());
    }
  }

  @Test
  public void testSanitizeWorkbookTemplateWithFourLanesAndColors() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    Track mockTrack = mock(Track.class);
    Lane lane1 = new Lane("#ef4444", "white", 100);
    Lane lane2 = new Lane("#ffffff", "black", 100);
    Lane lane3 = new Lane("#3b82f6", "white", 100);
    Lane lane4 = new Lane("#fbbf24", "black", 100);
    when(mockTrack.getLanes()).thenReturn(Arrays.asList(lane1, lane2, lane3, lane4));
    when(mockRace.getTrack()).thenReturn(mockTrack);

    InputStream sanitizedIs = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, 4, mockRace);
    assertNotNull(sanitizedIs);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(sanitizedIs)) {
      org.apache.poi.ss.usermodel.Sheet standingsSheet = wb.getSheet("Overall Standings");
      org.apache.poi.ss.usermodel.Row standingsHeader = standingsSheet.getRow(3);
      assertEquals("Lane 1 Laps", standingsHeader.getCell(4).getStringCellValue());
      assertEquals("Lane 2 Laps", standingsHeader.getCell(5).getStringCellValue());
      assertEquals("Lane 3 Laps", standingsHeader.getCell(6).getStringCellValue());
      assertEquals("Lane 4 Laps", standingsHeader.getCell(7).getStringCellValue());

      org.apache.poi.ss.usermodel.Sheet heatListSheet = wb.getSheet("Heat List");
      org.apache.poi.ss.usermodel.Row heatListHeader = heatListSheet.getRow(3);
      assertEquals("Heat", heatListHeader.getCell(0).getStringCellValue());
      assertEquals("Lane 1", heatListHeader.getCell(1).getStringCellValue());
      assertEquals("Lane 2", heatListHeader.getCell(2).getStringCellValue());
      assertEquals("Lane 3", heatListHeader.getCell(3).getStringCellValue());
      assertEquals("Lane 4", heatListHeader.getCell(4).getStringCellValue());

      org.apache.poi.ss.usermodel.Row heatListData = heatListSheet.getRow(4);
      assertEquals("${heat.heatNumber}", heatListData.getCell(0).getStringCellValue());
      assertEquals("${heat.getDriverNameOnLane(0)}", heatListData.getCell(1).getStringCellValue());
      assertEquals("${heat.getDriverNameOnLane(3)}", heatListData.getCell(4).getStringCellValue());

      // Verify lane styles were applied to header and data cells
      assertNotNull(heatListHeader.getCell(1).getCellStyle());
      assertNotNull(heatListData.getCell(1).getCellStyle());
    }
  }

  @Test
  public void testSanitizeWorkbookTemplateWithFourLanes() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    InputStream sanitizedIs = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, 4);
    assertNotNull(sanitizedIs);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(sanitizedIs)) {
      org.apache.poi.ss.usermodel.Sheet sheet2 = wb.getSheet("Overall Standings");
      org.apache.poi.ss.usermodel.Row row3 = sheet2.getRow(3);
      assertEquals("Lane 1 Laps", row3.getCell(4).getStringCellValue());
      assertEquals("Lane 2 Laps", row3.getCell(5).getStringCellValue());
      assertEquals("Lane 3 Laps", row3.getCell(6).getStringCellValue());
      assertEquals("Lane 4 Laps", row3.getCell(7).getStringCellValue());
      assertEquals("Best Lap Time", row3.getCell(8).getStringCellValue());
    }
  }

  @Test
  public void testJxlsTemplateProcessingFourLanes() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    InputStream is = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, 4);

    Driver d1 = new Driver("Lotus 98T #12", "d1");
    RaceParticipant p1 = new RaceParticipant(d1);
    List<RaceParticipant> drivers = Collections.singletonList(p1);

    DriverHeatData dhd1 = new DriverHeatData(p1, d1);
    dhd1.getLaps().add(new DriverHeatData.LapData(5.481, "d1", null, false));

    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd1, dhd1, dhd1), false);
    List<Heat> heats = Collections.singletonList(heat1);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race modelRace = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(modelRace);
    when(modelRace.getName()).thenReturn("Test Race");

    Track mockTrack = mock(Track.class);
    Lane l1 = mock(Lane.class);
    when(mockTrack.getLanes()).thenReturn(Arrays.asList(l1, l1, l1, l1));
    when(mockRace.getTrack()).thenReturn(mockTrack);

    List<DriverAnalysisSummary> summaries = new ArrayList<>();
    List<String> driverSheetNames = new ArrayList<>();
    RaceStatisticsUtils.prepareExportData(mockRace, drivers, heats, summaries, driverSheetNames);

    org.jxls.common.Context jxlsContext = new org.jxls.common.Context();
    jxlsContext.putVar("race", mockRace);
    jxlsContext.putVar("standings", drivers);
    jxlsContext.putVar("heats", heats);
    jxlsContext.putVar("heatSheetNames", Collections.singletonList("Heat 1"));
    jxlsContext.putVar("driverSummaries", summaries);
    jxlsContext.putVar("driverSheetNames", driverSheetNames);

    ByteArrayOutputStream os = new ByteArrayOutputStream();
    org.jxls.util.JxlsHelper.getInstance().processTemplate(is, os, jxlsContext);

    byte[] outBytes = os.toByteArray();
    assertTrue(outBytes.length > 0);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook resultWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(outBytes))) {
      org.apache.poi.ss.usermodel.Sheet standingsSheet = resultWb.getSheetAt(1);
      org.apache.poi.ss.usermodel.Row headerRow = standingsSheet.getRow(3);
      assertEquals("Lane 1 Laps", headerRow.getCell(4).getStringCellValue());
      assertEquals("Lane 2 Laps", headerRow.getCell(5).getStringCellValue());
      assertEquals("Lane 3 Laps", headerRow.getCell(6).getStringCellValue());
      assertEquals("Lane 4 Laps", headerRow.getCell(7).getStringCellValue());
    }
  }

  @Test
  public void testFullExportValidation() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);

    Driver d1 = new Driver("Driver 1", "d1");
    Driver d2 = new Driver("Driver 2", "d2");
    RaceParticipant p1 = new RaceParticipant(d1);
    RaceParticipant p2 = new RaceParticipant(d2);
    List<RaceParticipant> drivers = Arrays.asList(p1, p2);

    DriverHeatData dhd1 = new DriverHeatData(p1, d1);
    DriverHeatData dhd2 = new DriverHeatData(p2, d2);
    Heat heat1 = new Heat(1, Arrays.asList(dhd1, dhd2), false);
    Heat heat2 = new Heat(2, Arrays.asList(dhd2, dhd1), false);
    List<Heat> heats = Arrays.asList(heat1, heat2);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race modelRace = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(modelRace);
    when(modelRace.getName()).thenReturn("Test Race");

    Track mockTrack = mock(Track.class);
    Lane l1 = new Lane("#ef4444", "white", 100);
    Lane l2 = new Lane("#3b82f6", "white", 100);
    when(mockTrack.getLanes()).thenReturn(Arrays.asList(l1, l2));
    when(mockRace.getTrack()).thenReturn(mockTrack);

    List<DriverAnalysisSummary> summaries = new ArrayList<>();
    List<String> driverSheetNames = new ArrayList<>();
    RaceStatisticsUtils.prepareExportData(mockRace, drivers, heats, summaries, driverSheetNames);

    InputStream is = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, 2, mockRace);

    org.jxls.common.Context jxlsContext = new org.jxls.common.Context();
    jxlsContext.putVar("race", mockRace);
    jxlsContext.putVar("standings", drivers);
    jxlsContext.putVar("heats", heats);
    jxlsContext.putVar("allHeats", heats);
    jxlsContext.putVar("heatSheetNames", Arrays.asList("Heat 1", "Heat 2"));
    jxlsContext.putVar("driverSummaries", summaries);
    jxlsContext.putVar("driverSheetNames", driverSheetNames);

    ByteArrayOutputStream os = new ByteArrayOutputStream();
    org.jxls.util.JxlsHelper.getInstance().processTemplate(is, os, jxlsContext);

    byte[] outBytes = os.toByteArray();
    assertTrue(outBytes.length > 0);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook resultWb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(outBytes))) {
      System.out.println("FULL EXPORT RESULT SHEETS: " + resultWb.getNumberOfSheets());
      for (int i = 0; i < resultWb.getNumberOfSheets(); i++) {
        org.apache.poi.ss.usermodel.Sheet s = resultWb.getSheetAt(i);
        System.out.println("Sheet " + i + ": " + s.getSheetName());
        for (int r = 0; r <= Math.min(s.getLastRowNum(), 10); r++) {
          org.apache.poi.ss.usermodel.Row row = s.getRow(r);
          if (row == null) continue;
          StringBuilder sb = new StringBuilder();
          sb.append("  Row ").append(r).append(": ");
          for (int c = 0; c < row.getLastCellNum(); c++) {
            org.apache.poi.ss.usermodel.Cell cell = row.getCell(c);
            sb.append("[").append(cell != null ? cell.toString() : "").append("] ");
          }
          System.out.println(sb.toString());
        }
      }
    }
  }

  @Test
  public void testJxlsTemplateProcessing() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    InputStream is = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs);

    Driver d1 = new Driver("Lotus 98T #12", "d1");
    RaceParticipant p1 = new RaceParticipant(d1);
    List<RaceParticipant> drivers = Collections.singletonList(p1);

    DriverHeatData dhd1 = new DriverHeatData(p1, d1);
    dhd1.getLaps().add(new DriverHeatData.LapData(5.481, "d1", null, false));

    Heat heat1 = new Heat(1, Collections.singletonList(dhd1), false);
    List<Heat> heats = Collections.singletonList(heat1);

    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    com.antigravity.models.Race modelRace = mock(com.antigravity.models.Race.class);
    when(mockRace.getRaceModel()).thenReturn(modelRace);
    when(modelRace.getName()).thenReturn("Test Race");

    Track mockTrack = mock(Track.class);
    when(mockRace.getTrack()).thenReturn(mockTrack);

    List<DriverAnalysisSummary> summaries = new ArrayList<>();
    List<String> driverSheetNames = new ArrayList<>();
    RaceStatisticsUtils.prepareExportData(mockRace, drivers, heats, summaries, driverSheetNames);

    org.jxls.common.Context jxlsContext = new org.jxls.common.Context();
    jxlsContext.putVar("race", mockRace);
    jxlsContext.putVar("standings", drivers);
    jxlsContext.putVar("heats", heats);
    jxlsContext.putVar("heatSheetNames", Collections.singletonList("Heat 1"));
    jxlsContext.putVar("driverSummaries", summaries);
    jxlsContext.putVar("driverSheetNames", driverSheetNames);

    ByteArrayOutputStream os = new ByteArrayOutputStream();
    org.jxls.util.JxlsHelper.getInstance().processTemplate(is, os, jxlsContext);

    assertTrue(os.toByteArray().length > 0);
  }

  @Test
  public void testSheetNameSanitizationAndUniqueness() {
    assertEquals("Driver_1", RaceStatisticsUtils.sanitizeSheetName("Driver:1", 1));
    assertEquals("Driver 1_2", RaceStatisticsUtils.sanitizeSheetName("Driver 1/2", 1));

    List<String> rawNames =
        Arrays.asList(
            "Driver 1",
            "Driver 1",
            "Driver 1: Very Long Name That Exceeds Thirty One Characters Limit",
            "Driver 1: Very Long Name That Exceeds Thirty One Characters Limit");

    List<String> uniqueNames = RaceStatisticsUtils.makeSheetNamesUnique(rawNames);
    assertEquals(4, uniqueNames.size());
    assertEquals("Driver 1", uniqueNames.get(0));
    assertEquals("Driver 1_2", uniqueNames.get(1));
    assertTrue(uniqueNames.get(2).length() <= 31);
    assertTrue(uniqueNames.get(3).length() <= 31);
    assertEquals(4, new java.util.HashSet<>(uniqueNames).size());
  }
}
