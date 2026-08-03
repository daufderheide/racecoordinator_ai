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
    config.numLanes = 4;
    config.minLapMs = 1500;

    assertEquals(
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.NONE,
        config.lapPinPitBehavior);

    com.antigravity.proto.BartConfig proto = BartConfigConverter.toProto(config);
    assertEquals("Custom BART", proto.getName());
    assertEquals("BART_9999", proto.getDeviceName());
    assertEquals("11:22:33:44:55:66", proto.getDeviceAddress());
    assertEquals(4, proto.getNumLanes());
    assertEquals(1500, proto.getMinLapMs());
    assertEquals(
        com.antigravity.proto.LapPinPitBehavior.LAP_PIN_PIT_NONE_VALUE,
        proto.getLapPinPitBehaviorValue());

    BartConfig roundTrip = BartConfigConverter.fromProto(proto);
    assertEquals("Custom BART", roundTrip.name);
    assertEquals("BART_9999", roundTrip.deviceName);
    assertEquals("11:22:33:44:55:66", roundTrip.deviceAddress);
    assertEquals(4, roundTrip.numLanes);
    assertEquals(1500, roundTrip.minLapMs);
    assertEquals(
        com.antigravity.protocols.arduino.ArduinoConfig.LapPinPitBehavior.NONE,
        roundTrip.lapPinPitBehavior);
  }
}
