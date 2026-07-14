package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import java.util.List;

public class RaceParticipant extends ServerToClientObject implements GapParticipant {

  private Driver driver;
  private Team team;
  private List<Driver> teamDrivers;
  private boolean isTeamParticipant;

  private int rank;
  private double totalLaps;
  private double totalTime;
  private double bestLapTime;
  private double averageLapTime;
  private double medianLapTime;
  private double rankValue;
  private int seed;
  private double fuelLevel = 100.0;
  private double gapLeader;
  private double gapPosition;
  private double gapLeaderF1;
  private double gapPositionF1;
  private int lapsDownLeader;
  private int lapsDownPosition;
  private List<Double> allScoringLaps;

  public RaceParticipant(Driver driver) {
    super();
    this.driver = driver;
    this.team = null;
    this.isTeamParticipant = false;
  }

  public RaceParticipant(Driver driver, Team team) {
    super();
    this.driver = driver;
    this.team = team;
    this.isTeamParticipant = false;
  }

  public RaceParticipant(Team team) {
    super();
    this.team = team;
    this.isTeamParticipant = true;
    // Create synthetic driver for the team
    // Prefix ID with t_ to avoid clashing with real driver IDs in the client cache
    // TODO(aufderheide): Replace this with a builder. There are too many parameters
    // for this to be readable.
    this.driver =
        new Driver(
            team.getName(),
            null, // Nickname
            team.getAvatarUrl(),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "t_" + team.getEntityId(),
            null);
  }

  public RaceParticipant(Driver driver, String objectId) {
    super(objectId);
    this.driver = driver;
    this.team = null;
  }

  public RaceParticipant(Team team, String objectId) {
    super(objectId);
    this.driver = null;
    this.team = team;
  }

  public RaceParticipant() {
    super();
  }

  public Driver getDriver() {
    return driver;
  }

  public void setDriver(Driver driver) {
    this.driver = driver;
  }

  public Team getTeam() {
    return team;
  }

  public void setTeam(Team team) {
    this.team = team;
  }

  public void setTeamDrivers(List<Driver> teamDrivers) {
    this.teamDrivers = teamDrivers;
  }

  public List<Driver> getTeamDrivers() {
    return teamDrivers;
  }

  public boolean isTeamParticipant() {
    return isTeamParticipant;
  }

  public void setTeamParticipant(boolean teamParticipant) {
    isTeamParticipant = teamParticipant;
  }

  public int getRank() {
    return rank;
  }

  public void setRank(int rank) {
    this.rank = rank;
  }

  public double getTotalLaps() {
    return totalLaps;
  }

  public void setTotalLaps(double totalLaps) {
    this.totalLaps = totalLaps;
  }

  public double getTotalTime() {
    return totalTime;
  }

  public void setTotalTime(double totalTime) {
    this.totalTime = totalTime;
  }

  public double getBestLapTime() {
    return bestLapTime;
  }

  public void setBestLapTime(double bestLapTime) {
    this.bestLapTime = bestLapTime;
  }

  public double getAverageLapTime() {
    return averageLapTime;
  }

  public void setAverageLapTime(double averageLapTime) {
    this.averageLapTime = averageLapTime;
  }

  public double getMedianLapTime() {
    return medianLapTime;
  }

  public void setMedianLapTime(double medianLapTime) {
    this.medianLapTime = medianLapTime;
  }

  public double getRankValue() {
    return rankValue;
  }

  public void setRankValue(double rankValue) {
    this.rankValue = rankValue;
  }

  public int getSeed() {
    return seed;
  }

  public void setSeed(int seed) {
    this.seed = seed;
  }

  public double getFuelLevel() {
    return fuelLevel;
  }

  public void setFuelLevel(double fuelLevel) {
    this.fuelLevel = fuelLevel;
  }

  public String getStableId() {
    if (isTeamParticipant && team != null) {
      return "t:" + team.getEntityId();
    }
    if (driver != null) {
      return "d:" + driver.getEntityId();
    }
    // TODO(aufderheide): Is this an error case? What happens if we fallback here?
    return getObjectId(); // Fallback to objectId if both are missing
  }

  @Override
  public double getAdjustedLapCount() {
    return getTotalLaps();
  }

  public void setAllScoringLaps(List<Double> laps) {
    this.allScoringLaps = laps;
  }

  public List<Double> getAllScoringLaps() {
    return allScoringLaps;
  }

  @Override
  public int getPhysicalLapCount() {
    if (allScoringLaps == null) {
      return 0;
    }
    return allScoringLaps.size();
  }

  @Override
  public double getTimeAtLap(int lapIndex) {
    if (allScoringLaps == null || lapIndex <= 0) {
      return 0.0;
    }
    if (lapIndex > allScoringLaps.size()) {
      lapIndex = allScoringLaps.size();
    }
    double sum = 0.0;
    for (int i = 0; i < lapIndex; i++) {
      sum += allScoringLaps.get(i);
    }
    return sum;
  }

  @Override
  public boolean hasNoFullLaps() {
    return getTotalTime() == 0.0;
  }

  @Override
  public void setGapLeader(double gapLeader) {
    this.gapLeader = gapLeader;
  }

  public double getGapLeader() {
    return gapLeader;
  }

  @Override
  public void setGapPosition(double gapPosition) {
    this.gapPosition = gapPosition;
  }

  public double getGapPosition() {
    return gapPosition;
  }

  @Override
  public void setGapLeaderF1(double gapLeaderF1) {
    this.gapLeaderF1 = gapLeaderF1;
  }

  public double getGapLeaderF1() {
    return gapLeaderF1;
  }

  @Override
  public void setGapPositionF1(double gapPositionF1) {
    this.gapPositionF1 = gapPositionF1;
  }

  public double getGapPositionF1() {
    return gapPositionF1;
  }

  @Override
  public void setLapsDownLeader(int lapsDown) {
    this.lapsDownLeader = lapsDown;
  }

  public int getLapsDownLeader() {
    return lapsDownLeader;
  }

  @Override
  public void setLapsDownPosition(int lapsDown) {
    this.lapsDownPosition = lapsDown;
  }

  public int getLapsDownPosition() {
    return lapsDownPosition;
  }
}
