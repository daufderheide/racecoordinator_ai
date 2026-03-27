package com.antigravity.race;

import static org.mockito.Mockito.mock;

public class ConstructorTest {
    public void test() {
        com.antigravity.models.Race model = mock(com.antigravity.models.Race.class);
        java.util.List<com.antigravity.race.RaceParticipant> drivers = new java.util.ArrayList<>();
        com.antigravity.models.Track track = mock(com.antigravity.models.Track.class);
        com.antigravity.race.Race race = new com.antigravity.race.Race(model, drivers, track, true, 0.0d, 0.0d);
    }
}
