package com.antigravity.protocols.interfaces;

import org.junit.Test;

public class BleConnectionMacTest {

  @Test
  public void testGetBleBridgeScriptPath() {
    // Should safely return a path or null without throwing
    BleConnectionMac.getBleBridgeScriptPath();
  }
}
