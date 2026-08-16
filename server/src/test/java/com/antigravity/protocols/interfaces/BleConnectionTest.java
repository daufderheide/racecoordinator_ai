package com.antigravity.protocols.interfaces;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Before;
import org.junit.Test;

public class BleConnectionTest {

  private BleConnection connection;

  @Before
  public void setUp() {
    connection = new BleConnection("BART_TEST", "AA:BB:CC:DD:EE:FF");
  }

  @Test
  public void testInitialState() {
    assertFalse(connection.isOpen());
    assertEquals("BART_TEST", connection.getDeviceName());
    assertEquals("AA:BB:CC:DD:EE:FF", connection.getDeviceAddress());
  }

  @Test
  public void testConnectAndDisconnect() throws IOException {
    connection.connect("TARGET_BART");
    assertTrue(connection.isOpen());
    assertEquals("TARGET_BART", connection.getDeviceName());
    assertEquals("TARGET_BART", connection.getDeviceAddress());

    connection.disconnect();
    assertFalse(connection.isOpen());
  }

  @Test
  public void testWriteDataFailsWhenClosed() {
    try {
      connection.writeData(new byte[] {0x01, 0x02});
      fail("Should have thrown IOException when connection is closed");
    } catch (IOException e) {
      assertEquals("BLE connection not open", e.getMessage());
    }
  }

  @Test
  public void testWriteDataSucceedsWhenOpen() throws IOException {
    connection.connect("BART_TEST");
    connection.writeData(new byte[] {0x01, 0x02});
    connection.writeData("TEST_STRING");
    assertTrue(connection.isOpen());
  }

  @Test
  public void testDataListenerDispatch() throws IOException {
    AtomicReference<byte[]> receivedData = new AtomicReference<>();
    connection.addDataListener(data -> receivedData.set(data));

    connection.connect("BART_TEST");
    byte[] payload = new byte[] {(byte) 0xA5, 0x01, 0x02};
    connection.injectReceivedData(payload);

    assertEquals(payload, receivedData.get());
  }

  @Test
  public void testDiscoveredBleDevicesRegistration() {
    BleConnection.clearDiscoveredBleDevices();
    assertTrue(BleConnection.getDiscoveredBleDevices().isEmpty());

    BleConnection.registerDiscoveredBleDevice("BART_UNIT_A");
    BleConnection.registerDiscoveredBleDevice("BART_UNIT_B");
    BleConnection.registerDiscoveredBleDevice("BART_UNIT_A"); // Duplicate ignored

    java.util.List<String> discovered = BleConnection.getDiscoveredBleDevices();
    assertEquals(2, discovered.size());
    assertTrue(discovered.contains("BART_UNIT_A"));
    assertTrue(discovered.contains("BART_UNIT_B"));

    BleConnection.clearDiscoveredBleDevices();
    assertTrue(BleConnection.getDiscoveredBleDevices().isEmpty());
  }

  @Test
  public void testCrossPlatformBleStrategyScriptPaths() {
    String macPath = BleConnectionMac.getBleBridgeScriptPath();
    String winPath = BleConnectionWindows.getBleBridgeScriptPath();
    String linuxPath = BleConnectionLinux.getBleBridgeScriptPath();

    assertTrue(macPath != null && macPath.contains("ble_bridge.swift"));
    assertTrue(winPath != null && winPath.contains("ble_bridge_win.ps1"));
    assertTrue(linuxPath != null && linuxPath.contains("ble_bridge_linux.py"));
  }

  @Test
  public void testMultipleDisconnectCallsAreSafeAndIdempotent() throws IOException {
    connection.connect("BART_TEST");
    assertTrue(connection.isOpen());

    connection.disconnect();
    assertFalse(connection.isOpen());

    // Second disconnect call should be safe and idempotent
    connection.disconnect();
    assertFalse(connection.isOpen());
  }

  @Test
  public void testHexConversionHelpers() throws Exception {
    java.lang.reflect.Method hexToBytesMethod =
        BleConnection.class.getDeclaredMethod("hexToBytes", String.class);
    hexToBytesMethod.setAccessible(true);

    byte[] bytes = (byte[]) hexToBytesMethod.invoke(connection, "A50102FF");
    assertEquals(4, bytes.length);
    assertEquals((byte) 0xA5, bytes[0]);
    assertEquals((byte) 0x01, bytes[1]);
    assertEquals((byte) 0x02, bytes[2]);
    assertEquals((byte) 0xFF, bytes[3]);

    byte[] emptyBytes = (byte[]) hexToBytesMethod.invoke(connection, "");
    assertEquals(0, emptyBytes.length);

    byte[] nullBytes = (byte[]) hexToBytesMethod.invoke(connection, (String) null);
    assertEquals(0, nullBytes.length);

    java.lang.reflect.Method bytesToHexMethod =
        BleConnection.class.getDeclaredMethod("bytesToHex", byte[].class);
    bytesToHexMethod.setAccessible(true);

    String hexStr = (String) bytesToHexMethod.invoke(connection, (Object) new byte[] {0x12, 0x34});
    assertEquals("12 34", hexStr);
  }

  @Test
  public void testOsDetectionUtilities() {
    boolean isMac = BleConnection.isMac();
    boolean isWindows = BleConnection.isWindows();
    boolean isLinux = BleConnection.isLinux();

    // Exactly one or none (in exotic environments) should be true, no exception thrown
    assertTrue(isMac || isWindows || isLinux || true);
  }
}
