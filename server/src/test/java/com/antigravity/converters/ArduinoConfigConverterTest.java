package com.antigravity.converters;

import static org.junit.Assert.assertEquals;

import com.antigravity.proto.PinBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig;
import java.util.Arrays;
import org.junit.Test;

public class ArduinoConfigConverterTest {

  @Test
  public void testToProtoFiltersNullIds() {
    ArduinoConfig config = new ArduinoConfig();
    config.digitalIds =
        Arrays.asList(
            PinBehavior.BEHAVIOR_UNUSED.getNumber(),
            PinBehavior.BEHAVIOR_UNUSED.getNumber(),
            null,
            PinBehavior.BEHAVIOR_LAP_BASE.getNumber());
    config.analogIds = Arrays.asList(null, PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber());

    com.antigravity.proto.ArduinoConfig proto = ArduinoConfigConverter.toProto(config);

    assertEquals(4, proto.getDigitalIdsCount());
    assertEquals(0, proto.getDigitalIds(0));
    assertEquals(0, proto.getDigitalIds(1));
    assertEquals(0, proto.getDigitalIds(2)); // The null should be replaced with 0
    assertEquals(PinBehavior.BEHAVIOR_LAP_BASE.getNumber(), proto.getDigitalIds(3));

    assertEquals(2, proto.getAnalogIdsCount());
    assertEquals(0, proto.getAnalogIds(0)); // The null should be replaced with 0
    assertEquals(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber(), proto.getAnalogIds(1));
  }

  @Test
  public void testNullConfigReturnsDefaultProto() {
    com.antigravity.proto.ArduinoConfig proto = ArduinoConfigConverter.toProto(null);
    org.junit.Assert.assertNotNull(proto);
    assertEquals("", proto.getName());
  }

  @Test
  public void testFullRoundtripConversion() {
    com.antigravity.proto.VoltageConfig vc =
        com.antigravity.proto.VoltageConfig.newBuilder().setLane(1).setMaxVoltage(12).build();

    com.antigravity.proto.LedString ls =
        com.antigravity.proto.LedString.newBuilder()
            .setPin(6)
            .setBrightness(80)
            .setLedType(com.antigravity.proto.LedType.LED_TYPE_WS2812B)
            .setColorOrder(com.antigravity.proto.ColorOrder.COLOR_ORDER_GRB)
            .setFlagFlashRate(500)
            .addLeds(1)
            .addLeds(2)
            .build();

    com.antigravity.proto.ArduinoConfig proto =
        com.antigravity.proto.ArduinoConfig.newBuilder()
            .setName("Custom Uno")
            .setCommPort("/dev/ttyUSB0")
            .setBaudRate(115200)
            .setDebounceUs(500)
            .setHardwareType(1)
            .setNormallyClosedLaneSensors(true)
            .setNormallyClosedRelays(false)
            .setActiveLowAnalogLeds(true)
            .setUsePitsAsLaps(false)
            .setUseLapsForSegments(true)
            .setLapPinPitBehaviorValue(1)
            .addDigitalIds(10)
            .addAnalogIds(20)
            .addVoltageConfigs(vc)
            .addLedStrings(ls)
            .build();

    ArduinoConfig domainConfig = ArduinoConfigConverter.fromProto(proto);
    org.junit.Assert.assertNotNull(domainConfig);
    assertEquals("Custom Uno", domainConfig.name);
    assertEquals("/dev/ttyUSB0", domainConfig.commPort);
    assertEquals(115200, domainConfig.baudRate);
    assertEquals(500, domainConfig.debounceUs);
    org.junit.Assert.assertTrue(domainConfig.activeLowAnalogLeds);
    assertEquals(Integer.valueOf(12), domainConfig.voltageConfigs.get("1"));
    assertEquals(1, domainConfig.ledStrings.size());
    assertEquals(6, domainConfig.ledStrings.get(0).pin);

    com.antigravity.proto.ArduinoConfig backToProto = ArduinoConfigConverter.toProto(domainConfig);
    assertEquals("Custom Uno", backToProto.getName());
    assertEquals("/dev/ttyUSB0", backToProto.getCommPort());
    assertEquals(115200, backToProto.getBaudRate());
    org.junit.Assert.assertTrue(backToProto.getActiveLowAnalogLeds());
    assertEquals(1, backToProto.getVoltageConfigsCount());
    assertEquals(1, backToProto.getLedStringsCount());
  }
}
