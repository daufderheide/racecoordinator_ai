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
}
