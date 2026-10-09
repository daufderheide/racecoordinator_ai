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

  @Test
  public void testSynchronizedWriteDataWithMockOutputStream() throws Exception {
    SerialConnection connection = new SerialConnection();
    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();

    java.lang.reflect.Field streamField = SerialConnection.class.getDeclaredField("outputStream");
    streamField.setAccessible(true);
    streamField.set(connection, baos);

    java.lang.reflect.Field portNameField = SerialConnection.class.getDeclaredField("portName");
    portNameField.setAccessible(true);
    portNameField.set(connection, "MOCK_PORT");

    connection.writeData(new byte[] {0x01, 0x02, 0x03});
    connection.writeData("HELLO");

    byte[] written = baos.toByteArray();
    org.junit.Assert.assertEquals(8, written.length);
    org.junit.Assert.assertEquals((byte) 0x01, written[0]);
    org.junit.Assert.assertEquals((byte) 0x02, written[1]);
    org.junit.Assert.assertEquals((byte) 0x03, written[2]);
    org.junit.Assert.assertEquals(
        "HELLO", new String(written, 3, 5, java.nio.charset.StandardCharsets.UTF_8));
  }

  @Test
  public void testConcurrentWritesAreThreadSafe() throws Exception {
    SerialConnection connection = new SerialConnection();
    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();

    java.lang.reflect.Field streamField = SerialConnection.class.getDeclaredField("outputStream");
    streamField.setAccessible(true);
    streamField.set(connection, baos);

    java.lang.reflect.Field portNameField = SerialConnection.class.getDeclaredField("portName");
    portNameField.setAccessible(true);
    portNameField.set(connection, "MOCK_PORT");

    int threadCount = 8;
    int writesPerThread = 50;
    java.util.concurrent.ExecutorService executor =
        java.util.concurrent.Executors.newFixedThreadPool(threadCount);
    java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
    java.util.concurrent.CountDownLatch doneLatch =
        new java.util.concurrent.CountDownLatch(threadCount);
    java.util.concurrent.atomic.AtomicInteger errorCount =
        new java.util.concurrent.atomic.AtomicInteger(0);

    for (int t = 0; t < threadCount; t++) {
      final byte b = (byte) t;
      executor.submit(
          () -> {
            try {
              startLatch.await();
              for (int i = 0; i < writesPerThread; i++) {
                connection.writeData(new byte[] {b});
              }
            } catch (Exception e) {
              errorCount.incrementAndGet();
            } finally {
              doneLatch.countDown();
            }
          });
    }

    startLatch.countDown();
    assertTrue(doneLatch.await(5, java.util.concurrent.TimeUnit.SECONDS));
    executor.shutdown();

    org.junit.Assert.assertEquals(0, errorCount.get());
    org.junit.Assert.assertEquals(threadCount * writesPerThread, baos.toByteArray().length);
  }

  private void assertEquals(String expected, String actual) {
    org.junit.Assert.assertEquals(expected, actual);
  }

  private void assertTrue(boolean condition) {
    org.junit.Assert.assertTrue(condition);
  }
}
