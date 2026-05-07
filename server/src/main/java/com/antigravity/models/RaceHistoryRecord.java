package com.antigravity.models;

import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceStatistics;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class RaceHistoryRecord {

  @BsonId
  @JsonProperty("_id")
  private ObjectId id;

  @BsonProperty("original_entity_id")
  @JsonProperty("original_entity_id")
  private String originalEntityId;

  @BsonProperty("model")
  @JsonProperty("model")
  private Race model;

  @BsonProperty("track")
  @JsonProperty("track")
  private Track track;

  @BsonProperty("drivers")
  @JsonProperty("drivers")
  private List<RaceParticipant> drivers;

  @BsonProperty("heats")
  @JsonProperty("heats")
  private List<Heat> heats;

  @BsonProperty("accumulatedRaceTime")
  @JsonProperty("accumulatedRaceTime")
  private float accumulatedRaceTime;

  @BsonProperty("statistics")
  @JsonProperty("statistics")
  private RaceStatistics statistics;

  @BsonProperty("database_name")
  @JsonProperty("database_name")
  private String databaseName;

  @BsonProperty("car_class")
  @JsonProperty("car_class")
  private String carClass;

  @BsonProperty("geolocation")
  @JsonProperty("geolocation")
  private String geolocation;

  public RaceHistoryRecord() {}

  @BsonCreator
  @JsonCreator
  public RaceHistoryRecord(
      @BsonId @JsonProperty("_id") ObjectId id,
      @BsonProperty("original_entity_id") @JsonProperty("original_entity_id")
          String originalEntityId,
      @BsonProperty("model") @JsonProperty("model") Race model,
      @BsonProperty("track") @JsonProperty("track") Track track,
      @BsonProperty("drivers") @JsonProperty("drivers") List<RaceParticipant> drivers,
      @BsonProperty("heats") @JsonProperty("heats") List<Heat> heats,
      @BsonProperty("accumulatedRaceTime") @JsonProperty("accumulatedRaceTime")
          float accumulatedRaceTime,
      @BsonProperty("statistics") @JsonProperty("statistics") RaceStatistics statistics,
      @BsonProperty("database_name") @JsonProperty("database_name") String databaseName,
      @BsonProperty("car_class") @JsonProperty("car_class") String carClass,
      @BsonProperty("geolocation") @JsonProperty("geolocation") String geolocation) {
    this.id = id;
    this.originalEntityId = originalEntityId;
    this.model = model;
    this.track = track;
    this.drivers = drivers;
    this.heats = heats;
    this.accumulatedRaceTime = accumulatedRaceTime;
    this.statistics = statistics;
    this.databaseName = databaseName;
    this.carClass = carClass;
    this.geolocation = geolocation;
  }

  public ObjectId getId() {
    return id;
  }

  public void setId(ObjectId id) {
    this.id = id;
  }

  public String getOriginalEntityId() {
    return originalEntityId;
  }

  public void setOriginalEntityId(String originalEntityId) {
    this.originalEntityId = originalEntityId;
  }

  public Race getModel() {
    return model;
  }

  public void setModel(Race model) {
    this.model = model;
  }

  public Track getTrack() {
    return track;
  }

  public void setTrack(Track track) {
    this.track = track;
  }

  public List<RaceParticipant> getDrivers() {
    return drivers;
  }

  public void setDrivers(List<RaceParticipant> drivers) {
    this.drivers = drivers;
  }

  public List<Heat> getHeats() {
    return heats;
  }

  public void setHeats(List<Heat> heats) {
    this.heats = heats;
  }

  public float getAccumulatedRaceTime() {
    return accumulatedRaceTime;
  }

  public void setAccumulatedRaceTime(float accumulatedRaceTime) {
    this.accumulatedRaceTime = accumulatedRaceTime;
  }

  public RaceStatistics getStatistics() {
    return statistics;
  }

  public void setStatistics(RaceStatistics statistics) {
    this.statistics = statistics;
  }

  public String getDatabaseName() {
    return databaseName;
  }

  public void setDatabaseName(String databaseName) {
    this.databaseName = databaseName;
  }

  public void setCarClass(String carClass) {
    this.carClass = carClass;
  }

  public String getGeolocation() {
    return geolocation;
  }

  public void setGeolocation(String geolocation) {
    this.geolocation = geolocation;
  }
}
