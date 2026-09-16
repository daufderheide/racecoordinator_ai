package com.antigravity;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import io.javalin.http.Context;
import org.junit.Test;

public class StaticFileCacheTest {

  @Test
  public void testApplyNoCacheHeadersSetsRequiredHeaders() {
    Context ctx = mock(Context.class);

    App.applyNoCacheHeaders(ctx);

    verify(ctx).header("Cache-Control", "no-cache, no-store, must-revalidate");
    verify(ctx).header("Pragma", "no-cache");
    verify(ctx).header("Expires", "0");
  }
}
