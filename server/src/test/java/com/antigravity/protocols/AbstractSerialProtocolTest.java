package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.interfaces.SerialConnection;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class AbstractSerialProtocolTest {

  private TestSerialProtocol protocol;
  private MockScheduler scheduler;
  private MockSerialConnection serialConnection;
  private TestListener listener;

  private static class TestListener implements ProtocolListener {
    InterfaceStatus lastStatus = InterfaceStatus.DISCONNECTED;
    int lastInterfaceIndex = -1;

    @Override
    public void onLap(int lane, double lapTime, int interfaceId, int interfaceIndex) {}

    @Override
    public void onSegment(int lane, double segmentTime, int interfaceId, int interfaceIndex) {}

    @Override
    public void onCallbutton(int lane, int interfaceIndex) {}

    @Override
    public void onInterfaceStatus(InterfaceStatus status, int interfaceIndex) {
      this.lastStatus = status;
      this.lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onCarData(CarData carData) {}

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {}
  }

  private static class MockSerialConnection extends SerialConnection {
    boolean open = false;
    SerialPortDataListener listener;
    SerialPort mockPort = mock(SerialPort.class);
    public List<byte[]> allWrittenData = new ArrayList<>();
    public List<String> eventLog = new ArrayList<>();
    public int connectionCount = 0;
    public String lastPortName;
    public int lastBaudRate;

    @Override
    public void connect(String portName, int baudRate) throws IOException {
      connect(portName, baudRate, true);
    }

    @Override
    public void connect(String portName, int baudRate, boolean setDtrRts) throws IOException {
      connectionCount++;
      lastPortName = portName;
      lastBaudRate = baudRate;
      if (portName != null && portName.equals("FAIL")) {
        throw new IOException("Connection failed");
      }
      open = true;
      eventLog.add("CONNECT");
    }

    @Override
    public void disconnect() {
      open = false;
      eventLog.add("DISCONNECT");
    }

    @Override
    public boolean isOpen() {
      return open;
    }

    @Override
    public void addListener(SerialPortDataListener listener) {
      this.listener = listener;
    }

    @Override
    public void writeData(byte[] data) throws IOException {
      allWrittenData.add(data);
      eventLog.add("WRITE");
    }

    public void injectData(byte[] data) {
      if (listener != null) {
        SerialPortEvent event =
            new SerialPortEvent(mockPort, SerialPort.LISTENING_EVENT_DATA_RECEIVED, data);
        listener.serialEvent(event);
      }
    }
  }

  private static class TestSerialProtocol extends AbstractSerialProtocol {
    MockScheduler mockScheduler;
    String commPort;
    int baudRate;
    long timeMs = 0;

    public TestSerialProtocol(int numLanes, MockSerialConnection serial, MockScheduler scheduler) {
      super(numLanes, serial, scheduler);
      this.mockScheduler = scheduler;
      this.baudRate = 9600;
      this.commPort = "COM1";
    }

    public void setPort(String port) {
      this.commPort = port;
    }

    public void advanceTime(long ms) {
      timeMs += ms;
    }

    @Override
    protected String getCommPort() {
      return commPort;
    }

    @Override
    protected int getBaudRate() {
      return baudRate;
    }

    @Override
    protected void onPortConnected() {}

    @Override
    protected void processData() {
      rxBuffer.clear();
    }

    @Override
    protected void sendTimeReset() {}

    @Override
    protected ScheduledExecutorService createScheduler() {
      if (mockScheduler.isShutdown()) {
        mockScheduler.reset();
      }
      return mockScheduler;
    }

    @Override
    protected long now() {
      return timeMs;
    }

    @Override
    protected double getHardwareDebounceUs() {
      return 0;
    }

    @Override
    protected boolean hasPitInConfigured(int laneIndex) {
      return false;
    }

    @Override
    protected boolean isNormallyClosedLaneSensors() {
      return false;
    }

    @Override
    protected boolean isNormallyClosedRelays() {
      return false;
    }

    @Override
    protected com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior
        getLapPinPitBehavior() {
      return com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.NONE;
    }

    @Override
    protected boolean useLapsForSegments() {
      return false;
    }

    @Override
    public boolean hasDigitalFuel() {
      return false;
    }

    @Override
    public boolean hasMainRelay() {
      return false;
    }

    @Override
    public void setMainPower(boolean isOn) {}

    @Override
    public void setLanePower(boolean isOn, int laneIndex) {}

    @Override
    public boolean hasPerLaneRelays() {
      return false;
    }
  }

  @Before
  public void setUp() {
    scheduler = new MockScheduler();
    serialConnection = new MockSerialConnection();
    protocol = new TestSerialProtocol(2, serialConnection, scheduler);
    listener = new TestListener();
    protocol.setListener(listener);
  }

  @Test
  public void testOpenAndClose() {
    protocol.open();
    assertTrue(serialConnection.isOpen());
    assertEquals("COM1", serialConnection.lastPortName);
    assertEquals(9600, serialConnection.lastBaudRate);
    assertEquals(2, scheduler.commands.size()); // Status scheduler and reconnect scheduler

    protocol.close();
    assertFalse(serialConnection.isOpen());
  }

  @Test
  public void testStatusDisconnected_NoPort() {
    protocol.setPort(null);
    protocol.open();
    scheduler.tick();
    assertEquals(
        "Status should be DISCONNECTED when no port",
        InterfaceStatus.DISCONNECTED,
        listener.lastStatus);
    assertFalse(serialConnection.isOpen());
  }

  @Test
  public void testStatusDisconnected_OnFailure() {
    protocol.setPort("FAIL");
    protocol.open();
    // Should broadcast immediately on failure
    assertEquals(
        "Status should be DISCONNECTED on connection failure",
        InterfaceStatus.DISCONNECTED,
        listener.lastStatus);
  }

  @Test
  public void testStatusBroadcastOnClose() {
    protocol.advanceTime(100);
    protocol.open();
    protocol.lastHeartbeatTimeMs = protocol.now(); // Simulate heartbeat
    scheduler.tick();
    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);

    protocol.close();

    assertEquals(
        "Status should be DISCONNECTED immediately on close",
        InterfaceStatus.DISCONNECTED,
        listener.lastStatus);
  }

  @Test
  public void testSchedulerStartsOnlyOnOpen() {
    assertEquals(0, scheduler.commands.size());
    protocol.open();
    assertEquals(2, scheduler.commands.size());
  }

  @Test
  public void testStatusDisconnected_NoPort_SchedulerRuns() {
    protocol.setPort(null);
    protocol.open();
    scheduler.tick();
    assertEquals(InterfaceStatus.DISCONNECTED, listener.lastStatus);
  }
}
