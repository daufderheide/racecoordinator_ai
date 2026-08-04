package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class SeasonRaceRecord {

  public static class SeasonDriverResult {
    @BsonProperty("driver_id")
    @JsonProperty("driver_id")
    private final String driverId;

    @BsonProperty("driver_name")
    @JsonProperty("driver_name")
    private final String driverName;

    @BsonProperty("overall_rank")
    @JsonProperty("overall_rank")
    private final int overallRank;

    @BsonProperty("overall_points")
    @JsonProperty("overall_points")
    private final int overallPoints;

    @BsonProperty("heat_points")
    @JsonProperty("heat_points")
    private final int heatPoints;

    @BsonProperty("total_points")
    @JsonProperty("total_points")
    private final int totalPoints;

    @BsonCreator
    @JsonCreator
    public SeasonDriverResult(
        @BsonProperty("driver_id") @JsonProperty("driver_id") String driverId,
        @BsonProperty("driver_name") @JsonProperty("driver_name") String driverName,
        @BsonProperty("overall_rank") @JsonProperty("overall_rank") Integer overallRank,
        @BsonProperty("overall_points") @JsonProperty("overall_points") Integer overallPoints,
        @BsonProperty("heat_points") @JsonProperty("heat_points") Integer heatPoints,
        @BsonProperty("total_points") @JsonProperty("total_points") Integer totalPoints) {
      this.driverId = driverId != null ? driverId : "";
      this.driverName = driverName != null ? driverName : "";
      this.overallRank = overallRank != null ? overallRank : 0;
      this.overallPoints = overallPoints != null ? overallPoints : 0;
      this.heatPoints = heatPoints != null ? heatPoints : 0;
      this.totalPoints =
          totalPoints != null ? totalPoints : (this.overallPoints + this.heatPoints);
    }

    public String getDriverId() {
      return driverId;
    }

    public String getDriverName() {
      return driverName;
    }

    public int getOverallRank() {
      return overallRank;
    }

    public int getOverallPoints() {
      return overallPoints;
    }

    public int getHeatPoints() {
      return heatPoints;
    }

    public int getTotalPoints() {
      return totalPoints;
    }
  }

  @BsonProperty("race_id")
  @JsonProperty("race_id")
  private final String raceId;

  @BsonProperty("race_name")
  @JsonProperty("race_name")
  private final String raceName;

  @BsonProperty("timestamp")
  @JsonProperty("timestamp")
  private final long timestamp;

  @BsonProperty("driver_results")
  @JsonProperty("driver_results")
  private final List<SeasonDriverResult> driverResults;

  @BsonCreator
  @JsonCreator
  public SeasonRaceRecord(
      @BsonProperty("race_id") @JsonProperty("race_id") String raceId,
      @BsonProperty("race_name") @JsonProperty("race_name") String raceName,
      @BsonProperty("timestamp") @JsonProperty("timestamp") Long timestamp,
      @BsonProperty("driver_results") @JsonProperty("driver_results")
          List<SeasonDriverResult> driverResults) {
    this.raceId = raceId != null ? raceId : "";
    this.raceName = raceName != null ? raceName : "";
    this.timestamp = timestamp != null ? timestamp : System.currentTimeMillis();
    this.driverResults = driverResults != null ? new ArrayList<>(driverResults) : new ArrayList<>();
  }

  public String getRaceId() {
    return raceId;
  }

  public String getRaceName() {
    return raceName;
  }

  public long getTimestamp() {
    return timestamp;
  }

  public List<SeasonDriverResult> getDriverResults() {
    return new ArrayList<>(driverResults);
  }
}
