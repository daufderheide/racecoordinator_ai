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

    @Override
    public void onLap(int lane, float lapTime) {
        System.out.println("NotStarted: Ignored onLap - Race not in progress");
    }

    @Override
    public void nextHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void start(com.antigravity.race.Race race) {
        System.out.println("NotStarted.start() called. Starting new race.");
        race.resetRaceTime();
        race.changeState(new com.antigravity.race.states.Starting());
    }

    @Override
    public void pause(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
    }

    @Override
    public void restartHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
    }
}
