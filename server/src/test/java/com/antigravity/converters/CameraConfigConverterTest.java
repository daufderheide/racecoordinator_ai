package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.CameraInterfaceConfig;
import com.antigravity.protocols.camera.CameraConfig;
import com.antigravity.protocols.camera.LaneDetectionGate;
import java.util.Arrays;
import org.junit.Test;

public class CameraConfigConverterTest {

  @Test
  public void testNullToProto() {
    CameraInterfaceConfig proto = CameraConfigConverter.toProto(null);
    assertNotNull(proto);
    assertEquals(CameraInterfaceConfig.getDefaultInstance(), proto);
  }

  @Test
  public void testNullFromProto() {
    CameraConfig config = CameraConfigConverter.fromProto(null);
    assertNull(config);
  }

  @Test
  public void testToProtoAndFromProtoRoundTrip() {
    CameraConfig config = new CameraConfig();
    config.name = "Webcam 1";
    config.interfaceIndex = 2;
    config.targetFps = 60;
    config.autoDetectLanes = true;

    LaneDetectionGate gate1 = new LaneDetectionGate();
    gate1.laneIndex = 0;
    gate1.xPct = 0.15f;
    gate1.yPct = 0.45f;
    gate1.widthPct = 0.25f;
    gate1.heightPct = 0.12f;
    gate1.gateType = LaneDetectionGate.TYPE_LAP;
    gate1.sensitivity = 0.65f;

    LaneDetectionGate gate2 = new LaneDetectionGate();
    gate2.laneIndex = 1;
    gate2.xPct = 0.45f;
    gate2.yPct = 0.45f;
    gate2.widthPct = 0.25f;
    gate2.heightPct = 0.12f;
    gate2.gateType = LaneDetectionGate.TYPE_PIT_IN;
    gate2.sensitivity = 0.70f;

    config.gates = Arrays.asList(gate1, gate2);

    CameraInterfaceConfig proto = CameraConfigConverter.toProto(config);
    assertEquals("Webcam 1", proto.getName());
    assertEquals(2, proto.getInterfaceIndex());
    assertEquals(60, proto.getTargetFps());
    assertTrue(proto.getAutoDetectLanes());
    assertEquals(2, proto.getGatesCount());
    assertEquals(0, proto.getGates(0).getLaneIndex());
    assertEquals(0.15f, proto.getGates(0).getXPct(), 0.001f);
    assertEquals(LaneDetectionGate.TYPE_LAP, proto.getGates(0).getGateType());
    assertEquals(LaneDetectionGate.TYPE_PIT_IN, proto.getGates(1).getGateType());

    CameraConfig roundTrip = CameraConfigConverter.fromProto(proto);
    assertNotNull(roundTrip);
    assertEquals("Webcam 1", roundTrip.name);
    assertEquals(2, roundTrip.interfaceIndex);
    assertEquals(60, roundTrip.targetFps);
    assertTrue(roundTrip.autoDetectLanes);
    assertEquals(2, roundTrip.gates.size());
    assertEquals(0, roundTrip.gates.get(0).laneIndex);
    assertEquals(0.15f, roundTrip.gates.get(0).xPct, 0.001f);
    assertEquals(LaneDetectionGate.TYPE_LAP, roundTrip.gates.get(0).gateType);
    assertEquals(LaneDetectionGate.TYPE_PIT_IN, roundTrip.gates.get(1).gateType);
    assertEquals(0.70f, roundTrip.gates.get(1).sensitivity, 0.001f);
  }
}
