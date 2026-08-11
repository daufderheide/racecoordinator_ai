package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Event extends Model {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class EventRaceItem {
    @JsonProperty("race_id")
    @JsonAlias("raceId")
    private final String raceId;

    @JsonProperty("max_drivers")
    @JsonAlias("maxDrivers")
    private final int maxDrivers;

    @JsonCreator
    public EventRaceItem(
        @JsonProperty("race_id") @JsonAlias("raceId") String raceId,
        @JsonProperty("max_drivers") @JsonAlias("maxDrivers") Integer maxDrivers) {
      this.raceId = raceId;
      this.maxDrivers = maxDrivers != null ? maxDrivers : 0;
    }

    public EventRaceItem(String raceId, int maxDrivers) {
      this.raceId = raceId;
      this.maxDrivers = maxDrivers;
    }

    public String getRaceId() {
      return raceId;
    }

    public int getMaxDrivers() {
      return maxDrivers;
    }
  }

  private final String name;
  private final String description;

  @JsonProperty("auto_advance_time")
  @JsonAlias("auto_advance_time")
  private final double autoAdvanceTime;

  private final List<EventRaceItem> races;

  @JsonCreator
  public Event(
      @JsonProperty("name") String name,
      @JsonProperty("description") String description,
      @JsonProperty("auto_advance_time") @JsonAlias("auto_advance_time") Double autoAdvanceTime,
      @JsonProperty("races") List<EventRaceItem> races,
      @JsonProperty("entity_id") @JsonAlias("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name;
    this.description = description != null ? description : "";
    this.autoAdvanceTime = autoAdvanceTime != null ? autoAdvanceTime : 0.0;
    this.races = races != null ? new ArrayList<>(races) : new ArrayList<>();
  }

  public Event(String name, String description, double autoAdvanceTime, List<EventRaceItem> races) {
    this(name, description, autoAdvanceTime, races, null, null);
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public double getAutoAdvanceTime() {
    return autoAdvanceTime;
  }

  public List<EventRaceItem> getRaces() {
    return new ArrayList<>(races);
  }
}
