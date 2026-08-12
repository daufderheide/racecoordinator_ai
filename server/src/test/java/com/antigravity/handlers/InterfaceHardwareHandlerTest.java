package com.antigravity.handlers;

import static org.mockito.Mockito.mock;

import io.javalin.http.Context;
import java.util.Collections;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Before;
import org.junit.Test;

public class InterfaceHardwareHandlerTest {

  private InterfaceHardwareHandler handler;
  private Context ctx;

  @Before
  public void setUp() {
    handler = new InterfaceHardwareHandler();
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, Collections.emptyMap());
  }

  @Test
  public void testGetBleDevices_ShouldNotCrash() {
    handler.getBleDevices(ctx);
  }

  @Test
  public void testGetSerialPorts_ShouldNotCrash() {
    handler.getSerialPorts(ctx);
  }
}
