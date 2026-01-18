package com.antigravity.race.states;

import com.antigravity.race.Race;

public interface IRaceState {
    void enter(Race race);

    void exit(Race race);
}
