package com.antigravity.race;

import java.util.ArrayList;
import java.util.Collections;

public class DriverHeatData extends ServerToClientObject {
    private RaceParticipant driver;

    private ArrayList<Float> laps = new ArrayList<>();
    private float bestLapTime = 0.0f;
    private float reactionTime = 0.0f;

    public DriverHeatData(RaceParticipant driver) {
        super();
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
        // TODO(aufderheide): Extract the calculation into a utility class
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
        // TODO(aufderheide): Extract the calculation into a utility class
        if (laps.isEmpty()) {
            return 0.0f;
        }
        ArrayList<Float> sortedLaps = new ArrayList<>(laps);
        Collections.sort(sortedLaps);
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

    public float getReactionTime() {
        return reactionTime;
    }

    public void setReactionTime(float reactionTime) {
        this.reactionTime = reactionTime;
    }

    public float getTotalTime() {
        float sum = 0.0f;
        for (float time : laps) {
            sum += time;
        }
        return sum;
    }
}
