package com.antigravity.race.states;

import com.antigravity.race.Race;

public interface IRaceState {
    void enter(Race race);

    void exit(Race race);

    // From the protocol listener
    void onLap(int lane, float lapTime);
}
