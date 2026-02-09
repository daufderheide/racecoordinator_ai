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
    public void nextHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void start(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot start race: Race is already in Starting state.");
    }

    @Override
    public void pause(com.antigravity.race.Race race) {
        System.out.println("Starting.pause() called. Cancelling start.");
        race.resetRaceTime();
        race.changeState(new NotStarted());
    }

    @Override
    public void restartHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void skipHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot skip heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void deferHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot defer heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void onLap(int lane, double lapTime, int interfaceId) {
        // TODO(aufderheide): Handle false start
        System.out.println("Starting: Ignored onLap - Race not in progress");
    }

    @Override
    public void onCarData(com.antigravity.protocols.CarData carData) {
        // TODO(aufderheide): Handle false start
        System.out.println("Starting: Ignored onCarData - Race not in progress");
    }

}
