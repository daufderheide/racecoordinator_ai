package com.antigravity.protocols.arduino;

import java.util.List;

import com.antigravity.proto.PinBehavior;
import java.util.Map;
import java.util.HashMap;

public class ArduinoConfig {
  public enum PinDirection {
    READ,
    WRITE
  }

  private static final Map<Integer, PinDirection> PIN_BEHAVIOR_MAP = new HashMap<>();
  public static final int MAX_LANES = 64;

  static {
    PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_CALL_BUTTON.getNumber(), PinDirection.READ);
    PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_RELAY.getNumber(), PinDirection.WRITE);

    for (int i = 0; i < MAX_LANES; i++) {
      PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_LAP_BASE.getNumber() + i, PinDirection.READ);
      PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_SEGMENT_BASE.getNumber() + i, PinDirection.READ);
      PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_CALL_BUTTON_BASE.getNumber() + i, PinDirection.READ);
      PIN_BEHAVIOR_MAP.put(PinBehavior.BEHAVIOR_RELAY_BASE.getNumber() + i, PinDirection.WRITE);
    }
  }

  public static boolean isReadPin(int id) {
    return PIN_BEHAVIOR_MAP.get(id) == PinDirection.READ;
  }

  public static boolean isWritePin(int id) {
    return PIN_BEHAVIOR_MAP.get(id) == PinDirection.WRITE;
  }

  public String name;
  public String commPort;
  public int baudRate;
  public int debounceUs;

  public int globalInvertLanes;
  public boolean normallyClosedRelays;
  public int globalInvertLights;
  public int useLapsForPits;
  public int useLapsForPitEnd;
  public int usePitsAsLaps;
  public int useLapsForSegments;

  public int hardwareType;

  public List<Integer> digitalIds;
  public List<Integer> analogIds;
  public List<LedString> ledStrings;
  public List<String> ledLaneColorOverrides;

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

    this.baudRate = 115200;

    // None of this is supported yet
    this.debounceUs = 200;
    this.hardwareType = 1;
    this.globalInvertLanes = 0;
    this.normallyClosedRelays = false;
    this.globalInvertLights = 0;
    this.useLapsForPits = 0;
    this.useLapsForPitEnd = 0;
    this.usePitsAsLaps = 0;
    this.useLapsForSegments = 0;
  }

  public ArduinoConfig(String name,
      String commPort,
      int baudRate,
      int debounceUs,
      int hardwareType,
      int globalInvertLanes,
      boolean normallyClosedRelays,
      int globalInvertLights,
      int useLapsForPits,
      int useLapsForPitEnd,
      int usePitsAsLaps,
      int useLapsForSegments,
      List<Integer> digitalIds,
      List<Integer> analogIds,
      List<LedString> ledStrings,
      List<String> ledLaneColorOverrides) {
    this.name = name;
    this.commPort = commPort;
    this.baudRate = baudRate;
    this.debounceUs = debounceUs;
    this.hardwareType = hardwareType;
    this.globalInvertLanes = globalInvertLanes;
    this.normallyClosedRelays = normallyClosedRelays;
    this.globalInvertLights = globalInvertLights;
    this.useLapsForPits = useLapsForPits;
    this.useLapsForPitEnd = useLapsForPitEnd;
    this.usePitsAsLaps = usePitsAsLaps;
    this.useLapsForSegments = useLapsForSegments;
    this.digitalIds = digitalIds;
    this.analogIds = analogIds;
    this.ledStrings = ledStrings;
    this.ledLaneColorOverrides = ledLaneColorOverrides;
  }
}
