package com.antigravity.race;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.RaceOver;

public class HeatExecutionManager {
  private com.antigravity.race.Race race;

  // Transient heat execution state
  private Set<Integer> finishedLanes = new HashSet<>();
  private double[] refuelDelayRemaining;
  private boolean[] isRefueling;
  private double[] accumulatedRefuelTime;

  public HeatExecutionManager(com.antigravity.race.Race race) {
    this.race = race;
  }

  public void setRace(com.antigravity.race.Race race) {
    this.race = race;
  }

  public void initialize(int laneCount) {
    this.finishedLanes.clear();
    this.refuelDelayRemaining = new double[laneCount];
    this.isRefueling = new boolean[laneCount];
    this.accumulatedRefuelTime = new double[laneCount];
    for (int i = 0; i < laneCount; i++) {
      this.refuelDelayRemaining[i] = -1.0;
      this.isRefueling[i] = false;
      this.accumulatedRefuelTime[i] = 0.0;
    }
  }

  public void processTicker(float delta) {
    handleRefueling(delta);
  }

  public void onLap(int lane, double lapTime, int interfaceId, boolean ignoreTeamLimits, boolean checkFinish) {
    System.out.println("HeatExecutionManager: Received onLap for lane " + lane + " time " + lapTime);

    com.antigravity.race.DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    if (!ignoreTeamLimits && checkTeamLimits(driverData, lapTime)) {
      System.out.println("HeatExecutionManager: Lane " + lane + " lap rejected due to team limits");
      handleAnalogFuelLapTime(driverData, lapTime - driverData.getReactionTime(), lane);
      return;
    }

    if (handleReactionTime(driverData, lapTime, lane, interfaceId)) {
      return;
    }

    double minLapTime = this.race.getRaceModel().getMinLapTime();
    if (minLapTime > 0) {
      driverData.addPendingLapTime(lapTime);
      if (driverData.getPendingLapTime() < minLapTime) {
        System.out.println("HeatExecutionManager: Lane " + lane + " lap time " + lapTime
            + " is below min " + minLapTime + ". Accumulated: " + driverData.getPendingLapTime());
        return;
      }
      double finalLapTime = driverData.getPendingLapTime();
      driverData.setPendingLapTime(0.0);
      handleLapTime(driverData, finalLapTime, lane, interfaceId);
    } else {
      handleLapTime(driverData, lapTime, lane, interfaceId);
    }

    // Check for finish condition immediately after a lap if requested
    if (checkFinish) {
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
          } else if (scoring.getAllowFinish() == com.antigravity.models.HeatScoring.AllowFinish.SingleLap && !finishedLanes.isEmpty()) {
            driverFinished = true;
          }
        }

