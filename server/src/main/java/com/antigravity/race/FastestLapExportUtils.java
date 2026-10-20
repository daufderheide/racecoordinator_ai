package com.antigravity.race;

import com.antigravity.models.Lane;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.Comment;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Utility helper methods for configuring and styling the Fastest Lap Times worksheet in the Excel
 * export pipeline.
 */
public final class FastestLapExportUtils {

  private FastestLapExportUtils() {}

  /**
   * Adjusts the Fastest Lap Times worksheet in the export template workbook. Configures table
   * headers, lane-dependent cells, spacer columns, and Jxls area comments.
   *
   * @param workbook the target Excel workbook
   * @param activeLanes the list of active lane indices
   * @param race the race entity
   */
  public static void adjustFastestLapSheet(
      XSSFWorkbook workbook, List<Integer> activeLanes, Race race) {
    if (workbook == null) {
      return;
    }
    if (activeLanes == null || activeLanes.isEmpty()) {
      activeLanes = Arrays.asList(0, 1);
    }
    Sheet sheet = workbook.getSheet("Fastest Lap Times");
    if (sheet == null) {
      sheet = workbook.getSheet("Fastest Lap");
    }
    if (sheet == null) {
      sheet = workbook.createSheet("Fastest Lap Times");
      int heatTplIdx = workbook.getSheetIndex("Heat Template");
      if (heatTplIdx != -1) {
        workbook.setSheetOrder("Fastest Lap Times", heatTplIdx + 1);
      } else {
        int heatListIdx = workbook.getSheetIndex("Heat List");
        if (heatListIdx != -1) {
          workbook.setSheetOrder("Fastest Lap Times", heatListIdx + 1);
        }
      }
    }

    Row rowTitle = getOrCreateRow(sheet, 0);
    Cell cTitle = getOrCreateCell(rowTitle, 0);
    String titleText = cTitle.getStringCellValue();
    if (titleText == null || titleText.trim().isEmpty()) {
      cTitle.setCellValue("Fastest Lap Times");
    }

    Row rowHeader = getOrCreateRow(sheet, 2);
    Row rowData = getOrCreateRow(sheet, 3);
    Row rowRecName = getOrCreateRow(sheet, 6);
    Row rowRecTime = getOrCreateRow(sheet, 7);
    Row rowRecDate = getOrCreateRow(sheet, 8);
    Row rowBestName = getOrCreateRow(sheet, 10);
    Row rowBestTime = getOrCreateRow(sheet, 11);

    populateFastestLapTable1(rowHeader, rowData, activeLanes);
    populateFastestLapTable2(rowRecName, rowRecTime, rowRecDate, activeLanes);
    populateFastestLapTable3(rowBestName, rowBestTime, activeLanes);

    int maxContentCol = 1 + activeLanes.size() + 2;
    cleanupFastestLapExtraColumns(
        Arrays.asList(
            rowHeader, rowData, rowRecName, rowRecTime, rowRecDate, rowBestName, rowBestTime),
        maxContentCol);

    updateFastestLapComments(workbook, sheet, activeLanes);
  }

  private static void populateFastestLapTable1(
      Row rowHeader, Row rowData, List<Integer> activeLanes) {
    getOrCreateCell(rowHeader, 0).setCellValue("Driver");
    getOrCreateCell(rowData, 0).setCellValue("${driver.driver.name}");

    for (int i = 0; i < activeLanes.size(); i++) {
      int laneNum = activeLanes.get(i) + 1;
      int col = 1 + i;
      getOrCreateCell(rowHeader, col).setCellValue("Lane " + laneNum);
      getOrCreateCell(rowData, col).setCellValue("${driver.laneFastestLaps[" + i + "]}");
    }

    int spacerCol = 1 + activeLanes.size();
    getOrCreateCell(rowHeader, spacerCol).setCellValue("");
    getOrCreateCell(rowData, spacerCol).setCellValue("");

    int fastLapCol = spacerCol + 1;
    getOrCreateCell(rowHeader, fastLapCol).setCellValue("Fastest Lap");
    getOrCreateCell(rowData, fastLapCol).setCellValue("${driver.bestLapTime}");

    int overallValCol = spacerCol + 2;
    getOrCreateCell(rowHeader, overallValCol).setCellValue("");
    getOrCreateCell(rowData, overallValCol).setCellValue("");
  }

