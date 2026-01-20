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
}
