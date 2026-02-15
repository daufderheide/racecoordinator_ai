package com.antigravity.race;

import com.antigravity.models.Driver;

public class RaceParticipant extends ServerToClientObject {
    private com.antigravity.models.Driver driver;
    private final com.antigravity.models.Team team;
    private java.util.List<com.antigravity.models.Driver> teamDrivers;

    private int rank;
    private int totalLaps;
    private double totalTime;
    private double bestLapTime;
    private double averageLapTime;
    private double medianLapTime;
    private double rankValue;
    private int seed;

    public RaceParticipant(com.antigravity.models.Driver driver) {
        super();
        this.driver = driver;
        this.team = null;
    }

    public RaceParticipant(com.antigravity.models.Team team) {
        super();
        this.team = team;
        // Create synthetic driver for the team
        this.driver = new com.antigravity.models.Driver(
                team.getName(),
                null, // Nickname
                team.getAvatarUrl(),
                null, null,
                null, null, null, null, null, null,
                team.getEntityId(),
                null);
    }

    public RaceParticipant(com.antigravity.models.Driver driver, String objectId) {
        super(objectId);
        this.driver = driver;
        this.team = null;
    }

    public RaceParticipant(com.antigravity.models.Team team, String objectId) {
        super(objectId);
        this.driver = null;
        this.team = team;
    }

    public com.antigravity.models.Driver getDriver() {
        return driver;
    }

    public com.antigravity.models.Team getTeam() {
        return team;
    }

    public void setTeamDrivers(java.util.List<com.antigravity.models.Driver> teamDrivers) {
        this.teamDrivers = teamDrivers;
    }

    public java.util.List<com.antigravity.models.Driver> getTeamDrivers() {
        return teamDrivers;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public int getTotalLaps() {
        return totalLaps;
    }

    public void setTotalLaps(int totalLaps) {
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

}
