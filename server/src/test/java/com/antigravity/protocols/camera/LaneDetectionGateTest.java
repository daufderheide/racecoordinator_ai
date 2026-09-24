package com.antigravity.protocols.camera;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class LaneDetectionGateTest {

  @Test
  public void testDefaultConstructor() {
    LaneDetectionGate gate = new LaneDetectionGate();
    assertEquals(0, gate.laneIndex);
    assertEquals(0.0f, gate.xPct, 0.001f);
    assertEquals(0.45f, gate.yPct, 0.001f);
    assertEquals(0.2f, gate.widthPct, 0.001f);
    assertEquals(0.1f, gate.heightPct, 0.001f);
    assertEquals(LaneDetectionGate.TYPE_LAP, gate.gateType);
    assertEquals(0.5f, gate.sensitivity, 0.001f);
  }

  @Test
  public void testParameterizedConstructor() {
    LaneDetectionGate gate =
        new LaneDetectionGate(1, 0.1f, 0.2f, 0.3f, 0.4f, LaneDetectionGate.TYPE_PIT_IN, 0.8f);
    assertEquals(1, gate.laneIndex);
    assertEquals(0.1f, gate.xPct, 0.001f);
    assertEquals(0.2f, gate.yPct, 0.001f);
    assertEquals(0.3f, gate.widthPct, 0.001f);
    assertEquals(0.4f, gate.heightPct, 0.001f);
    assertEquals(LaneDetectionGate.TYPE_PIT_IN, gate.gateType);
    assertEquals(0.8f, gate.sensitivity, 0.001f);
  }

  @Test
  public void testParameterizedConstructorNulls() {
    LaneDetectionGate gate = new LaneDetectionGate(null, null, null, null, null, null, null);
    assertEquals(0, gate.laneIndex);
    assertEquals(0.0f, gate.xPct, 0.001f);
    assertEquals(0.45f, gate.yPct, 0.001f);
    assertEquals(0.2f, gate.widthPct, 0.001f);
    assertEquals(0.1f, gate.heightPct, 0.001f);
    assertEquals(LaneDetectionGate.TYPE_LAP, gate.gateType);
    assertEquals(0.5f, gate.sensitivity, 0.001f);
  }

  @Test
  public void testEqualsAndHashCode() {
    LaneDetectionGate g1 =
        new LaneDetectionGate(0, 0.1f, 0.2f, 0.3f, 0.4f, LaneDetectionGate.TYPE_LAP, 0.5f);
    LaneDetectionGate g2 =
        new LaneDetectionGate(0, 0.1f, 0.2f, 0.3f, 0.4f, LaneDetectionGate.TYPE_LAP, 0.5f);
    LaneDetectionGate g3 =
        new LaneDetectionGate(1, 0.1f, 0.2f, 0.3f, 0.4f, LaneDetectionGate.TYPE_LAP, 0.5f);

    assertEquals(g1, g2);
    assertEquals(g1.hashCode(), g2.hashCode());
    assertNotEquals(g1, g3);
    assertNotEquals(g1, null);
    assertNotEquals(g1, "string");
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    LaneDetectionGate gate =
        new LaneDetectionGate(2, 0.15f, 0.25f, 0.35f, 0.45f, LaneDetectionGate.TYPE_SECTOR, 0.9f);

    String json = mapper.writeValueAsString(gate);
    LaneDetectionGate deserialized = mapper.readValue(json, LaneDetectionGate.class);

    assertNotNull(deserialized);
    assertEquals(gate, deserialized);
  }
}
