package com.antigravity.models;

import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceStatistics;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

@JsonIgnoreProperties(ignoreUnknown = true)
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

  @BsonProperty("is_demo")
  @JsonProperty("is_demo")
  private boolean isDemo;

  @BsonProperty("driver_results")
  @JsonProperty("driver_results")
  private List<SeasonRaceRecord.SeasonDriverResult> driverResults;

  @BsonProperty("event_id")
  @JsonProperty("event_id")
  private String eventId;

  @BsonProperty("event_name")
  @JsonProperty("event_name")
  private String eventName;

  @BsonProperty("is_event_race")
  @JsonProperty("is_event_race")
  private boolean isEventRace;

  @BsonProperty("is_event_summary")
  @JsonProperty("is_event_summary")
  private boolean isEventSummary;

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
      @BsonProperty("is_demo") @JsonProperty("is_demo") @JsonAlias({"isDemo", "demo"})
          Boolean isDemo) {
    this.id = id;
    this.originalEntityId = originalEntityId;
    this.model = model;
    this.track = track;
    this.drivers = drivers;
    this.heats = heats;
    this.accumulatedRaceTime = accumulatedRaceTime;
    this.statistics = statistics;
    this.isDemo = isDemo != null ? isDemo : false;
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

  @JsonProperty("is_demo")
  public boolean isDemo() {
    return isDemo;
  }

  public void setDemo(boolean isDemo) {
    this.isDemo = isDemo;
  }

  @JsonProperty("driver_results")
  public List<SeasonRaceRecord.SeasonDriverResult> getDriverResults() {
    return driverResults;
  }

  public void setDriverResults(List<SeasonRaceRecord.SeasonDriverResult> driverResults) {
    this.driverResults = driverResults;
  }

  @JsonProperty("event_id")
  public String getEventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  @JsonProperty("event_name")
  public String getEventName() {
    return eventName;
  }

  public void setEventName(String eventName) {
    this.eventName = eventName;
  }

  @JsonProperty("is_event_race")
  public boolean isEventRace() {
    return isEventRace;
  }

  public void setEventRace(boolean isEventRace) {
    this.isEventRace = isEventRace;
  }

  @JsonProperty("is_event_summary")
  public boolean isEventSummary() {
    return isEventSummary;
  }

  public void setEventSummary(boolean isEventSummary) {
    this.isEventSummary = isEventSummary;
  }
}
