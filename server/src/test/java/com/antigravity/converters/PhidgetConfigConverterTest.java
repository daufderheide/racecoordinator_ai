package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.protocols.phidget.PhidgetConfig;
import java.util.Arrays;
import java.util.HashMap;
import org.junit.Test;

public class PhidgetConfigConverterTest {

  @Test
  public void testToProto_NullConfig_ReturnsDefaultInstance() {
    com.antigravity.proto.PhidgetConfig proto = PhidgetConfigConverter.toProto(null);
    assertNotNull(proto);
    assertEquals(com.antigravity.proto.PhidgetConfig.getDefaultInstance(), proto);
  }

  @Test
  public void testToProto_PopulatedConfig_ConvertsCorrectly() {
    PhidgetConfig config = new PhidgetConfig();
    config.name = "Phidget Interface 1";
    config.serialNumber = 123456;
    config.isHubPort = true;
    config.hubPort = 3;
    config.debounceUs = 1000;
    config.normallyClosedLaneSensors = true;
    config.normallyClosedRelays = false;
    config.digitalInIds = Arrays.asList(1000, 1001);
    config.digitalOutIds = Arrays.asList(4000, 4001);
    config.analogIds = Arrays.asList(0, 1);
    config.voltageConfigs = new HashMap<>();
    config.voltageConfigs.put("0", 12);

    com.antigravity.proto.PhidgetConfig proto = PhidgetConfigConverter.toProto(config);

    assertNotNull(proto);
    assertEquals("Phidget Interface 1", proto.getName());
    assertEquals(123456, proto.getSerialNumber());
    assertTrue(proto.getIsHubPort());
    assertEquals(3, proto.getHubPort());
    assertEquals(1000, proto.getDebounceUs());
    assertTrue(proto.getNormallyClosedLaneSensors());
    assertEquals(2, proto.getDigitalInIdsCount());
    assertEquals(1000, proto.getDigitalInIds(0));
    assertEquals(1, proto.getVoltageConfigsCount());
    assertEquals(0, proto.getVoltageConfigs(0).getLane());
    assertEquals(12, proto.getVoltageConfigs(0).getMaxVoltage());
  }

  @Test
  public void testFromProto_NullProto_ReturnsNull() {
    PhidgetConfig config = PhidgetConfigConverter.fromProto(null);
    assertNull(config);
  }

  @Test
  public void testFromProto_PopulatedProto_ConvertsCorrectly() {
    com.antigravity.proto.PhidgetConfig proto =
        com.antigravity.proto.PhidgetConfig.newBuilder()
            .setName("Proto Phidget")
            .setSerialNumber(654321)
            .setIsHubPort(false)
            .setHubPort(0)
            .setDebounceUs(2000)
            .setNormallyClosedLaneSensors(true)
            .addDigitalInIds(1000)
            .addDigitalOutIds(4000)
            .addAnalogIds(0)
            .addVoltageConfigs(
                com.antigravity.proto.VoltageConfig.newBuilder().setLane(1).setMaxVoltage(10))
            .build();

    PhidgetConfig config = PhidgetConfigConverter.fromProto(proto);

    assertNotNull(config);
    assertEquals("Proto Phidget", config.name);
    assertEquals(654321, config.serialNumber);
    assertEquals(false, config.isHubPort);
    assertEquals(2000, config.debounceUs);
    assertEquals(1, config.digitalInIds.size());
    assertEquals(Integer.valueOf(1000), config.digitalInIds.get(0));
    assertNotNull(config.voltageConfigs);
    assertEquals(Integer.valueOf(10), config.voltageConfigs.get("1"));
  }
}
