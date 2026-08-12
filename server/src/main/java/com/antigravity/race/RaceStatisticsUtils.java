package com.antigravity.race;

import com.antigravity.models.Lane;
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
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class RaceStatisticsUtils {

  private RaceStatisticsUtils() {}

  public static InputStream sanitizeWorkbookTemplate(InputStream inputStream) {
    return sanitizeWorkbookTemplate(inputStream, java.util.Arrays.asList(0, 1), null);
  }

  public static InputStream sanitizeWorkbookTemplate(
      InputStream inputStream, List<Integer> activeLanes) {
    return sanitizeWorkbookTemplate(inputStream, activeLanes, null);
  }

  public static InputStream sanitizeWorkbookTemplate(
      InputStream inputStream, List<Integer> activeLanes, Race race) {
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

      boolean hasSeason =
          race != null
              && race.getSeasonEntityId() != null
              && !race.getSeasonEntityId().trim().isEmpty();

      adjustOverallStandingsSheet(workbook, activeLanes, hasSeason);
      adjustHeatListSheet(workbook, activeLanes, race, hasSeason);
      adjustRaceInformationSheet(workbook, race);

      if (!hasSeason) {
        int seasonSheetIndex = workbook.getSheetIndex("Season Standings");
        if (seasonSheetIndex != -1) {
          workbook.removeSheetAt(seasonSheetIndex);
        } else if (workbook.getNumberOfSheets() > 0
            && "Season Standings".equalsIgnoreCase(workbook.getSheetName(0))) {
          workbook.removeSheetAt(0);
        }
      }

      workbook.write(os);
      return new ByteArrayInputStream(os.toByteArray());
    } catch (Exception e) {
      return new ByteArrayInputStream(bytes);
    }
  }

  private static void adjustRaceInformationSheet(XSSFWorkbook workbook, Race race) {
    if (race == null || race.getRaceModel() == null) {
      return;
    }

    Sheet sheet = workbook.getSheet("Race Information");
    if (sheet == null && workbook.getNumberOfSheets() > 0) {
      for (Sheet s : workbook) {
        if ("Race Information".equalsIgnoreCase(s.getSheetName())) {
          sheet = s;
          break;
        }
      }
    }
    if (sheet == null) {
      return;
    }

    boolean analogFuelEnabled =
        race.getRaceModel().getFuelOptions() != null
            && race.getRaceModel().getFuelOptions().isEnabled();
    boolean digitalFuelEnabled =
        race.getRaceModel().getDigitalFuelOptions() != null
            && race.getRaceModel().getDigitalFuelOptions().isEnabled();
    boolean groupEnabled =
        race.getRaceModel().getGroupOptions() != null
            && race.getRaceModel().getGroupOptions().isEnabled();

    int lastRow = sheet.getLastRowNum();
    for (int r = lastRow; r >= 15; r--) {
      Row row = sheet.getRow(r);
      if (row == null) {
        continue;
      }
      Cell cell0 = row.getCell(0);
      if (cell0 == null || cell0.getCellType() != CellType.STRING) {
        continue;
      }
      String fieldName = cell0.getStringCellValue().trim();

      boolean removeRow = false;
      if (fieldName.startsWith("fuel_options.") && !fieldName.equals("fuel_options.enabled")) {
        if (!analogFuelEnabled) {
          removeRow = true;
        }
      } else if (fieldName.startsWith("digital_fuel_options.")
          && !fieldName.equals("digital_fuel_options.enabled")) {
        if (!digitalFuelEnabled) {
          removeRow = true;
        }
      } else if (fieldName.startsWith("group_options.")
          && !fieldName.equals("group_options.enabled")) {
        if (!groupEnabled) {
          removeRow = true;
        }
      }

      if (removeRow) {
        sheet.removeRow(row);
        if (r < sheet.getLastRowNum()) {
          sheet.shiftRows(r + 1, sheet.getLastRowNum(), -1);
        }
      }
    }
  }

  private static void adjustOverallStandingsSheet(
      XSSFWorkbook workbook, List<Integer> activeLanes, boolean hasSeason) {
    if (activeLanes == null || activeLanes.isEmpty()) {
      activeLanes = java.util.Arrays.asList(0, 1);
    }
    Sheet sheet = workbook.getSheet("Overall Standings");
    int expectedIndex = hasSeason ? 3 : 2;
    if (sheet == null && workbook.getNumberOfSheets() > expectedIndex) {
      sheet = workbook.getSheetAt(expectedIndex);
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

    for (int i = 0; i < activeLanes.size(); i++) {
      int l = activeLanes.get(i);
      int col = 4 + i;
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

    int startExtraCol = 4 + activeLanes.size();
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

  private static void adjustHeatListSheet(
      XSSFWorkbook workbook, List<Integer> activeLanes, Race race, boolean hasSeason) {
    if (activeLanes == null || activeLanes.isEmpty()) {
      activeLanes = java.util.Arrays.asList(0, 1);
    }
    Sheet sheet = workbook.getSheet("Heat List");
    int expectedIndex = hasSeason ? 2 : 1;
    if (sheet == null && workbook.getNumberOfSheets() > expectedIndex) {
      Sheet s = workbook.getSheetAt(expectedIndex);
      if ("Heat List".equalsIgnoreCase(s.getSheetName())) {
        sheet = s;
      }
    }
    if (sheet == null) {
      return;
    }

    Row row3 = sheet.getRow(3);
    Row row4 = sheet.getRow(4);
    if (row3 == null || row4 == null) {
      return;
    }

    Cell refHeaderCell = row3.getCell(1);
    Cell refDataCell = row4.getCell(1);
    CellStyle defaultHeaderStyle = refHeaderCell != null ? refHeaderCell.getCellStyle() : null;
    CellStyle defaultDataStyle = refDataCell != null ? refDataCell.getCellStyle() : null;

    List<Lane> trackLanes = null;
    if (race != null && race.getTrack() != null) {
      trackLanes = race.getTrack().getLanes();
    }

    for (int i = 0; i < activeLanes.size(); i++) {
      int l = activeLanes.get(i);
      int col = 1 + i;
      Cell cHeader = row3.getCell(col);
      if (cHeader == null) {
        cHeader = row3.createCell(col);
      }
      cHeader.setCellValue("Lane " + (l + 1));

      Cell cData = row4.getCell(col);
      if (cData == null) {
        cData = row4.createCell(col);
      }
      cData.setCellValue("${heat.getDriverNameOnLane(" + l + ")}");

      String bgColorStr = null;
      String fgColorStr = null;
      if (trackLanes != null && l < trackLanes.size()) {
        Lane lane = trackLanes.get(l);
        if (lane != null) {
          bgColorStr = lane.getBackground_color();
          fgColorStr = lane.getForeground_color();
        }
      }

      if (defaultHeaderStyle != null) cHeader.setCellStyle(defaultHeaderStyle);
      if (bgColorStr != null || fgColorStr != null) {
        CellStyle dataLaneStyle =
            createColoredCellStyle(workbook, defaultDataStyle, bgColorStr, fgColorStr, false);
        cData.setCellStyle(dataLaneStyle);
      } else {
        if (defaultHeaderStyle != null) cHeader.setCellStyle(defaultHeaderStyle);
        if (defaultDataStyle != null) cData.setCellStyle(defaultDataStyle);
      }
    }

    int lastLaneColIdx = 1 + activeLanes.size() - 1;
    int maxCol = Math.max((int) row3.getLastCellNum(), (int) row4.getLastCellNum());
    for (int col = lastLaneColIdx + 1; col <= maxCol; col++) {
      Cell c3 = row3.getCell(col);
      if (c3 != null) row3.removeCell(c3);
      Cell c4 = row4.getCell(col);
      if (c4 != null) row4.removeCell(c4);
    }

    String lastColLetter = CellReference.convertNumToColString(lastLaneColIdx);
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

  private static final org.apache.poi.xssf.usermodel.IndexedColorMap COLOR_MAP =
      new org.apache.poi.xssf.usermodel.DefaultIndexedColorMap();

  private static XSSFColor createXssfColor(java.awt.Color color) {
    if (color == null) {
      return null;
    }
    byte[] rgb =
        new byte[] {(byte) color.getRed(), (byte) color.getGreen(), (byte) color.getBlue()};
    return new XSSFColor(rgb, COLOR_MAP);
  }

  private static CellStyle createColoredCellStyle(
      XSSFWorkbook workbook,
      CellStyle baseStyle,
      String bgColorStr,
      String fgColorStr,
      boolean isHeader) {
    XSSFCellStyle style = workbook.createCellStyle();
    if (baseStyle != null) {
      style.cloneStyleFrom(baseStyle);
    } else {
      style.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
      style.setVerticalAlignment(org.apache.poi.ss.usermodel.VerticalAlignment.CENTER);
    }

    java.awt.Color bgColor = parseColor(bgColorStr);
    if (bgColor != null) {
      XSSFColor xssfBg = createXssfColor(bgColor);
      style.setFillForegroundColor(xssfBg);
      style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    }

    java.awt.Color fgColor = parseColor(fgColorStr);
    XSSFFont font = workbook.createFont();
    if (baseStyle != null && baseStyle.getFontIndex() > 0) {
      XSSFFont baseFont = workbook.getFontAt(baseStyle.getFontIndex());
      if (baseFont != null) {
        font.setBold(baseFont.getBold());
        font.setFontHeightInPoints(baseFont.getFontHeightInPoints());
        font.setFontName(baseFont.getFontName());
      }
    }
    if (isHeader) {
      font.setBold(true);
    }
    if (fgColor != null) {
      XSSFColor xssfFg = createXssfColor(fgColor);
      font.setColor(xssfFg);
    }
    style.setFont(font);

    return style;
  }

  public static void removeAllCommentsAndVmlDrawings(Workbook workbook) {
    if (workbook == null) return;
    if (workbook instanceof XSSFWorkbook) {
      XSSFWorkbook xssfWb = (XSSFWorkbook) workbook;
      for (int i = 0; i < xssfWb.getNumberOfSheets(); i++) {
        Sheet sheet = xssfWb.getSheetAt(i);
        if (sheet instanceof XSSFSheet) {
          XSSFSheet xssfSheet = (XSSFSheet) sheet;
          for (Row row : xssfSheet) {
            if (row == null) continue;
            for (Cell cell : row) {
              if (cell != null && cell.getCellComment() != null) {
                try {
                  cell.removeCellComment();
                } catch (Exception ignored) {
                }
              }
            }
          }
          try {
            if (xssfSheet.getCTWorksheet().isSetLegacyDrawing()) {
              xssfSheet.getCTWorksheet().unsetLegacyDrawing();
            }
            if (xssfSheet.getCTWorksheet().isSetLegacyDrawingHF()) {
              xssfSheet.getCTWorksheet().unsetLegacyDrawingHF();
            }
          } catch (Exception ignored) {
          }

          List<org.apache.poi.ooxml.POIXMLDocumentPart.RelationPart> relParts =
              new ArrayList<>(xssfSheet.getRelationParts());
          for (org.apache.poi.ooxml.POIXMLDocumentPart.RelationPart rp : relParts) {
            if (rp != null && rp.getRelationship() != null) {
              String type = rp.getRelationship().getRelationshipType();
              if (type != null && (type.contains("comments") || type.contains("vmlDrawing"))) {
                try {
                  for (java.lang.reflect.Method m :
                      org.apache.poi.ooxml.POIXMLDocumentPart.class.getDeclaredMethods()) {
                    if (m.getName().equals("removeRelation")
                        && m.getParameterCount() == 2
                        && m.getParameterTypes()[0]
                            == org.apache.poi.ooxml.POIXMLDocumentPart.class) {
                      m.setAccessible(true);
                      m.invoke(xssfSheet, rp.getDocumentPart(), true);
                      break;
                    }
                  }
                } catch (Exception ignored) {
                }
              }
            }
          }
        }
      }
    }
  }

  public static java.awt.Color parseColor(String colorStr) {
    if (colorStr == null || colorStr.trim().isEmpty()) {
      return null;
    }
    String str = colorStr.trim().toLowerCase();
    if (str.startsWith("#")) {
      try {
        if (str.length() == 4) {
          char r = str.charAt(1);
          char g = str.charAt(2);
          char b = str.charAt(3);
          str = "#" + r + r + g + g + b + b;
        }
        return java.awt.Color.decode(str);
      } catch (Exception e) {
        return null;
      }
    }
    switch (str) {
      case "red":
        return java.awt.Color.RED;
      case "blue":
        return java.awt.Color.BLUE;
      case "green":
        return java.awt.Color.GREEN;
      case "yellow":
        return java.awt.Color.YELLOW;
      case "white":
        return java.awt.Color.WHITE;
      case "black":
        return java.awt.Color.BLACK;
      case "orange":
        return new java.awt.Color(255, 165, 0);
      case "purple":
        return new java.awt.Color(128, 0, 128);
      case "pink":
        return new java.awt.Color(255, 192, 203);
      case "gray":
      case "grey":
        return java.awt.Color.GRAY;
      case "cyan":
        return java.awt.Color.CYAN;
      case "magenta":
        return java.awt.Color.MAGENTA;
      case "lime":
        return new java.awt.Color(0, 255, 0);
      case "navy":
        return new java.awt.Color(0, 0, 128);
      case "teal":
        return new java.awt.Color(0, 128, 128);
      case "maroon":
        return new java.awt.Color(128, 0, 0);
      case "olive":
        return new java.awt.Color(128, 128, 0);
      default:
        try {
          return java.awt.Color.decode(str);
        } catch (Exception e) {
          return null;
        }
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

  public static List<Integer> determineActiveLanes(Race race, List<Heat> runHeats) {
    java.util.Set<Integer> active = new java.util.HashSet<>();
    if (runHeats != null) {
      for (Heat h : runHeats) {
        if (h.getDrivers() != null) {
          for (int i = 0; i < h.getDrivers().size(); i++) {
            DriverHeatData dhd = h.getDrivers().get(i);
            if (dhd != null && !dhd.isEmptyParticipant()) {
              active.add(i);
            }
          }
        }
      }
    }
    if (active.isEmpty()) {
      int defaultLanes = 2;
      if (race != null && race.getTrack() != null && race.getTrack().getLanes() != null) {
        defaultLanes = race.getTrack().getLanes().size();
      }
      for (int i = 0; i < defaultLanes; i++) {
        active.add(i);
      }
    }
    List<Integer> sorted = new ArrayList<>(active);
    Collections.sort(sorted);
    return sorted;
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

    List<Integer> activeLanes = determineActiveLanes(race, runHeats);

    for (RaceParticipant p : drivers) {
      List<Double> laneLaps = new ArrayList<>();
      for (int l : activeLanes) {
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

      for (int l : activeLanes) {
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

  private static boolean isHeaderRow(Row row) {
    if (row == null) return true;
    for (Cell c : row) {
      if (c == null) continue;
      if (c.getCellType() == CellType.STRING) {
        String val = c.getStringCellValue().trim();
        if ("Driver".equalsIgnoreCase(val)
            || "Driver / Team".equalsIgnoreCase(val)
            || "Rank".equalsIgnoreCase(val)
            || "Metric".equalsIgnoreCase(val)
            || "Heat".equalsIgnoreCase(val)
            || "Field".equalsIgnoreCase(val)
            || "Actual Driver".equalsIgnoreCase(val)
            || "Lap Time".equalsIgnoreCase(val)
            || "Total Laps".equalsIgnoreCase(val)
            || "Total Time".equalsIgnoreCase(val)) {
          return true;
        }
      }
      CellStyle style = c.getCellStyle();
      if (style != null
          && style.getFillPattern() != org.apache.poi.ss.usermodel.FillPatternType.NO_FILL) {
        org.apache.poi.ss.usermodel.Color color = style.getFillForegroundColorColor();
        if (color instanceof org.apache.poi.xssf.usermodel.XSSFColor) {
          String argb = ((org.apache.poi.xssf.usermodel.XSSFColor) color).getARGBHex();
          if (argb != null && argb.toUpperCase().endsWith("D0D0D0")) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public static void applyPostJxlsLaneColors(
      org.apache.poi.xssf.usermodel.XSSFWorkbook workbook, Race race) {
    if (race == null || race.getTrack() == null || race.getTrack().getLanes() == null) {
      return;
    }
    List<Lane> lanes = race.getTrack().getLanes();
    java.util.Map<String, CellStyle> styleCache = new java.util.HashMap<>();

    for (Sheet sheet : workbook) {
      java.util.Map<Integer, Integer> columnToLaneIndex = new java.util.HashMap<>();

      for (int i = 0; i <= 20; i++) {
        Row row = sheet.getRow(i);
        if (row == null) continue;
        for (Cell cell : row) {
          if (cell.getCellType() == CellType.STRING) {
            String text = cell.getStringCellValue().trim();
            if (text.isEmpty()) continue;

            java.util.regex.Matcher m =
                java.util.regex.Pattern.compile(
                        "^Lane\\s+(\\d+)(?:\\s+Laps)?$", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(text);
            if (m.matches()) {
              int laneNum = Integer.parseInt(m.group(1));
              int laneIdx = laneNum - 1;
              if (laneIdx >= 0 && laneIdx < lanes.size()) {
                columnToLaneIndex.put(cell.getColumnIndex(), laneIdx);
              }
            } else if ("Lane".equalsIgnoreCase(text)) {
              columnToLaneIndex.put(cell.getColumnIndex(), -2);
            }
          }
        }
      }

      if (!columnToLaneIndex.isEmpty()) {
        for (Row row : sheet) {
          if (isHeaderRow(row)) continue;

          for (java.util.Map.Entry<Integer, Integer> entry : columnToLaneIndex.entrySet()) {
            int colIdx = entry.getKey();
            int laneIdx = entry.getValue();

            if (laneIdx == -2) {
              Cell laneCell = row.getCell(colIdx);
              if (laneCell == null) continue;
              int dynamicLaneIdx = -1;
              if (laneCell.getCellType() == CellType.NUMERIC) {
                dynamicLaneIdx = ((int) laneCell.getNumericCellValue()) - 1;
              } else if (laneCell.getCellType() == CellType.STRING) {
                try {
                  dynamicLaneIdx = Integer.parseInt(laneCell.getStringCellValue().trim()) - 1;
                } catch (NumberFormatException e) {
                }
              }
              if (dynamicLaneIdx >= 0 && dynamicLaneIdx < lanes.size()) {
                Lane lane = lanes.get(dynamicLaneIdx);
                for (Cell c : row) {
                  if (c != null) {
                    colorCell(workbook, c, lane, false, styleCache);
                  }
                }
              }
            } else {
              Cell cell = row.getCell(colIdx);
              if (cell != null) {
                colorCell(workbook, cell, lanes.get(laneIdx), false, styleCache);
              }
            }
          }
        }
      }
    }
  }

  private static void colorCell(
      org.apache.poi.xssf.usermodel.XSSFWorkbook workbook,
      Cell cell,
      Lane lane,
      boolean isHeader,
      java.util.Map<String, CellStyle> styleCache) {
    if (lane == null || cell == null) return;
    String bgColorStr = lane.getBackground_color();
    String fgColorStr = lane.getForeground_color();
    if ((bgColorStr == null || bgColorStr.isEmpty())
        && (fgColorStr == null || fgColorStr.isEmpty())) {
      return;
    }
    CellStyle baseStyle = cell.getCellStyle();
    if (baseStyle != null) {
      if (baseStyle.getFillPattern() != org.apache.poi.ss.usermodel.FillPatternType.NO_FILL) {
        org.apache.poi.ss.usermodel.Color color = baseStyle.getFillForegroundColorColor();
        if (color instanceof org.apache.poi.xssf.usermodel.XSSFColor) {
          String argb = ((org.apache.poi.xssf.usermodel.XSSFColor) color).getARGBHex();
          // Default gray header color in template is D0D0D0 (usually 00D0D0D0 or FFD0D0D0)
          if (argb == null || !argb.toUpperCase().endsWith("D0D0D0")) {
            return; // User has overridden the template cell color, skip dynamic lane color
          }
        } else if (color != null) {
          // If it has a color but not XSSFColor, assume it's overridden
          return;
        }
      }
    }

    short baseIndex = baseStyle != null ? baseStyle.getIndex() : -1;
    String key = baseIndex + "_" + bgColorStr + "_" + fgColorStr + "_" + isHeader;

    CellStyle style = styleCache.get(key);
    if (style == null) {
      style = createColoredCellStyle(workbook, baseStyle, bgColorStr, fgColorStr, isHeader);
      styleCache.put(key, style);
    }
    cell.setCellStyle(style);
  }
}
