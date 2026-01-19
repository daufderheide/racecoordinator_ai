package com.antigravity.handlers;

import com.antigravity.protocols.ProtocolListener;

public class ProtocolHandler implements ProtocolListener {
    private com.antigravity.race.Race race;

    public ProtocolHandler(com.antigravity.race.Race race) {
        this.race = race;
    }

    @Override
    public void onLap(int lane, float lapTime) {
        System.out.println("Race: Received onLap for lane " + lane + " time " + lapTime);

        if (!race.isRacing()) {
            System.out.println("Race: Ignored onLap - Race not in progress");
            return;
        }

        com.antigravity.race.Heat currentHeat = race.getCurrentHeat();
        if (currentHeat == null) {
            System.out.println("Race: Ignored onLap - No current heat");
            return;
        }

        java.util.List<com.antigravity.race.DriverHeatData> drivers = currentHeat.getDrivers();
        if (lane < 0 || lane >= drivers.size()) {
            System.out.println("Race: Ignored onLap - Invalid lane " + lane);
            return;
        }

        com.antigravity.race.DriverHeatData driverData = drivers.get(lane);
        if (driverData == null || driverData.getDriver() == null || driverData.getDriver().getDriver() == null
                || driverData.getDriver().getDriver().getEntityId() == null) {
            System.out.println("Race: Ignored onLap - Invalid driver/entity");
            return;
        }

        driverData.addLap(lapTime);

        com.antigravity.proto.Lap lapMsg = com.antigravity.proto.Lap.newBuilder()
                .setLane(lane)
                .setLapTime(lapTime)
                .setLapNumber(driverData.getLapCount())
                .setAverageLapTime(driverData.getAverageLapTime())
                .setMedianLapTime(driverData.getMedianLapTime())
                .setBestLapTime(driverData.getBestLapTime())
                .build();

        com.antigravity.proto.RaceData lapDataMsg = com.antigravity.proto.RaceData.newBuilder()
                .setLap(lapMsg)
                .build();

        race.broadcast(lapDataMsg);
    }
}