        if (driverFinished) {
          finishedLanes.add(lane);
          System.out
              .println("HeatExecutionManager: Driver " + driverData.getDriver().getDriver().getName() + " finished on lane "
                  + lane + " (" + driverData.getLapCount() + " laps)");

          if (allowFinish == com.antigravity.models.HeatScoring.AllowFinish.None
              || finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
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
  }

  public void onSegment(int lane, double segmentTime, int interfaceId) {
    System.out.println("HeatExecutionManager: Received onSegment for lane " + lane + " time " + segmentTime);

    com.antigravity.race.DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    if (driverData.getReactionTime() == 0.0f) {
      System.out.println("HeatExecutionManager: Ignored onSegment - Driver on lane " + lane + " has not set reaction time");
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

  public void handleRefueling(float delta) {
    com.antigravity.models.FuelOptions fuelOptions = null;
    if (isAnalogFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getFuelOptions();
    } else if (isDigitalFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions == null) {
      return;
    }

    if (finishedLanes == null || refuelDelayRemaining == null || isRefueling == null || accumulatedRefuelTime == null) {
        return;
    }

    List<com.antigravity.race.DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    for (int i = 0; i < drivers.size(); i++) {
      if (finishedLanes.contains(i))
        continue;

      com.antigravity.race.DriverHeatData driverData = drivers.get(i);
      com.antigravity.race.RaceParticipant participant = driverData.getDriver();

      if (refuelDelayRemaining[i] >= 0) {
        accumulatedRefuelTime[i] += delta;
        if (refuelDelayRemaining[i] > 0) {
          refuelDelayRemaining[i] -= delta;
          if (refuelDelayRemaining[i] <= 0) {
            refuelDelayRemaining[i] = 0;
            isRefueling[i] = true;
          }
        } else if (!isRefueling[i]) {
          // Already waited the delay. Restart if fuel dropped below capacity.
          if (participant.getFuelLevel() < fuelOptions.getCapacity()) {
            isRefueling[i] = true;
          }
        }
      }

      if (isRefueling[i]) {
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
          }
        } else {
          isRefueling[i] = false;
        }
      }
    }
  }

  public void handlePitDetection(com.antigravity.protocols.CarData carData) {
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
    if (lane < 0 || isRefueling == null || lane >= isRefueling.length) {
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
          System.out.println("HeatExecutionManager: Lane " + lane + " in pit and can refuel. Starting delay: "
              + refuelDelayRemaining[lane]);
        }
      }
    } else {
      // Left pit or cannot refuel
      if (isRefueling[lane] || refuelDelayRemaining[lane] >= 0) {
        isRefueling[lane] = false;
        refuelDelayRemaining[lane] = -1.0;
        System.out.println("HeatExecutionManager: Lane " + lane + " refueling stopped (left pit or canRefuel=false).");
      }
    }
  }

  public void handleDigitalFuelCarData(com.antigravity.protocols.CarData carData) {
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

    if (consumed > 0) {
      System.out.println("HeatExecutionManager: Lane " + lane + " (digital) consumed " + consumed + " fuel. Throttle: " + throttle
          + " UsageRate: " + usageRate + " New level: " + newFuel);
    }

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      System.out.println("HeatExecutionManager: Lane " + lane + " (digital) out of fuel. Turning off power.");
      this.race.setLanePower(false, lane);
    }
  }

  private com.antigravity.race.DriverHeatData validateInput(int lane) {
    if (finishedLanes.contains(lane)) {
      System.out.println("HeatExecutionManager: Ignored onLap/onSegment - Driver on lane " + lane + " already finished");
      return null;
    }

    com.antigravity.models.AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    if (fuelOptions != null && fuelOptions.isEnabled()) {
      com.antigravity.race.Heat heat = this.race.getCurrentHeat();
      if (heat != null && lane >= 0 && lane < heat.getDrivers().size()) {
        com.antigravity.race.DriverHeatData driverData = heat.getDrivers().get(lane);
        if (driverData.getDriver().getFuelLevel() <= 0) {
          System.out.println("HeatExecutionManager: Ignored onLap/onSegment - Driver on lane " + lane + " is out of fuel");
          return null;
        }
      }
    }

    com.antigravity.race.Heat currentHeat = this.race.getCurrentHeat();
    if (currentHeat == null) {
      System.out.println("HeatExecutionManager: Ignored onLap/onSegment - No current heat");
      return null;
    }

    java.util.List<com.antigravity.race.DriverHeatData> drivers = currentHeat.getDrivers();
    if (lane < 0 || lane >= drivers.size()) {
      System.out.println("HeatExecutionManager: Ignored onLap/onSegment - Invalid lane " + lane);
      return null;
    }

    com.antigravity.race.DriverHeatData driverData = drivers.get(lane);
    if (driverData == null || driverData.getDriver() == null || driverData.getDriver().getDriver() == null
        || driverData.getDriver().getDriver().getEntityId() == null) {
      System.out.println("HeatExecutionManager: Ignored onLap/onSegment - Invalid driver/entity");
      return null;
    }
    return driverData;
  }

  private boolean checkTeamLimits(com.antigravity.race.DriverHeatData driverData, double lapTime) {
    com.antigravity.models.TeamOptions options = race.getRaceModel().getTeamOptions();
    if (options == null) return false;
    
    if (driverData.getDriver() != null && !driverData.getDriver().isTeamParticipant()) {
      return false;
    }

    com.antigravity.models.Driver actualDriver = driverData.getActualDriver();
    if (actualDriver == null) return false;

    String driverId = actualDriver.getEntityId();

    // Heat Limits
    if (options.getHeatLapLimit() > 0 || options.getHeatTimeLimit() > 0) {
      int heatLaps = 0;
      double heatTime = 0;
      for (com.antigravity.race.DriverHeatData.LapData lap : driverData.getLaps()) {
        if (driverId.equals(lap.getDriverId())) {
          heatLaps++;
          heatTime += lap.getLapTime();
        }
      }

      if (options.getHeatLapLimit() > 0 && heatLaps >= options.getHeatLapLimit()) {
        System.out.println("HeatExecutionManager: Team limits - Heat Lap Limit reached for " + driverId);
        return true;
      }
      if (options.getHeatTimeLimit() > 0 && (heatTime + lapTime) > options.getHeatTimeLimit()) {
        System.out.println("HeatExecutionManager: Team limits - Heat Time Limit reached for " + driverId);
        return true;
      }
    }

    // Overall Limits
    if (options.getOverallLapLimit() > 0 || options.getOverallTimeLimit() > 0) {
      int overallLaps = 0;
      double overallTime = 0;

      for (com.antigravity.race.Heat heat : race.getHeats()) {
        for (com.antigravity.race.DriverHeatData hd : heat.getDrivers()) {
          for (com.antigravity.race.DriverHeatData.LapData lap : hd.getLaps()) {
            if (driverId.equals(lap.getDriverId())) {
              overallLaps++;
              overallTime += lap.getLapTime();
            }
          }
        }
      }

      if (options.getOverallLapLimit() > 0 && overallLaps >= options.getOverallLapLimit()) {
        System.out.println("HeatExecutionManager: Team limits - Overall Lap Limit reached for " + driverId);
        return true;
      }
      if (options.getOverallTimeLimit() > 0 && (overallTime + lapTime) > options.getOverallTimeLimit()) {
        System.out.println("HeatExecutionManager: Team limits - Overall Time Limit reached for " + driverId);
        return true;
      }
    }

    return false;
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
      System.out.println("HeatExecutionManager: Broadcasted reaction time for lane " + lane + ": " + lapTime);

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

    System.out.println("HeatExecutionManager: Lane " + lane + " fuel level: " + newFuel + " (used " + lapFuelUsed + ")");

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      System.out.println("HeatExecutionManager: Lane " + lane + " out of fuel. Turning off power.");
      this.race.setLanePower(false, lane);
    }
  }

  public boolean isAnalogFuelEnabled() {
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

  public boolean isDigitalFuelEnabled() {
    if (race.getTrack() == null || !race.getTrack().hasDigitalFuel()) {
      return false;
    }

    com.antigravity.models.DigitalFuelOptions fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    if (fuelOptions == null || !fuelOptions.isEnabled()) {
      return false;
    }

    return true;
  }

  public Set<Integer> getFinishedLanes() {
    return finishedLanes;
  }

  public double[] getRefuelDelayRemaining() {
    return refuelDelayRemaining;
  }

  public boolean[] getIsRefueling() {
    return isRefueling;
  }

  public double[] getAccumulatedRefuelTime() {
    return accumulatedRefuelTime;
  }
}
