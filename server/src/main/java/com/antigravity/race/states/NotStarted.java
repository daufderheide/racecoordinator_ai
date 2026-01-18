package com.antigravity.race.states;

public class NotStarted implements IRaceState {
    private java.util.concurrent.ScheduledExecutorService scheduler;
    private java.util.concurrent.ScheduledFuture<?> timerHandle;

    @Override
    public void enter(com.antigravity.race.Race race) {
        scheduler = java.util.concurrent.Executors.newScheduledThreadPool(1);
        final Runnable ticker = new Runnable() {
            float currentTime = 0.0f;
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
                    currentTime += delta;

                    // Broadcast RaceTime message
                    com.antigravity.proto.RaceTime msg = com.antigravity.proto.RaceTime.newBuilder()
                            .setTime(currentTime)
                            .build();
                    race.broadcast(msg);
                } catch (Exception e) {
                    System.err.println("Error in timer: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        };
        timerHandle = scheduler.scheduleAtFixedRate(ticker, 0, 100, java.util.concurrent.TimeUnit.MILLISECONDS);
        System.out.println("NotStarted state entered. Timer started.");
    }

    @Override
    public void exit(com.antigravity.race.Race race) {
        if (timerHandle != null) {
            timerHandle.cancel(true);
        }
        if (scheduler != null) {
            scheduler.shutdown();
        }
        System.out.println("NotStarted state exited. Timer stopped.");
    }
}
