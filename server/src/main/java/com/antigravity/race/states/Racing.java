package com.antigravity.race.states;

public class Racing implements IRaceState {
    private java.util.concurrent.ScheduledExecutorService scheduler;
    private java.util.concurrent.ScheduledFuture<?> timerHandle;

    private com.antigravity.race.Race race;

    @Override
    public void enter(com.antigravity.race.Race race) {
        System.out.println("Racing state entered. Race started!");
        this.race = race;

        com.antigravity.models.RaceScoring scoring = race.getRaceModel().getRaceScoring();
        if (scoring != null && scoring.getFinishMethod() == com.antigravity.models.RaceScoring.FinishMethod.Timed) {
            // If starting fresh (time is 0), set it to finish value.
            // If resuming (time > 0), assume it's already set.
            if (race.getRaceTime() == 0) {
                race.addRaceTime((float) scoring.getFinishValue());
            }
        }

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

                    com.antigravity.models.RaceScoring scoring = race.getRaceModel().getRaceScoring();
                    boolean isTimed = scoring != null
                            && scoring.getFinishMethod() == com.antigravity.models.RaceScoring.FinishMethod.Timed;

                    if (isTimed) {
                        race.addRaceTime(-delta);
                    } else {
                        race.addRaceTime(delta);
                    }

                    // Check finish conditions
                    boolean finished = false;
                    if (scoring != null) {
                        if (isTimed) {
                            if (race.getRaceTime() <= 0) {
                                race.resetRaceTime(); // Snap to 0? Or keep negative? Usually 0.
                                finished = true;
                            }
                        } else {
                            // Lap based
                            long limit = scoring.getFinishValue();
                            for (com.antigravity.race.DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
                                if (driver.getLapCount() >= limit) {
                                    finished = true;
                                    break;
                                }
                            }
                        }
                    }

                    // Broadcast RaceTime message wrapped in RaceData
                    // Ensure we don't send negative time for display if finished
                    float displayTime = Math.max(0, race.getRaceTime());

                    com.antigravity.proto.RaceTime raceTimeMsg = com.antigravity.proto.RaceTime.newBuilder()
                            .setTime(displayTime)
                            .build();

                    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
                            .setRaceTime(raceTimeMsg)
                            .build();

                    race.broadcast(raceDataMsg);

                    if (finished) {
                        if (race.isLastHeat()) {
                            race.changeState(new RaceOver());
                        } else {
                            race.changeState(new HeatOver());
                        }
                    }

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

    @Override
    public void onLap(int lane, float lapTime) {
        System.out.println("Race: Received onLap for lane " + lane + " time " + lapTime);

        if (!this.race.isRacing()) {
            System.out.println("Race: Ignored onLap - Race not in progress");
            return;
        }

        com.antigravity.race.Heat currentHeat = this.race.getCurrentHeat();
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

        if (handleReactionTime(driverData, lapTime, lane)) {
            return;
        }

        handleLapTime(driverData, lapTime);

        // Check for finish condition immediately after a lap (mainly for Lap based
        // races)
        com.antigravity.models.RaceScoring scoring = race.getRaceModel().getRaceScoring();
        if (scoring != null && scoring.getFinishMethod() == com.antigravity.models.RaceScoring.FinishMethod.Lap) {
            long limit = scoring.getFinishValue();
            if (driverData.getLapCount() >= limit) {
                if (race.isLastHeat()) {
                    race.changeState(new RaceOver());
                } else {
                    race.changeState(new HeatOver());
                }
            }
        }
    }

    private boolean handleReactionTime(com.antigravity.race.DriverHeatData driverData, float lapTime, int lane) {
        if (driverData.getReactionTime() == 0.0f) {
            driverData.setReactionTime(lapTime);

            com.antigravity.proto.ReactionTime rtMsg = com.antigravity.proto.ReactionTime.newBuilder()
                    .setObjectId(driverData.getObjectId())
                    .setReactionTime(lapTime)
                    .build();

            com.antigravity.proto.RaceData rtDataMsg = com.antigravity.proto.RaceData.newBuilder()
                    .setReactionTime(rtMsg)
                    .build();

            this.race.broadcast(rtDataMsg);
            System.out.println("Race: Broadcasted reaction time for lane " + lane + ": " + lapTime);
            return true;
        }
        return false;
    }

    private void handleLapTime(com.antigravity.race.DriverHeatData driverData, float lapTime) {
        float effectiveLapTime = lapTime;
        if (driverData.getLapCount() == 0) {
            effectiveLapTime += driverData.getReactionTime();
        }

        driverData.addLap(effectiveLapTime);

        com.antigravity.proto.Lap lapMsg = com.antigravity.proto.Lap.newBuilder()
                .setObjectId(driverData.getObjectId())
                .setLapTime(effectiveLapTime)
                .setLapNumber(driverData.getLapCount())
                .setAverageLapTime(driverData.getAverageLapTime())
                .setMedianLapTime(driverData.getMedianLapTime())
                .setBestLapTime(driverData.getBestLapTime())
                .build();

        com.antigravity.proto.RaceData lapDataMsg = com.antigravity.proto.RaceData.newBuilder()
                .setLap(lapMsg)
                .build();

        this.race.broadcast(lapDataMsg);

        com.antigravity.proto.StandingsUpdate standingsUpdate = this.race.getCurrentHeat().getHeatStandings().onLap(0,
                effectiveLapTime);
        if (standingsUpdate != null) {
            com.antigravity.proto.RaceData standingsDataMsg = com.antigravity.proto.RaceData.newBuilder()
                    .setStandingsUpdate(standingsUpdate)
                    .build();
            this.race.broadcast(standingsDataMsg);
        }
    }

    @Override
    public void nextHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot move to next heat from state: " + this.getClass().getSimpleName());
    }

    @Override
    public void start(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot start race: Race is already in Racing state.");
    }

    @Override
    public void pause(com.antigravity.race.Race race) {
        System.out.println("Racing.pause() called. Pausing race.");
        race.changeState(new com.antigravity.race.states.Paused());
    }

    @Override
    public void restartHeat(com.antigravity.race.Race race) {
        throw new IllegalStateException("Cannot restart heat from state: " + this.getClass().getSimpleName());
    }
}
