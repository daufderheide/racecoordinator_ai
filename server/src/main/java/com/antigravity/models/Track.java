package com.antigravity.models;

import com.antigravity.proto.PinBehavior;
import com.antigravity.proto.RgbLedBehavior;
import com.antigravity.protocols.arduino.ArduinoConfig;
import com.antigravity.protocols.arduino.LedString;
import com.antigravity.protocols.bart.BartConfig;
import com.antigravity.protocols.phidget.PhidgetConfig;
import com.antigravity.protocols.trackmate.TrackmateConfig;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Track extends Model {

  private final String name;
  private final int numTrackSections;
  private final double trackScale;
  private final List<Lane> lanes;
  private final List<ArduinoConfig> arduinoConfigs;
  private final List<TrackmateConfig> trackmateConfigs;
  private final List<PhidgetConfig> phidgetConfigs;
  private final List<BartConfig> bartConfigs;

  @JsonCreator
  public Track(
      @JsonProperty("name") String name,
      @JsonProperty("num_track_sections") Integer numTrackSections,
      @JsonProperty("track_scale") Double trackScale,
      @JsonProperty("lanes") List<Lane> lanes,
      @JsonProperty("arduino_configs") List<ArduinoConfig> arduinoConfigs,
      @JsonProperty("trackmate_configs") List<TrackmateConfig> trackmateConfigs,
      @JsonProperty("phidget_configs") List<PhidgetConfig> phidgetConfigs,
      @JsonProperty("bart_configs") List<BartConfig> bartConfigs,
      @JsonProperty("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.numTrackSections = numTrackSections != null ? numTrackSections : 100;
    this.trackScale =
        (trackScale != null && trackScale > 0.0 && trackScale <= 1.0) ? trackScale : 1.0;
    this.lanes = lanes != null ? Collections.unmodifiableList(lanes) : Collections.emptyList();
    this.arduinoConfigs =
        arduinoConfigs != null
            ? Collections.unmodifiableList(arduinoConfigs)
            : Collections.emptyList();
    this.trackmateConfigs =
        trackmateConfigs != null
            ? Collections.unmodifiableList(trackmateConfigs)
            : Collections.emptyList();
    this.phidgetConfigs =
        phidgetConfigs != null
            ? Collections.unmodifiableList(phidgetConfigs)
            : Collections.emptyList();
    this.bartConfigs =
        bartConfigs != null ? Collections.unmodifiableList(bartConfigs) : Collections.emptyList();
  }

  public Track(
      String name,
      Integer numTrackSections,
      List<Lane> lanes,
      List<ArduinoConfig> arduinoConfigs,
      List<TrackmateConfig> trackmateConfigs,
      List<PhidgetConfig> phidgetConfigs,
      List<BartConfig> bartConfigs,
      String entityId,
      String id) {
    this(
        name,
        numTrackSections,
        1.0,
        lanes,
        arduinoConfigs,
        trackmateConfigs,
        phidgetConfigs,
        bartConfigs,
        entityId,
        id);
  }

  public static class Builder {
    private String name;
    private Integer numTrackSections = 100;
    private Double trackScale = 1.0;
    private List<Lane> lanes = new ArrayList<>();
    private List<ArduinoConfig> arduinoConfigs = new ArrayList<>();
    private List<TrackmateConfig> trackmateConfigs = new ArrayList<>();
    private List<PhidgetConfig> phidgetConfigs = new ArrayList<>();
    private List<BartConfig> bartConfigs = new ArrayList<>();
    private String entityId;
    private String id;

    public Builder name(String name) {
      this.name = name;
      return this;
    }

    public Builder numTrackSections(Integer numTrackSections) {
      this.numTrackSections = numTrackSections;
      return this;
    }

    public Builder trackScale(Double trackScale) {
      this.trackScale = trackScale;
      return this;
    }

    public Builder lanes(List<Lane> lanes) {
      this.lanes = lanes;
      return this;
    }

    public Builder arduinoConfigs(List<ArduinoConfig> arduinoConfigs) {
      this.arduinoConfigs = arduinoConfigs;
      return this;
    }

    public Builder trackmateConfigs(List<TrackmateConfig> trackmateConfigs) {
      this.trackmateConfigs = trackmateConfigs;
      return this;
    }

    public Builder phidgetConfigs(List<PhidgetConfig> phidgetConfigs) {
      this.phidgetConfigs = phidgetConfigs;
      return this;
    }

    public Builder bartConfigs(List<BartConfig> bartConfigs) {
      this.bartConfigs = bartConfigs;
      return this;
    }

    public Builder entityId(String entityId) {
      this.entityId = entityId;
      return this;
    }

    public Builder id(String id) {
      this.id = id;
      return this;
    }

    public Track build() {
      return new Track(
          name,
          numTrackSections,
          trackScale,
          lanes,
          arduinoConfigs,
          trackmateConfigs,
          phidgetConfigs,
          bartConfigs,
          entityId,
          id);
    }
  }

  public String getName() {
    return name;
  }

  @JsonProperty("num_track_sections")
  public int getNumTrackSections() {
    return numTrackSections;
  }

  @JsonProperty("track_scale")
  public double getTrackScale() {
    return trackScale;
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

    for (PhidgetConfig config : this.phidgetConfigs) {
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

  @JsonProperty("has_per_lane_relays")
  public boolean hasPerLaneRelays() {
    int base = PinBehavior.BEHAVIOR_RELAY_BASE.getNumber();
    int max = base + Math.max(1, this.lanes.size());

    for (ArduinoConfig config : this.arduinoConfigs) {
      if (config != null) {
        if (config.digitalIds != null) {
          for (Integer code : config.digitalIds) {
            if (code != null && code >= base && code < max) {
              return true;
            }
          }
        }
        if (config.analogIds != null) {
          for (Integer code : config.analogIds) {
            if (code != null && code >= base && code < max) {
              return true;
            }
          }
        }
      }
    }

    for (PhidgetConfig config : this.phidgetConfigs) {
      if (config != null) {
        if (config.digitalOutIds != null) {
          for (Integer code : config.digitalOutIds) {
            if (code != null && code >= base && code < max) {
              return true;
            }
          }
        }
        if (config.analogIds != null) {
          for (Integer code : config.analogIds) {
            if (code != null && code >= base && code < max) {
              return true;
            }
          }
        }
      }
    }
    if (this.trackmateConfigs != null) {
      for (TrackmateConfig config : this.trackmateConfigs) {
        if (config != null && config.hasPerLaneRelays) {
          return true;
        }
      }
    }

    return false;
  }

  @JsonProperty("has_main_relay")
  public boolean hasMainRelay() {
    int mainRelay = PinBehavior.BEHAVIOR_RELAY.getNumber();

    for (ArduinoConfig config : this.arduinoConfigs) {
      if (config != null) {
        if (config.digitalIds != null) {
          for (Integer code : config.digitalIds) {
            if (code != null && code == mainRelay) {
              return true;
            }
          }
        }
        if (config.analogIds != null) {
          for (Integer code : config.analogIds) {
            if (code != null && code == mainRelay) {
              return true;
            }
          }
        }
      }
    }

    for (PhidgetConfig config : this.phidgetConfigs) {
      if (config != null) {
        if (config.digitalOutIds != null) {
          for (Integer code : config.digitalOutIds) {
            if (code != null && code == mainRelay) {
              return true;
            }
          }
        }
        if (config.analogIds != null) {
          for (Integer code : config.analogIds) {
            if (code != null && code == mainRelay) {
              return true;
            }
          }
        }
      }
    }

    if (this.trackmateConfigs != null) {
      for (TrackmateConfig config : this.trackmateConfigs) {
        if (config != null && !config.hasPerLaneRelays) {
          return true;
        }
      }
    }

    return false;
  }

  public List<Lane> getLanes() {
    return lanes;
  }

  @JsonProperty("arduino_configs")
  public List<ArduinoConfig> getArduinoConfigs() {
    return arduinoConfigs;
  }

  @JsonProperty("trackmate_configs")
  public List<TrackmateConfig> getTrackmateConfigs() {
    return trackmateConfigs;
  }

  @JsonProperty("phidget_configs")
  public List<PhidgetConfig> getPhidgetConfigs() {
    return phidgetConfigs;
  }

  @JsonProperty("bart_configs")
  public List<BartConfig> getBartConfigs() {
    return bartConfigs;
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

    return new Builder()
        .name(this.name)
        .numTrackSections(this.numTrackSections)
        .trackScale(this.trackScale)
        .lanes(this.lanes)
        .arduinoConfigs(syncedConfigs)
        .trackmateConfigs(this.trackmateConfigs)
        .phidgetConfigs(this.phidgetConfigs)
        .bartConfigs(this.bartConfigs)
        .entityId(this.getEntityId())
        .id(this.getId())
        .build();
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
