package com.antigravity.service;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.protocols.interfaces.LogReaderSerialConnection;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class LogReplayServiceTest {

  private File tempLogFile;
  private LogReplayService replayService;

  @Before
  public void setUp() throws IOException {
    tempLogFile = File.createTempFile("test_log", ".txt");
  }

  @After
  public void tearDown() {
    LogReplayService.reset();
    if (tempLogFile != null && tempLogFile.exists()) {
      tempLogFile.delete();
    }
  }

  @Test
  public void testLogReplayParsesSerialBytes() throws Exception {
    try (FileWriter writer = new FileWriter(tempLogFile)) {
      writer.write(
          "2026-07-18 12:12:00.001 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 41 34 0A\n");
      writer.write(
          "2026-07-18 12:12:00.005 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 42 35\n");
    }

    LogReaderSerialConnection mockConnection = new LogReaderSerialConnection();
    mockConnection.connect("COM3", 9600, false);

    List<byte[]> receivedDataList = new ArrayList<>();
    CountDownLatch latch = new CountDownLatch(2);

    mockConnection.addListener(
        new SerialPortDataListener() {
          @Override
          public int getListeningEvents() {
            return com.fazecast.jSerialComm.SerialPort.LISTENING_EVENT_DATA_RECEIVED;
          }

          @Override
          public void serialEvent(SerialPortEvent event) {
            receivedDataList.add(event.getReceivedData());
            latch.countDown();
          }
        });

    LogReplayService.reset();

    // Use reflection to instantiate and register BEFORE starting the thread
    // This avoids race conditions on slow CI runners
    java.lang.reflect.Constructor<LogReplayService> constructor =
        LogReplayService.class.getDeclaredConstructor(String.class);
    constructor.setAccessible(true);
    replayService = constructor.newInstance(tempLogFile.getAbsolutePath());

    java.lang.reflect.Field instanceField = LogReplayService.class.getDeclaredField("instance");
    instanceField.setAccessible(true);
    instanceField.set(null, replayService);

    replayService.registerSerialConnection(mockConnection);
    replayService.start();

    boolean completed = latch.await(2, TimeUnit.SECONDS);
    assertTrue("Did not receive expected serial events in time", completed);

    assertArrayEquals(new byte[] {0x41, 0x34, 0x0A}, receivedDataList.get(0));
    assertArrayEquals(new byte[] {0x42, 0x35}, receivedDataList.get(1));
  }

  @Test
  public void testLogReplayStatusTracking() throws Exception {
    try (FileWriter writer = new FileWriter(tempLogFile)) {
      writer.write(
          "2026-07-18 12:12:00.001 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 41 34 0A\n");
      writer.write(
          "2026-07-18 12:12:00.005 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 42 35\n");
    }

    LogReplayService.reset();

    java.lang.reflect.Constructor<LogReplayService> constructor =
        LogReplayService.class.getDeclaredConstructor(String.class);
    constructor.setAccessible(true);
    replayService = constructor.newInstance(tempLogFile.getAbsolutePath());

    java.lang.reflect.Field instanceField = LogReplayService.class.getDeclaredField("instance");
    instanceField.setAccessible(true);
    instanceField.set(null, replayService);

    replayService.start();

    // Wait briefly for replay to finish
    Thread.sleep(500);

    com.antigravity.proto.LogReplayStatus status = replayService.getLogReplayStatus();
    assertTrue("Log should be finished", status.getIsFinished());
    org.junit.Assert.assertEquals("Should have processed 2 lines", 2, status.getLinesProcessed());
    org.junit.Assert.assertEquals("Total lines should be 2", 2, status.getTotalLines());
  }
}
