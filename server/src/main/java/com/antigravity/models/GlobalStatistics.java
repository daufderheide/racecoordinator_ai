package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class GlobalStatistics {

  @JsonProperty("_id")
  private String id;

  @JsonProperty("race_entity_id")
  private String raceEntityId;

  @JsonProperty("total_races")
  private int totalRaces;

  @JsonProperty("total_laps")
  private double totalLaps;

  @JsonProperty("total_race_time_ms")
  private long totalRaceTimeMs;

  @JsonProperty("fastest_lap_time")
  private double fastestLapTime;

  @JsonProperty("fastest_lap_driver_name")
  private String fastestLapDriverName;

  @JsonProperty("fastest_lap_track_name")
  private String fastestLapTrackName;

  @JsonProperty("fastest_lap_driver_nickname")
  private String fastestLapDriverNickname;

  @JsonProperty("fastest_lap_date")
  private long fastestLapDate;

  @JsonProperty("fastest_lap_team_name")
  private String fastestLapTeamName;

  @JsonProperty("highest_score")
  private double highestScore;

  @JsonProperty("highest_score_holder_name")
  private String highestScoreHolderName;

  @JsonProperty("highest_score_track_name")
  private String highestScoreTrackName;

  @JsonProperty("highest_score_holder_nickname")
  private String highestScoreHolderNickname;

  @JsonProperty("highest_score_date")
  private long highestScoreDate;

  @JsonProperty("highest_score_team_name")
  private String highestScoreTeamName;

  @JsonProperty("lane_fastest_lap_times")
  private List<Double> laneFastestLapTimes;

  @JsonProperty("lane_fastest_lap_driver_names")
  private List<String> laneFastestLapDriverNames;

  @JsonProperty("lane_fastest_lap_driver_nicknames")
  private List<String> laneFastestLapDriverNicknames;

  @JsonProperty("lane_fastest_lap_dates")
  private List<Long> laneFastestLapDates;

  @JsonProperty("lane_fastest_lap_team_names")
  private List<String> laneFastestLapTeamNames;

  @JsonProperty("lane_highest_scores")
  private List<Double> laneHighestScores;

  @JsonProperty("lane_highest_score_holder_names")
  private List<String> laneHighestScoreHolderNames;

  @JsonProperty("lane_highest_score_holder_nicknames")
  private List<String> laneHighestScoreHolderNicknames;

  @JsonProperty("lane_highest_score_dates")
  private List<Long> laneHighestScoreDates;

  @JsonProperty("lane_highest_score_team_names")
  private List<String> laneHighestScoreTeamNames;

  public GlobalStatistics() {
    this.fastestLapTime = Double.MAX_VALUE;
    initLaneLists();
  }

  public GlobalStatistics(String raceEntityId) {
    this.raceEntityId = raceEntityId;
    this.fastestLapTime = Double.MAX_VALUE;
    initLaneLists();
  }

  private void initLaneLists() {
    this.laneFastestLapTimes = new ArrayList<>();
    this.laneFastestLapDriverNames = new ArrayList<>();
    this.laneFastestLapDriverNicknames = new ArrayList<>();
    this.laneFastestLapDates = new ArrayList<>();
    this.laneHighestScores = new ArrayList<>();
    this.laneHighestScoreHolderNames = new ArrayList<>();
    this.laneHighestScoreHolderNicknames = new ArrayList<>();
    this.laneHighestScoreDates = new ArrayList<>();
    this.laneFastestLapTeamNames = new ArrayList<>();
    this.laneHighestScoreTeamNames = new ArrayList<>();
  }

  public GlobalStatistics(
      @JsonProperty("_id") String id,
      @JsonProperty("race_entity_id") String raceEntityId,
      @JsonProperty("total_races") int totalRaces,
      @JsonProperty("total_laps") double totalLaps,
      @JsonProperty("total_race_time_ms") long totalRaceTimeMs,
      @JsonProperty("fastest_lap_time") double fastestLapTime,
      @JsonProperty("fastest_lap_driver_name") String fastestLapDriverName,
      @JsonProperty("fastest_lap_driver_nickname") String fastestLapDriverNickname,
      @JsonProperty("fastest_lap_track_name") String fastestLapTrackName,
      @JsonProperty("fastest_lap_date") long fastestLapDate,
      @JsonProperty("highest_score") double highestScore,
      @JsonProperty("highest_score_holder_name") String highestScoreHolderName,
      @JsonProperty("highest_score_holder_nickname") String highestScoreHolderNickname,
      @JsonProperty("highest_score_track_name") String highestScoreTrackName,
      @JsonProperty("highest_score_date") long highestScoreDate,
      @JsonProperty("lane_fastest_lap_times") List<Double> laneFastestLapTimes,
      @JsonProperty("lane_fastest_lap_driver_names") List<String> laneFastestLapDriverNames,
      @JsonProperty("lane_fastest_lap_driver_nicknames") List<String> laneFastestLapDriverNicknames,
      @JsonProperty("lane_fastest_lap_dates") List<Long> laneFastestLapDates,
      @JsonProperty("lane_highest_scores") List<Double> laneHighestScores,
      @JsonProperty("lane_highest_score_holder_names") List<String> laneHighestScoreHolderNames,
      @JsonProperty("lane_highest_score_holder_nicknames")
          List<String> laneHighestScoreHolderNicknames,
      @JsonProperty("lane_highest_score_dates") List<Long> laneHighestScoreDates,
      @JsonProperty("fastest_lap_team_name") String fastestLapTeamName,
      @JsonProperty("highest_score_team_name") String highestScoreTeamName,
      @JsonProperty("lane_fastest_lap_team_names") List<String> laneFastestLapTeamNames,
      @JsonProperty("lane_highest_score_team_names") List<String> laneHighestScoreTeamNames) {
    this.id = id;
    this.raceEntityId = raceEntityId;
    this.totalRaces = totalRaces;
    this.totalLaps = totalLaps;
    this.totalRaceTimeMs = totalRaceTimeMs;
    this.fastestLapTime = fastestLapTime;
    this.fastestLapDriverName = fastestLapDriverName;
    this.fastestLapDriverNickname = fastestLapDriverNickname;
    this.fastestLapTrackName = fastestLapTrackName;
    this.fastestLapDate = fastestLapDate;
    this.highestScore = highestScore;
    this.highestScoreHolderName = highestScoreHolderName;
    this.highestScoreHolderNickname = highestScoreHolderNickname;
    this.highestScoreTrackName = highestScoreTrackName;
    this.highestScoreDate = highestScoreDate;
    this.laneFastestLapTimes =
        laneFastestLapTimes != null ? laneFastestLapTimes : new ArrayList<>();
    this.laneFastestLapDriverNames =
        laneFastestLapDriverNames != null ? laneFastestLapDriverNames : new ArrayList<>();
    this.laneFastestLapDriverNicknames =
        laneFastestLapDriverNicknames != null ? laneFastestLapDriverNicknames : new ArrayList<>();
    this.laneFastestLapDates =
        laneFastestLapDates != null ? laneFastestLapDates : new ArrayList<>();
    this.laneHighestScores = laneHighestScores != null ? laneHighestScores : new ArrayList<>();
    this.laneHighestScoreHolderNames =
        laneHighestScoreHolderNames != null ? laneHighestScoreHolderNames : new ArrayList<>();
    this.laneHighestScoreHolderNicknames =
        laneHighestScoreHolderNicknames != null
            ? laneHighestScoreHolderNicknames
            : new ArrayList<>();
    this.laneHighestScoreDates =
        laneHighestScoreDates != null ? laneHighestScoreDates : new ArrayList<>();
    this.fastestLapTeamName = fastestLapTeamName;
    this.highestScoreTeamName = highestScoreTeamName;
    this.laneFastestLapTeamNames =
        laneFastestLapTeamNames != null ? laneFastestLapTeamNames : new ArrayList<>();
    this.laneHighestScoreTeamNames =
        laneHighestScoreTeamNames != null ? laneHighestScoreTeamNames : new ArrayList<>();
  }

  public String getId() {
    return id;
  }

  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getEntityId() {
    return raceEntityId != null ? raceEntityId : id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getRaceEntityId() {
    return raceEntityId;
  }

  public void setRaceEntityId(String raceEntityId) {
    this.raceEntityId = raceEntityId;
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

  public double getTotalLaps() {
    return totalLaps;
  }

  public void setTotalLaps(double totalLaps) {
    this.totalLaps = totalLaps;
  }

  public void addLaps(double laps) {
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

  public long getFastestLapDate() {
    return fastestLapDate;
  }

  public void setFastestLapDate(long fastestLapDate) {
    this.fastestLapDate = fastestLapDate;
  }

  public String getFastestLapTeamName() {
    return fastestLapTeamName;
  }

  public void setFastestLapTeamName(String fastestLapTeamName) {
    this.fastestLapTeamName = fastestLapTeamName;
  }

  public double getHighestScore() {
    return highestScore;
  }

  public void setHighestScore(double highestScore) {
    this.highestScore = highestScore;
  }

  public String getHighestScoreHolderName() {
    return highestScoreHolderName;
  }

  public void setHighestScoreHolderName(String highestScoreHolderName) {
    this.highestScoreHolderName = highestScoreHolderName;
  }

  public String getHighestScoreTrackName() {
    return highestScoreTrackName;
  }

  public void setHighestScoreTrackName(String highestScoreTrackName) {
    this.highestScoreTrackName = highestScoreTrackName;
  }

  public long getHighestScoreDate() {
    return highestScoreDate;
  }

  public void setHighestScoreDate(long highestScoreDate) {
    this.highestScoreDate = highestScoreDate;
  }

  public String getHighestScoreTeamName() {
    return highestScoreTeamName;
  }

  public void setHighestScoreTeamName(String highestScoreTeamName) {
    this.highestScoreTeamName = highestScoreTeamName;
  }

  public String getFastestLapDriverNickname() {
    return fastestLapDriverNickname;
  }

  public void setFastestLapDriverNickname(String fastestLapDriverNickname) {
    this.fastestLapDriverNickname = fastestLapDriverNickname;
  }

  public String getHighestScoreHolderNickname() {
    return highestScoreHolderNickname;
  }

  public void setHighestScoreHolderNickname(String highestScoreHolderNickname) {
    this.highestScoreHolderNickname = highestScoreHolderNickname;
  }

  public List<Double> getLaneFastestLapTimes() {
    return laneFastestLapTimes;
  }

  public void setLaneFastestLapTimes(List<Double> laneFastestLapTimes) {
    this.laneFastestLapTimes = laneFastestLapTimes;
  }

  public List<String> getLaneFastestLapDriverNames() {
    return laneFastestLapDriverNames;
  }

  public void setLaneFastestLapDriverNames(List<String> laneFastestLapDriverNames) {
    this.laneFastestLapDriverNames = laneFastestLapDriverNames;
  }

  public List<String> getLaneFastestLapDriverNicknames() {
    return laneFastestLapDriverNicknames;
  }

  public void setLaneFastestLapDriverNicknames(List<String> laneFastestLapDriverNicknames) {
    this.laneFastestLapDriverNicknames = laneFastestLapDriverNicknames;
  }

  public List<Long> getLaneFastestLapDates() {
    return laneFastestLapDates;
  }

  public void setLaneFastestLapDates(List<Long> laneFastestLapDates) {
    this.laneFastestLapDates = laneFastestLapDates;
  }

  public List<String> getLaneFastestLapTeamNames() {
    return laneFastestLapTeamNames;
  }

  public void setLaneFastestLapTeamNames(List<String> laneFastestLapTeamNames) {
    this.laneFastestLapTeamNames = laneFastestLapTeamNames;
  }

  public List<Double> getLaneHighestScores() {
    return laneHighestScores;
  }

  public void setLaneHighestScores(List<Double> laneHighestScores) {
    this.laneHighestScores = laneHighestScores;
  }

  public List<String> getLaneHighestScoreHolderNames() {
    return laneHighestScoreHolderNames;
  }

  public void setLaneHighestScoreHolderNames(List<String> laneHighestScoreHolderNames) {
    this.laneHighestScoreHolderNames = laneHighestScoreHolderNames;
  }

  public List<String> getLaneHighestScoreHolderNicknames() {
    return laneHighestScoreHolderNicknames;
  }

  public void setLaneHighestScoreHolderNicknames(List<String> laneHighestScoreHolderNicknames) {
    this.laneHighestScoreHolderNicknames = laneHighestScoreHolderNicknames;
  }

  public List<Long> getLaneHighestScoreDates() {
    return laneHighestScoreDates;
  }

  public void setLaneHighestScoreDates(List<Long> laneHighestScoreDates) {
    this.laneHighestScoreDates = laneHighestScoreDates;
  }

  public List<String> getLaneHighestScoreTeamNames() {
    return laneHighestScoreTeamNames;
  }

  public void setLaneHighestScoreTeamNames(List<String> laneHighestScoreTeamNames) {
    this.laneHighestScoreTeamNames = laneHighestScoreTeamNames;
  }
}
