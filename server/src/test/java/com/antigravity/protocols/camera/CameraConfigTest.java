package com.antigravity.protocols.camera;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class CameraConfigTest {

  @Test
  public void testDefaultConstructor() {
    CameraConfig config = new CameraConfig();
    assertEquals("Camera Interface", config.name);
    assertEquals(0, config.interfaceIndex);
    assertEquals(60, config.targetFps);
    assertFalse(config.autoDetectLanes);
    assertNotNull(config.gates);
    assertTrue(config.gates.isEmpty());
  }

  @Test
  public void testParameterizedConstructor() {
    LaneDetectionGate gate = new LaneDetectionGate();
    CameraConfig config =
        new CameraConfig("Custom Cam", 2, 30, true, Collections.singletonList(gate));
    assertEquals("Custom Cam", config.name);
    assertEquals(2, config.interfaceIndex);
    assertEquals(30, config.targetFps);
    assertTrue(config.autoDetectLanes);
    assertEquals(1, config.gates.size());
  }

  @Test
  public void testParameterizedConstructorNulls() {
    CameraConfig config = new CameraConfig(null, null, null, null, null);
    assertEquals("Camera Interface", config.name);
    assertEquals(0, config.interfaceIndex);
    assertEquals(60, config.targetFps);
    assertFalse(config.autoDetectLanes);
    assertNotNull(config.gates);
    assertTrue(config.gates.isEmpty());
  }

  @Test
  public void testEqualsAndHashCode() {
    CameraConfig c1 = new CameraConfig("Cam", 1, 60, false, null);
    CameraConfig c2 = new CameraConfig("Cam", 1, 60, false, null);
    CameraConfig c3 = new CameraConfig("Other", 2, 30, true, null);

    assertEquals(c1, c2);
    assertEquals(c1.hashCode(), c2.hashCode());
    assertNotEquals(c1, c3);
    assertNotEquals(c1, null);
    assertNotEquals(c1, "someString");
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CameraConfig config = new CameraConfig("Webcam", 3, 120, true, null);

    String json = mapper.writeValueAsString(config);
    CameraConfig deserialized = mapper.readValue(json, CameraConfig.class);

    assertNotNull(deserialized);
    assertEquals(config, deserialized);
  }
}
