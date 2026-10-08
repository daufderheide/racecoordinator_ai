package com.antigravity.importer;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.importer.DriverImportParserHelper.ExtractedPackage;
import com.antigravity.importer.DriverImportParserHelper.ParsedDataFile;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.Test;

public class DriverImportParserHelperTest {

  @Test
  public void testParseCsvWithDirectivesAndQuotes() throws Exception {
    String csv =
        "# default-audio: none\n"
            + "Name,Nickname,Avatar,\"Lap Sound\"\n"
            + "\"Andretti, Mario\",Mario,mario.png,default_beep\n"
            + "Senna,Ayrton,,tts:Great lap\n";

    ByteArrayInputStream bais = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    ParsedDataFile parsed = DriverImportParserHelper.parseCsv(bais);

    assertEquals("none", parsed.getDetectedAudioDefault());
    assertEquals(2, parsed.getRows().size());

    assertEquals("Andretti, Mario", parsed.getRows().get(0).get("name"));
    assertEquals("Mario", parsed.getRows().get(0).get("nickname"));
    assertEquals("mario.png", parsed.getRows().get(0).get("avatar"));
    assertEquals("default_beep", parsed.getRows().get(0).get("lap"));

    assertEquals("Senna", parsed.getRows().get(1).get("name"));
    assertEquals("Ayrton", parsed.getRows().get(1).get("nickname"));
    assertEquals("tts:Great lap", parsed.getRows().get(1).get("lap"));
  }

  @Test
  public void testParseCsvSemicolonAndTabDelimiters() throws Exception {
    String csvSemi = "Name;Nickname;Lap Sound\nMario;Jumpman;beep.wav\n";
    ParsedDataFile p1 =
        DriverImportParserHelper.parseCsv(
            new ByteArrayInputStream(csvSemi.getBytes(StandardCharsets.UTF_8)));
    assertEquals(1, p1.getRows().size());
    assertEquals("Mario", p1.getRows().get(0).get("name"));
    assertEquals("Jumpman", p1.getRows().get(0).get("nickname"));

    String csvTab = "Name\tNickname\tLap Sound\nLuigi\tWeegee\tchimes.wav\n";
    ParsedDataFile p2 =
        DriverImportParserHelper.parseCsv(
            new ByteArrayInputStream(csvTab.getBytes(StandardCharsets.UTF_8)));
    assertEquals(1, p2.getRows().size());
    assertEquals("Luigi", p2.getRows().get(0).get("name"));
    assertEquals("Weegee", p2.getRows().get(0).get("nickname"));
  }

  @Test
  public void testParseExcel() throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (Workbook wb = new XSSFWorkbook()) {
      Sheet sheet = wb.createSheet("Drivers");
      Row r0 = sheet.createRow(0);
      r0.createCell(0).setCellValue("# default-audio: none");

      Row r1 = sheet.createRow(1);
      r1.createCell(0).setCellValue("Driver Name");
      r1.createCell(1).setCellValue("Callsign");
      r1.createCell(2).setCellValue("Lap Sound");

      Row r2 = sheet.createRow(2);
      r2.createCell(0).setCellValue("Max Verstappen");
      r2.createCell(1).setCellValue("Max");
      r2.createCell(2).setCellValue("driveby.wav");

      wb.write(baos);
    }

    ParsedDataFile parsed =
        DriverImportParserHelper.parseExcel(new ByteArrayInputStream(baos.toByteArray()));

    assertEquals("none", parsed.getDetectedAudioDefault());
    assertEquals(1, parsed.getRows().size());
    assertEquals("Max Verstappen", parsed.getRows().get(0).get("name"));
    assertEquals("Max", parsed.getRows().get(0).get("nickname"));
    assertEquals("driveby.wav", parsed.getRows().get(0).get("lap"));
  }

  @Test
  public void testParseJsonEnvelopeAndArray() throws Exception {
    String jsonEnv =
        "{\n"
            + "  \"defaultAudio\": \"none\",\n"
            + "  \"drivers\": [\n"
            + "    {\"name\": \"Lewis Hamilton\", \"nickname\": \"Lewis\", \"lapAudio\": {\"type\": \"preset\", \"url\": \"beep.wav\"}}\n"
            + "  ]\n"
            + "}";

    ParsedDataFile p1 =
        DriverImportParserHelper.parseJson(
            new ByteArrayInputStream(jsonEnv.getBytes(StandardCharsets.UTF_8)));
    assertEquals("none", p1.getDetectedAudioDefault());
    assertEquals(1, p1.getRows().size());
    assertEquals("Lewis Hamilton", p1.getRows().get(0).get("name"));
    assertEquals("Lewis", p1.getRows().get(0).get("nickname"));
    assertEquals("beep.wav", p1.getRows().get(0).get("lap"));

    String jsonArr = "[\n" + "  {\"name\": \"Charles Leclerc\", \"nickname\": \"Charles\"}\n" + "]";
    ParsedDataFile p2 =
        DriverImportParserHelper.parseJson(
            new ByteArrayInputStream(jsonArr.getBytes(StandardCharsets.UTF_8)));
    assertEquals("system", p2.getDetectedAudioDefault());
    assertEquals(1, p2.getRows().size());
    assertEquals("Charles Leclerc", p2.getRows().get(0).get("name"));
  }

  @Test
  public void testExtractZipPackage() throws Exception {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      ZipEntry eCsv = new ZipEntry("drivers.csv");
      zos.putNextEntry(eCsv);
      zos.write("Name,Nickname\nMario,Mario\n".getBytes(StandardCharsets.UTF_8));
      zos.closeEntry();

      ZipEntry eSound = new ZipEntry("sounds/custom_horn.wav");
      zos.putNextEntry(eSound);
      zos.write(new byte[] {1, 2, 3, 4});
      zos.closeEntry();
    }

    ExtractedPackage pkg =
        DriverImportParserHelper.extractZip(new ByteArrayInputStream(baos.toByteArray()));

    assertEquals("drivers.csv", pkg.getPrimaryFileName());
    assertNotNull(pkg.getPrimaryFileData());
    assertTrue(pkg.getCompanionAssets().containsKey("custom_horn.wav"));
    assertEquals(4, pkg.getCompanionAssets().get("custom_horn.wav").length);
  }
}
