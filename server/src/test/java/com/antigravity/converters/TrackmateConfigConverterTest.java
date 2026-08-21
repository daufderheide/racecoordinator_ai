package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.protocols.trackmate.TrackmateConfig;
import org.junit.Test;

public class TrackmateConfigConverterTest {

  @Test
  public void testToProto_NullConfig_ReturnsDefaultInstance() {
    com.antigravity.proto.TrackmateConfig proto = TrackmateConfigConverter.toProto(null);
    assertNotNull(proto);
    assertEquals(com.antigravity.proto.TrackmateConfig.getDefaultInstance(), proto);
  }

  @Test
  public void testToProto_PopulatedConfig_ConvertsCorrectly() {
    TrackmateConfig config = new TrackmateConfig();
    config.name = "Test Trackmate";
    config.commPort = "COM3";
    config.normallyClosedRelays = false;
    config.normallyClosedLaneSensors = true;
    config.hasPerLaneRelays = true;
    config.useIR = true;
    config.debounce = 2;
    config.numLanes = 6;
    config.lapPinPitBehavior =
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.PIT_IN_OUT;
    config.lapPinBehaviors = java.util.Arrays.asList(100, 101, 102, 103);

    com.antigravity.proto.TrackmateConfig proto = TrackmateConfigConverter.toProto(config);

    assertNotNull(proto);
    assertEquals("Test Trackmate", proto.getName());
    assertEquals("COM3", proto.getCommPort());
    assertEquals(false, proto.getNormallyClosedRelays());
    assertEquals(true, proto.getNormallyClosedLaneSensors());
    assertEquals(true, proto.getHasPerLaneRelays());
    assertEquals(true, proto.getUseIr());
    assertEquals(2, proto.getDebounce());
    assertEquals(6, proto.getNumLanes());
    assertEquals(
        com.antigravity.proto.LapPinPitBehavior.LAP_PIN_PIT_IN_OUT, proto.getLapPinPitBehavior());
    assertEquals(4, proto.getLapPinBehaviorsCount());
    assertEquals(100, proto.getLapPinBehaviors(0));
  }

  @Test
  public void testToProto_NullFields_ConvertsCorrectly() {
    TrackmateConfig config = new TrackmateConfig();
    config.name = null;
    config.commPort = null;
    config.lapPinPitBehavior = null;
    config.lapPinBehaviors = null;

    com.antigravity.proto.TrackmateConfig proto = TrackmateConfigConverter.toProto(config);

    assertNotNull(proto);
    assertEquals("", proto.getName());
    assertEquals("", proto.getCommPort());
    assertEquals(0, proto.getLapPinBehaviorsCount());
  }

  @Test
  public void testFromProto_NullProto_ReturnsNull() {
    TrackmateConfig config = TrackmateConfigConverter.fromProto(null);
    assertNull(config);
  }

  @Test
  public void testFromProto_PopulatedProto_ConvertsCorrectly() {
    com.antigravity.proto.TrackmateConfig proto =
        com.antigravity.proto.TrackmateConfig.newBuilder()
            .setName("Test Trackmate")
            .setCommPort("COM3")
            .setNormallyClosedRelays(true)
            .setNormallyClosedLaneSensors(true)
            .setHasPerLaneRelays(true)
            .setUseIr(true)
            .setDebounce(5)
            .setNumLanes(4)
            .setLapPinPitBehavior(com.antigravity.proto.LapPinPitBehavior.LAP_PIN_PIT_IN)
            .addAllLapPinBehaviors(java.util.Arrays.asList(200, 201))
            .build();

    TrackmateConfig config = TrackmateConfigConverter.fromProto(proto);

    assertNotNull(config);
    assertEquals("Test Trackmate", config.name);
    assertEquals("COM3", config.commPort);
    assertEquals(true, config.normallyClosedRelays);
    assertEquals(true, config.normallyClosedLaneSensors);
    assertEquals(true, config.hasPerLaneRelays);
    assertEquals(true, config.useIR);
    assertEquals(5, config.debounce);
    assertEquals(4, config.numLanes);
    assertEquals(
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.PIT_IN,
        config.lapPinPitBehavior);
    assertNotNull(config.lapPinBehaviors);
    assertEquals(2, config.lapPinBehaviors.size());
    assertEquals(Integer.valueOf(200), config.lapPinBehaviors.get(0));
  }
}
