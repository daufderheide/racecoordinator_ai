package com.antigravity.protocols.camera;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import com.antigravity.proto.InterfaceStatus;
import com.antigravity.protocols.ProtocolListener;
import com.antigravity.race.ClientSubscriptionManager;
import java.util.Arrays;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class CameraWebSocketProtocolTest {

  private CameraConfig config;
  private CameraWebSocketProtocol protocol;
  private ProtocolListener listener;

  @Before
  public void setUp() {
    config = new CameraConfig();
    config.name = "Test Camera";
    config.interfaceIndex = 1;
    config.targetFps = 60;

    LaneDetectionGate lapGate = new LaneDetectionGate();
    lapGate.laneIndex = 0;
    lapGate.gateType = LaneDetectionGate.TYPE_LAP;

    LaneDetectionGate pitGate = new LaneDetectionGate();
    pitGate.laneIndex = 1;
    pitGate.gateType = LaneDetectionGate.TYPE_PIT_IN;

    config.gates = Arrays.asList(lapGate, pitGate);

    protocol = new CameraWebSocketProtocol(config, 2);
    protocol.setInterfaceIndex(1);
    listener = mock(ProtocolListener.class);
    protocol.setListener(listener);
  }

  @After
  public void tearDown() {
    protocol.close();
  }

  @Test
  public void testGateConfigurationAndHooks() {
    assertFalse(protocol.isNormallyClosedLaneSensors());
    assertFalse(protocol.isNormallyClosedRelays());
    assertFalse(protocol.useLapsForSegments());
    assertEquals(0, (int) protocol.getHardwareDebounceUs());
    assertFalse(protocol.hasPitInConfigured(0));
    assertTrue(protocol.hasPitInConfigured(1));
    assertFalse(protocol.hasPitInConfigured(2));
    assertEquals(config, protocol.getConfig());
  }

  @Test
  public void testLifecycleAndRegistration() {
    assertTrue(protocol.open());
    assertEquals(protocol, ClientSubscriptionManager.getInstance().getCameraProtocol(1));
    verify(listener, timeout(1000)).onInterfaceStatus(eq(InterfaceStatus.NO_DATA), eq(1));

    protocol.close();
    assertEquals(null, ClientSubscriptionManager.getInstance().getCameraProtocol(1));
    verify(listener, timeout(1000)).onInterfaceStatus(eq(InterfaceStatus.DISCONNECTED), eq(1));
  }

  @Test
  public void testIncomingLapAndTelemetry() {
    protocol.open();

    protocol.onIncomingHeartbeat(59, 0.85f, 12345.0);
    assertEquals(59, protocol.getCurrentFps());
    assertEquals(0.85f, protocol.getBatteryLevel(), 0.01f);
    assertTrue(protocol.isConnected());

    protocol.onIncomingLap(0, 3.456, 10);
    verify(listener).onLap(0, 3.456, 10, 1);

    protocol.onIncomingSegment(1, 1.234, 11);
    verify(listener).onSegment(1, 1.234, 11, 1);

    protocol.onIncomingCallbutton(0);
    verify(listener).onCallbutton(0, 1);
  }

  @Test
  public void testIncomingPitEvents() {
    protocol.open();
    assertFalse(protocol.isLaneInPits(0));

    protocol.onIncomingPitIn(0);
    assertTrue(protocol.isLaneInPits(0));

    protocol.onIncomingPitOut(0);
    assertFalse(protocol.isLaneInPits(0));
  }
}
