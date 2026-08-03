package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Event extends Model {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class EventRaceItem {
    @BsonProperty("race_id")
    @JsonProperty("race_id")
    @JsonAlias("raceId")
    private final String raceId;

    @BsonProperty("max_drivers")
    @JsonProperty("max_drivers")
    @JsonAlias("maxDrivers")
    private final int maxDrivers;

    @JsonCreator
    @BsonCreator
    public EventRaceItem(
        @BsonProperty("race_id") @JsonProperty("race_id") @JsonAlias("raceId") String raceId,
        @BsonProperty("max_drivers") @JsonProperty("max_drivers") @JsonAlias("maxDrivers")
            Integer maxDrivers) {
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

  @BsonProperty("auto_advance_time")
  @JsonProperty("auto_advance_time")
  @JsonAlias("auto_advance_time")
  private final double autoAdvanceTime;

  private final List<EventRaceItem> races;

  @JsonCreator
  @BsonCreator
  public Event(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("description") @JsonProperty("description") String description,
      @BsonProperty("auto_advance_time")
          @JsonProperty("auto_advance_time")
          @JsonAlias("auto_advance_time")
          Double autoAdvanceTime,
      @BsonProperty("races") @JsonProperty("races") List<EventRaceItem> races,
      @BsonProperty("entity_id") @JsonProperty("entity_id") @JsonAlias("entity_id") String entityId,
      @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
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
