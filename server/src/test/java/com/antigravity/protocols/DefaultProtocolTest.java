package com.antigravity.protocols;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.mocks.MockScheduler;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.InterfaceStatus;
import java.util.concurrent.ScheduledExecutorService;
import org.junit.Before;
import org.junit.Test;

public class DefaultProtocolTest {

  private TestDefaultProtocol protocol;
  private MockScheduler scheduler;
  private TestListener listener;

  private static class TestDefaultProtocol extends DefaultProtocol {
    boolean connected = false;
    long mockedTime = 10000;
    MockScheduler mockScheduler;

    public TestDefaultProtocol(MockScheduler scheduler) {
      super(2);
      this.mockScheduler = scheduler;
    }

    @Override
    protected boolean isConnected() {
      return connected;
    }

    @Override
    public boolean open() {
      startStatusScheduler();
      return true;
    }

    @Override
    public void close() {
      stopStatusScheduler();
    }

    @Override
    protected ScheduledExecutorService createScheduler() {
      if (mockScheduler.isShutdown()) {
        mockScheduler.reset();
      }
      return mockScheduler;
    }

    @Override
    protected long now() {
      return mockedTime;
    }

    public void advanceTime(long millis) {
      mockedTime += millis;
    }

    public void simulateHeartbeat() {
      lastHeartbeatTimeMs = now();
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
      lastStatus = status;
      lastInterfaceIndex = interfaceIndex;
    }

    @Override
    public void onCarData(CarData carData) {}

    @Override
    public void onInterfaceEvent(InterfaceEvent event) {}
  }

  @Before
  public void setUp() {
    scheduler = new MockScheduler();
    protocol = new TestDefaultProtocol(scheduler);
    listener = new TestListener();
    protocol.setListener(listener);
    protocol.setInterfaceIndex(5);
  }

  @Test
  public void testStatusDisconnected_NotConnected() {
    protocol.connected = false;
    protocol.open();
    scheduler.tick();
    assertEquals(InterfaceStatus.DISCONNECTED, listener.lastStatus);
    assertEquals(5, listener.lastInterfaceIndex);
  }

  @Test
  public void testStatusNoData_ConnectedButNoHeartbeat() {
    protocol.connected = true;
    protocol.open();
    scheduler.tick();
    assertEquals(InterfaceStatus.NO_DATA, listener.lastStatus);
  }

  @Test
  public void testStatusConnected_AfterHeartbeat() {
    protocol.connected = true;
    protocol.open();
    scheduler.tick();
    assertEquals(InterfaceStatus.NO_DATA, listener.lastStatus);

    protocol.simulateHeartbeat();
    scheduler.tick();
    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);
  }

  @Test
  public void testStatusDisconnected_Timeout() {
    protocol.connected = true;
    protocol.open();
    protocol.simulateHeartbeat();
    scheduler.tick();
    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);

    protocol.advanceTime(2500); // Exceed 2000ms heartbeat limit
    scheduler.tick();
    assertEquals(InterfaceStatus.DISCONNECTED, listener.lastStatus);
  }

  @Test
  public void testIsHealthy() {
    assertFalse("Initially unhealthy", protocol.isHealthy());
    protocol.simulateHeartbeat();
    assertTrue("Healthy after heartbeat", protocol.isHealthy());
    protocol.advanceTime(2500);
    assertFalse("Unhealthy after timeout", protocol.isHealthy());
  }

  @Test
  public void testPinStateCache() {
    protocol.pinStateCache.put(10, true);
    assertEquals(1, protocol.pinStateCache.size());
    protocol.pinStateCache.clear();
    assertEquals(0, protocol.pinStateCache.size());
  }

  @Test
  public void testInterfaceIndexReporting() {
    protocol.setInterfaceIndex(7);
    assertEquals("Internal index should be 7", 7, protocol.getInterfaceIndex());

    protocol.connected = true;
    protocol.open();
    protocol.simulateHeartbeat();

    scheduler.tick();
    assertEquals("Status should have correct index", 7, listener.lastInterfaceIndex);
  }
}
