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

    @Override
    public void restartHeat(Race race) {
        System.out.println("Paused.restartHeat() called. Resetting current heat.");

        com.antigravity.race.Heat currentHeat = race.getCurrentHeat();
        if (currentHeat != null) {
            // Reset all drivers in the heat
            for (com.antigravity.race.DriverHeatData driverData : currentHeat.getDrivers()) {
                driverData.reset();
            }

            // Reset standings to initial order
            currentHeat.getHeatStandings().reset();

            // Reset race time
            race.resetRaceTime();

            // Broadcast update to client
            java.util.Set<String> sentObjectIds = new java.util.HashSet<>();
            for (com.antigravity.race.RaceParticipant p : race.getDrivers()) {
                sentObjectIds.add(com.antigravity.converters.HeatConverter.PARTICIPANT_PREFIX + p.getObjectId());
            }

            com.antigravity.proto.Race raceProto = com.antigravity.proto.Race.newBuilder()
                    .setCurrentHeat(com.antigravity.converters.HeatConverter.toProto(currentHeat, sentObjectIds))
                    .build();

            race.broadcast(com.antigravity.proto.RaceData.newBuilder()
                    .setRace(raceProto)
                    .build());

            // Also broadcast time reset
            race.broadcast(com.antigravity.proto.RaceData.newBuilder()
                    .setRaceTime(com.antigravity.proto.RaceTime.newBuilder().setTime(0.0f).build())
                    .build());
        }

        race.changeState(new com.antigravity.race.states.NotStarted());
    }

    @Override
    public void skipHeat(Race race) {
        System.out.println("Paused.skipHeat() called. Advancing to next heat.");
        Common.advanceToNextHeat(race);
    }

    @Override
    public void deferHeat(Race race) {
        throw new IllegalStateException("Cannot defer heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void onLap(int lane, double lapTime, int interfaceId) {
        System.out.println("Paused: Ignored onLap - Race not in progress");
    }

    @Override
    public void onCarData(com.antigravity.protocols.CarData carData) {
        System.out.println("Paused: Ignored onCarData - Race not in progress");
    }
}
