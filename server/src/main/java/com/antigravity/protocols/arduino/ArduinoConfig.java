package com.antigravity.protocols.arduino;

import java.util.List;

import com.antigravity.proto.PinBehavior;
import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ArduinoConfig {
  public enum PinMode {
    READ,
    WRITE,
    READ_ANALOG
  }

  public enum LapPinPitBehavior {
    NONE(0),
    PIT_IN(1),
    PIT_OUT(2),
    PIT_IN_OUT(3);

    private final int value;

    LapPinPitBehavior(int value) {
      this.value = value;
    }

    @com.fasterxml.jackson.annotation.JsonValue
    public int getValue() {
      return value;
    }

    @com.fasterxml.jackson.annotation.JsonCreator
    public static LapPinPitBehavior fromValue(int value) {
      for (LapPinPitBehavior behavior : LapPinPitBehavior.values()) {
        if (behavior.value == value) {
          return behavior;
        }
      }
      return PIT_IN_OUT; // Default
    }
  }

  private static final Map<Integer, PinMode> PIN_MODE_MAP = new HashMap<>();
  public static final int MAX_LANES = 64;

  static {
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_CALL_BUTTON.getNumber(), PinMode.READ);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_RELAY.getNumber(), PinMode.WRITE);

    for (int i = 0; i < MAX_LANES; i++) {
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + i, PinMode.WRITE);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + i, PinMode.READ_ANALOG);
    }
  }

  public static PinMode getPinMode(int id) {
    return PIN_MODE_MAP.get(id);
  }

  public static boolean isReadPin(int id) {
    return getPinMode(id) == PinMode.READ;
  }

  public static boolean isWritePin(int id) {
    return getPinMode(id) == PinMode.WRITE;
  }

  public String name;
  public String commPort;
  public int baudRate;
  public int debounceUs;

  // Normally closed lane sensors means the sensor is active low.
  public boolean normallyClosedLaneSensors;
  public boolean normallyClosedRelays;
  public int globalInvertLights;
  public boolean usePitsAsLaps;
  public boolean useLapsForSegments;
  public LapPinPitBehavior lapPinPitBehavior;

  public int hardwareType;

  public List<Integer> digitalIds;
  public List<Integer> analogIds;
  public List<LedString> ledStrings;
  public List<String> ledLaneColorOverrides;
  @com.fasterxml.jackson.annotation.JsonAlias({ "voltage_configs", "voltageConfigs" })
  public Map<String, Integer> voltageConfigs = new java.util.HashMap<>();

  @com.fasterxml.jackson.annotation.JsonIgnore
  public Map<String, Integer> getVoltageConfigsMap() {
    return voltageConfigs;
  }

  public static final int MAX_DIGITAL_PINS = 60;
  public static final int MAX_ANALOG_PINS = 16;

  public ArduinoConfig() {
    this.digitalIds = new java.util.ArrayList<>();
    for (int i = 0; i < MAX_DIGITAL_PINS; i++) {
      this.digitalIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }
    this.analogIds = new java.util.ArrayList<>();
    for (int i = 0; i < MAX_ANALOG_PINS; i++) {
      this.analogIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }
    this.ledStrings = new java.util.ArrayList<>();
    this.ledLaneColorOverrides = new java.util.ArrayList<>();
    this.voltageConfigs = new java.util.HashMap<>();

    this.name = "Arduino";
    this.baudRate = 115200;

    // None of this is supported yet
    this.debounceUs = 200;
    this.hardwareType = 1;
    this.normallyClosedLaneSensors = true;
    this.normallyClosedRelays = true;
    this.globalInvertLights = 0;
    this.usePitsAsLaps = false;
    this.useLapsForSegments = true;
    this.lapPinPitBehavior = LapPinPitBehavior.PIT_IN_OUT;
  }

  @com.fasterxml.jackson.annotation.JsonCreator
  public ArduinoConfig(
      @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
      @com.fasterxml.jackson.annotation.JsonProperty("commPort") String commPort,
      @com.fasterxml.jackson.annotation.JsonProperty("baudRate") int baudRate,
      @com.fasterxml.jackson.annotation.JsonProperty("debounceUs") int debounceUs,
      @com.fasterxml.jackson.annotation.JsonProperty("hardwareType") int hardwareType,
      @com.fasterxml.jackson.annotation.JsonProperty("normallyClosedLaneSensors") boolean normallyClosedLaneSensors,
      @com.fasterxml.jackson.annotation.JsonProperty("normallyClosedRelays") boolean normallyClosedRelays,
      @com.fasterxml.jackson.annotation.JsonProperty("globalInvertLights") int globalInvertLights,
      @com.fasterxml.jackson.annotation.JsonProperty("usePitsAsLaps") boolean usePitsAsLaps,
      @com.fasterxml.jackson.annotation.JsonProperty("useLapsForSegments") boolean useLapsForSegments,
      @com.fasterxml.jackson.annotation.JsonProperty("lapPinPitBehavior") LapPinPitBehavior lapPinPitBehavior,
      @com.fasterxml.jackson.annotation.JsonProperty("digitalIds") List<Integer> digitalIds,
      @com.fasterxml.jackson.annotation.JsonProperty("analogIds") List<Integer> analogIds,
      @com.fasterxml.jackson.annotation.JsonProperty("ledStrings") List<LedString> ledStrings,
      @com.fasterxml.jackson.annotation.JsonProperty("ledLaneColorOverrides") List<String> ledLaneColorOverrides,
      @com.fasterxml.jackson.annotation.JsonProperty("voltageConfigs") @com.fasterxml.jackson.annotation.JsonAlias("voltage_configs") java.util.Map<String, Integer> voltageConfigs) {
    this.name = name;
    this.commPort = commPort;
    this.baudRate = baudRate;
    this.debounceUs = debounceUs;
    this.hardwareType = hardwareType;
    this.normallyClosedLaneSensors = normallyClosedLaneSensors;
    this.normallyClosedRelays = normallyClosedRelays;
    this.globalInvertLights = globalInvertLights;
    this.usePitsAsLaps = usePitsAsLaps;
    this.useLapsForSegments = useLapsForSegments;
    this.lapPinPitBehavior = lapPinPitBehavior;
    this.digitalIds = digitalIds;
    this.analogIds = analogIds;
    this.ledStrings = ledStrings;
    this.ledLaneColorOverrides = ledLaneColorOverrides;
    this.voltageConfigs = voltageConfigs;
  }
}
