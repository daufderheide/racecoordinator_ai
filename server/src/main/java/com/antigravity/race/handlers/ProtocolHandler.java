package com.antigravity.race.handlers;

import com.antigravity.protocols.ProtocolListener;

public class ProtocolHandler implements ProtocolListener {
    private com.antigravity.race.Race race;

    public ProtocolHandler(com.antigravity.race.Race race) {
        this.race = race;
    }

    @Override
    public void onLap(int lane, float lapTime) {
        System.out.println("Race: Received onLap for lane " + lane + " time " + lapTime);
        com.antigravity.proto.Lap lapMsg = com.antigravity.proto.Lap.newBuilder()
                .setLane(lane)
                .setLapTime(lapTime)
                .build();

        com.antigravity.proto.RaceData lapDataMsg = com.antigravity.proto.RaceData.newBuilder()
                .setLap(lapMsg)
                .build();

        race.broadcast(lapDataMsg);
    }
}
