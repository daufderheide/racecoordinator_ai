package com.antigravity.util;

import static org.junit.Assert.assertEquals;

import org.junit.Before;
import org.junit.Test;

public class CircularBufferTest {

  private CircularBuffer buffer;

  @Before
  public void setUp() {
    buffer = new CircularBuffer(10);
  }

  @Test
  public void testEmptyBuffer() {
    assertEquals("", buffer.toHexString());
  }

  @Test
  public void testSingleByte() {
    buffer.add((byte) 0xAB);
    assertEquals("AB", buffer.toHexString());
  }

  @Test
  public void testMultipleBytes() {
    buffer.write(new byte[] {0x01, 0x02, 0x0F, (byte) 0xFF});
    assertEquals("01 02 0F FF", buffer.toHexString());
  }

  @Test
  public void testWrapAround() {
    // Fill 8 bytes
    buffer.write(new byte[] {0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, (byte) 0x88});
    // Consume 5 bytes
    buffer.read(5); // head is now at index 5, 3 bytes remain: 66, 77, 88
    // Write 4 more bytes to force wrap around (capacity is 10)
    buffer.write(new byte[] {(byte) 0xAA, (byte) 0xBB, (byte) 0xCC, (byte) 0xDD});

    // Current content should be 66 77 88 AA BB CC DD
    assertEquals("66 77 88 AA BB CC DD", buffer.toHexString());
  }

  @Test
  public void testFullBuffer() {
    byte[] data = new byte[10];
    for (int i = 0; i < 10; i++) {
      data[i] = (byte) i;
    }
    buffer.write(data);
    assertEquals("00 01 02 03 04 05 06 07 08 09", buffer.toHexString());
  }
}
