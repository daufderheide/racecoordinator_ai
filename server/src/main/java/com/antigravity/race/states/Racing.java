package com.antigravity.race.states;

import java.util.Set;
import java.util.HashSet;
import java.util.List;

public class Racing implements IRaceState {
  private java.util.concurrent.ScheduledExecutorService scheduler;
  private java.util.concurrent.ScheduledFuture<?> timerHandle;

  private com.antigravity.race.Race race;
  private Set<Integer> finishedLanes = new HashSet<>();

  private double[] refuelDelayRemaining;
  private boolean[] isRefueling;
  private double[] accumulatedRefuelTime;

  @Override
  public void enter(com.antigravity.race.Race race) {
    System.out.println("Racing state entered. Race started!");
    this.race = race;
    race.setMainPower(true);

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
    refuelDelayRemaining = new double[laneCount];
    isRefueling = new boolean[laneCount];
    accumulatedRefuelTime = new double[laneCount];
    for (int i = 0; i < laneCount; i++) {
      refuelDelayRemaining[i] = -1.0;
      isRefueling[i] = false;
      accumulatedRefuelTime[i] = 0.0;
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

          com.antigravity.models.HeatScoring scoring = race.getRaceModel().getHeatScoring();
          boolean isTimed = scoring != null
              && scoring.getFinishMethod() == com.antigravity.models.HeatScoring.FinishMethod.Timed;

          if (isTimed) {
            race.addRaceTime(-delta);
          } else {
            race.addRaceTime(delta);
          }

          // Handle refueling
          handleRefueling(delta);

          // Check finish conditions
          boolean allFinished = false;
          com.antigravity.models.HeatScoring.AllowFinish allowFinish = scoring != null
              ? scoring.getAllowFinish()
              : com.antigravity.models.HeatScoring.AllowFinish.None;

          if (scoring != null) {
            if (isTimed) {
              if (race.getRaceTime() <= 0) {
                race.resetRaceTime();
                if (allowFinish == com.antigravity.models.HeatScoring.AllowFinish.None) {
                  allFinished = true;
                } else {
                  // Timed race with Allow Finish: Heat ends when everyone has crossed the line
                  // once after time expired
                  if (finishedLanes.size() >= race.getCurrentHeat().getDrivers().size()) {
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
                if (finishedLanes.size() >= race.getCurrentHeat().getDrivers().size()) {
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

  private void handleRefueling(float delta) {
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (isAnalogFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getFuelOptions();
    } else if (isDigitalFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions == null) {
      return;
    }

    List<com.antigravity.race.DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    for (int i = 0; i < drivers.size(); i++) {
      if (finishedLanes.contains(i))
        continue;

      com.antigravity.race.DriverHeatData driverData = drivers.get(i);
      com.antigravity.race.RaceParticipant participant = driverData.getDriver();

      if (refuelDelayRemaining[i] > 0) {
        accumulatedRefuelTime[i] += delta;
        refuelDelayRemaining[i] -= delta;
        if (refuelDelayRemaining[i] <= 0) {
          refuelDelayRemaining[i] = 0;
          isRefueling[i] = true;
          System.out.println("Racing: Lane " + i + " starting to refuel after delay.");
        }
      }

      if (isRefueling[i]) {
        accumulatedRefuelTime[i] += delta;
        double currentFuel = participant.getFuelLevel();
        double capacity = fuelOptions.getCapacity();

        if (currentFuel < capacity) {
          double newFuel = Math.min(capacity, currentFuel + fuelOptions.getRefuelRate() * delta);
          participant.setFuelLevel(newFuel);

          // Broadcast fuel update using CarData instead of Lap
          com.antigravity.proto.CarData fuelMsg = com.antigravity.proto.CarData.newBuilder()
              .setLane(i)
              .setFuelLevel(newFuel)
              .setIsRefueling(true)
              .build();

          com.antigravity.proto.RaceData fuelDataMsg = com.antigravity.proto.RaceData.newBuilder()
              .setCarData(fuelMsg)
              .build();

          race.broadcast(fuelDataMsg);

          if (newFuel >= capacity) {
            isRefueling[i] = false;
            System.out.println("Racing: Lane " + i + " reached full fuel capacity.");
          }
        } else {
          isRefueling[i] = false;
        }
      }
    }
  }

  private boolean isAnalogFuelEnabled() {
    if (race.getTrack() == null || race.getTrack().hasDigitalFuel()) {
      // No track or the track uses digital fuel.
      return false;
    }

    com.antigravity.models.AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      // Analog fuel is not enabled.
      return false;
    }

    return true;
  }

  private boolean isDigitalFuelEnabled() {
    if (race.getTrack() == null || !race.getTrack().hasDigitalFuel()) {
      // No track or the track does not use digital fuel.
      return false;
    }

    com.antigravity.models.DigitalFuelOptions fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      // Digital fuel is not enabled.
      return false;
    }

    return true;
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

  private com.antigravity.race.DriverHeatData validateInput(int lane) {
    if (finishedLanes.contains(lane)) {
      System.out.println("Race: Ignored onLap/onSegment - Driver on lane " + lane + " already finished");
      return null;
    }

    com.antigravity.models.AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    if (fuelOptions != null && fuelOptions.isEnabled()) {
      com.antigravity.race.Heat heat = this.race.getCurrentHeat();
      if (heat != null && lane >= 0 && lane < heat.getDrivers().size()) {
        com.antigravity.race.DriverHeatData driverData = heat.getDrivers().get(lane);
        if (driverData.getDriver().getFuelLevel() <= 0) {
          System.out.println("Race: Ignored onLap/onSegment - Driver on lane " + lane + " is out of fuel");
          return null;
        }
      }
    }

    com.antigravity.race.Heat currentHeat = this.race.getCurrentHeat();
    if (currentHeat == null) {
      System.out.println("Race: Ignored onLap/onSegment - No current heat");
      return null;
    }

    java.util.List<com.antigravity.race.DriverHeatData> drivers = currentHeat.getDrivers();
    if (lane < 0 || lane >= drivers.size()) {
      System.out.println("Race: Ignored onLap/onSegment - Invalid lane " + lane);
      return null;
    }

    com.antigravity.race.DriverHeatData driverData = drivers.get(lane);
    if (driverData == null || driverData.getDriver() == null || driverData.getDriver().getDriver() == null
        || driverData.getDriver().getDriver().getEntityId() == null) {
      System.out.println("Race: Ignored onLap/onSegment - Invalid driver/entity");
      return null;
    }
    return driverData;
  }

  @Override
  public void onLap(int lane, double lapTime, int interfaceId) {
    System.out.println("Race: Received onLap for lane " + lane + " time " + lapTime);

    com.antigravity.race.DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    if (handleReactionTime(driverData, lapTime, lane, interfaceId)) {
      return;
    }

    double minLapTime = this.race.getRaceModel().getMinLapTime();
    if (minLapTime > 0) {
      driverData.addPendingLapTime(lapTime);
      if (driverData.getPendingLapTime() < minLapTime) {
        System.out.println("Race: Lane " + lane + " lap time " + lapTime
            + " is below min " + minLapTime + ". Accumulated: " + driverData.getPendingLapTime());
        return;
      }
      double finalLapTime = driverData.getPendingLapTime();
      driverData.setPendingLapTime(0.0);
      handleLapTime(driverData, finalLapTime, lane, interfaceId);
    } else {
      handleLapTime(driverData, lapTime, lane, interfaceId);
    }

    // Check for finish condition immediately after a lap
    com.antigravity.models.HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring != null) {
      com.antigravity.models.HeatScoring.AllowFinish allowFinish = scoring.getAllowFinish();
      boolean isTimed = scoring.getFinishMethod() == com.antigravity.models.HeatScoring.FinishMethod.Timed;
      boolean driverFinished = false;

      if (isTimed) {
        if (race.getRaceTime() <= 0) {
          driverFinished = true;
        }
      } else {
        if (driverData.getLapCount() >= scoring.getFinishValue()) {
          driverFinished = true;
        }
      }

      if (driverFinished) {
        finishedLanes.add(lane);
        System.out
            .println("Racing: Driver " + driverData.getDriver().getDriver().getName() + " finished on lane "
                + lane + " (" + driverData.getLapCount() + " laps)");

        if (allowFinish == com.antigravity.models.HeatScoring.AllowFinish.None
            || finishedLanes.size() >= race.getCurrentHeat().getDrivers().size()) {
          // Heat ends
          if (race.isLastHeat()) {
            race.changeState(new RaceOver());
          } else {
            race.changeState(new HeatOver());
          }
        } else {
          // Other drivers still racing so turn off power to this lane
          race.setLanePower(false, lane);
        }
      }
    }
  }

  private boolean handleReactionTime(com.antigravity.race.DriverHeatData driverData, double lapTime, int lane,
      int interfaceId) {
    if (driverData.getReactionTime() == 0.0f) {
      driverData.setReactionTime(lapTime);

      com.antigravity.proto.ReactionTime rtMsg = com.antigravity.proto.ReactionTime.newBuilder()
          .setObjectId(driverData.getObjectId())
          .setReactionTime(lapTime)
          .setInterfaceId(interfaceId)
          .build();

      com.antigravity.proto.RaceData rtDataMsg = com.antigravity.proto.RaceData.newBuilder()
          .setReactionTime(rtMsg)
          .build();

      this.race.broadcast(rtDataMsg);
      System.out.println("Race: Broadcasted reaction time for lane " + lane + ": " + lapTime);

      com.antigravity.proto.StandingsUpdate standingsUpdate = this.race.getCurrentHeat().getHeatStandings()
          .updateStandings();
      if (standingsUpdate != null) {
        com.antigravity.proto.RaceData standingsDataMsg = com.antigravity.proto.RaceData.newBuilder()
            .setStandingsUpdate(standingsUpdate)
            .build();
        this.race.broadcast(standingsDataMsg);
      }

      return true;
    }
    return false;
  }

  private void handleLapTime(com.antigravity.race.DriverHeatData driverData, double lapTime, int lane,
      int interfaceId) {
    double effectiveLapTime = lapTime;
    if (driverData.getLapCount() == 0) {
      effectiveLapTime += driverData.getReactionTime();
    }

    driverData.addLap(effectiveLapTime);

    // Handle analog fuel usage, but exclude reaction time as it could be extremely
    // high if the driver has technical issues at the start of the heat.
    handleAnalogFuelLapTime(driverData, effectiveLapTime - driverData.getReactionTime(), lane);

    com.antigravity.proto.Lap lapMsg = com.antigravity.proto.Lap.newBuilder()
        .setObjectId(driverData.getObjectId())
        .setLapTime(effectiveLapTime)
        .setLapNumber(driverData.getLapCount())
        .setAverageLapTime(driverData.getAverageLapTime())
        .setMedianLapTime(driverData.getMedianLapTime())
        .setBestLapTime(driverData.getBestLapTime())
        .setInterfaceId(interfaceId)
        .setDriverId(driverData.getActualDriver() != null ? driverData.getActualDriver().getEntityId() : "")
        .setFuelLevel(driverData.getDriver().getFuelLevel())
        .build();

    com.antigravity.proto.RaceData lapDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setLap(lapMsg)
        .build();

    this.race.broadcast(lapDataMsg);

    com.antigravity.proto.StandingsUpdate standingsUpdate = this.race.getCurrentHeat().getHeatStandings().onLap(
        lane,
        effectiveLapTime);
    if (standingsUpdate != null) {
      com.antigravity.proto.RaceData standingsDataMsg = com.antigravity.proto.RaceData.newBuilder()
          .setStandingsUpdate(standingsUpdate)
          .build();
      this.race.broadcast(standingsDataMsg);
    }

    this.race.updateAndBroadcastOverallStandings();
  }

  private void handleAnalogFuelLapTime(com.antigravity.race.DriverHeatData driverData, double lapTime, int lane) {
    if (!isAnalogFuelEnabled()) {
      return;
    }

    com.antigravity.models.AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    double lapFuelUsed = 0.0;
    double usageRate = fuelOptions.getUsageRate();

    double racingTime = Math.max(0.1, lapTime - accumulatedRefuelTime[lane]);
    accumulatedRefuelTime[lane] = 0.0; // reset for next lap

    // Fuel usage is proportional to the lap time. Faster laps use more
    // fuel than slower laps. And quadratic and cubic usage use more
    // the faster the lap is.
    switch (fuelOptions.getUsageType()) {
      case LINEAR:
        double refL = Math.max(0.1, fuelOptions.getReferenceTime());
        double x1 = refL * 2.0;
        double y1 = usageRate / 2.0;
        double x2 = refL;
        double y2 = usageRate;
        double m = (y2 - y1) / (x2 - x1);
        double b = y1 - m * x1;
        lapFuelUsed = m * racingTime + b;
        break;
      case QUADRATIC:
        double refQ = Math.max(0.1, fuelOptions.getReferenceTime());
        double safeTimeQ = Math.max(0.1, racingTime);
        lapFuelUsed = usageRate * (refQ * refQ) / (safeTimeQ * safeTimeQ);
        break;
      case CUBIC:
        double refC = Math.max(0.1, fuelOptions.getReferenceTime());
        double safeTimeC = Math.max(0.1, racingTime);
        lapFuelUsed = usageRate * (refC * refC * refC) / (safeTimeC * safeTimeC * safeTimeC);
        break;
    }

    if (Double.isNaN(lapFuelUsed) || Double.isInfinite(lapFuelUsed)) {
      lapFuelUsed = 0.0;
    }
    lapFuelUsed = Math.max(0, lapFuelUsed);

    double currentFuel = driverData.getDriver().getFuelLevel();
    double newFuel = Math.max(0, currentFuel - lapFuelUsed);
    driverData.getDriver().setFuelLevel(newFuel);

    System.out.println("Race: Lane " + lane + " fuel level: " + newFuel + " (used " + lapFuelUsed + ")");

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      System.out.println("Race: Lane " + lane + " out of fuel. Turning off power.");
      this.race.setLanePower(false, lane);
    }
  }

  @Override
  public void onCarData(com.antigravity.protocols.CarData carData) {
    if (carData.getLocation() != carData.getLastLocation()) {
      System.out.println("Race: Lane " + carData.getLane() + " location changed from " + carData.getLastLocation()
          + " to " + carData.getLocation());
    }

    handlePitDetection(carData);
    handleDigitalFuelCarData(carData);

    int lane = carData.getLane();
    // Broadcast the CarData to clients
    com.antigravity.proto.CarData.Builder dataBuilder = com.antigravity.proto.CarData.newBuilder()
        .setLane(carData.getLane())
        .setControllerThrottlePct(carData.getControllerThrottlePCT())
        .setCarThrottlePct(carData.getCarThrottlePCT())
        .setLocation(carData.getLocation().getValue())
        .setLocationId(carData.getLocationId())
        .setIsRefueling(isRefueling[lane]);

    if (race.getCurrentHeat() != null && race.getCurrentHeat().getDrivers() != null) {
      if (lane >= 0 && lane < race.getCurrentHeat().getDrivers().size()) {
        com.antigravity.race.DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
        if (driverData != null && driverData.getDriver() != null) {
          dataBuilder.setFuelLevel(driverData.getDriver().getFuelLevel());
        }
      }
    }

    com.antigravity.proto.CarData protoCarData = dataBuilder.build();
    com.antigravity.proto.RaceData raceDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setCarData(protoCarData)
        .build();

    race.broadcast(raceDataMsg);

    System.out.println("Race: Received onCarData for lane " + carData.getLane() + " time " + carData.getTime());
  }

  private void handlePitDetection(com.antigravity.protocols.CarData carData) {
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (isAnalogFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getFuelOptions();
    } else if (isDigitalFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions == null) {
      return;
    }

    int lane = carData.getLane();
    if (lane < 0 || lane >= isRefueling.length) {
      // Invalid lane
      return;
    }

    com.antigravity.protocols.CarLocation loc = carData.getLocation();
    boolean inPit = loc == com.antigravity.protocols.CarLocation.PitRow
        || (loc.getValue() >= com.antigravity.protocols.CarLocation.PitBayBase.getValue()
            && loc.getValue() < com.antigravity.protocols.CarLocation.PitBayBase.getValue()
                + race.getTrack().getLanes().size());
    boolean canRefuel = carData.getCanRefuel();

    if (inPit && canRefuel) {
      if (!isRefueling[lane] && refuelDelayRemaining[lane] < 0) {
        // Check if already at full fuel
        com.antigravity.race.DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
        if (driverData.getDriver().getFuelLevel() < fuelOptions.getCapacity()) {
          refuelDelayRemaining[lane] = fuelOptions.getPitStopDelay();
          System.out.println("Racing: Lane " + lane + " in pit and can refuel. Starting delay: "
              + refuelDelayRemaining[lane]);
        }
      }
    } else {
      // Left pit or cannot refuel
      if (isRefueling[lane] || refuelDelayRemaining[lane] >= 0) {
        isRefueling[lane] = false;
        refuelDelayRemaining[lane] = -1.0;
        System.out.println("Racing: Lane " + lane + " refueling stopped (left pit or canRefuel=false).");
      }
    }
  }

  private void handleDigitalFuelCarData(com.antigravity.protocols.CarData carData) {
    if (!isDigitalFuelEnabled()) {
      return;
    }

    int lane = carData.getLane();
    if (lane < 0 || lane >= race.getCurrentHeat().getDrivers().size()) {
      return;
    }

    if (finishedLanes.contains(lane)) {
      return;
    }

    com.antigravity.race.DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
    com.antigravity.models.DigitalFuelOptions fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();

    double throttle = carData.getCarThrottlePCT() * 100.0;
    double tRatio = throttle / 100.0;
    double usageRate = fuelOptions.getUsageRate();
    double val = usageRate * tRatio;

    switch (fuelOptions.getUsageType()) {
      case QUADRATIC:
        val *= (1.0 + (1.0 - tRatio));
        break;
      case CUBIC:
        val *= (1.0 + (1.0 - tRatio) * (1.0 + (1.0 - tRatio)));
        break;
      default:
        break;
    }

    double finalUsagePerSec = Double.isNaN(val) || Double.isInfinite(val) ? 0.0 : Math.max(0.0, Math.min(val, 100.0));
    double consumed = finalUsagePerSec * carData.getTime();

    double currentFuel = driverData.getDriver().getFuelLevel();
    double newFuel = Math.max(0.0, currentFuel - consumed);
    driverData.getDriver().setFuelLevel(newFuel);

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      System.out.println("Race: Lane " + lane + " (digital) out of fuel. Turning off power.");
      this.race.setLanePower(false, lane);
    }
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {
    System.out.println("Race: Received onSegment for lane " + lane + " time " + segmentTime);

    com.antigravity.race.DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    if (driverData.getReactionTime() == 0.0f) {
      System.out.println("Race: Ignored onSegment - Driver on lane " + lane + " has not set reaction time");
      return;
    }

    driverData.addSegment(segmentTime);

    com.antigravity.proto.Segment segmentMsg = com.antigravity.proto.Segment.newBuilder()
        .setObjectId(driverData.getObjectId())
        .setSegmentTime(segmentTime)
        .setSegmentNumber(driverData.getSegments().size())
        .setInterfaceId(interfaceId)
        .build();

    com.antigravity.proto.RaceData segmentDataMsg = com.antigravity.proto.RaceData.newBuilder()
        .setSegment(segmentMsg)
        .build();

    this.race.broadcast(segmentDataMsg);
  }

  @Override
  public void onCallbutton(com.antigravity.race.Race race, int lane) {
    System.out.println("Racing.onCallbutton() called. Pausing race.");
    pause(race);
  }
}
