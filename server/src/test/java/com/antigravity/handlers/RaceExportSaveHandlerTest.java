package com.antigravity.handlers;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.context.DatabaseContext;
import com.antigravity.race.ClientSubscriptionManager;
import io.javalin.http.Context;
import java.io.File;
import java.nio.file.Path;
import java.util.Collections;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RaceExportSaveHandlerTest {

  private DatabaseContext databaseContext;
  private RaceExportSaveHandler handler;
  private Context ctx;
  private HttpServletResponse res;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "export_save_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    Path tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    ClientSubscriptionManager.setInstance(null);
    handler = new RaceExportSaveHandler(databaseContext);

    HttpServletRequest req = mock(HttpServletRequest.class);
    res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, Collections.emptyMap());
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testSaveRace_NoActiveRace_ShouldReturn404() {
    handler.saveRace(ctx);
    verify(res).setStatus(404);
  }

  @Test
  public void testExportCsv_NoActiveRace_ShouldReturn404() {
    handler.exportRaceCsv(ctx);
    verify(res).setStatus(404);
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
}
