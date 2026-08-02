package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.protocols.bart.BartConfig;
import org.junit.Test;

public class BartConfigConverterTest {

  @Test
  public void testNullToProto() {
    com.antigravity.proto.BartConfig proto = BartConfigConverter.toProto(null);
    assertNotNull(proto);
    assertEquals(com.antigravity.proto.BartConfig.getDefaultInstance(), proto);
  }

  @Test
  public void testToProtoAndFromProtoRoundTrip() {
    BartConfig config = new BartConfig();
    config.name = "Custom BART";
    config.deviceName = "BART_9999";
    config.deviceAddress = "11:22:33:44:55:66";
    config.debounce = 2;
    config.numLanes = 4;
    config.minLapMs = 1500;

    com.antigravity.proto.BartConfig proto = BartConfigConverter.toProto(config);
    assertEquals("Custom BART", proto.getName());
    assertEquals("BART_9999", proto.getDeviceName());
    assertEquals("11:22:33:44:55:66", proto.getDeviceAddress());
    assertEquals(2, proto.getDebounce());
    assertEquals(4, proto.getNumLanes());
    assertEquals(1500, proto.getMinLapMs());

    BartConfig roundTrip = BartConfigConverter.fromProto(proto);
    assertEquals("Custom BART", roundTrip.name);
    assertEquals("BART_9999", roundTrip.deviceName);
    assertEquals("11:22:33:44:55:66", roundTrip.deviceAddress);
    assertEquals(2, roundTrip.debounce);
    assertEquals(4, roundTrip.numLanes);
    assertEquals(1500, roundTrip.minLapMs);
  }
}
