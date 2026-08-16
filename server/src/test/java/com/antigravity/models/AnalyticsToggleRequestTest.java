package com.antigravity.models;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AnalyticsToggleRequestTest {

  @Test
  public void testGettersAndSetters() {
    AnalyticsToggleRequest req = new AnalyticsToggleRequest();
    assertFalse(req.isEnabled());

    req.setEnabled(true);
    assertTrue(req.isEnabled());
  }
}
