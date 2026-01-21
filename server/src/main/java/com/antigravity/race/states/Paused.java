package com.antigravity.race.states;

import com.antigravity.race.Race;

public class Paused implements IRaceState {

    @Override
    public void enter(Race race) {
        System.out.println("Paused state entered. Race paused.");
    }

    @Override
    public void exit(Race race) {
        System.out.println("Paused state exited.");
    }

    @Override
    public void onLap(int lane, float lapTime) {
        System.out.println("Paused: Ignored onLap - Race not in progress");
    }

    @Override
    public void nextHeat(Race race) {
        throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void start(Race race) {
        System.out.println("Paused.start() called. Resuming from Paused state.");
        race.changeState(new com.antigravity.race.states.Starting());
    }

    @Override
    public void pause(Race race) {
        throw new IllegalStateException("Cannot pause race: Race is already in Paused state.");
    }
}
