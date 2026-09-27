package com.antigravity.handlers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.race.ClientSubscriptionManager;
import io.javalin.http.Context;
import java.io.File;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Path;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceExportSaveHandlerTest {

  private DatabaseContext databaseContext;
  private RaceExportSaveHandler handler;
  private Context ctx;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "export_save_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    Path tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    ClientSubscriptionManager.setInstance(null);
    handler = new RaceExportSaveHandler(databaseContext);

    ctx = mock(Context.class);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.contentType(any(String.class))).thenReturn(ctx);
    when(ctx.header(any(), any())).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testSaveRace_NoActiveRace_ShouldReturn404() {
    handler.saveRace(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testExportCsv_NoActiveRace_ShouldReturn404() {
    handler.exportRaceCsv(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testSaveRace_WhenRacing_ShouldReturn400() {
    com.antigravity.race.Race mockRace = mock(com.antigravity.race.Race.class);
    when(mockRace.getState()).thenReturn(new com.antigravity.race.states.Racing());
    ClientSubscriptionManager.getInstance().setRace(mockRace);

    handler.saveRace(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testGetSavedRaces_Success() {
    handler.getSavedRaces(ctx);
    verify(ctx).contentType("application/json");
  }

  @Test
  public void testDeleteSavedRace_NotFound() {
    when(ctx.pathParam("filename")).thenReturn("non_existent_race.json");
    handler.deleteSavedRace(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testLoadRace_NullFilename_Returns400() {
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    when(ctx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);

    handler.loadRace(ctx);
    verify(ctx).status(400);
  }

  @Test
  public void testLoadRace_NotFound_Returns404() {
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("filename", "missing_save.json");
    when(ctx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);

    handler.loadRace(ctx);
    verify(ctx).status(404);
  }

  @Test
  public void testExportLapDataAccessors() {
    RaceExportSaveHandler.ExportLapData lapData =
        new RaceExportSaveHandler.ExportLapData(
            "Driver A",
            "Actual Driver A",
            1,
            2,
            12.5,
            125.0,
            4.2,
            java.util.Arrays.asList(1.2, 1.5, 1.5));

    org.junit.Assert.assertEquals("Driver A", lapData.getDriverName());
    org.junit.Assert.assertEquals("Actual Driver A", lapData.getActualDriverName());
    org.junit.Assert.assertEquals(1, lapData.getHeatNumber());
    org.junit.Assert.assertEquals(2, lapData.getLaneNumber());
    org.junit.Assert.assertEquals(12.5, lapData.getAbsoluteHeatLapTime(), 0.001);
    org.junit.Assert.assertEquals(125.0, lapData.getAbsoluteLapTime(), 0.001);
    org.junit.Assert.assertEquals(4.2, lapData.getLapTime(), 0.001);
    org.junit.Assert.assertEquals(3, lapData.getSegments().size());

    RaceExportSaveHandler.ExportLapData nullSegments =
        new RaceExportSaveHandler.ExportLapData("Driver B", "Actual B", 2, 1, 5.0, 50.0, 5.0, null);
    org.junit.Assert.assertNotNull(nullSegments.getSegments());
    org.junit.Assert.assertTrue(nullSegments.getSegments().isEmpty());
  }

  @Test
  public void testExportCsv_WithActiveRace() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);

    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(lane))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Active Race")
            .withEntityId("r1")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    handler.exportRaceCsv(ctx);
    verify(ctx).contentType("text/csv");
  }

  @Test
  public void testSaveAndLoadRace_RoundTrip() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);

    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(lane))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Saved Race")
            .withEntityId("r_saved")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    handler.saveRace(ctx);
    verify(ctx).status(200);

    // Now get saved races
    io.javalin.http.Context getCtx = mock(io.javalin.http.Context.class);
    when(getCtx.contentType(any(String.class))).thenReturn(getCtx);
    handler.getSavedRaces(getCtx);
    verify(getCtx).contentType("application/json");
  }

  @Test
  public void testSaveRace_WithCustomName() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(lane))
            .build();
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Initial Name")
            .withEntityId("r_custom")
            .build();
    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("name", "Custom Renamed Race");
    when(ctx.body()).thenReturn("{\"name\":\"Custom Renamed Race\"}");
    when(ctx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);

    handler.saveRace(ctx);
    verify(ctx).status(200);

    com.antigravity.service.DatabaseService dbService =
        com.antigravity.service.DatabaseService.getInstance();
    java.util.List<com.antigravity.race.RaceSaveData> saves =
        dbService.getSavedRaces(databaseContext, com.antigravity.context.RaceScope.DEMO);
    org.junit.Assert.assertFalse(saves.isEmpty());
    org.junit.Assert.assertEquals("Custom Renamed Race.json", saves.get(0).getSaveName());
  }

  @Test
  public void testLoadRace_WithCustomName() {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.models.Lane lane = new com.antigravity.models.Lane("red", "black", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(java.util.Collections.singletonList(lane))
            .build();
    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Original Saved Name")
            .withEntityId("r_saved_2")
            .build();
    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Collections.singletonList(p1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    handler.saveRace(ctx);
    verify(ctx).status(200);

    // Fetch saved races to get the generated saveName
    com.antigravity.service.DatabaseService dbService =
        com.antigravity.service.DatabaseService.getInstance();
    java.util.List<com.antigravity.race.RaceSaveData> saves =
        dbService.getSavedRaces(databaseContext, com.antigravity.context.RaceScope.DEMO);
    org.junit.Assert.assertFalse(saves.isEmpty());
    String saveName = saves.get(0).getSaveName();

    // Now load the saved race with a custom name
    io.javalin.http.Context loadCtx = mock(io.javalin.http.Context.class);
    when(loadCtx.status(any(Integer.class))).thenReturn(loadCtx);
    when(loadCtx.result(any(String.class))).thenReturn(loadCtx);
    java.util.HashMap<String, Object> loadBody = new java.util.HashMap<>();
    loadBody.put("filename", saveName);
    loadBody.put("name", "Newly Loaded Custom Name");
    loadBody.put("isDemo", true);
    when(loadCtx.queryParam("demo")).thenReturn("true");
    when(loadCtx.body())
        .thenReturn(
            "{\"filename\":\""
                + saveName
                + "\",\"name\":\"Newly Loaded Custom Name\",\"isDemo\":true}");
    when(loadCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(loadBody);

    handler.loadRace(loadCtx);
    verify(loadCtx).status(200);

    com.antigravity.race.Race loadedRace = ClientSubscriptionManager.getInstance().getRace();
    org.junit.Assert.assertNotNull(loadedRace);
    org.junit.Assert.assertEquals("Newly Loaded Custom Name", loadedRace.getRaceModel().getName());
  }

  @Test
  public void testRenameSavedRace_Success() {
    com.antigravity.service.DatabaseService dbService =
        com.antigravity.service.DatabaseService.getInstance();
    com.antigravity.race.RaceSaveData save = new com.antigravity.race.RaceSaveData();
    save.setId("my_race.json");
    save.setSaveName("my_race.json");
    dbService.saveManualRace(databaseContext, save);

    io.javalin.http.Context renameCtx = mock(io.javalin.http.Context.class);
    when(renameCtx.status(any(Integer.class))).thenReturn(renameCtx);
    when(renameCtx.result(any(String.class))).thenReturn(renameCtx);
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("oldFilename", "my_race.json");
    body.put("newFilename", "my_renamed_race");
    body.put("isDemo", false);
    when(renameCtx.body())
        .thenReturn("{\"oldFilename\":\"my_race.json\",\"newFilename\":\"my_renamed_race\"}");
    when(renameCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(renameCtx.pathParamMap()).thenReturn(java.util.Collections.emptyMap());

    handler.renameSavedRace(renameCtx);
    verify(renameCtx).status(200);

    org.junit.Assert.assertNull(dbService.getSavedRace(databaseContext, "my_race.json", false));
    org.junit.Assert.assertNotNull(
        dbService.getSavedRace(databaseContext, "my_renamed_race.json", false));
  }

  @Test
  public void testRenameSavedRace_MissingParamsAndNotFound() {
    io.javalin.http.Context badCtx = mock(io.javalin.http.Context.class);
    when(badCtx.status(any(Integer.class))).thenReturn(badCtx);
    when(badCtx.result(any(String.class))).thenReturn(badCtx);
    when(badCtx.body()).thenReturn("{}");
    when(badCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(new java.util.HashMap<>());
    when(badCtx.pathParamMap()).thenReturn(java.util.Collections.emptyMap());

    handler.renameSavedRace(badCtx);
    verify(badCtx).status(400);

    io.javalin.http.Context notFoundCtx = mock(io.javalin.http.Context.class);
    when(notFoundCtx.status(any(Integer.class))).thenReturn(notFoundCtx);
    when(notFoundCtx.result(any(String.class))).thenReturn(notFoundCtx);
    java.util.HashMap<String, Object> body = new java.util.HashMap<>();
    body.put("oldFilename", "nonexistent.json");
    body.put("newFilename", "new_name");
    when(notFoundCtx.body())
        .thenReturn("{\"oldFilename\":\"nonexistent.json\",\"newFilename\":\"new_name\"}");
    when(notFoundCtx.bodyAsClass(java.util.HashMap.class)).thenReturn(body);
    when(notFoundCtx.pathParamMap()).thenReturn(java.util.Collections.emptyMap());

    handler.renameSavedRace(notFoundCtx);
    verify(notFoundCtx).status(404);
  }

  @Test
  public void testExportRaceXls_WithCustomLapByLapTemplate() throws Exception {
    java.io.File templateFile = new java.io.File("../race_export_template CRXed.xlsx");
    if (!templateFile.exists()) {
      templateFile = new java.io.File("race_export_template CRXed.xlsx");
    }
    if (!templateFile.exists()) {
      return;
    }

    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.models.Driver d2 = new com.antigravity.models.Driver("Bob", "Bobby", "d2", "2");
    com.antigravity.models.Driver d3 =
        new com.antigravity.models.Driver("Charlie", "Chuck", "d3", "3");
    com.antigravity.models.Driver d4 = new com.antigravity.models.Driver("Dave", "Davy", "d4", "4");

    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);
    com.antigravity.race.RaceParticipant p3 = new com.antigravity.race.RaceParticipant(d3);
    com.antigravity.race.RaceParticipant p4 = new com.antigravity.race.RaceParticipant(d4);

    com.antigravity.race.DriverHeatData dhd1 = new com.antigravity.race.DriverHeatData(p1);
    dhd1.setLane(0);
    dhd1.addLap(3.51, false, true);
    dhd1.addLap(3.42, false, true);
    dhd1.addLap(3.49, false, true);

    com.antigravity.race.DriverHeatData dhd2 = new com.antigravity.race.DriverHeatData(p2);
    dhd2.setLane(1);
    dhd2.addLap(3.81, false, true);
    dhd2.addLap(3.75, false, true);

    com.antigravity.race.DriverHeatData dhd3 = new com.antigravity.race.DriverHeatData(p3);
    dhd3.setLane(2);
    dhd3.addLap(3.62, false, true);

    com.antigravity.race.DriverHeatData dhd4 = new com.antigravity.race.DriverHeatData(p4);
    dhd4.setLane(3);
    dhd4.addLap(3.71, false, true);
    dhd4.addLap(3.68, false, true);

    com.antigravity.race.Heat heat1 =
        new com.antigravity.race.Heat(1, java.util.Arrays.asList(dhd1, dhd2, dhd3, dhd4), false);
    heat1.setStarted(true);

    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Track 1")
            .lanes(
                java.util.Arrays.asList(
                    new com.antigravity.models.Lane("red", "black", 100),
                    new com.antigravity.models.Lane("white", "black", 101),
                    new com.antigravity.models.Lane("blue", "white", 102),
                    new com.antigravity.models.Lane("yellow", "black", 103)))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Custom Template Race")
            .withEntityId("r_custom")
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2, p3, p4))
            .heats(java.util.Collections.singletonList(heat1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    byte[] fileBytes = java.nio.file.Files.readAllBytes(templateFile.toPath());
    String base64 = java.util.Base64.getEncoder().encodeToString(fileBytes);
    java.util.Map<String, Object> body = new java.util.HashMap<>();
    body.put("templateBase64", base64);
    when(ctx.bodyAsClass(java.util.Map.class)).thenReturn(body);

    handler.exportRaceXls(ctx);

    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(ctx).result(captor.capture());
    byte[] exportedBytes = captor.getValue();
    org.junit.Assert.assertNotNull(exportedBytes);
    org.junit.Assert.assertTrue(exportedBytes.length > 0);

    try (org.apache.poi.xssf.usermodel.XSSFWorkbook wb =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(exportedBytes))) {
      org.apache.poi.ss.usermodel.Sheet heat1Sheet = wb.getSheet("Heat 1");
      org.junit.Assert.assertNotNull(heat1Sheet);

      // Verify row 11 (Driver Names across lanes)
      org.apache.poi.ss.usermodel.Row row11 = heat1Sheet.getRow(10);
      org.junit.Assert.assertEquals("Alice", row11.getCell(1).getStringCellValue());
      org.junit.Assert.assertEquals("Bob", row11.getCell(2).getStringCellValue());
      org.junit.Assert.assertEquals("Charlie", row11.getCell(3).getStringCellValue());
      org.junit.Assert.assertEquals("Dave", row11.getCell(4).getStringCellValue());

      // Verify row 12 (Total Laps across lanes)
      org.apache.poi.ss.usermodel.Row row12 = heat1Sheet.getRow(11);
      org.junit.Assert.assertEquals("Total Laps", row12.getCell(0).getStringCellValue());
      org.junit.Assert.assertEquals(3.0, row12.getCell(1).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(2.0, row12.getCell(2).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(1.0, row12.getCell(3).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(2.0, row12.getCell(4).getNumericCellValue(), 0.001);

      // Verify row 13 (Headers)
      org.apache.poi.ss.usermodel.Row row13 = heat1Sheet.getRow(12);
      org.junit.Assert.assertEquals("Lap Number", row13.getCell(0).getStringCellValue());
      org.junit.Assert.assertEquals("Lane 1", row13.getCell(1).getStringCellValue());

      // Verify row 14 (Lap 1 times)
      org.apache.poi.ss.usermodel.Row row14 = heat1Sheet.getRow(13);
      org.junit.Assert.assertEquals(1.0, row14.getCell(0).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(3.51, row14.getCell(1).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(3.81, row14.getCell(2).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(3.62, row14.getCell(3).getNumericCellValue(), 0.001);
      org.junit.Assert.assertEquals(3.71, row14.getCell(4).getNumericCellValue(), 0.001);
    }
  }

  @Test
  public void testExportRaceXls_EnforcesMaxThreeDecimalPlaces_DefaultTemplate() throws Exception {
    com.antigravity.models.Driver d1 =
        new com.antigravity.models.Driver("Alice", "Ally", "d1", "1");
    com.antigravity.models.Driver d2 = new com.antigravity.models.Driver("Bob", "Bobby", "d2", "2");

    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.race.RaceParticipant p2 = new com.antigravity.race.RaceParticipant(d2);

    com.antigravity.race.DriverHeatData dhd1 = new com.antigravity.race.DriverHeatData(p1);
    dhd1.setLane(0);
    dhd1.addLap(3.14159265, false, true);
    dhd1.addLap(3.27182818, false, true);
    if (!dhd1.getLaps().isEmpty()) {
      dhd1.getLaps().get(0).setSegments(java.util.Arrays.asList(1.123456, 2.018018));
    }

    com.antigravity.race.DriverHeatData dhd2 = new com.antigravity.race.DriverHeatData(p2);
    dhd2.setLane(1);
    dhd2.addLap(3.33333333, false, true);
    dhd2.addLap(3.66666667, false, true);

    com.antigravity.race.Heat heat1 =
        new com.antigravity.race.Heat(1, java.util.Arrays.asList(dhd1, dhd2), false);
    heat1.setStarted(true);

    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Grand Track")
            .lanes(
                java.util.Arrays.asList(
                    new com.antigravity.models.Lane("red", "black", 100),
                    new com.antigravity.models.Lane("white", "black", 101)))
            .build();

    com.antigravity.models.Race model =
        new com.antigravity.models.Race.Builder()
            .withName("Precision Test Race")
            .withEntityId("r_precision")
            .withMinLapTime(1.123456)
            .build();

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .drivers(java.util.Arrays.asList(p1, p2))
            .heats(java.util.Collections.singletonList(heat1))
            .track(track)
            .isDemoMode(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    handler.exportRaceXls(ctx);

    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(ctx).result(captor.capture());
    byte[] exportedBytes = captor.getValue();
    org.junit.Assert.assertNotNull(exportedBytes);
    org.junit.Assert.assertTrue(exportedBytes.length > 0);

    try (XSSFWorkbook wb = new XSSFWorkbook(new java.io.ByteArrayInputStream(exportedBytes))) {
      int cellCount = 0;
      for (Sheet sheet : wb) {
        for (Row row : sheet) {
          for (Cell cell : row) {
            cellCount++;
            if (cell.getCellType() == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
              double val = cell.getNumericCellValue();
              if (!Double.isNaN(val) && !Double.isInfinite(val)) {
                double rounded =
                    BigDecimal.valueOf(val).setScale(3, RoundingMode.HALF_UP).doubleValue();
                org.junit.Assert.assertEquals(
                    "Cell at "
                        + sheet.getSheetName()
                        + "!"
                        + cell.getAddress()
                        + " has >3 decimal places: "
                        + val,
                    rounded,
                    val,
                    0.0000001);
              }
            } else if (cell.getCellType() == CellType.STRING) {
              String str = cell.getStringCellValue();
              if (str != null && str.matches("^[+-]?\\d+\\.\\d+$")) {
                int dotIdx = str.indexOf('.');
                int decimals = str.length() - dotIdx - 1;
                org.junit.Assert.assertTrue(
                    "String cell at "
                        + sheet.getSheetName()
                        + "!"
                        + cell.getAddress()
                        + " has >3 decimals: "
                        + str,
                    decimals <= 3);
              }
            }
          }
        }
      }
      org.junit.Assert.assertTrue("Workbook should contain data cells", cellCount > 0);
    }
  }

  @Test
  public void testGetDefaultTemplate_Success() {
    handler.getDefaultTemplate(ctx);

    verify(ctx).contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    verify(ctx).header("Content-Disposition", "attachment; filename=\"race_export_template.xlsx\"");
    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(ctx).result(captor.capture());
    byte[] templateBytes = captor.getValue();
    org.junit.Assert.assertNotNull(templateBytes);
    org.junit.Assert.assertTrue(templateBytes.length > 0);
  }

  @Test
  public void testTestExportXls_NoActiveRace_UsesSampleRace() {
    ClientSubscriptionManager.getInstance().setRace(null);

    handler.testExportXls(ctx);

    verify(ctx).contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    verify(ctx).header("Content-Disposition", "attachment; filename=\"sample_race_export.xlsx\"");
    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(ctx).result(captor.capture());
    byte[] exportedBytes = captor.getValue();
    org.junit.Assert.assertNotNull(exportedBytes);
    org.junit.Assert.assertTrue(exportedBytes.length > 0);
  }

  @Test
  public void testTestExportXls_WithActiveRace_UsesActiveRace() {
    com.antigravity.models.Driver d1 = new com.antigravity.models.Driver("Active Driver", "ad1");
    com.antigravity.race.RaceParticipant p1 = new com.antigravity.race.RaceParticipant(d1);
    com.antigravity.models.Lane l1 = new com.antigravity.models.Lane("#EF4444", "white", 100);
    com.antigravity.models.Track track =
        new com.antigravity.models.Track.Builder()
            .name("Test Track")
            .lanes(java.util.Arrays.asList(l1))
            .build();
    com.antigravity.models.Race model = // fqn-collision
        new com.antigravity.models.Race.Builder()
            .withName("Active Test Race")
            .build(); // fqn-collision

    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData(p1, d1);
    dhd.setLane(1);
    dhd.getLaps()
        .add(
            new com.antigravity.race.DriverHeatData.LapData(
                5.123, "ad1", java.util.Arrays.asList(5.123), false, true));
    com.antigravity.race.Heat heat =
        new com.antigravity.race.Heat(1, java.util.Arrays.asList(dhd), false);

    com.antigravity.race.Race activeRace =
        new com.antigravity.race.Race.Builder()
            .model(model)
            .track(track)
            .drivers(java.util.Arrays.asList(p1))
            .heats(java.util.Arrays.asList(heat))
            .skipHardwareInterface(true)
            .build();

    ClientSubscriptionManager.getInstance().setRace(activeRace);

    handler.testExportXls(ctx);

    verify(ctx).contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    verify(ctx).header("Content-Disposition", "attachment; filename=\"sample_race_export.xlsx\"");
    org.mockito.ArgumentCaptor<byte[]> captor = org.mockito.ArgumentCaptor.forClass(byte[].class);
    verify(ctx).result(captor.capture());
    byte[] exportedBytes = captor.getValue();
    org.junit.Assert.assertNotNull(exportedBytes);
    org.junit.Assert.assertTrue(exportedBytes.length > 0);
  }
}
