package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.antigravity.proto.CameraHeartbeatEvent;
import com.antigravity.proto.InterfaceEvent;
import com.antigravity.proto.LapEvent;
import com.antigravity.proto.PitInEvent;
import com.antigravity.proto.PitOutEvent;
import com.antigravity.proto.TimeSyncPing;
import com.antigravity.protocols.camera.CameraConfig;
import com.antigravity.protocols.camera.CameraWebSocketProtocol;
import io.javalin.websocket.WsContext;
import java.nio.ByteBuffer;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class CameraInterfaceWebSocketTest {

  private ClientSubscriptionManager manager;
  private CameraWebSocketProtocol protocol;
  private CameraConfig config;
  private WsContext wsContext;

  @Before
  public void setUp() {
    manager = ClientSubscriptionManager.getInstance();
    config = new CameraConfig();
    config.name = "Cam 1";
    config.interfaceIndex = 0;
    protocol = new CameraWebSocketProtocol(config, 2);
    protocol.setInterfaceIndex(0);
    protocol.open();

    wsContext = mock(WsContext.class);
  }

  @After
  public void tearDown() {
    protocol.close();
  }

  @Test
  public void testHandleTimeSyncPing() throws Exception {
    InterfaceEvent ping =
        InterfaceEvent.newBuilder()
            .setTimeSyncPing(TimeSyncPing.newBuilder().setClientSendTime(1000.5).build())
            .build();

    manager.handleIncomingInterfaceEvent(wsContext, ping);

    ArgumentCaptor<ByteBuffer> captor = ArgumentCaptor.forClass(ByteBuffer.class);
    verify(wsContext).send(captor.capture());

    InterfaceEvent response = InterfaceEvent.parseFrom(captor.getValue().array());
    assertTrue(response.hasTimeSyncPong());
    assertEquals(1000.5, response.getTimeSyncPong().getClientSendTime(), 0.001);
    assertTrue(response.getTimeSyncPong().getServerRecvTime() > 0);
  }

  @Test
  public void testHandleCameraHeartbeat() {
    InterfaceEvent hb =
        InterfaceEvent.newBuilder()
            .setCameraHeartbeat(
                CameraHeartbeatEvent.newBuilder()
                    .setInterfaceIndex(0)
                    .setCurrentFps(60)
                    .setBatteryLevel(0.92f)
                    .setClientTimestamp(2000.0)
                    .build())
            .build();

    manager.handleIncomingInterfaceEvent(wsContext, hb);
    assertEquals(60, protocol.getCurrentFps());
    assertEquals(0.92f, protocol.getBatteryLevel(), 0.01f);
  }

  @Test
  public void testHandleLapEvent() {
    InterfaceEvent lapEvent =
        InterfaceEvent.newBuilder()
            .setLap(
                LapEvent.newBuilder()
                    .setLane(1)
                    .setLapTime(4.25)
                    .setInterfaceId(99)
                    .setInterfaceIndex(0)
                    .build())
            .build();

    manager.handleIncomingInterfaceEvent(wsContext, lapEvent);
    assertTrue(protocol.isConnected());
  }

  @Test
  public void testHandlePitInOutEvents() {
    InterfaceEvent pitIn =
        InterfaceEvent.newBuilder()
            .setPitIn(PitInEvent.newBuilder().setLane(0).setInterfaceIndex(0).build())
            .build();

    manager.handleIncomingInterfaceEvent(wsContext, pitIn);
    assertTrue(protocol.isLaneInPits(0));

    InterfaceEvent pitOut =
        InterfaceEvent.newBuilder()
            .setPitOut(PitOutEvent.newBuilder().setLane(0).setInterfaceIndex(0).build())
            .build();

    manager.handleIncomingInterfaceEvent(wsContext, pitOut);
    assertEquals(false, protocol.isLaneInPits(0));
  }
}
