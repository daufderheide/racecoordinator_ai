package com.antigravity.race;

public class DriverHeatData {
    private RaceParticipant driver;

    private java.util.List<Float> laps = new java.util.ArrayList<>();

    private float bestLapTime = 0.0f;

    public DriverHeatData(RaceParticipant driver) {
        this.driver = driver;
    }

    public RaceParticipant getDriver() {
        return driver;
    }

    public void addLap(float lapTime) {
        laps.add(lapTime);
        if (bestLapTime == 0.0f || lapTime < bestLapTime) {
            bestLapTime = lapTime;
        }
    }

    public int getLapCount() {
        return laps.size();
    }

    public float getLastLapTime() {
        if (laps.isEmpty()) {
            return 0.0f;
        }
        return laps.get(laps.size() - 1);
    }

    public float getAverageLapTime() {
        if (laps.isEmpty()) {
            return 0.0f;
        }
        float sum = 0.0f;
        for (float time : laps) {
            sum += time;
        }
        return sum / laps.size();
    }

    public float getMedianLapTime() {
        if (laps.isEmpty()) {
            return 0.0f;
        }
        java.util.List<Float> sortedLaps = new java.util.ArrayList<>(laps);
        java.util.Collections.sort(sortedLaps);
        int middle = sortedLaps.size() / 2;
        if (sortedLaps.size() % 2 == 1) {
            return sortedLaps.get(middle);
        } else {
            return (sortedLaps.get(middle - 1) + sortedLaps.get(middle)) / 2.0f;
        }
    }

    public float getBestLapTime() {
        return bestLapTime;
    }
}
