package com.antigravity.converters;

import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.LedString;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ArduinoConfigConverter {
  public static ArduinoConfig fromProto(com.antigravity.proto.ArduinoConfig proto) {
    java.util.Map<String, Integer> voltageConfigs = new java.util.HashMap<>();
    for (com.antigravity.proto.VoltageConfig vc : proto.getVoltageConfigsList()) {
      voltageConfigs.put(String.valueOf(vc.getLane()), vc.getMaxVoltage());
    }

    List<LedString> ledStrings = proto.getLedStringsList().stream()
        .map(ls -> new LedString(
            ls.getStringNum(),
            new ArrayList<>(ls.getLedsList()),
            ls.getBrightness(),
            ls.getYellowFlagFlashRate(),
            new ArrayList<>(ls.getLedLaneColorOverridesList())))
        .collect(Collectors.toList());

    return new ArduinoConfig(
        proto.getName(),
        proto.getCommPort(),
        proto.getBaudRate(),
        proto.getDebounceUs(),
        proto.getHardwareType(),
        proto.getNormallyClosedLaneSensors(),
        proto.getNormallyClosedRelays(),
        proto.getGlobalInvertLights(),
        proto.getUsePitsAsLaps(),
        proto.getUseLapsForSegments(),
        ArduinoConfig.LapPinPitBehavior.fromValue(proto.getLapPinPitBehaviorValue()),
        new ArrayList<>(proto.getDigitalIdsList()),
        new ArrayList<>(proto.getAnalogIdsList()),
        ledStrings,
        voltageConfigs);
  }

  public static com.antigravity.proto.ArduinoConfig toProto(ArduinoConfig config) {
    if (config == null) {
      return com.antigravity.proto.ArduinoConfig.getDefaultInstance();
    }

    com.antigravity.proto.ArduinoConfig.Builder builder = com.antigravity.proto.ArduinoConfig.newBuilder()
        .setName(config.name != null ? config.name : "")
        .setCommPort(config.commPort != null ? config.commPort : "")
        .setBaudRate(config.baudRate)
        .setDebounceUs(config.debounceUs)
        .setNormallyClosedLaneSensors(config.normallyClosedLaneSensors)
        .setNormallyClosedRelays(config.normallyClosedRelays)
        .setGlobalInvertLights(config.globalInvertLights)
        .setUsePitsAsLaps(config.usePitsAsLaps)
        .setUseLapsForSegments(config.useLapsForSegments)
        .setHardwareType(config.hardwareType);

    if (config.digitalIds != null) {
      builder.addAllDigitalIds(config.digitalIds);
    }
    if (config.analogIds != null) {
      builder.addAllAnalogIds(config.analogIds);
    }
    if (config.lapPinPitBehavior != null) {
      builder.setLapPinPitBehaviorValue(config.lapPinPitBehavior.getValue());
    }

    if (config.ledStrings != null) {
      for (LedString ls : config.ledStrings) {
        com.antigravity.proto.LedString.Builder lsBuilder = com.antigravity.proto.LedString.newBuilder()
            .setStringNum(ls.stringNum)
            .setNumUsedLeds(ls.numUsedLeds)
            .setAddressableLeds(ls.addressableLeds)
            .setBrightness(ls.brightness)
            .setYellowFlagFlashRate(ls.yellowFlagFlashRate);

        if (ls.leds != null) {
          lsBuilder.addAllLeds(ls.leds);
        }
        if (ls.ledLaneColorOverrides != null) {
          lsBuilder.addAllLedLaneColorOverrides(ls.ledLaneColorOverrides);
        }
        builder.addLedStrings(lsBuilder.build());
      }
    }

    if (config.voltageConfigs != null) {
      for (java.util.Map.Entry<String, Integer> entry : config.voltageConfigs.entrySet()) {
        try {
          int lane = Integer.parseInt(entry.getKey());
          builder.addVoltageConfigs(com.antigravity.proto.VoltageConfig.newBuilder()
              .setLane(lane)
              .setMaxVoltage(entry.getValue())
              .build());
        } catch (NumberFormatException e) {
          // Skip invalid lane keys
        }
      }
    }

    return builder.build();
  }
}
