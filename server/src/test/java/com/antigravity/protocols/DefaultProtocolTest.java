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
      this.openTimeMs = mockedTime;
    }

    @Override
    protected boolean isConnected() {
      return connected;
    }

    @Override
    public boolean open() {
      this.openTimeMs = now();
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
    InterfaceEvent lastInterfaceEvent;

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
    public void onInterfaceEvent(InterfaceEvent event) {
      lastInterfaceEvent = event;
    }
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
    protocol.connected = true;
    assertFalse("Initially unhealthy", protocol.isHealthy());
    protocol.simulateHeartbeat();
    assertTrue("Healthy after heartbeat", protocol.isHealthy());
    protocol.advanceTime(2500);
    assertFalse("Unhealthy after timeout", protocol.isHealthy());

    protocol.simulateHeartbeat();
    assertTrue("Healthy again after heartbeat", protocol.isHealthy());
    protocol.connected = false;
    assertFalse("Unhealthy if disconnected despite recent heartbeat", protocol.isHealthy());
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

  @Test
  public void testHandleHeartbeat_ResetMismatchHandling() {
    // 1. Initial State: PC expects reset (hwReset = 1)
    protocol.startTimer();
    assertEquals(1, protocol.hwReset);

    // 2. Receive heartbeat with isReset = 0 (in-flight before reset confirmation)
    // It should discard the time, but KEEP hwReset = 1
    protocol.handleHeartbeat(1000000, (byte) 0);
    assertEquals(1, protocol.hwReset);
    assertEquals(0.0, protocol.hwLapTime[0].time(), 0.001);

    // 3. Receive heartbeat with isReset = 1 (reset confirmation)
    // It should match, set hwReset = 0, and accumulate the time (1.5s)
    protocol.handleHeartbeat(1500000, (byte) 1);
    assertEquals(0, protocol.hwReset);
    assertEquals(1.5, protocol.hwLapTime[0].time(), 0.001);

    // 4. Receive regular heartbeat with isReset = 0
    // It should match (both false), set hwReset = 0, and accumulate time (2.0s)
    protocol.handleHeartbeat(2000000, (byte) 0);
    assertEquals(0, protocol.hwReset);
    assertEquals(2.0, protocol.hwLapTime[0].time(), 0.001);
  }

  @Test
  public void testAddHardwareTimeDeltaNanos() {
    protocol.startTimer();
    long startNanos = protocol.lastLapTimeNanos[0];
    assertTrue("Start nanos should be > 0", startNanos > 0);
    assertEquals(0.0, protocol.hwLapTime[0].time(), 0.001);

    // Simulate 1 second passing (1,000,000,000 nanos)
    long oneSecondNanos = 1_000_000_000L;
    protocol.addHardwareTimeDeltaNanos(0, startNanos + oneSecondNanos);

    // Time is stored internally in microseconds, so 1 second = 1,000,000 us.
    // The time() method returns seconds, so we expect 1.0
    assertEquals(1.0, protocol.hwLapTime[0].time(), 0.001);
    assertEquals(1.0, protocol.hwSegmentTime[0].time(), 0.001);
    assertEquals(startNanos + oneSecondNanos, protocol.lastLapTimeNanos[0]);
    assertEquals(startNanos + oneSecondNanos, protocol.lastSegmentTimeNanos[0]);

    // Simulate another 0.5 seconds passing (500,000,000 nanos)
    long halfSecondNanos = 500_000_000L;
    protocol.addHardwareTimeDeltaNanos(0, startNanos + oneSecondNanos + halfSecondNanos);

    // Because we consumed the 1.0 second earlier, the hwLapTime only contains the new 0.5 seconds
    assertEquals(0.5, protocol.hwLapTime[0].time(), 0.001);
    assertEquals(0.5, protocol.hwSegmentTime[0].time(), 0.001);
  }

  @Test
  public void testStatusSchedulerIncludesDetectedChannels() {
    protocol.connected = true;
    protocol.simulateHeartbeat();
    protocol.detectedChannels = 4;
    protocol.open();

    scheduler.tick();

    assertEquals(InterfaceStatus.CONNECTED, listener.lastStatus);
    assertTrue(
        "InterfaceEvent with status should have been broadcast",
        listener.lastInterfaceEvent != null && listener.lastInterfaceEvent.hasStatus());
    assertEquals(4, listener.lastInterfaceEvent.getStatus().getDetectedChannels());
  }

  @Test
  public void testDefaultCreateSchedulerDaemonThread() throws Exception {
    DefaultProtocol realProtocol =
        new DefaultProtocol(2) {
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
          protected boolean isConnected() {
            return false;
          }

          @Override
          public boolean open() {
            return true;
          }

          @Override
          public void close() {}
        };

    ScheduledExecutorService ses = realProtocol.createScheduler();
    try {
      java.util.concurrent.atomic.AtomicBoolean isDaemon =
          new java.util.concurrent.atomic.AtomicBoolean(false);
      ses.submit(() -> isDaemon.set(Thread.currentThread().isDaemon())).get();
      assertTrue("DefaultProtocol scheduler thread must be daemon", isDaemon.get());
    } finally {
      ses.shutdownNow();
    }
  }
}
