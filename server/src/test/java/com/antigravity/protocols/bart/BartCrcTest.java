package com.antigravity.protocols.bart;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class BartCrcTest {

  @Test
  public void testCrc8UpdateSingleBytes() {
    byte crc = 0;
    // Test sequence: A5 90 01
    crc = BartCrc.crc8Update(crc, (byte) 0xA5);
    crc = BartCrc.crc8Update(crc, (byte) 0x90);
    crc = BartCrc.crc8Update(crc, (byte) 0x01);

    byte arrayCrc = BartCrc.calculateCrc(new byte[] {(byte) 0xA5, (byte) 0x90, 0x01});
    assertEquals(crc, arrayCrc);
  }

  @Test
  public void testCrcCalculationMatches() {
    byte[] packet = new byte[] {(byte) 0xA5, 0x01, 0x01, 0x00, 0x01, (byte) 0xE8, 0x03, 0x00, 0x00};
    byte computedCrc = BartCrc.calculateCrc(packet);
    byte checkWithCrc = BartCrc.crc8Update(computedCrc, computedCrc);
    assertEquals(0, checkWithCrc);
  }
}