  private static void populateFastestLapTable2(
      Row rowName, Row rowTime, Row rowDate, List<Integer> activeLanes) {
    getOrCreateCell(rowName, 0).setCellValue("Record Lap Name");
    getOrCreateCell(rowTime, 0).setCellValue("Record Lap Time");
    getOrCreateCell(rowDate, 0).setCellValue("Record Lap Date");

    for (int i = 0; i < activeLanes.size(); i++) {
      int col = 1 + i;
      getOrCreateCell(rowName, col).setCellValue("${fastestLaps.recordLapNames[" + i + "]}");
      getOrCreateCell(rowTime, col).setCellValue("${fastestLaps.recordLapTimes[" + i + "]}");
      getOrCreateCell(rowDate, col).setCellValue("${fastestLaps.recordLapDates[" + i + "]}");
    }

    int spacerCol = 1 + activeLanes.size();
    getOrCreateCell(rowName, spacerCol).setCellValue("");
    getOrCreateCell(rowTime, spacerCol).setCellValue("");
    getOrCreateCell(rowDate, spacerCol).setCellValue("");

    int labelCol = spacerCol + 1;
    int valCol = spacerCol + 2;

    getOrCreateCell(rowName, labelCol).setCellValue("Record Lap Time Name");
    getOrCreateCell(rowName, valCol).setCellValue("${fastestLaps.overallRecordLapName}");

    getOrCreateCell(rowTime, labelCol).setCellValue("Record Lap Time");
    getOrCreateCell(rowTime, valCol).setCellValue("${fastestLaps.overallRecordLapTime}");

    getOrCreateCell(rowDate, labelCol).setCellValue("Record Lap Time Date");
    getOrCreateCell(rowDate, valCol).setCellValue("${fastestLaps.overallRecordLapDate}");
  }

  private static void populateFastestLapTable3(
      Row rowName, Row rowTime, List<Integer> activeLanes) {
    getOrCreateCell(rowName, 0).setCellValue("Best Lap Name");
    getOrCreateCell(rowTime, 0).setCellValue("Best Lap Time");

    for (int i = 0; i < activeLanes.size(); i++) {
      int col = 1 + i;
      getOrCreateCell(rowName, col).setCellValue("${fastestLaps.bestLapNames[" + i + "]}");
      getOrCreateCell(rowTime, col).setCellValue("${fastestLaps.bestLapTimes[" + i + "]}");
    }
  }

  private static void cleanupFastestLapExtraColumns(List<Row> rows, int maxColIdx) {
    for (Row row : rows) {
      if (row == null) {
        continue;
      }
      int lastCell = row.getLastCellNum();
      for (int c = maxColIdx + 1; c <= lastCell; c++) {
        Cell cell = row.getCell(c);
        if (cell != null) {
          row.removeCell(cell);
        }
      }
    }
  }

  private static void updateFastestLapComments(
      XSSFWorkbook workbook, Sheet sheet, List<Integer> activeLanes) {
    int lastColIdx = 1 + activeLanes.size() + 2;
    String lastColLetter = CellReference.convertNumToColString(lastColIdx);
    String areaLastCell = lastColLetter + "12";
    String driverLastCell = lastColLetter + "4";

    Comment commentA1 = sheet.getCellComment(new CellAddress(0, 0));
    if (commentA1 != null) {
      String text = commentA1.getString().getString();
      String updated =
          text.replaceAll("lastCell=\"[A-Z]+[0-9]+\"", "lastCell=\"" + areaLastCell + "\"");
      commentA1.setString(workbook.getCreationHelper().createRichTextString(updated));
    } else {
      setCellComment(sheet, 0, 0, "jx:area(lastCell=\"" + areaLastCell + "\")");
    }

    Comment commentA4 = sheet.getCellComment(new CellAddress(3, 0));
    if (commentA4 != null) {
      String text = commentA4.getString().getString();
      String updated =
          text.replaceAll("lastCell=\"[A-Z]+[0-9]+\"", "lastCell=\"" + driverLastCell + "\"");
      commentA4.setString(workbook.getCreationHelper().createRichTextString(updated));
    } else {
      setCellComment(
          sheet,
          3,
          0,
          "jx:each(items=\"standings\", var=\"driver\", lastCell=\"" + driverLastCell + "\")");
    }
  }

