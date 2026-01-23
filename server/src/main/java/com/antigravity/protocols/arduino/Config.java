package com.antigravity.protocols.arduino;

import java.util.List;

public class Config {
  public String name;
  public String commPort;
  public int baudRate;
  public int debounceUs;

  public int globalInvertLanes;
  public int globalInvertRelays;
  public int globalInvertLights;
  public int useLapsForPits;
  public int useLapsForPitEnd;
  public int usePitsAsLaps;
  public int useLapsForSegments;

  public int hardwareType;

  public int[] digitalIds;
  public int[] analogIds;
  public List<LedString> ledStrings;
  public List<String> ledLaneColorOverrides;

  public Config(String name,
      String commPort,
      int baudRate,
      int debounceUs,
      int hardwareType,
      int globalInvertLanes,
      int globalInvertRelays,
      int globalInvertLights,
      int useLapsForPits,
      int useLapsForPitEnd,
      int usePitsAsLaps,
      int useLapsForSegments,
      int[] digitalIds,
      int[] analogIds,
      List<LedString> ledStrings,
      List<String> ledLaneColorOverrides) {
    this.name = name;
    this.commPort = commPort;
    this.baudRate = baudRate;
    this.debounceUs = debounceUs;
    this.hardwareType = hardwareType;
    this.globalInvertLanes = globalInvertLanes;
    this.globalInvertRelays = globalInvertRelays;
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
