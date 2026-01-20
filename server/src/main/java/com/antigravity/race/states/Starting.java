package com.antigravity.race.states;

public class Starting implements IRaceState {
    private java.util.concurrent.ScheduledExecutorService scheduler;
    private java.util.concurrent.ScheduledFuture<?> timerHandle;

    @Override
    public void enter(com.antigravity.race.Race race) {
        System.out.println("Starting state entered. Countdown initiating.");
        scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);
        final Runnable ticker = new Runnable() {
            int countdown = 50; // 5 seconds * 10 (100ms interval)

            public void run() {
                try {
                    float displayTime = countdown / 10.0f;

                    com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
                            .setTime(displayTime)
                            .build();

                    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
                            .setRaceTime(raceTimeMsg)
                            .build();

                    race.broadcast(raceDataMsg);

                    countdown--;

                    if (countdown < 0) {
                        race.changeState(new Racing());
                    }
                } catch (Exception e) {
                    System.err.println("Error in Starting timer: " + e.getMessage());
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
        System.out.println("Starting state exited.");
    }

    @Override
    public void onLap(int lane, float lapTime) {
        // TODO(aufderheide): Handle false start
        System.out.println("Starting: Ignored onLap - Race not in progress");
    }
}
