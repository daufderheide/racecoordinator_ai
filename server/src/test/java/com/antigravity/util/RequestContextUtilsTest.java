package com.antigravity.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.context.RaceScope;
import io.javalin.http.Context;
import org.junit.Test;

public class RequestContextUtilsTest {

  @Test
  public void testGetRaceScope_NullContext() {
    assertEquals(RaceScope.PRODUCTION, RequestContextUtils.getRaceScope(null));
    assertFalse(RequestContextUtils.isDemoMode(null));
  }

  @Test
  public void testGetRaceScope_QueryParam() {
    Context ctx1 = mock(Context.class);
    when(ctx1.queryParam("demo")).thenReturn("true");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx1));
    assertTrue(RequestContextUtils.isDemoMode(ctx1));

    Context ctx2 = mock(Context.class);
    when(ctx2.queryParam("isDemo")).thenReturn("true");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx2));
  }

  @Test
  public void testGetRaceScope_Header() {
    Context ctx1 = mock(Context.class);
    when(ctx1.header("X-Race-Demo-Mode")).thenReturn("true");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx1));

    Context ctx2 = mock(Context.class);
    when(ctx2.header("X-Demo-Mode")).thenReturn("true");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx2));
  }

  @Test
  public void testGetRaceScope_BodyJson() {
    Context ctx1 = mock(Context.class);
    when(ctx1.body()).thenReturn("{\"isDemo\": true}");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx1));

    Context ctx2 = mock(Context.class);
    when(ctx2.body()).thenReturn("{\"demo\": true}");
    assertEquals(RaceScope.DEMO, RequestContextUtils.getRaceScope(ctx2));

    Context ctx3 = mock(Context.class);
    when(ctx3.body()).thenReturn("{\"isDemo\": false}");
    assertEquals(RaceScope.PRODUCTION, RequestContextUtils.getRaceScope(ctx3));
  }
}
