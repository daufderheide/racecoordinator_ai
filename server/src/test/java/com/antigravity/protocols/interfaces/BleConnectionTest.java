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
}
