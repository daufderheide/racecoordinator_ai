package com.antigravity.protocols.interfaces;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.util.List;
import org.junit.Test;

public class SerialConnectionTest {

  @Test
  public void testGetAvailableSerialPorts() {
    List<String> ports = SerialConnection.getAvailableSerialPorts();
    assertNotNull("Available serial ports list should not be null", ports);
  }

  @Test
  public void testGetPortNames() {
    String[] names = SerialConnection.getPortNames();
    assertNotNull("Port names array should not be null", names);
  }

  @Test
  public void testConnectNonExistentPort() {
    SerialConnection connection = new SerialConnection();
    assertFalse(connection.isOpen());

    try {
      connection.connect("INVALID_PORT_NAME_123456789");
      fail("Connecting to non-existent port should throw IOException");
    } catch (IOException e) {
      assertTrue(e.getMessage().contains("Port not found"));
    }
  }

  @Test
  public void testWriteDataThrowsWhenDisconnected() {
    SerialConnection connection = new SerialConnection();
    assertFalse(connection.isOpen());

    try {
      connection.writeData(new byte[] {0x01, 0x02});
      fail("Should have thrown IOException");
    } catch (IOException e) {
      assertEquals("Port not open", e.getMessage());
    }

    try {
      connection.writeData("TEST_STRING");
      fail("Should have thrown IOException");
    } catch (IOException e) {
      assertEquals("Port not open", e.getMessage());
    }
  }

  @Test
  public void testDisconnectWhenClosedIsSafe() {
    SerialConnection connection = new SerialConnection();
    connection.disconnect();
    assertFalse(connection.isOpen());
  }

  @Test
  public void testAddListenerNullSafety() {
    SerialConnection connection = new SerialConnection();
    connection.addListener(null);
    connection.addDataListener(null);
  }

  @Test
  public void testBytesToHexHelper() throws Exception {
    java.lang.reflect.Method method =
        SerialConnection.class.getDeclaredMethod("bytesToHex", byte[].class);
    method.setAccessible(true);

    byte[] input = new byte[] {0x0A, (byte) 0xFF, 0x00, 0x5C};
    String result = (String) method.invoke(null, (Object) input);
    assertEquals("0A FF 00 5C", result);
  }

  private void assertEquals(String expected, String actual) {
    org.junit.Assert.assertEquals(expected, actual);
  }

  private void assertTrue(boolean condition) {
    org.junit.Assert.assertTrue(condition);
  }
}
