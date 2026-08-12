package com.antigravity.handlers;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.javalin.http.Context;
import java.util.Collections;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Before;
import org.junit.Test;

public class AnalyticsHandlerTest {

  private AnalyticsHandler handler;
  private Context ctx;
  private HttpServletRequest req;
  private HttpServletResponse res;

  @Before
  public void setUp() {
    handler = new AnalyticsHandler();
    req = mock(HttpServletRequest.class);
    res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, Collections.emptyMap());
  }

  @Test
  public void testToggleAnalytics_NonLocalhost_ShouldReturn403() {
    when(req.getRemoteAddr()).thenReturn("192.168.1.50");
    when(req.getRemoteHost()).thenReturn("remotehost");

    handler.toggleAnalytics(ctx);
    verify(res).setStatus(403);
  }
}
