package com.antigravity.models;

import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.LedString;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Track extends Model {

  private final String name;
  private final int numTrackSections;
  private final List<Lane> lanes;
  private final List<ArduinoConfig> arduinoConfigs;
  private final String geolocation;

  @BsonCreator
  @JsonCreator
  public Track(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("num_track_sections") @JsonProperty("num_track_sections")
          Integer numTrackSections,
      @BsonProperty("lanes") @JsonProperty("lanes") List<Lane> lanes,
      @BsonProperty("arduino_configs") @JsonProperty("arduino_configs")
          List<ArduinoConfig> arduinoConfigs,
      @BsonProperty("geolocation") @JsonProperty("geolocation") String geolocation,
      @BsonProperty("entity_id") @JsonProperty("entity_id") String entityId,
      @BsonId @JsonProperty("_id") ObjectId id) {
    super(id, entityId);
    this.name = name;
    this.numTrackSections = numTrackSections != null ? numTrackSections : 100;
    this.lanes = lanes != null ? Collections.unmodifiableList(lanes) : Collections.emptyList();
    this.arduinoConfigs =
        arduinoConfigs != null
            ? Collections.unmodifiableList(arduinoConfigs)
            : Collections.emptyList();
    this.geolocation = geolocation;
  }

  public Track(
      String name,
      List<Lane> lanes,
      List<ArduinoConfig> arduinoConfigs,
      String entityId,
      ObjectId id) {
    this(name, 100, lanes, arduinoConfigs, null, entityId, id);
  }

  public Track(String name, List<Lane> lanes, String entityId, ObjectId id) {
    this(name, 100, lanes, null, null, entityId, id);
  }

  // Legacy constructor or convenience
  public Track(String name, List<Lane> lanes) {
    this(name, 100, lanes, null, null, null, null);
  }

  public String getName() {
    return name;
  }

  @JsonProperty("num_track_sections")
  @BsonProperty("num_track_sections")
  public int getNumTrackSections() {
    return numTrackSections;
  }

  public String getGeolocation() {
    return geolocation;
  }

  @JsonProperty("has_digital_fuel")
  public boolean hasDigitalFuel() {
    int base = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE.getNumber();
    int max = base + Math.max(1, this.lanes.size());

    for (ArduinoConfig config : this.arduinoConfigs) {
      if (config != null && config.analogIds != null) {
        for (Integer code : config.analogIds) {
          if (code != null && code >= base && code < max) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public List<Lane> getLanes() {
    return lanes;
  }

  @JsonProperty("arduino_configs")
  @BsonProperty("arduino_configs")
  public List<ArduinoConfig> getArduinoConfigs() {
    return arduinoConfigs;
  }

  /**
   * Synchronizes all Arduino configurations with the current lane model. This heals color mappings,
   * removes stale behaviors, and ensures array lengths match.
   *
   * @return A NEW Track instance with synchronized configurations.
   */
  public Track syncWithLanes() {
    List<ArduinoConfig> syncedConfigs = new ArrayList<>();

    for (ArduinoConfig config : this.arduinoConfigs) {
      if (config == null) continue;

      // Create a copy of the config to modify
      ArduinoConfig syncedConfig =
          new ArduinoConfig(
              config.name,
              config.commPort,
              config.baudRate,
              config.debounceUs,
              config.hardwareType,
              config.normallyClosedLaneSensors,
              config.normallyClosedRelays,
              config.globalInvertLights,
              config.usePitsAsLaps,
              config.useLapsForSegments,
              config.lapPinPitBehavior,
              new ArrayList<>(config.digitalIds),
              new ArrayList<>(config.analogIds),
              new ArrayList<>(),
              new HashMap<>(config.voltageConfigs));

      if (config.ledStrings != null) {
        for (LedString ls : config.ledStrings) {
          if (ls == null) continue;

          List<String> syncedOverrides = new ArrayList<>(ls.ledLaneColorOverrides);

          // 1. Sync override array length
          while (syncedOverrides.size() < this.lanes.size()) {
            syncedOverrides.add("");
          }
          if (syncedOverrides.size() > this.lanes.size()) {
            syncedOverrides = syncedOverrides.subList(0, this.lanes.size());
          }

          // 2. Sync colors (aggressive tracking)
          for (int i = 0; i < this.lanes.size(); i++) {
            syncedOverrides.set(i, this.lanes.get(i).getBackground_color());
          }

          // 3. Cleanup stale behaviors
          List<Integer> syncedBehaviors = new ArrayList<>();
          for (Integer behavior : ls.leds) {
            int val = (behavior != null) ? behavior : 0;
            int laneIdx = getLaneIndexFromRgbBehavior(val);

            if (laneIdx != -1 && (laneIdx < 0 || laneIdx >= this.lanes.size())) {
              syncedBehaviors.add(RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED_VALUE);
            } else {
              syncedBehaviors.add(val);
            }
          }

          syncedConfig.ledStrings.add(
              new LedString(
                  ls.pin,
                  syncedBehaviors,
                  ls.brightness,
                  ls.ledType,
                  ls.colorOrder,
                  ls.flagFlashRate,
                  syncedOverrides));
        }
      }
      syncedConfigs.add(syncedConfig);
    }

    return new Track(
        this.name,
        this.numTrackSections,
        this.lanes,
        syncedConfigs,
        this.geolocation,
        this.getEntityId(),
        this.getId());
  }

  private int getLaneIndexFromRgbBehavior(int flavor) {
    if (flavor >= RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE
        && flavor < RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE + 64) {
      return flavor - RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE_VALUE;
    }
    if (flavor >= RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE
        && flavor < RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE + 64) {
      return flavor - RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE_VALUE;
    }
    if (flavor >= RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE
        && flavor < RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE + 64) {
      return flavor - RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE_VALUE;
    }
    if (flavor >= RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE_VALUE
        && flavor < RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE_VALUE + 64) {
      return flavor - RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE_VALUE;
    }
    if (flavor >= RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE
        && flavor < RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE + 64) {
      return flavor - RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE_VALUE;
    }
    return -1;
  }
}
