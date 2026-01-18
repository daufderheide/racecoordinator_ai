package com.antigravity.race.states;

public class Racing implements IRaceState {
    private java.util.concurrent.ScheduledExecutorService scheduler;
    private java.util.concurrent.ScheduledFuture<?> timerHandle;

    @Override
    public void enter(com.antigravity.race.Race race) {
        System.out.println("Racing state entered. Race started!");
        race.startProtocols();
        scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);
        final Runnable ticker = new Runnable() {
            long lastTime = 0;

            public void run() {
                try {
                    long now = System.nanoTime();
                    if (lastTime == 0) {
                        lastTime = now;
                        return;
                    }

                    float delta = (now - lastTime) / 1_000_000_000.0f;
                    lastTime = now;
                    race.addRaceTime(delta);

                    // Broadcast RaceTime message wrapped in RaceData
                    com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
                            .setTime(race.getSafeRaceTime())
                            .build();

                    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
                            .setRaceTime(raceTimeMsg)
                            .build();

                    race.broadcast(raceDataMsg);

                } catch (Exception e) {
                    System.err.println("Error in Racing timer: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        };
        timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    @Override
    public void exit(com.antigravity.race.Race race) {
        if (timerHandle != null) {
            timerHandle.cancel(true);
        }
        if (scheduler != null) {
            scheduler.shutdown();
        }
        race.stopProtocols();
        System.out.println("Racing state exited.");
    }
}
