package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.util.Map;
import org.junit.Test;

public class ReplayLoggerTest {

  @Test
  public void testMapOf() {
    Map<String, Object> map = ReplayLogger.mapOf("k1", "v1", "k2", 123);
    assertNotNull(map);
    assertEquals("v1", map.get("k1"));
    assertEquals(123, map.get("k2"));
  }

  @Test
  public void testLogReplayCommand_DoesNotThrow() {
    ReplayLogger.logReplayCommand("test-command", ReplayLogger.mapOf("param1", "val1"));
  }
}
