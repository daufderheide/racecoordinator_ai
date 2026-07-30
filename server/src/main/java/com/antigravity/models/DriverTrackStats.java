package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class DriverTrackStats {

  @BsonId
  @JsonProperty("_id")
  private ObjectId id;

  @BsonProperty("driver_id")
  @JsonProperty("driver_id")
  private String driverId;

  @BsonProperty("track_id")
  @JsonProperty("track_id")
  private String trackId;

  @BsonProperty("total_races")
  @JsonProperty("total_races")
  private int totalRaces;

  @BsonProperty("total_heats")
  @JsonProperty("total_heats")
  private int totalHeats;

  @BsonProperty("total_laps")
  @JsonProperty("total_laps")
  private int totalLaps;

  @BsonProperty("lane_stats")
  @JsonProperty("lane_stats")
  private List<LanePaceStats> laneStats = new ArrayList<>();

  @BsonProperty("overall_median_lap_time")
  @JsonProperty("overall_median_lap_time")
  private double overallMedianLapTime;

  @BsonProperty("overall_consistency_score")
  @JsonProperty("overall_consistency_score")
  private double overallConsistencyScore;

  @BsonProperty("last_updated")
  @JsonProperty("last_updated")
  private long lastUpdated;

  public DriverTrackStats() {}

  @BsonCreator
  @JsonCreator
  public DriverTrackStats(
      @BsonId @JsonProperty("_id") ObjectId id,
      @BsonProperty("driver_id") @JsonProperty("driver_id") String driverId,
      @BsonProperty("track_id") @JsonProperty("track_id") String trackId,
      @BsonProperty("total_races") @JsonProperty("total_races") int totalRaces,
      @BsonProperty("total_heats") @JsonProperty("total_heats") int totalHeats,
      @BsonProperty("total_laps") @JsonProperty("total_laps") int totalLaps,
      @BsonProperty("lane_stats") @JsonProperty("lane_stats") List<LanePaceStats> laneStats,
      @BsonProperty("overall_median_lap_time") @JsonProperty("overall_median_lap_time")
          double overallMedianLapTime,
      @BsonProperty("overall_consistency_score") @JsonProperty("overall_consistency_score")
          double overallConsistencyScore,
      @BsonProperty("last_updated") @JsonProperty("last_updated") long lastUpdated) {
    this.id = id;
    this.driverId = driverId;
    this.trackId = trackId;
    this.totalRaces = totalRaces;
    this.totalHeats = totalHeats;
    this.totalLaps = totalLaps;
    this.laneStats = laneStats != null ? laneStats : new ArrayList<>();
    this.overallMedianLapTime = overallMedianLapTime;
    this.overallConsistencyScore = overallConsistencyScore;
    this.lastUpdated = lastUpdated;
  }

  public ObjectId getId() {
    return id;
  }

  public void setId(ObjectId id) {
    this.id = id;
  }

  public String getDriverId() {
    return driverId;
  }

  public void setDriverId(String driverId) {
    this.driverId = driverId;
  }

  public String getTrackId() {
    return trackId;
  }

  public void setTrackId(String trackId) {
    this.trackId = trackId;
  }

  public int getTotalRaces() {
    return totalRaces;
  }

  public void setTotalRaces(int totalRaces) {
    this.totalRaces = totalRaces;
  }

  public int getTotalHeats() {
    return totalHeats;
  }

  public void setTotalHeats(int totalHeats) {
    this.totalHeats = totalHeats;
  }

  public int getTotalLaps() {
    return totalLaps;
  }

  public void setTotalLaps(int totalLaps) {
    this.totalLaps = totalLaps;
  }

  public List<LanePaceStats> getLaneStats() {
    return laneStats;
  }

  public void setLaneStats(List<LanePaceStats> laneStats) {
    this.laneStats = laneStats != null ? laneStats : new ArrayList<>();
  }

  public double getOverallMedianLapTime() {
    return overallMedianLapTime;
  }

  public void setOverallMedianLapTime(double overallMedianLapTime) {
    this.overallMedianLapTime = overallMedianLapTime;
  }

  public double getOverallConsistencyScore() {
    return overallConsistencyScore;
  }

  public void setOverallConsistencyScore(double overallConsistencyScore) {
    this.overallConsistencyScore = overallConsistencyScore;
  }

  public long getLastUpdated() {
    return lastUpdated;
  }

  public void setLastUpdated(long lastUpdated) {
    this.lastUpdated = lastUpdated;
  }

  public static class LanePaceStats {
    @BsonProperty("lane_index")
    @JsonProperty("lane_index")
    private int laneIndex;

    @BsonProperty("median_lap_time")
    @JsonProperty("median_lap_time")
    private double medianLapTime;

    @BsonProperty("p90_lap_time")
    @JsonProperty("p90_lap_time")
    private double p90LapTime;

    @BsonProperty("best_lap_time")
    @JsonProperty("best_lap_time")
    private double bestLapTime;

    @BsonProperty("std_dev")
    @JsonProperty("std_dev")
    private double stdDev;

    @BsonProperty("consistency_score")
    @JsonProperty("consistency_score")
    private double consistencyScore;

    @BsonProperty("drift_lap_rate")
    @JsonProperty("drift_lap_rate")
    private double driftLapRate;

    @BsonProperty("sample_size_laps")
    @JsonProperty("sample_size_laps")
    private int sampleSizeLaps;

    public LanePaceStats() {}

    @BsonCreator
    @JsonCreator
    public LanePaceStats(
        @BsonProperty("lane_index") @JsonProperty("lane_index") int laneIndex,
        @BsonProperty("median_lap_time") @JsonProperty("median_lap_time") double medianLapTime,
        @BsonProperty("p90_lap_time") @JsonProperty("p90_lap_time") double p90LapTime,
        @BsonProperty("best_lap_time") @JsonProperty("best_lap_time") double bestLapTime,
        @BsonProperty("std_dev") @JsonProperty("std_dev") double stdDev,
        @BsonProperty("consistency_score") @JsonProperty("consistency_score")
            double consistencyScore,
        @BsonProperty("drift_lap_rate") @JsonProperty("drift_lap_rate") double driftLapRate,
        @BsonProperty("sample_size_laps") @JsonProperty("sample_size_laps") int sampleSizeLaps) {
      this.laneIndex = laneIndex;
      this.medianLapTime = medianLapTime;
      this.p90LapTime = p90LapTime;
      this.bestLapTime = bestLapTime;
      this.stdDev = stdDev;
      this.consistencyScore = consistencyScore;
      this.driftLapRate = driftLapRate;
      this.sampleSizeLaps = sampleSizeLaps;
    }

    public int getLaneIndex() {
      return laneIndex;
    }

    public void setLaneIndex(int laneIndex) {
      this.laneIndex = laneIndex;
    }

    public double getMedianLapTime() {
      return medianLapTime;
    }

    public void setMedianLapTime(double medianLapTime) {
      this.medianLapTime = medianLapTime;
    }

    public double getP90LapTime() {
      return p90LapTime;
    }

    public void setP90LapTime(double p90LapTime) {
      this.p90LapTime = p90LapTime;
    }

    public double getBestLapTime() {
      return bestLapTime;
    }

    public void setBestLapTime(double bestLapTime) {
      this.bestLapTime = bestLapTime;
    }

    public double getStdDev() {
      return stdDev;
    }

    public void setStdDev(double stdDev) {
      this.stdDev = stdDev;
    }

    public double getConsistencyScore() {
      return consistencyScore;
    }

    public void setConsistencyScore(double consistencyScore) {
      this.consistencyScore = consistencyScore;
    }

    public double getDriftLapRate() {
      return driftLapRate;
    }

    public void setDriftLapRate(double driftLapRate) {
      this.driftLapRate = driftLapRate;
    }

    public int getSampleSizeLaps() {
      return sampleSizeLaps;
    }

    public void setSampleSizeLaps(int sampleSizeLaps) {
      this.sampleSizeLaps = sampleSizeLaps;
    }
  }
}
