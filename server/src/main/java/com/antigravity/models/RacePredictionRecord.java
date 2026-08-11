package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RacePredictionRecord {

  @JsonProperty("_id")
  private String id;

  @JsonProperty("race_id")
  private String raceId;

  @JsonProperty("timestamp")
  private long timestamp;

  @JsonProperty("pre_race")
  private PredictionSnapshot preRace;

  @JsonProperty("realtime_snapshots")
  private List<PredictionSnapshot> realtimeSnapshots = new ArrayList<>();

  public RacePredictionRecord() {}

  @JsonCreator
  public RacePredictionRecord(
      @JsonProperty("_id") String id,
      @JsonProperty("race_id") String raceId,
      @JsonProperty("timestamp") long timestamp,
      @JsonProperty("pre_race") PredictionSnapshot preRace,
      @JsonProperty("realtime_snapshots") List<PredictionSnapshot> realtimeSnapshots) {
    this.id = id;
    this.raceId = raceId;
    this.timestamp = timestamp;
    this.preRace = preRace;
    this.realtimeSnapshots = realtimeSnapshots != null ? realtimeSnapshots : new ArrayList<>();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
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
    @JsonProperty("heat_index")
    private int heatIndex;

    @JsonProperty("completed_laps")
    private int completedLaps;

    @JsonProperty("win_probabilities")
    private Map<String, Double> winProbabilities = new HashMap<>();

    @JsonProperty("podium_probabilities")
    private Map<String, Double> podiumProbabilities = new HashMap<>();

    @JsonProperty("projected_standings")
    private List<DriverProjection> projectedStandings = new ArrayList<>();

    @JsonProperty("heat_forecasts")
    private List<HeatForecast> heatForecasts = new ArrayList<>();

    public PredictionSnapshot() {}

    @JsonCreator
    public PredictionSnapshot(
        @JsonProperty("heat_index") int heatIndex,
        @JsonProperty("completed_laps") int completedLaps,
        @JsonProperty("win_probabilities") Map<String, Double> winProbabilities,
        @JsonProperty("podium_probabilities") Map<String, Double> podiumProbabilities,
        @JsonProperty("projected_standings") List<DriverProjection> projectedStandings,
        @JsonProperty("heat_forecasts") List<HeatForecast> heatForecasts) {
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
    @JsonProperty("driver_id")
    private String driverId;

    @JsonProperty("driver_name")
    private String driverName;

    @JsonProperty("projected_rank")
    private int projectedRank;

    @JsonProperty("projected_laps")
    private double projectedLaps;

    @JsonProperty("projected_time_seconds")
    private double projectedTimeSeconds;

    @JsonProperty("win_probability")
    private double winProbability;

    @JsonProperty("podium_probability")
    private double podiumProbability;

    @JsonProperty("prior_median_lap_time")
    private double priorMedianLapTime = -1.0;

    @JsonProperty("prior_std_dev")
    private double priorStdDev = -1.0;

    @JsonProperty("historical_laps")
    private int historicalLaps = 0;

    @JsonProperty("per_lane_medians")
    private Map<String, Double> perLaneMedians = new HashMap<>();

    @JsonProperty("empirical_laps")
    private int empiricalLaps = 0;

    @JsonProperty("empirical_median_lap_time")
    private double empiricalMedianLapTime = -1.0;

    @JsonProperty("simulated_wins")
    private int simulatedWins = 0;

    @JsonProperty("total_simulations")
    private int totalSimulations = 0;

    public DriverProjection() {}

    @JsonCreator
    public DriverProjection(
        @JsonProperty("driver_id") String driverId,
        @JsonProperty("driver_name") String driverName,
        @JsonProperty("projected_rank") int projectedRank,
        @JsonProperty("projected_laps") double projectedLaps,
        @JsonProperty("projected_time_seconds") double projectedTimeSeconds,
        @JsonProperty("win_probability") double winProbability,
        @JsonProperty("podium_probability") double podiumProbability,
        @JsonProperty("prior_median_lap_time") Double priorMedianLapTime,
        @JsonProperty("prior_std_dev") Double priorStdDev,
        @JsonProperty("historical_laps") Integer historicalLaps,
        @JsonProperty("per_lane_medians") Map<String, Double> perLaneMedians,
        @JsonProperty("empirical_laps") Integer empiricalLaps,
        @JsonProperty("empirical_median_lap_time") Double empiricalMedianLapTime,
        @JsonProperty("simulated_wins") Integer simulatedWins,
        @JsonProperty("total_simulations") Integer totalSimulations) {
      this.driverId = driverId;
      this.driverName = driverName;
      this.projectedRank = projectedRank;
      this.projectedLaps = projectedLaps;
      this.projectedTimeSeconds = projectedTimeSeconds;
      this.winProbability = winProbability;
      this.podiumProbability = podiumProbability;
      this.priorMedianLapTime = priorMedianLapTime != null ? priorMedianLapTime : -1.0;
      this.priorStdDev = priorStdDev != null ? priorStdDev : -1.0;
      this.historicalLaps = historicalLaps != null ? historicalLaps : 0;
      this.perLaneMedians = perLaneMedians != null ? perLaneMedians : new HashMap<>();
      this.empiricalLaps = empiricalLaps != null ? empiricalLaps : 0;
      this.empiricalMedianLapTime = empiricalMedianLapTime != null ? empiricalMedianLapTime : -1.0;
      this.simulatedWins = simulatedWins != null ? simulatedWins : 0;
      this.totalSimulations = totalSimulations != null ? totalSimulations : 0;
    }

    public DriverProjection(
        String driverId,
        String driverName,
        int projectedRank,
        double projectedLaps,
        double projectedTimeSeconds,
        double winProbability,
        double podiumProbability) {
      this(
          driverId,
          driverName,
          projectedRank,
          projectedLaps,
          projectedTimeSeconds,
          winProbability,
          podiumProbability,
          -1.0,
          -1.0,
          0,
          new HashMap<>(),
          0,
          -1.0,
          0,
          0);
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

    public double getPriorMedianLapTime() {
      return priorMedianLapTime;
    }

    public void setPriorMedianLapTime(double priorMedianLapTime) {
      this.priorMedianLapTime = priorMedianLapTime;
    }

    public double getPriorStdDev() {
      return priorStdDev;
    }

    public void setPriorStdDev(double priorStdDev) {
      this.priorStdDev = priorStdDev;
    }

    public int getHistoricalLaps() {
      return historicalLaps;
    }

    public void setHistoricalLaps(int historicalLaps) {
      this.historicalLaps = historicalLaps;
    }

    public Map<String, Double> getPerLaneMedians() {
      return perLaneMedians;
    }

    public void setPerLaneMedians(Map<String, Double> perLaneMedians) {
      this.perLaneMedians = perLaneMedians != null ? perLaneMedians : new HashMap<>();
    }

    public int getEmpiricalLaps() {
      return empiricalLaps;
    }

    public void setEmpiricalLaps(int empiricalLaps) {
      this.empiricalLaps = empiricalLaps;
    }

    public double getEmpiricalMedianLapTime() {
      return empiricalMedianLapTime;
    }

    public void setEmpiricalMedianLapTime(double empiricalMedianLapTime) {
      this.empiricalMedianLapTime = empiricalMedianLapTime;
    }

    public int getSimulatedWins() {
      return simulatedWins;
    }

    public void setSimulatedWins(int simulatedWins) {
      this.simulatedWins = simulatedWins;
    }

    public int getTotalSimulations() {
      return totalSimulations;
    }

    public void setTotalSimulations(int totalSimulations) {
      this.totalSimulations = totalSimulations;
    }
  }

  public static class HeatForecast {
    @JsonProperty("heat_number")
    private int heatNumber;

    @JsonProperty("predicted_winner_id")
    private String predictedWinnerId;

    @JsonProperty("driver_projected_laps")
    private Map<String, Double> driverProjectedLaps = new HashMap<>();

    public HeatForecast() {}

    @JsonCreator
    public HeatForecast(
        @JsonProperty("heat_number") int heatNumber,
        @JsonProperty("predicted_winner_id") String predictedWinnerId,
        @JsonProperty("driver_projected_laps") Map<String, Double> driverProjectedLaps) {
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
