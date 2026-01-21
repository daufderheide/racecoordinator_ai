package com.antigravity.race;

import java.util.ArrayList;
import java.util.List;

import com.antigravity.models.Driver;

public class HeatBuilder {
    public static List<Heat> buildHeats(
            Race race,
            List<RaceParticipant> drivers) {

        int numLanes = race.getTrack().getLanes().size();
        com.antigravity.models.HeatRotationType rotationType = race.getRaceModel().getHeatRotationType();
        if (rotationType == null) {
            rotationType = com.antigravity.models.HeatRotationType.RoundRobin;
        }

        switch (rotationType) {
            case RoundRobin:
                return GetRoundRobinHeats(drivers, numLanes, getRoundRobinRotationSequence(numLanes), false,
                        race.getRaceModel().getRaceScoring());
            case FriendlyRoundRobin:
                return GetRoundRobinHeats(drivers, numLanes, getRoundRobinRotationSequence(numLanes), true,
                        race.getRaceModel().getRaceScoring());
            case EuropeanRoundRobin:
                return GetRoundRobinHeats(drivers, numLanes, getEuroRoundRobinRotationSequence(numLanes), false,
                        race.getRaceModel().getRaceScoring());
            default:
                throw new IllegalArgumentException("Unknown HeatRotationType: " + rotationType);
        }
    }

    private static List<Integer> getRoundRobinRotationSequence(int numLanes) {
        List<Integer> rotationSequence = new ArrayList<>();
        for (int i = 0; i < numLanes; i++) {
            rotationSequence.add((i + 1));
        }
        return rotationSequence;
    }

    private static List<Integer> getEuroRoundRobinRotationSequence(int numLanes) {
        List<Integer> rotationSequence = new ArrayList<>();

        // Odd lanes first (0 based) in incrementing order
        // [1, 3, 5, 7, ..]
        for (int i = 0; i < numLanes; i += 2) {
            rotationSequence.add((i + 1));
        }

        // Even lanes next, in decrementing order
        // [.., 8, 6, 4, 2]
        int evenLane = numLanes;
        if (numLanes % 2 != 0) {
            evenLane = numLanes - 1;
        }
        for (int i = numLanes; i > 1; i -= 2) {
            rotationSequence.add(evenLane);
            evenLane -= 2;
        }
        return rotationSequence;
    }

    private static List<Heat> GetRoundRobinHeats(
            List<RaceParticipant> drivers,
            int numLanes,
            List<Integer> rotationSequence,
            boolean friendly,
            com.antigravity.models.RaceScoring scoring) {
        List<Heat> heatList = new ArrayList<>();

        int numHeats;
        if (drivers.size() > rotationSequence.size()) {
            numHeats = drivers.size();
        } else {
            numHeats = rotationSequence.size();
        }

        for (int h = 0; h < numHeats; h++) {
            List<DriverHeatData> heatDrivers = new ArrayList<>();

            // First put an empty lane everywhere
            for (long laneIdx = 0; laneIdx < numLanes; laneIdx++) {
                heatDrivers.add(new DriverHeatData(new RaceParticipant(Driver.EMPTY_DRIVER)));
            }

            // Now use the rotation sequence to fill in the drivers
            for (int d = 0; d < drivers.size(); d++) {
                int v = (h + d) % numHeats;
                if (v < rotationSequence.size()) {
                    int lane = rotationSequence.get(v);
                    if (lane > 0) {
                        lane--;
                        if (lane < numLanes) {
                            int idx = d;
                            if (friendly) {
                                // Swap the order of the initial group of sitouts so that the
                                // first sit out rotated in is the lowest seed.
                                if (d >= numLanes) {
                                    idx = drivers.size() - (d - numLanes) - 1;
                                }
                            }
                            heatDrivers.set(lane, new DriverHeatData(drivers.get(idx)));
                        }
                    }
                }
            }
            heatList.add(new Heat(h + 1, heatDrivers, scoring));
        }
        return heatList;
    }
}