  private static void setCellComment(Sheet sheet, int rowIdx, int colIdx, String text) {
    try {
      Row row = getOrCreateRow(sheet, rowIdx);
      Cell cell = getOrCreateCell(row, colIdx);
      Drawing<?> drawing = sheet.createDrawingPatriarch();
      CreationHelper helper = sheet.getWorkbook().getCreationHelper();
      ClientAnchor anchor = helper.createClientAnchor();
      anchor.setCol1(colIdx);
      anchor.setRow1(rowIdx);
      anchor.setCol2(colIdx + 2);
      anchor.setRow2(rowIdx + 2);
      Comment comment = drawing.createCellComment(anchor);
      comment.setString(helper.createRichTextString(text));
      cell.setCellComment(comment);
    } catch (Exception ignored) {
    }
  }

  private static Row getOrCreateRow(Sheet sheet, int rowIdx) {
    Row row = sheet.getRow(rowIdx);
    return row != null ? row : sheet.createRow(rowIdx);
  }

  private static Cell getOrCreateCell(Row row, int colIdx) {
    Cell cell = row.getCell(colIdx);
    return cell != null ? cell : row.createCell(colIdx);
  }

  /**
   * Checks whether the given sheet represents the Fastest Lap Times tab.
   *
   * @param sheet the sheet to test
   * @return true if sheet name or header indicates fastest lap tab
   */
  public static boolean isFastestLapSheet(Sheet sheet) {
    if (sheet == null) {
      return false;
    }
    String name = sheet.getSheetName() != null ? sheet.getSheetName().trim().toLowerCase() : "";
    if (name.contains("fastest lap")) {
      return true;
    }
    for (int i = 0; i <= Math.min(5, sheet.getLastRowNum()); i++) {
      Row row = sheet.getRow(i);
      if (row == null) {
        continue;
      }
      String c0 = RaceStatisticsUtils.getCellString(row.getCell(0));
      if ("Fastest Lap Times".equalsIgnoreCase(c0) || "Fastest Lap".equalsIgnoreCase(c0)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Colors the Fastest Lap Times tab using the track's configured lane colors. Applies colors to
   * Table 1 headers and cells, Table 2 lane cells, and Table 3 lane cells.
   *
   * @param workbook the workbook containing the sheet
   * @param sheet the Fastest Lap Times sheet
   * @param lanes the track lane configurations
   * @param styleCache cache of created cell styles
   */
  public static void colorFastestLapSheet(
      XSSFWorkbook workbook, Sheet sheet, List<Lane> lanes, Map<String, CellStyle> styleCache) {
    if (workbook == null || sheet == null || lanes == null || lanes.isEmpty()) {
      return;
    }

    Row headerRow = null;
    Map<Integer, Integer> colToLane = new HashMap<>();

    for (int r = 0; r <= Math.min(5, sheet.getLastRowNum()); r++) {
      Row row = sheet.getRow(r);
      if (row == null || RaceStatisticsUtils.isTitleOrSubtitleRow(row)) {
        continue;
      }
      for (Cell cell : row) {
        Matcher m =
            RaceStatisticsUtils.LANE_HEADER_PATTERN.matcher(
                RaceStatisticsUtils.getCellString(cell));
        if (m.matches()) {
          int laneNum = Integer.parseInt(m.group(1));
          int laneIdx = laneNum - 1;
          if (laneIdx >= 0 && laneIdx < lanes.size()) {
            colToLane.put(cell.getColumnIndex(), laneIdx);
          }
        }
      }
      if (!colToLane.isEmpty()) {
        headerRow = row;
        break;
      }
    }

    if (headerRow == null || colToLane.isEmpty()) {
      return;
    }

    for (Map.Entry<Integer, Integer> entry : colToLane.entrySet()) {
      Cell cell = headerRow.getCell(entry.getKey());
      if (cell != null) {
        RaceStatisticsUtils.colorCell(
            workbook, cell, lanes.get(entry.getValue()), true, true, styleCache);
      }
    }

    for (int r = headerRow.getRowNum() + 1; r <= sheet.getLastRowNum(); r++) {
      Row row = sheet.getRow(r);
      if (row == null || RaceStatisticsUtils.isTitleOrSubtitleRow(row)) {
        continue;
      }
      String c0Str = RaceStatisticsUtils.getCellString(row.getCell(0));
      if (c0Str.isEmpty() || c0Str.startsWith("#")) {
        continue;
      }
      for (Map.Entry<Integer, Integer> entry : colToLane.entrySet()) {
        Cell cell = row.getCell(entry.getKey());
        if (cell != null) {
          RaceStatisticsUtils.colorCell(
              workbook, cell, lanes.get(entry.getValue()), false, true, styleCache);
        }
      }
    }
  }
}
