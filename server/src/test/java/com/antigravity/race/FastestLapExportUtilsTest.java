package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Lane;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.Test;

public class FastestLapExportUtilsTest {

  @Test
  public void testAdjustFastestLapSheet_CreatesSheetAndPopulatesTables() {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      wb.createSheet("Heat List");
      FastestLapExportUtils.adjustFastestLapSheet(wb, Arrays.asList(0, 1), null);

      Sheet sheet = wb.getSheet("Fastest Lap Times");
      assertNotNull("Expected Fastest Lap Times sheet to be created", sheet);
      assertEquals(1, wb.getSheetIndex("Fastest Lap Times")); // after Heat List

      Row row0 = sheet.getRow(0);
      assertNotNull(row0);
      assertEquals("Fastest Lap Times", row0.getCell(0).getStringCellValue());

      Row row2 = sheet.getRow(2);
      assertEquals("Driver", row2.getCell(0).getStringCellValue());
      assertEquals("Lane 1", row2.getCell(1).getStringCellValue());
      assertEquals("Lane 2", row2.getCell(2).getStringCellValue());
      assertEquals("Fastest Lap", row2.getCell(4).getStringCellValue());

      Row row3 = sheet.getRow(3);
      assertEquals("${driver.driver.name}", row3.getCell(0).getStringCellValue());
      assertEquals("${driver.laneFastestLaps[0]}", row3.getCell(1).getStringCellValue());
      assertEquals("${driver.laneFastestLaps[1]}", row3.getCell(2).getStringCellValue());
      assertEquals("${driver.bestLapTime}", row3.getCell(4).getStringCellValue());

      Row row6 = sheet.getRow(6);
      assertEquals("Record Lap Name", row6.getCell(0).getStringCellValue());
      assertEquals("${fastestLaps.recordLapNames[0]}", row6.getCell(1).getStringCellValue());
      assertEquals("Record Lap Time Name", row6.getCell(4).getStringCellValue());
      assertEquals("${fastestLaps.overallRecordLapName}", row6.getCell(5).getStringCellValue());

      Row row7 = sheet.getRow(7);
      assertEquals("Record Lap Time", row7.getCell(0).getStringCellValue());
      assertEquals("${fastestLaps.recordLapTimes[0]}", row7.getCell(1).getStringCellValue());

      Row row8 = sheet.getRow(8);
      assertEquals("Record Lap Date", row8.getCell(0).getStringCellValue());
      assertEquals("${fastestLaps.recordLapDates[0]}", row8.getCell(1).getStringCellValue());

      Row row10 = sheet.getRow(10);
      assertEquals("Best Lap Name", row10.getCell(0).getStringCellValue());
      assertEquals("${fastestLaps.bestLapNames[0]}", row10.getCell(1).getStringCellValue());

      Row row11 = sheet.getRow(11);
      assertEquals("Best Lap Time", row11.getCell(0).getStringCellValue());
      assertEquals("${fastestLaps.bestLapTimes[0]}", row11.getCell(1).getStringCellValue());
    } catch (Exception e) {
      org.junit.Assert.fail("Unexpected exception: " + e.getMessage());
    }
  }

  @Test
  public void testIsFastestLapSheet() {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      Sheet s1 = wb.createSheet("Fastest Lap Times");
      assertTrue(FastestLapExportUtils.isFastestLapSheet(s1));

      Sheet s2 = wb.createSheet("Fastest Lap");
      assertTrue(FastestLapExportUtils.isFastestLapSheet(s2));

      Sheet s3 = wb.createSheet("Other Sheet");
      assertFalse(FastestLapExportUtils.isFastestLapSheet(s3));
      Row r0 = s3.createRow(0);
      r0.createCell(0).setCellValue("Fastest Lap Times");
      assertTrue(FastestLapExportUtils.isFastestLapSheet(s3));

      assertFalse(FastestLapExportUtils.isFastestLapSheet(null));
    } catch (Exception e) {
      org.junit.Assert.fail("Unexpected exception: " + e.getMessage());
    }
  }

  @Test
  public void testColorFastestLapSheet() {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      Sheet sheet = wb.createSheet("Fastest Lap Times");
      Row row2 = sheet.createRow(2);
      row2.createCell(0).setCellValue("Driver");
      row2.createCell(1).setCellValue("Lane 1");
      row2.createCell(2).setCellValue("Lane 2");

      Row row3 = sheet.createRow(3);
      row3.createCell(0).setCellValue("David");
      row3.createCell(1).setCellValue(6.737);
      row3.createCell(2).setCellValue(6.621);

      List<Lane> lanes =
          Arrays.asList(new Lane("red", "white", 100), new Lane("blue", "white", 100));

      FastestLapExportUtils.colorFastestLapSheet(
          wb, sheet, lanes, new HashMap<String, CellStyle>());

      assertNotNull(row2.getCell(1).getCellStyle());
      assertNotNull(row3.getCell(1).getCellStyle());

      // Null handling
      FastestLapExportUtils.colorFastestLapSheet(null, sheet, lanes, null);
      FastestLapExportUtils.colorFastestLapSheet(wb, null, lanes, null);
      FastestLapExportUtils.colorFastestLapSheet(wb, sheet, null, null);
    } catch (Exception e) {
      org.junit.Assert.fail("Unexpected exception: " + e.getMessage());
    }
  }
}
