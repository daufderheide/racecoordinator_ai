package com.antigravity.race.handlers;

public class StateHandler {
    private com.antigravity.race.Race race;

    public StateHandler(com.antigravity.race.Race race) {
        this.race = race;
    }

    public void startTimer() {
        race.startProtocols();
    }

    public void stopTimer() {
        race.stopProtocols();
    }
}
