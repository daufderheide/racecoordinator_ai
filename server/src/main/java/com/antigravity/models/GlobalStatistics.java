package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class GlobalStatistics {

  @BsonId
  @JsonProperty("_id")
  private ObjectId id;

  @BsonProperty("singleton_id")
  @JsonProperty("singleton_id")
  private String singletonId;

  @BsonProperty("total_races")
  @JsonProperty("total_races")
  private int totalRaces;

  @BsonProperty("total_laps")
  @JsonProperty("total_laps")
  private int totalLaps;

  @BsonProperty("total_race_time_ms")
  @JsonProperty("total_race_time_ms")
  private long totalRaceTimeMs;

  @BsonProperty("fastest_lap_time")
  @JsonProperty("fastest_lap_time")
  private double fastestLapTime;

  @BsonProperty("fastest_lap_driver_name")
  @JsonProperty("fastest_lap_driver_name")
  private String fastestLapDriverName;

  @BsonProperty("fastest_lap_track_name")
  @JsonProperty("fastest_lap_track_name")
  private String fastestLapTrackName;

  public GlobalStatistics() {
    this.singletonId = "global";
    this.fastestLapTime = Double.MAX_VALUE;
  }

  @BsonCreator
  @JsonCreator
  public GlobalStatistics(
      @BsonId @JsonProperty("_id") ObjectId id,
      @BsonProperty("singleton_id") @JsonProperty("singleton_id") String singletonId,
      @BsonProperty("total_races") @JsonProperty("total_races") int totalRaces,
      @BsonProperty("total_laps") @JsonProperty("total_laps") int totalLaps,
      @BsonProperty("total_race_time_ms") @JsonProperty("total_race_time_ms") long totalRaceTimeMs,
      @BsonProperty("fastest_lap_time") @JsonProperty("fastest_lap_time") double fastestLapTime,
      @BsonProperty("fastest_lap_driver_name") @JsonProperty("fastest_lap_driver_name")
          String fastestLapDriverName,
      @BsonProperty("fastest_lap_track_name") @JsonProperty("fastest_lap_track_name")
          String fastestLapTrackName) {
    this.id = id;
    this.singletonId = singletonId != null ? singletonId : "global";
    this.totalRaces = totalRaces;
    this.totalLaps = totalLaps;
    this.totalRaceTimeMs = totalRaceTimeMs;
    this.fastestLapTime = fastestLapTime;
    this.fastestLapDriverName = fastestLapDriverName;
    this.fastestLapTrackName = fastestLapTrackName;
  }

  public ObjectId getId() {
    return id;
  }

  public void setId(ObjectId id) {
    this.id = id;
  }

  public String getSingletonId() {
    return singletonId;
  }

  public void setSingletonId(String singletonId) {
    this.singletonId = singletonId;
  }

  public int getTotalRaces() {
    return totalRaces;
  }

  public void setTotalRaces(int totalRaces) {
    this.totalRaces = totalRaces;
  }

  public void addRaceCount() {
    this.totalRaces++;
  }

  public int getTotalLaps() {
    return totalLaps;
  }

  public void setTotalLaps(int totalLaps) {
    this.totalLaps = totalLaps;
  }

  public void addLaps(int laps) {
    this.totalLaps += laps;
  }

  public long getTotalRaceTimeMs() {
    return totalRaceTimeMs;
  }

  public void setTotalRaceTimeMs(long totalRaceTimeMs) {
    this.totalRaceTimeMs = totalRaceTimeMs;
  }

  public void addRaceTimeMs(long ms) {
    this.totalRaceTimeMs += ms;
  }

  public double getFastestLapTime() {
    return fastestLapTime;
  }

  public void setFastestLapTime(double fastestLapTime) {
    this.fastestLapTime = fastestLapTime;
  }

  public String getFastestLapDriverName() {
    return fastestLapDriverName;
  }

  public void setFastestLapDriverName(String fastestLapDriverName) {
    this.fastestLapDriverName = fastestLapDriverName;
  }

  public String getFastestLapTrackName() {
    return fastestLapTrackName;
  }

  public void setFastestLapTrackName(String fastestLapTrackName) {
    this.fastestLapTrackName = fastestLapTrackName;
  }
}
