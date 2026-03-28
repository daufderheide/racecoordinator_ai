package com.antigravity.race.states;

import java.util.Set;
import com.antigravity.race.HeatExecutionManager;

public class Racing implements IRaceState {
  private java.util.concurrent.ScheduledExecutorService scheduler;
  private java.util.concurrent.ScheduledFuture<?> timerHandle;

  private com.antigravity.race.Race race;
  private HeatExecutionManager executionManager;

  @Override
  public void enter(com.antigravity.race.Race race) {
    this.race = race;
    this.executionManager = race.getHeatExecutionManager();

    if (race.isDemoMode()) {
      race.setMainPower(true);
    }

    com.antigravity.models.HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring != null && scoring.getFinishMethod() == com.antigravity.models.HeatScoring.FinishMethod.Timed) {
      if (race.getRaceTime() == 0) {
        race.addRaceTime((float) scoring.getFinishValue());
      }
    }

    race.setHasRacedInCurrentHeat(true);

    int laneCount = 0;
    if (race.getTrack() != null && race.getTrack().getLanes() != null) {
      laneCount = race.getTrack().getLanes().size();
      for (int i = 0; i < laneCount; i++) {
        race.setLanePower(true, i);
      }
    }

    System.out.println("Racing: Digital fuel enabled: " + executionManager.isDigitalFuelEnabled());
    System.out.println("Racing: Analog fuel enabled: " + executionManager.isAnalogFuelEnabled());

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

          com.antigravity.models.HeatScoring scoring = race.getRaceModel().getHeatScoring();
          boolean isTimed = scoring != null
              && scoring.getFinishMethod() == com.antigravity.models.HeatScoring.FinishMethod.Timed;

          if (isTimed) {
            race.addRaceTime(-delta);
          } else {
            race.addRaceTime(delta);
          }

          // Handle refueling and fuel usage via the execution manager
          executionManager.processTicker(delta);

          // Check finish conditions
          boolean allFinished = false;
          com.antigravity.models.HeatScoring.AllowFinish allowFinish = scoring != null
              ? scoring.getAllowFinish()
              : com.antigravity.models.HeatScoring.AllowFinish.None;

          if (scoring != null) {
            Set<Integer> finishedLanes = executionManager.getFinishedLanes();
            if (isTimed) {
              if (race.getRaceTime() <= 0) {
                race.resetRaceTime();
                if (allowFinish == com.antigravity.models.HeatScoring.AllowFinish.None) {
                  allFinished = true;
                } else {
                  // Timed race with Allow Finish: Heat ends when everyone has crossed the line
                  // once after time expired
                  if (finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
                    allFinished = true;
                  }
                }
              }
            } else {
              // Lap based
              long limit = scoring.getFinishValue();
              if (allowFinish == com.antigravity.models.HeatScoring.AllowFinish.None) {
                for (com.antigravity.race.DriverHeatData driver : race.getCurrentHeat().getDrivers()) {
                  if (driver.getLapCount() >= limit) {
                    allFinished = true;
                    break;
                  }
                }
              } else {
                // Lap based with Allow Finish: Heat ends when everyone has reached the lap
                // limit
                if (finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
                  allFinished = true;
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

          if (allFinished) {
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
    System.out.println("Racing.restartHeat() called. Resetting current heat.");
    race.resetCurrentHeat();
    race.changeState(new com.antigravity.race.states.NotStarted());
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
    executionManager.onLap(lane, lapTime, interfaceId, false, true);
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    executionManager.onSegment(lane, segmentTime, interfaceId);
  }

  @Override
  public void onCarData(com.antigravity.protocols.CarData carData) {
    executionManager.handlePitDetection(carData);
    if (executionManager.isDigitalFuelEnabled()) {
      executionManager.handleDigitalFuelCarData(carData);
    }

    int lane = carData.getLane();
    // Broadcast the CarData to clients
    com.antigravity.proto.CarData.Builder dataBuilder = com.antigravity.proto.CarData.newBuilder()
        .setLane(carData.getLane())
        .setControllerThrottlePct(carData.getControllerThrottlePCT())
        .setCarThrottlePct(carData.getCarThrottlePCT())
        .setLocation(carData.getLocation().getValue())
        .setLocationId(carData.getLocationId())
        .setIsRefueling(executionManager.getIsRefueling()[lane]);

    if (race.getCurrentHeat() != null && race.getCurrentHeat().getDrivers() != null) {
      if (lane >= 0 && lane < race.getCurrentHeat().getDrivers().size()) {
        com.antigravity.race.DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
        if (driverData != null) {
          driverData.setCurrentLocation(carData.getLocation());
          if (driverData.getDriver() != null) {
            dataBuilder.setFuelLevel(driverData.getDriver().getFuelLevel());
          }
        }
      }
    }

    com.antigravity.proto.CarData protoCarData = dataBuilder.build();
    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setCarData(protoCarData)
        .build();

    race.broadcast(raceDataMsg);
  }

  @Override
  public void onCallbutton(com.antigravity.race.Race race, int lane) {
    System.out.println("Racing.onCallbutton() called. Pausing race.");
    pause(race);
  }
}
