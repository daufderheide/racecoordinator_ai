package com.antigravity.handlers;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.context.DatabaseContext;
import com.antigravity.race.ClientSubscriptionManager;
import io.javalin.http.Context;
import java.io.File;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class DriverLaneHeatHandlerTest {

  private DatabaseContext databaseContext;
  private DriverLaneHeatHandler handler;
  private Context ctx;
  private HttpServletResponse res;

  @Before
  public void setUp() throws Exception {
    String tmpDir = System.getProperty("java.io.tmpdir");
    File tempFile = new File(tmpDir, "driver_lane_heat_test_" + System.currentTimeMillis());
    tempFile.mkdirs();
    Path tempDir = tempFile.toPath();

    databaseContext = new DatabaseContext("testdb", null, tempDir.toString() + File.separator);
    ClientSubscriptionManager.setInstance(null);
    handler = new DriverLaneHeatHandler(databaseContext);

    HttpServletRequest req = mock(HttpServletRequest.class);
    res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, Collections.emptyMap());
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  @Test
  public void testUpdateUserLaps_NoActiveRace_ShouldReturn404() {
    Map<String, String> pathParams = new HashMap<>();
    pathParams.put("lane", "0");
    Map<String, Object> body = new HashMap<>();
    body.put("userLaps", 5.0);

    handler.updateUserLaps(ctx, pathParams, body);
    verify(res).setStatus(404);
  }
}
