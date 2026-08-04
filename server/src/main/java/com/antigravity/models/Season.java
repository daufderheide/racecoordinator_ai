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
public class Season extends Model {

  private final String name;
  private final int drops;
  private final List<SeasonRaceRecord> races;

  @JsonCreator
  @BsonCreator
  public Season(
      @BsonProperty("name") @JsonProperty("name") String name,
      @BsonProperty("drops") @JsonProperty("drops") Integer drops,
      @BsonProperty("races") @JsonProperty("races") List<SeasonRaceRecord> races,
      @BsonProperty("entity_id") @JsonProperty("entity_id") @JsonAlias("entity_id") String entityId,
      @BsonId @BsonProperty("_id") @JsonProperty("_id") ObjectId id) {
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
