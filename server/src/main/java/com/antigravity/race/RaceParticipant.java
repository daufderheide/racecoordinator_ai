package com.antigravity.race;

import com.antigravity.models.Driver;

public class RaceParticipant extends ServerToClientObject {
    private final com.antigravity.models.Driver driver;
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
    }

    public RaceParticipant(com.antigravity.models.Driver driver, String objectId) {
        super(objectId);
        this.driver = driver;
    }

    public Driver getDriver() {
        return driver;
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
