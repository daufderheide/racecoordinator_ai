package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class RacePredictionRecord {

  @BsonId
  @JsonProperty("_id")
  private ObjectId id;

  @BsonProperty("race_id")
  @JsonProperty("race_id")
  private String raceId;

  @BsonProperty("timestamp")
  @JsonProperty("timestamp")
  private long timestamp;

  @BsonProperty("pre_race")
  @JsonProperty("pre_race")
  private PredictionSnapshot preRace;

  @BsonProperty("realtime_snapshots")
  @JsonProperty("realtime_snapshots")
  private List<PredictionSnapshot> realtimeSnapshots = new ArrayList<>();

  public RacePredictionRecord() {}

  @BsonCreator
  @JsonCreator
  public RacePredictionRecord(
      @BsonId @JsonProperty("_id") ObjectId id,
      @BsonProperty("race_id") @JsonProperty("race_id") String raceId,
      @BsonProperty("timestamp") @JsonProperty("timestamp") long timestamp,
      @BsonProperty("pre_race") @JsonProperty("pre_race") PredictionSnapshot preRace,
      @BsonProperty("realtime_snapshots") @JsonProperty("realtime_snapshots")
          List<PredictionSnapshot> realtimeSnapshots) {
    this.id = id;
    this.raceId = raceId;
    this.timestamp = timestamp;
    this.preRace = preRace;
    this.realtimeSnapshots = realtimeSnapshots != null ? realtimeSnapshots : new ArrayList<>();
  }

  public ObjectId getId() {
    return id;
  }

  public void setId(ObjectId id) {
    this.id = id;
  }

  public String getRaceId() {
    return raceId;
  }

  public void setRaceId(String raceId) {
    this.raceId = raceId;
  }

  public long getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(long timestamp) {
    this.timestamp = timestamp;
  }

  public PredictionSnapshot getPreRace() {
    return preRace;
  }

  public void setPreRace(PredictionSnapshot preRace) {
    this.preRace = preRace;
  }

  public List<PredictionSnapshot> getRealtimeSnapshots() {
    return realtimeSnapshots;
  }

  public void setRealtimeSnapshots(List<PredictionSnapshot> realtimeSnapshots) {
    this.realtimeSnapshots = realtimeSnapshots != null ? realtimeSnapshots : new ArrayList<>();
  }

  public static class PredictionSnapshot {
    @BsonProperty("heat_index")
    @JsonProperty("heat_index")
    private int heatIndex;

    @BsonProperty("completed_laps")
    @JsonProperty("completed_laps")
    private int completedLaps;

    @BsonProperty("win_probabilities")
    @JsonProperty("win_probabilities")
    private Map<String, Double> winProbabilities = new HashMap<>();

    @BsonProperty("podium_probabilities")
    @JsonProperty("podium_probabilities")
    private Map<String, Double> podiumProbabilities = new HashMap<>();

    @BsonProperty("projected_standings")
    @JsonProperty("projected_standings")
    private List<DriverProjection> projectedStandings = new ArrayList<>();

    @BsonProperty("heat_forecasts")
    @JsonProperty("heat_forecasts")
    private List<HeatForecast> heatForecasts = new ArrayList<>();

    public PredictionSnapshot() {}

    @BsonCreator
    @JsonCreator
    public PredictionSnapshot(
        @BsonProperty("heat_index") @JsonProperty("heat_index") int heatIndex,
        @BsonProperty("completed_laps") @JsonProperty("completed_laps") int completedLaps,
        @BsonProperty("win_probabilities") @JsonProperty("win_probabilities")
            Map<String, Double> winProbabilities,
        @BsonProperty("podium_probabilities") @JsonProperty("podium_probabilities")
            Map<String, Double> podiumProbabilities,
        @BsonProperty("projected_standings") @JsonProperty("projected_standings")
            List<DriverProjection> projectedStandings,
        @BsonProperty("heat_forecasts") @JsonProperty("heat_forecasts")
            List<HeatForecast> heatForecasts) {
      this.heatIndex = heatIndex;
      this.completedLaps = completedLaps;
      this.winProbabilities = winProbabilities != null ? winProbabilities : new HashMap<>();
      this.podiumProbabilities =
          podiumProbabilities != null ? podiumProbabilities : new HashMap<>();
      this.projectedStandings = projectedStandings != null ? projectedStandings : new ArrayList<>();
      this.heatForecasts = heatForecasts != null ? heatForecasts : new ArrayList<>();
    }

    public int getHeatIndex() {
      return heatIndex;
    }

    public void setHeatIndex(int heatIndex) {
      this.heatIndex = heatIndex;
    }

    public int getCompletedLaps() {
      return completedLaps;
    }

    public void setCompletedLaps(int completedLaps) {
      this.completedLaps = completedLaps;
    }

    public Map<String, Double> getWinProbabilities() {
      return winProbabilities;
    }

    public void setWinProbabilities(Map<String, Double> winProbabilities) {
      this.winProbabilities = winProbabilities != null ? winProbabilities : new HashMap<>();
    }

    public Map<String, Double> getPodiumProbabilities() {
      return podiumProbabilities;
    }

    public void setPodiumProbabilities(Map<String, Double> podiumProbabilities) {
      this.podiumProbabilities =
          podiumProbabilities != null ? podiumProbabilities : new HashMap<>();
    }

    public List<DriverProjection> getProjectedStandings() {
      return projectedStandings;
    }

    public void setProjectedStandings(List<DriverProjection> projectedStandings) {
      this.projectedStandings = projectedStandings != null ? projectedStandings : new ArrayList<>();
    }

    public List<HeatForecast> getHeatForecasts() {
      return heatForecasts;
    }

    public void setHeatForecasts(List<HeatForecast> heatForecasts) {
      this.heatForecasts = heatForecasts != null ? heatForecasts : new ArrayList<>();
    }
  }

  public static class DriverProjection {
    @BsonProperty("driver_id")
    @JsonProperty("driver_id")
    private String driverId;

    @BsonProperty("driver_name")
    @JsonProperty("driver_name")
    private String driverName;

    @BsonProperty("projected_rank")
    @JsonProperty("projected_rank")
    private int projectedRank;

    @BsonProperty("projected_laps")
    @JsonProperty("projected_laps")
    private double projectedLaps;

    @BsonProperty("projected_time_seconds")
    @JsonProperty("projected_time_seconds")
    private double projectedTimeSeconds;

    @BsonProperty("win_probability")
    @JsonProperty("win_probability")
    private double winProbability;

    @BsonProperty("podium_probability")
    @JsonProperty("podium_probability")
    private double podiumProbability;

    public DriverProjection() {}

    @BsonCreator
    @JsonCreator
    public DriverProjection(
        @BsonProperty("driver_id") @JsonProperty("driver_id") String driverId,
        @BsonProperty("driver_name") @JsonProperty("driver_name") String driverName,
        @BsonProperty("projected_rank") @JsonProperty("projected_rank") int projectedRank,
        @BsonProperty("projected_laps") @JsonProperty("projected_laps") double projectedLaps,
        @BsonProperty("projected_time_seconds") @JsonProperty("projected_time_seconds")
            double projectedTimeSeconds,
        @BsonProperty("win_probability") @JsonProperty("win_probability") double winProbability,
        @BsonProperty("podium_probability") @JsonProperty("podium_probability")
            double podiumProbability) {
      this.driverId = driverId;
      this.driverName = driverName;
      this.projectedRank = projectedRank;
      this.projectedLaps = projectedLaps;
      this.projectedTimeSeconds = projectedTimeSeconds;
      this.winProbability = winProbability;
      this.podiumProbability = podiumProbability;
    }

    public String getDriverId() {
      return driverId;
    }

    public void setDriverId(String driverId) {
      this.driverId = driverId;
    }

    public String getDriverName() {
      return driverName;
    }

    public void setDriverName(String driverName) {
      this.driverName = driverName;
    }

    public int getProjectedRank() {
      return projectedRank;
    }

    public void setProjectedRank(int projectedRank) {
      this.projectedRank = projectedRank;
    }

    public double getProjectedLaps() {
      return projectedLaps;
    }

    public void setProjectedLaps(double projectedLaps) {
      this.projectedLaps = projectedLaps;
    }

    public double getProjectedTimeSeconds() {
      return projectedTimeSeconds;
    }

    public void setProjectedTimeSeconds(double projectedTimeSeconds) {
      this.projectedTimeSeconds = projectedTimeSeconds;
    }

    public double getWinProbability() {
      return winProbability;
    }

    public void setWinProbability(double winProbability) {
      this.winProbability = winProbability;
    }

    public double getPodiumProbability() {
      return podiumProbability;
    }

    public void setPodiumProbability(double podiumProbability) {
      this.podiumProbability = podiumProbability;
    }
  }

  public static class HeatForecast {
    @BsonProperty("heat_number")
    @JsonProperty("heat_number")
    private int heatNumber;

    @BsonProperty("predicted_winner_id")
    @JsonProperty("predicted_winner_id")
    private String predictedWinnerId;

    @BsonProperty("driver_projected_laps")
    @JsonProperty("driver_projected_laps")
    private Map<String, Double> driverProjectedLaps = new HashMap<>();

    public HeatForecast() {}

    @BsonCreator
    @JsonCreator
    public HeatForecast(
        @BsonProperty("heat_number") @JsonProperty("heat_number") int heatNumber,
        @BsonProperty("predicted_winner_id") @JsonProperty("predicted_winner_id")
            String predictedWinnerId,
        @BsonProperty("driver_projected_laps") @JsonProperty("driver_projected_laps")
            Map<String, Double> driverProjectedLaps) {
      this.heatNumber = heatNumber;
      this.predictedWinnerId = predictedWinnerId;
      this.driverProjectedLaps =
          driverProjectedLaps != null ? driverProjectedLaps : new HashMap<>();
    }

    public int getHeatNumber() {
      return heatNumber;
    }

    public void setHeatNumber(int heatNumber) {
      this.heatNumber = heatNumber;
    }

    public String getPredictedWinnerId() {
      return predictedWinnerId;
    }

    public void setPredictedWinnerId(String predictedWinnerId) {
      this.predictedWinnerId = predictedWinnerId;
    }

    public Map<String, Double> getDriverProjectedLaps() {
      return driverProjectedLaps;
    }

    public void setDriverProjectedLaps(Map<String, Double> driverProjectedLaps) {
      this.driverProjectedLaps =
          driverProjectedLaps != null ? driverProjectedLaps : new HashMap<>();
    }
  }
}
