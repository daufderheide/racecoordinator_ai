package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
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
  public void testSanitizeWorkbookTemplateWithFourLanes() throws Exception {
    InputStream rawIs =
        getClass().getClassLoader().getResourceAsStream("race_export_template.xlsx");
    assertNotNull(rawIs);
    InputStream sanitizedIs = RaceStatisticsUtils.sanitizeWorkbookTemplate(rawIs, 4);
    assertNotNull(sanitizedIs);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(sanitizedIs)) {
      org.apache.poi.ss.usermodel.Sheet sheet2 = wb.getSheetAt(1);
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
