package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.codecs.pojo.annotations.BsonProperty;
import org.bson.types.ObjectId;

public class PredictionEvaluationRecord {

  @BsonId
  @JsonProperty("_id")
  private ObjectId id;

  @BsonProperty("race_id")
  @JsonProperty("race_id")
  private String raceId;

  @BsonProperty("evaluated_at")
  @JsonProperty("evaluated_at")
  private long evaluatedAt;

  @BsonProperty("brier_score")
  @JsonProperty("brier_score")
  private double brierScore;

  @BsonProperty("rank_mae")
  @JsonProperty("rank_mae")
  private double rankMae;

  @BsonProperty("lap_projection_mae")
  @JsonProperty("lap_projection_mae")
  private double lapProjectionMae;

  @BsonProperty("driver_evaluations")
  @JsonProperty("driver_evaluations")
  private List<DriverEvaluation> driverEvaluations = new ArrayList<>();

  public PredictionEvaluationRecord() {}

  @BsonCreator
  @JsonCreator
  public PredictionEvaluationRecord(
      @BsonId @JsonProperty("_id") ObjectId id,
      @BsonProperty("race_id") @JsonProperty("race_id") String raceId,
      @BsonProperty("evaluated_at") @JsonProperty("evaluated_at") long evaluatedAt,
      @BsonProperty("brier_score") @JsonProperty("brier_score") double brierScore,
      @BsonProperty("rank_mae") @JsonProperty("rank_mae") double rankMae,
      @BsonProperty("lap_projection_mae") @JsonProperty("lap_projection_mae")
          double lapProjectionMae,
      @BsonProperty("driver_evaluations") @JsonProperty("driver_evaluations")
          List<DriverEvaluation> driverEvaluations) {
    this.id = id;
    this.raceId = raceId;
    this.evaluatedAt = evaluatedAt;
    this.brierScore = brierScore;
    this.rankMae = rankMae;
    this.lapProjectionMae = lapProjectionMae;
    this.driverEvaluations = driverEvaluations != null ? driverEvaluations : new ArrayList<>();
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

  public long getEvaluatedAt() {
    return evaluatedAt;
  }

  public void setEvaluatedAt(long evaluatedAt) {
    this.evaluatedAt = evaluatedAt;
  }

  public double getBrierScore() {
    return brierScore;
  }

  public void setBrierScore(double brierScore) {
    this.brierScore = brierScore;
  }

  public double getRankMae() {
    return rankMae;
  }

  public void setRankMae(double rankMae) {
    this.rankMae = rankMae;
  }

  public double getLapProjectionMae() {
    return lapProjectionMae;
  }

  public void setLapProjectionMae(double lapProjectionMae) {
    this.lapProjectionMae = lapProjectionMae;
  }

  public List<DriverEvaluation> getDriverEvaluations() {
    return driverEvaluations;
  }

  public void setDriverEvaluations(List<DriverEvaluation> driverEvaluations) {
    this.driverEvaluations = driverEvaluations != null ? driverEvaluations : new ArrayList<>();
  }

  public static class DriverEvaluation {
    @BsonProperty("driver_id")
    @JsonProperty("driver_id")
    private String driverId;

    @BsonProperty("driver_name")
    @JsonProperty("driver_name")
    private String driverName;

    @BsonProperty("pre_race_win_prob")
    @JsonProperty("pre_race_win_prob")
    private double preRaceWinProb;

    @BsonProperty("projected_rank")
    @JsonProperty("projected_rank")
    private int projectedRank;

    @BsonProperty("actual_rank")
    @JsonProperty("actual_rank")
    private int actualRank;

    @BsonProperty("projected_laps")
    @JsonProperty("projected_laps")
    private double projectedLaps;

    @BsonProperty("actual_laps")
    @JsonProperty("actual_laps")
    private double actualLaps;

    public DriverEvaluation() {}

    @BsonCreator
    @JsonCreator
    public DriverEvaluation(
        @BsonProperty("driver_id") @JsonProperty("driver_id") String driverId,
        @BsonProperty("driver_name") @JsonProperty("driver_name") String driverName,
        @BsonProperty("pre_race_win_prob") @JsonProperty("pre_race_win_prob") double preRaceWinProb,
        @BsonProperty("projected_rank") @JsonProperty("projected_rank") int projectedRank,
        @BsonProperty("actual_rank") @JsonProperty("actual_rank") int actualRank,
        @BsonProperty("projected_laps") @JsonProperty("projected_laps") double projectedLaps,
        @BsonProperty("actual_laps") @JsonProperty("actual_laps") double actualLaps) {
      this.driverId = driverId;
      this.driverName = driverName;
      this.preRaceWinProb = preRaceWinProb;
      this.projectedRank = projectedRank;
      this.actualRank = actualRank;
      this.projectedLaps = projectedLaps;
      this.actualLaps = actualLaps;
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

    public double getPreRaceWinProb() {
      return preRaceWinProb;
    }

    public void setPreRaceWinProb(double preRaceWinProb) {
      this.preRaceWinProb = preRaceWinProb;
    }

    public int getProjectedRank() {
      return projectedRank;
    }

    public void setProjectedRank(int projectedRank) {
      this.projectedRank = projectedRank;
    }

    public int getActualRank() {
      return actualRank;
    }

    public void setActualRank(int actualRank) {
      this.actualRank = actualRank;
    }

    public double getProjectedLaps() {
      return projectedLaps;
    }

    public void setProjectedLaps(double projectedLaps) {
      this.projectedLaps = projectedLaps;
    }

    public double getActualLaps() {
      return actualLaps;
    }

    public void setActualLaps(double actualLaps) {
      this.actualLaps = actualLaps;
    }
  }
}
