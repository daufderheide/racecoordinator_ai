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
    // Write sample log file
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

    // Pre-initialize so we can register the connection BEFORE it starts reading.
    // Wait, init() instantiates AND starts. Let's make sure it's reset.
    LogReplayService.reset();

    // To avoid the race condition where the thread finishes before we register,
    // we can't easily register before init() if init() creates the instance.
    // Let's modify LogReaderSerialConnection to register itself when LogReplayService is created?
    // No.
    // We can instantiate it directly, but constructor is private.
    // Alternatively, let's make the log file have a sleep at the beginning!
    try (FileWriter writer = new FileWriter(tempLogFile)) {
      // Add a 100ms gap at the start
      writer.write("2026-07-18 12:12:00.001 [Thread-1] INFO  com.antigravity.App - Server start\n");
      writer.write(
          "2026-07-18 12:12:00.200 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 41 34 0A\n");
      writer.write(
          "2026-07-18 12:12:00.205 [Thread-1] DEBUG com.antigravity.protocols.interfaces.SerialConnection - [COM3] Received: 42 35\n");
    }

    LogReplayService.init(tempLogFile.getAbsolutePath());
    replayService = LogReplayService.getInstance();

    replayService.registerSerialConnection(mockConnection);

    boolean completed = latch.await(2, TimeUnit.SECONDS);
    assertTrue("Did not receive expected serial events in time", completed);

    assertArrayEquals(new byte[] {0x41, 0x34, 0x0A}, receivedDataList.get(0));
    assertArrayEquals(new byte[] {0x42, 0x35}, receivedDataList.get(1));
  }
}
