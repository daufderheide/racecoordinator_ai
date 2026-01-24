package com.antigravity.race;

import java.util.ArrayList;
import java.util.Collections;

public class DriverHeatData extends ServerToClientObject {
    private RaceParticipant driver;

    private ArrayList<Double> laps = new ArrayList<>();
    private double bestLapTime = 0.0f;
    private double reactionTime = 0.0f;

    public DriverHeatData(RaceParticipant driver) {
        super();
        this.driver = driver;
    }

    public RaceParticipant getDriver() {
        return driver;
    }

    public void addLap(double lapTime) {
        laps.add(lapTime);
        if (bestLapTime == 0.0f || lapTime < bestLapTime) {
            bestLapTime = lapTime;
        }
    }

    public int getLapCount() {
        return laps.size();
    }

    public java.util.List<Double> getLaps() {
        return java.util.Collections.unmodifiableList(laps);
    }

    public double getLastLapTime() {
        if (laps.isEmpty()) {
            return 0.0f;
        }
        return laps.get(laps.size() - 1);
    }

    public double getAverageLapTime() {
        // TODO(aufderheide): Extract the calculation into a utility class
        if (laps.isEmpty()) {
            return 0.0f;
        }
        double sum = 0.0f;
        for (double time : laps) {
            sum += time;
        }
        return sum / laps.size();
    }

    public double getMedianLapTime() {
        // TODO(aufderheide): Extract the calculation into a utility class
        if (laps.isEmpty()) {
            return 0.0f;
        }
        ArrayList<Double> sortedLaps = new ArrayList<>(laps);
        Collections.sort(sortedLaps);
        int middle = sortedLaps.size() / 2;
        if (sortedLaps.size() % 2 == 1) {
            return sortedLaps.get(middle);
        } else {
            return (sortedLaps.get(middle - 1) + sortedLaps.get(middle)) / 2.0f;
        }
    }

    public double getBestLapTime() {
        return bestLapTime;
    }

    public double getReactionTime() {
        return reactionTime;
    }

    public void setReactionTime(double reactionTime) {
        this.reactionTime = reactionTime;
    }

    public double getTotalTime() {
        double sum = 0.0f;
        for (double time : laps) {
            sum += time;
        }
        return sum;
    }

    public void reset() {
        laps.clear();
        bestLapTime = 0.0f;
        reactionTime = 0.0f;
    }
}
