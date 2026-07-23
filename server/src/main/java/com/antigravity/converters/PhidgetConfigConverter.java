package com.antigravity.converters;

import com.antigravity.proto.LapPinPitBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.phidget.PhidgetConfig;

public class PhidgetConfigConverter {
  public static PhidgetConfig fromProto(
      com.antigravity.proto.PhidgetConfig proto) { // fqn-collision
    if (proto == null) {
      return null;
    }
    PhidgetConfig config = new PhidgetConfig();
    config.name = proto.getName();
    config.serialNumber = proto.getSerialNumber();
    config.isHubPort = proto.getIsHubPort();
    config.hubPort = proto.getHubPort();
    config.debounceUs = proto.getDebounceUs();
    config.normallyClosedLaneSensors = proto.getNormallyClosedLaneSensors();
    config.normallyClosedRelays = proto.getNormallyClosedRelays();
    config.usePitsAsLaps = proto.getUsePitsAsLaps();
    config.useLapsForSegments = proto.getUseLapsForSegments();
    config.useLapsForPits = proto.getUseLapsForPits();
    config.useLapsForPitEnd = proto.getUseLapsForPitEnd();

    LapPinPitBehavior protoBehavior = proto.getLapPinPitBehavior();
    if (protoBehavior != null) {
      config.lapPinPitBehavior =
          ArduinoConfig.LapPinPitBehavior.fromValue(protoBehavior.getNumber());
    }

    config.digitalInIds.clear();
    config.digitalInIds.addAll(proto.getDigitalInIdsList());

    config.digitalOutIds.clear();
    config.digitalOutIds.addAll(proto.getDigitalOutIdsList());

    config.analogIds.clear();
    config.analogIds.addAll(proto.getAnalogIdsList());

    for (com.antigravity.proto.VoltageConfig vc : proto.getVoltageConfigsList()) { // fqn-collision
      config.voltageConfigs.put(String.valueOf(vc.getLane()), vc.getMaxVoltage());
    }

    return config;
  }

  public static com.antigravity.proto.PhidgetConfig toProto(PhidgetConfig config) { // fqn-collision
    if (config == null) {
      return com.antigravity.proto.PhidgetConfig.getDefaultInstance(); // fqn-collision
    }
    com.antigravity.proto.PhidgetConfig.Builder builder = // fqn-collision
        com.antigravity.proto.PhidgetConfig.newBuilder() // fqn-collision
            .setName(config.name != null ? config.name : "")
            .setSerialNumber(config.serialNumber)
            .setIsHubPort(config.isHubPort)
            .setHubPort(config.hubPort)
            .setDebounceUs(config.debounceUs)
            .setNormallyClosedLaneSensors(config.normallyClosedLaneSensors)
            .setNormallyClosedRelays(config.normallyClosedRelays)
            .setUsePitsAsLaps(config.usePitsAsLaps)
            .setUseLapsForSegments(config.useLapsForSegments)
            .setUseLapsForPits(config.useLapsForPits)
            .setUseLapsForPitEnd(config.useLapsForPitEnd);
    if (config.lapPinPitBehavior != null) {
      builder.setLapPinPitBehaviorValue(config.lapPinPitBehavior.getValue());
    }
    if (config.digitalInIds != null) {
      builder.addAllDigitalInIds(config.digitalInIds);
    }
    if (config.digitalOutIds != null) {
      builder.addAllDigitalOutIds(config.digitalOutIds);
    }
    if (config.analogIds != null) {
      builder.addAllAnalogIds(config.analogIds);
    }
    if (config.voltageConfigs != null) {
      for (java.util.Map.Entry<String, Integer> entry : config.voltageConfigs.entrySet()) {
        try {
          int lane = Integer.parseInt(entry.getKey());
          builder.addVoltageConfigs(
              com.antigravity.proto.VoltageConfig.newBuilder() // fqn-collision
                  .setLane(lane)
                  .setMaxVoltage(entry.getValue())
                  .build());
        } catch (NumberFormatException ignored) {
        }
      }
    }
    return builder.build();
  }
}
