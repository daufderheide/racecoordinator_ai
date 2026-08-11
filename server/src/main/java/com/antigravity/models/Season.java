package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Season extends Model {

  private final String name;
  private final int drops;
  private final List<SeasonRaceRecord> races;

  @JsonCreator
  public Season(
      @JsonProperty("name") String name,
      @JsonProperty("drops") Integer drops,
      @JsonProperty("races") List<SeasonRaceRecord> races,
      @JsonProperty("entity_id") @JsonAlias("entity_id") String entityId,
      @JsonProperty("_id") String id) {
    super(id, entityId);
    this.name = name != null ? name : "";
    this.drops = drops != null ? Math.max(0, drops) : 0;
    this.races = races != null ? new ArrayList<>(races) : new ArrayList<>();
  }

  public Season(String name, int drops, List<SeasonRaceRecord> races) {
    this(name, drops, races, null, null);
  }

  public Season(String name, int drops) {
    this(name, drops, new ArrayList<>(), null, null);
  }

  public String getName() {
    return name;
  }

  public int getDrops() {
    return drops;
  }

  public List<SeasonRaceRecord> getRaces() {
    return new ArrayList<>(races);
  }
}
