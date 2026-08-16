package com.antigravity.protocols.interfaces;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.io.IOException;
import org.junit.Test;

public class LogReaderSerialConnectionTest {

  @Test
  public void testConnectAndDisconnect() throws IOException {
    LogReaderSerialConnection conn = new LogReaderSerialConnection();
    assertFalse(conn.isOpen());

    conn.connect("COM1");
    assertTrue(conn.isOpen());
    assertEquals("COM1", conn.getPortName());

    conn.writeData("TEST");
    conn.writeData("TEST".getBytes());

    conn.disconnect();
    assertFalse(conn.isOpen());
  }

  @Test
  public void testDataListener() throws IOException {
    LogReaderSerialConnection conn = new LogReaderSerialConnection();
    conn.connect("COM2");

    final byte[][] received = new byte[1][];
    conn.addDataListener(data -> received[0] = data);

    byte[] testBytes = new byte[] {0x01, 0x02, 0x03};
    conn.injectReceivedData(testBytes);

    assertEquals(testBytes, received[0]);
    conn.disconnect();
  }
}
