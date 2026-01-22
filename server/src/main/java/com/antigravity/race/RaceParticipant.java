package com.antigravity.race;

import com.antigravity.models.Driver;

public class RaceParticipant extends ServerToClientObject {
    private final com.antigravity.models.Driver driver;
    private int rank;
    private int totalLaps;
    private float totalTime;
    private float bestLapTime;
    private float averageLapTime;
    private float medianLapTime;

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

    public float getTotalTime() {
        return totalTime;
    }

    public void setTotalTime(float totalTime) {
        this.totalTime = totalTime;
    }

    public float getBestLapTime() {
        return bestLapTime;
    }

    public void setBestLapTime(float bestLapTime) {
        this.bestLapTime = bestLapTime;
    }

    public float getAverageLapTime() {
        return averageLapTime;
    }

    public void setAverageLapTime(float averageLapTime) {
        this.averageLapTime = averageLapTime;
    }

    public float getMedianLapTime() {
        return medianLapTime;
    }

    public void setMedianLapTime(float medianLapTime) {
        this.medianLapTime = medianLapTime;
    }

}
