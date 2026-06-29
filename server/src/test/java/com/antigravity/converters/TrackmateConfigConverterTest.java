package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

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
    config.useIR = false;
    config.debounce = 2;
    config.numLanes = 6;

    com.antigravity.proto.TrackmateConfig proto = TrackmateConfigConverter.toProto(config);

    assertNotNull(proto);
    assertEquals("Test Trackmate", proto.getName());
    assertEquals("COM3", proto.getCommPort());
    assertEquals(false, proto.getNormallyClosedRelays());
    assertEquals(false, proto.getUseIr());
    assertEquals(2, proto.getDebounce());
    assertEquals(6, proto.getNumLanes());
  }

  @Test
  public void testToProto_NullFields_ConvertsCorrectly() {
    TrackmateConfig config = new TrackmateConfig();
    config.name = null;
    config.commPort = null;
    // other fields are primitives, they have defaults

    com.antigravity.proto.TrackmateConfig proto = TrackmateConfigConverter.toProto(config);

    assertNotNull(proto);
    assertEquals("", proto.getName());
    assertEquals("", proto.getCommPort());
  }
}
