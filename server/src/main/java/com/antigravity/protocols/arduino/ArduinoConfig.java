package com.antigravity.protocols.arduino;

import com.antigravity.proto.PinBehavior;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @JsonValue
    public int getValue() {
      return value;
    }

    @JsonCreator
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
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_LED_RGB_STRING.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_GREEN_FLAG.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_YELLOW_FLAG.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_1.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_2.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_3.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_4.getNumber(), PinMode.WRITE);
    PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_ANALOG_LED_COUNTDOWN_5.getNumber(), PinMode.WRITE);

    for (int i = 0; i < MAX_LANES; i++) {
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + i, PinMode.WRITE);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_PIT_IN_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_PIT_OUT_BASE.getNumber() + i, PinMode.READ);
      PIN_MODE_MAP.put(
          PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber() + i, PinMode.READ_ANALOG);
      PIN_MODE_MAP.put(PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE.getNumber() + i, PinMode.READ);
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

  @JsonAlias({"voltage_configs", "voltageConfigs"})
  public Map<String, Integer> voltageConfigs = new HashMap<>();

  @JsonIgnore
  public Map<String, Integer> getVoltageConfigsMap() {
    return voltageConfigs;
  }

  public static final int MAX_DIGITAL_PINS = 60;
  public static final int MAX_ANALOG_PINS = 16;

  public ArduinoConfig() {
    this.digitalIds = new ArrayList<>();
    for (int i = 0; i < MAX_DIGITAL_PINS; i++) {
      this.digitalIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }
    this.analogIds = new ArrayList<>();
    for (int i = 0; i < MAX_ANALOG_PINS; i++) {
      this.analogIds.add(PinBehavior.BEHAVIOR_UNUSED.getNumber());
    }
    this.ledStrings = new ArrayList<>();
    this.voltageConfigs = new HashMap<>();

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

  @JsonCreator
  public ArduinoConfig(
      @JsonProperty("name") String name,
      @JsonProperty("commPort") String commPort,
      @JsonProperty("baudRate") int baudRate,
      @JsonProperty("debounceUs") int debounceUs,
      @JsonProperty("hardwareType") int hardwareType,
      @JsonProperty("normallyClosedLaneSensors") boolean normallyClosedLaneSensors,
      @JsonProperty("normallyClosedRelays") boolean normallyClosedRelays,
      @JsonProperty("globalInvertLights") int globalInvertLights,
      @JsonProperty("usePitsAsLaps") boolean usePitsAsLaps,
      @JsonProperty("useLapsForSegments") boolean useLapsForSegments,
      @JsonProperty("lapPinPitBehavior") LapPinPitBehavior lapPinPitBehavior,
      @JsonProperty("digitalIds") List<Integer> digitalIds,
      @JsonProperty("analogIds") List<Integer> analogIds,
      @JsonProperty("ledStrings") List<LedString> ledStrings,
      @JsonProperty("voltageConfigs") @JsonAlias("voltage_configs")
          Map<String, Integer> voltageConfigs) {
    this.name = name;
    this.commPort = commPort;
    this.baudRate = baudRate;
    if (this.baudRate <= 0) {
      this.baudRate = 115200;
    }
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
    this.voltageConfigs = voltageConfigs;
  }
}
