package com.antigravity.race.states;

public class NotStarted implements IRaceState {

    @Override
    public void enter(com.antigravity.race.Race race) {
        System.out.println("NotStarted state entered.");
        // Broadcast 0 time to reset client
        com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
                .setTime(0.0f)
                .build();

        com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
                .setRaceTime(raceTimeMsg)
                .build();

        race.broadcast(raceDataMsg);
    }

    @Override
    public void exit(com.antigravity.race.Race race) {
        System.out.println("NotStarted state exited.");
    }
}
