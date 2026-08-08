package com.antigravity.race;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Comment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class RaceStatisticsUtils {

  private RaceStatisticsUtils() {}

  public static InputStream sanitizeWorkbookTemplate(InputStream inputStream) {
    return sanitizeWorkbookTemplate(inputStream, 2);
  }

  public static InputStream sanitizeWorkbookTemplate(InputStream inputStream, int numLanes) {
    if (inputStream == null) {
      return null;
    }
    byte[] bytes;
    try {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      byte[] buffer = new byte[8192];
      int n;
      while ((n = inputStream.read(buffer)) != -1) {
        baos.write(buffer, 0, n);
      }
      bytes = baos.toByteArray();
    } catch (Exception e) {
      return inputStream;
    }

    try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
        XSSFWorkbook workbook = new XSSFWorkbook(bais);
        ByteArrayOutputStream os = new ByteArrayOutputStream()) {
      for (Sheet sheet : workbook) {
        for (Row row : sheet) {
          for (Cell cell : row) {
            if (cell.getCellType() == CellType.STRING) {
              String strVal = cell.getStringCellValue();
              cell.setBlank();
              cell.setCellValue(strVal);
            }
          }
        }
      }

      adjustOverallStandingsSheet(workbook, numLanes);

      workbook.write(os);
      return new ByteArrayInputStream(os.toByteArray());
    } catch (Exception e) {
      return new ByteArrayInputStream(bytes);
    }
  }

  private static void adjustOverallStandingsSheet(XSSFWorkbook workbook, int numLanes) {
    if (numLanes <= 0) {
      numLanes = 2;
    }
    Sheet sheet = workbook.getSheet("Overall Standings");
    if (sheet == null && workbook.getNumberOfSheets() > 1) {
      sheet = workbook.getSheetAt(1);
    }
    if (sheet == null) {
      return;
    }

    Row row3 = sheet.getRow(3);
    Row row4 = sheet.getRow(4);
    if (row3 == null || row4 == null) {
      return;
    }

    Cell refHeaderCell = row3.getCell(4);
    Cell refDataCell = row4.getCell(4);
    CellStyle headerStyle = refHeaderCell != null ? refHeaderCell.getCellStyle() : null;
    CellStyle dataStyle = refDataCell != null ? refDataCell.getCellStyle() : null;

    for (int l = 0; l < numLanes; l++) {
      int col = 4 + l;
      Cell cHeader = row3.getCell(col);
      if (cHeader == null) {
        cHeader = row3.createCell(col);
      }
      cHeader.setCellValue("Lane " + (l + 1) + " Laps");
      if (headerStyle != null) {
        cHeader.setCellStyle(headerStyle);
      }

      Cell cData = row4.getCell(col);
      if (cData == null) {
        cData = row4.createCell(col);
      }
      cData.setCellValue("${driver.laneLaps[" + l + "]}");
      if (dataStyle != null) {
        cData.setCellStyle(dataStyle);
      }
    }

    String[] extraHeaders = {
      "Best Lap Time", "Average Lap Time", "Median Lap Time", "Gap to Leader", "Gap to Position"
    };
    String[] extraValues = {
      "${driver.bestLapTime}",
      "${driver.averageLapTime}",
      "${driver.medianLapTime}",
      "${driver.gapLeader}",
      "${driver.gapPosition}"
    };

    int startExtraCol = 4 + numLanes;
    for (int i = 0; i < extraHeaders.length; i++) {
      int col = startExtraCol + i;
      Cell cHeader = row3.getCell(col);
      if (cHeader == null) {
        cHeader = row3.createCell(col);
      }
      cHeader.setCellValue(extraHeaders[i]);
      if (headerStyle != null) {
        cHeader.setCellStyle(headerStyle);
      }

      Cell cData = row4.getCell(col);
      if (cData == null) {
        cData = row4.createCell(col);
      }
      cData.setCellValue(extraValues[i]);
      if (dataStyle != null) {
        cData.setCellStyle(dataStyle);
      }
    }

    int lastColIdx = startExtraCol + extraHeaders.length - 1;

    int maxCol = Math.max((int) row3.getLastCellNum(), (int) row4.getLastCellNum());
    for (int col = lastColIdx + 1; col <= maxCol; col++) {
      Cell c3 = row3.getCell(col);
      if (c3 != null) {
        row3.removeCell(c3);
      }
      Cell c4 = row4.getCell(col);
      if (c4 != null) {
        row4.removeCell(c4);
      }
    }

    String lastColLetter = CellReference.convertNumToColString(lastColIdx);
    String newLastCell = lastColLetter + "5";

    Comment commentA1 = sheet.getCellComment(new CellAddress(0, 0));
    if (commentA1 != null) {
      String text = commentA1.getString().getString();
      String updated = text.replaceAll("lastCell=\"[A-Z]+5\"", "lastCell=\"" + newLastCell + "\"");
      commentA1.setString(workbook.getCreationHelper().createRichTextString(updated));
    }

    Comment commentA5 = sheet.getCellComment(new CellAddress(4, 0));
    if (commentA5 != null) {
      String text = commentA5.getString().getString();
      String updated = text.replaceAll("lastCell=\"[A-Z]+5\"", "lastCell=\"" + newLastCell + "\"");
      commentA5.setString(workbook.getCreationHelper().createRichTextString(updated));
    }
  }

  public static String sanitizeSheetName(String rawName, int fallbackIndex) {
    if (rawName == null || rawName.trim().isEmpty()) {
      return "Sheet " + fallbackIndex;
    }
    String clean = rawName.replaceAll("[\\\\/:\\?\\*\\[\\]]", "_").trim();
    if (clean.length() > 31) {
      clean = clean.substring(0, 31).trim();
    }
    if (clean.isEmpty()) {
      return "Sheet " + fallbackIndex;
    }
    return clean;
  }

  public static List<String> makeSheetNamesUnique(List<String> rawNames) {
    List<String> result = new ArrayList<>();
    if (rawNames == null || rawNames.isEmpty()) {
      return result;
    }
    Set<String> used = new HashSet<>();
    for (int i = 0; i < rawNames.size(); i++) {
      String base = sanitizeSheetName(rawNames.get(i), i + 1);
      String candidate = base;
      int counter = 2;
      while (used.contains(candidate.toLowerCase())) {
        String suffix = "_" + counter;
        int maxBaseLen = 31 - suffix.length();
        if (base.length() > maxBaseLen) {
          candidate = base.substring(0, maxBaseLen) + suffix;
        } else {
          candidate = base + suffix;
        }
        counter++;
      }
      used.add(candidate.toLowerCase());
      result.add(candidate);
    }
    return result;
  }

  public static DriverAnalysisSummary.LaneStats calculateLaneStats(
      String laneName, int laneNumber, double totalLaps, List<Double> lapTimes) {

    if (lapTimes == null || lapTimes.isEmpty()) {
      return new DriverAnalysisSummary.LaneStats(
          laneName, laneNumber, totalLaps, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }

    double totalTime = 0.0;
    for (double lap : lapTimes) {
      totalTime += lap;
    }

    double avg = totalTime / lapTimes.size();
    double med = calculateMedian(lapTimes);

    double best = lapTimes.get(0);
    for (double lap : lapTimes) {
      if (lap < best) {
        best = lap;
      }
    }

    double std = calculateStdDev(lapTimes, avg);
    double cons = calculateConsistencyScore(std, avg);

    double top5 = calculateAverageTopN(lapTimes, 5);
    double top10 = calculateAverageTopN(lapTimes, 10);
    double top15 = calculateAverageTopN(lapTimes, 15);

    double top2c = calculateTopKConsecutive(lapTimes, 2);
    double top3c = calculateTopKConsecutive(lapTimes, 3);

    return new DriverAnalysisSummary.LaneStats(
        laneName,
        laneNumber,
        totalLaps,
        totalTime,
        avg,
        med,
        best,
        std,
        cons,
        top5,
        top10,
        top15,
        top2c,
        top3c);
  }

  public static double calculateMedian(List<Double> values) {
    if (values == null || values.isEmpty()) {
      return 0.0;
    }
    List<Double> sorted = new ArrayList<>(values);
    Collections.sort(sorted);
    int n = sorted.size();
    int middle = n / 2;
    if (n % 2 == 1) {
      return sorted.get(middle);
    } else {
      return (sorted.get(middle - 1) + sorted.get(middle)) / 2.0;
    }
  }

  public static double calculateStdDev(List<Double> values, double mean) {
    if (values == null || values.size() <= 1) {
      return 0.0;
    }
    double sumSquaredDiffs = 0.0;
    for (double val : values) {
      double diff = val - mean;
      sumSquaredDiffs += diff * diff;
    }
    return Math.sqrt(sumSquaredDiffs / (values.size() - 1));
  }

  public static double calculateConsistencyScore(double stdDev, double mean) {
    if (mean <= 0.0) {
      return 0.0;
    }
    return 1.0 - (stdDev / mean);
  }

  public static double calculateAverageTopN(List<Double> values, int n) {
    if (values == null || values.isEmpty() || n <= 0) {
      return 0.0;
    }
    List<Double> sorted = new ArrayList<>(values);
    Collections.sort(sorted);
    int k = Math.min(sorted.size(), n);
    double sum = 0.0;
    for (int i = 0; i < k; i++) {
      sum += sorted.get(i);
    }
    return sum / k;
  }

  public static double calculateTopKConsecutive(List<Double> values, int k) {
    if (values == null || values.size() < k || k <= 0) {
      return 0.0;
    }
    double minSum = Double.MAX_VALUE;
    for (int i = 0; i <= values.size() - k; i++) {
      double currentSum = 0.0;
      for (int j = 0; j < k; j++) {
        currentSum += values.get(i + j);
      }
      if (currentSum < minSum) {
        minSum = currentSum;
      }
    }
    return minSum == Double.MAX_VALUE ? 0.0 : minSum;
  }

  public static int determineTrackLanes(Race race, List<Heat> runHeats) {
    int numLanes = 0;
    if (race != null
        && race.getTrack() != null
        && race.getTrack().getLanes() != null
        && !race.getTrack().getLanes().isEmpty()) {
      numLanes = race.getTrack().getLanes().size();
    }
    if (runHeats != null) {
      for (Heat h : runHeats) {
        if (h.getDrivers() != null) {
          numLanes = Math.max(numLanes, h.getDrivers().size());
        }
      }
    }
    return Math.max(numLanes, 2);
  }

  public static void prepareExportData(
      Race race,
      List<RaceParticipant> drivers,
      List<Heat> runHeats,
      List<DriverAnalysisSummary> outSummaries,
      List<String> outDriverSheetNames) {

    for (Heat h : runHeats) {
      if (h.getDrivers() != null) {
        for (int l = 0; l < h.getDrivers().size(); l++) {
          DriverHeatData dhd = h.getDrivers().get(l);
          if (dhd != null) {
            dhd.setLane(l + 1);
          }
        }
      }
    }

    int numLanes = determineTrackLanes(race, runHeats);

    for (RaceParticipant p : drivers) {
      List<Double> laneLaps = new ArrayList<>();
      for (int l = 0; l < numLanes; l++) {
        double totalLapsOnLane = 0.0;
        for (Heat h : runHeats) {
          if (h.getDrivers() != null && l < h.getDrivers().size()) {
            DriverHeatData dhd = h.getDrivers().get(l);
            if (dhd != null
                && dhd.getDriver() != null
                && p.getStableId().equals(dhd.getDriver().getStableId())) {
              totalLapsOnLane += dhd.getAdjustedLapCount();
            }
          }
        }
        laneLaps.add(totalLapsOnLane);
      }
      p.setLaneLaps(laneLaps);
    }

    for (RaceParticipant p : drivers) {
      String driverName = p.getDriver() != null ? p.getDriver().getName() : "Driver";
      String driverId = p.getDriver() != null ? p.getDriver().getEntityId() : p.getObjectId();

      DriverAnalysisSummary summary = new DriverAnalysisSummary(driverName, driverId);

      for (int l = 0; l < numLanes; l++) {
        int laneNum = l + 1;
        String laneName = "Lane " + laneNum;
        double laneTotalLaps = 0.0;
        List<Double> lapTimesOnLane = new ArrayList<>();

        for (Heat h : runHeats) {
          if (h.getDrivers() != null && l < h.getDrivers().size()) {
            DriverHeatData dhd = h.getDrivers().get(l);
            if (dhd != null
                && dhd.getDriver() != null
                && p.getStableId().equals(dhd.getDriver().getStableId())) {
              laneTotalLaps += dhd.getAdjustedLapCount();
              if (dhd.getLaps() != null) {
                for (DriverHeatData.LapData lap : dhd.getLaps()) {
                  lapTimesOnLane.add(lap.getLapTime());
                }
              }
            }
          }
        }

        DriverAnalysisSummary.LaneStats stats =
            calculateLaneStats(laneName, laneNum, laneTotalLaps, lapTimesOnLane);
        summary.addLaneStats(stats);
      }

      outSummaries.add(summary);
      outDriverSheetNames.add(driverName);
    }

    if (outSummaries.isEmpty()) {
      DriverAnalysisSummary dummy = new DriverAnalysisSummary("Driver 1", "d1");
      dummy.addLaneStats(calculateLaneStats("Lane 1", 1, 0.0, new ArrayList<>()));
      dummy.addLaneStats(calculateLaneStats("Lane 2", 2, 0.0, new ArrayList<>()));
      outSummaries.add(dummy);
      outDriverSheetNames.add("Driver 1");
    }

    List<String> uniqueSheetNames = makeSheetNamesUnique(outDriverSheetNames);
    outDriverSheetNames.clear();
    outDriverSheetNames.addAll(uniqueSheetNames);
  }
}
