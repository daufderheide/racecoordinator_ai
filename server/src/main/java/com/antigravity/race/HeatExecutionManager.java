package com.antigravity.race;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.DigitalFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.FuelOptions;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.TeamOptions;
import com.antigravity.proto.CarData;
import com.antigravity.proto.Lap;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.Segment;
import com.antigravity.proto.StandingsUpdate;
import com.antigravity.protocols.CarLocation;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.RaceOver;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HeatExecutionManager {

  private static final Logger logger = LoggerFactory.getLogger(HeatExecutionManager.class);
  private Race race;

  // Transient heat execution state
  private final Set<Integer> finishedLanes = new HashSet<>();
  private double[] refuelDelayRemaining;
  private boolean[] isRefueling;
  private double[] accumulatedRefuelTime;
  private double[] timeSinceLastLap;

  public HeatExecutionManager(Race race) {
    this.race = race;
  }

  public void setRace(Race race) {
    this.race = race;
  }

  public boolean isAllowFinishEnabled() {
    if (race == null
        || race.getRaceModel() == null
        || race.getRaceModel().getHeatScoring() == null) {
      return false;
    }
    AllowFinish allowFinish = race.getRaceModel().getHeatScoring().getAllowFinish();
    return allowFinish == AllowFinish.Allow || allowFinish == AllowFinish.SingleLap;
  }

  public void initialize(int laneCount) {
    this.finishedLanes.clear();
    this.refuelDelayRemaining = new double[laneCount];
    this.isRefueling = new boolean[laneCount];
    this.accumulatedRefuelTime = new double[laneCount];
    this.timeSinceLastLap = new double[laneCount];
    for (int i = 0; i < laneCount; i++) {
      this.refuelDelayRemaining[i] = -1.0;
      this.isRefueling[i] = false;
      this.accumulatedRefuelTime[i] = 0.0;
      this.timeSinceLastLap[i] = 0.0;
    }
  }

  public void processTicker(float delta) {
    handleRefueling(delta);
    if (timeSinceLastLap != null) {
      for (int i = 0; i < timeSinceLastLap.length; i++) {
        if (!finishedLanes.contains(i)) {
          timeSinceLastLap[i] += delta;
        }
      }
    }
  }

  /**
   * Processes a sensor hit as a lap.
   *
   * @param lane The lane index where the hit occurred.
   * @param lapTime The time measured for the hit.
   * @param interfaceId The ID of the interface that recorded the hit.
   * @param ignoreTeamLimits Whether to skip team lap/time limit checks.
   * @param checkFinish Whether to check if this lap finishes the heat for the driver.
   * @param isDrift Whether this is a drift lap (recorded during a pause).
   * @return {@code true} if the hit was counted as a legitimate lap (eligible for records), {@code
   *     false} if it was a reaction time hit or was rejected.
   */
  public boolean onLap(
      int lane,
      double lapTime,
      int interfaceId,
      boolean ignoreTeamLimits,
      boolean checkFinish,
      boolean isDrift) {
    logger.debug("Received onLap for lane {} time {}", lane, lapTime);

    DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return false;
    }

    if (!ignoreTeamLimits && checkTeamLimits(driverData, lapTime)) {
      logger.info("Lane {} lap rejected due to team limits", lane);
      handleAnalogFuelLapTime(driverData, lapTime - driverData.getReactionTime(), lane);
      return false;
    }

    if (handleReactionTime(driverData, lapTime, lane, interfaceId)) {
      timeSinceLastLap[lane] = 0.0;
      return false;
    }

    boolean lapCounted = false;
    double minLapTime = this.race.getRaceModel().getMinLapTime();
    if (minLapTime > 0) {
      driverData.addPendingLapTime(lapTime);
      if (driverData.getPendingLapTime() < minLapTime) {
        Lap minLapMsg =
            Lap.newBuilder()
                .setObjectId(driverData.getObjectId())
                .setLapTime(lapTime)
                .setInterfaceId(interfaceId)
                .setType(Lap.LapType.MIN_LAP_TIME)
                .setFlag(race.getState().getLaneFlagType(race, lane))
                .build();
        driverData.setFlag(minLapMsg.getFlag());
        race.broadcast(RaceData.newBuilder().setLap(minLapMsg).build());
        return false;
      }
      double finalLapTime = driverData.getPendingLapTime();
      driverData.setPendingLapTime(0.0);
      lapCounted = handleLapTime(driverData, finalLapTime, lane, interfaceId, isDrift);
    } else {
      double finalLapTime = lapTime + driverData.getPendingLapTime();
      driverData.setPendingLapTime(0.0);
      lapCounted = handleLapTime(driverData, finalLapTime, lane, interfaceId, isDrift);
    }

    if (lapCounted) {
      timeSinceLastLap[lane] = 0.0;
    }

    // Check for finish condition immediately after a lap if requested
    if (lapCounted && checkFinish) {
      HeatScoring scoring = race.getRaceModel().getHeatScoring();
      if (scoring != null) {
        AllowFinish allowFinish = scoring.getAllowFinish();
        boolean isTimed = scoring.getFinishMethod() == FinishMethod.Timed;
        boolean driverFinished = false;

        if (isTimed) {
          if (race.getRaceTime() <= 0) {
            driverFinished = true;
          }
        } else {
          if (driverData.getLapCount() >= scoring.getFinishValue()) {
            driverFinished = true;
          } else if (scoring.getAllowFinish() == AllowFinish.SingleLap
              && !finishedLanes.isEmpty()) {
            driverFinished = true;
          }
        }

        if (driverFinished) {
          finishedLanes.add(lane);
          logger.info(
              "Driver {} finished on lane {} ({} laps)",
              driverData.getDriver().getDriver().getName(),
              lane,
              driverData.getLapCount());

          if (allowFinish == AllowFinish.None
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
    return lapCounted;
  }

  public void onSegment(int lane, double segmentTime, int interfaceId) {
    logger.debug("Received onSegment for lane {} time {}", lane, segmentTime);

    DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    if (driverData.getReactionTime() < 0) {
      logger.debug("Ignored onSegment - Driver on lane {} has not set reaction time", lane);
      return;
    }

    driverData.addSegment(segmentTime);

    Segment segmentMsg =
        Segment.newBuilder()
            .setObjectId(driverData.getObjectId())
            .setSegmentTime(segmentTime)
            .setSegmentNumber(driverData.getSegments().size())
            .setInterfaceId(interfaceId)
            .build();

    RaceData segmentDataMsg = RaceData.newBuilder().setSegment(segmentMsg).build();

    this.race.broadcast(segmentDataMsg);
  }

  public void handleRefueling(float delta) {
    FuelOptions fuelOptions = null;
    if (isAnalogFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getFuelOptions();
    } else if (isDigitalFuelEnabled()) {
      fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
    }

    if (fuelOptions == null) {
      return;
    }

    if (finishedLanes == null
        || refuelDelayRemaining == null
        || isRefueling == null
        || accumulatedRefuelTime == null) {
      return;
    }

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    for (int i = 0; i < drivers.size(); i++) {
      if (finishedLanes.contains(i)) {
        continue;
      }

      DriverHeatData driverData = drivers.get(i);
      RaceParticipant participant = driverData.getDriver();

      if (participant == null
          || participant.getDriver() == null
          || participant.getDriver().isEmpty()) {
        continue;
      }

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

      driverData.setRefueling(isRefueling[i]);
      if (isRefueling[i]) {
        double currentFuel = participant.getFuelLevel();
        double capacity = fuelOptions.getCapacity();

        if (currentFuel < capacity) {
          double newFuel = Math.min(capacity, currentFuel + fuelOptions.getRefuelRate() * delta);
          participant.setFuelLevel(newFuel);

          // Broadcast fuel update using CarData instead of Lap
          CarData fuelMsg =
              CarData.newBuilder()
                  .setLane(i)
                  .setFuelLevel(newFuel)
                  .setIsRefueling(true)
                  .setFlag(race.getState().getLaneFlagType(race, i))
                  .build();
          driverData.setFlag(fuelMsg.getFlag());

          RaceData fuelDataMsg = RaceData.newBuilder().setCarData(fuelMsg).build();

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

  public synchronized void changeLane(int from, int to) {
    if (from < 0 || to < 0 || from >= isRefueling.length || to >= isRefueling.length) {
      return;
    }

    // Swap finished state
    boolean fromFinished = finishedLanes.contains(from);
    boolean toFinished = finishedLanes.contains(to);

    if (fromFinished) {
      finishedLanes.remove(from);
    }
    if (toFinished) {
      finishedLanes.remove(to);
    }

    if (fromFinished) {
      finishedLanes.add(to);
    }
    if (toFinished) {
      finishedLanes.add(from);
    }

    // Swap fuel related transient state
    double tempDelay = refuelDelayRemaining[from];
    refuelDelayRemaining[from] = refuelDelayRemaining[to];
    refuelDelayRemaining[to] = tempDelay;

    boolean tempRefueling = isRefueling[from];
    isRefueling[from] = isRefueling[to];
    isRefueling[to] = tempRefueling;

    race.getCurrentHeat().getDrivers().get(from).setRefueling(isRefueling[from]);
    race.getCurrentHeat().getDrivers().get(to).setRefueling(isRefueling[to]);

    double tempAccumulated = accumulatedRefuelTime[from];
    accumulatedRefuelTime[from] = accumulatedRefuelTime[to];
    accumulatedRefuelTime[to] = tempAccumulated;

    double tempTimeSinceLastLap = timeSinceLastLap[from];
    timeSinceLastLap[from] = timeSinceLastLap[to];
    timeSinceLastLap[to] = tempTimeSinceLastLap;

    logger.info("Swapped transient lane state for lanes {} and {}", from, to);
  }

  public void handlePitDetection(com.antigravity.protocols.CarData carData) { // fqn-collision
    FuelOptions fuelOptions = null;
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

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
    if (driverData == null
        || driverData.getDriver() == null
        || driverData.getDriver().getDriver() == null
        || driverData.getDriver().getDriver().isEmpty()) {
      return;
    }

    CarLocation loc = carData.getLocation();
    driverData.setCurrentLocation(loc);
    boolean inPit =
        loc == CarLocation.PitRow
            || (loc.getValue() >= CarLocation.PitBayBase.getValue()
                && loc.getValue()
                    < CarLocation.PitBayBase.getValue() + race.getTrack().getLanes().size());
    boolean canRefuel = carData.getCanRefuel();

    if (inPit && canRefuel) {
      if (!isRefueling[lane] && refuelDelayRemaining[lane] < 0) {
        // Check if already at full fuel
        if (driverData.getDriver().getFuelLevel() < fuelOptions.getCapacity()) {
          refuelDelayRemaining[lane] = fuelOptions.getPitStopDelay();
        }
      }
    } else {
      // Left pit or cannot refuel
      if (isRefueling[lane] || refuelDelayRemaining[lane] >= 0) {
        isRefueling[lane] = false;
        driverData.setRefueling(false);
        refuelDelayRemaining[lane] = -1.0;
      }
    }
  }

  public void handleDigitalFuelCarData(com.antigravity.protocols.CarData carData) { // fqn-collision
    int lane = carData.getLane();
    if (lane < 0 || lane >= race.getCurrentHeat().getDrivers().size()) {
      return;
    }

    if (finishedLanes.contains(lane)) {
      return;
    }

    DriverHeatData driverData = race.getCurrentHeat().getDrivers().get(lane);
    if (driverData == null
        || driverData.getDriver() == null
        || driverData.getDriver().getDriver() == null
        || driverData.getDriver().getDriver().isEmpty()) {
      return;
    }
    DigitalFuelOptions fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();

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

    double finalUsagePerSec =
        Double.isNaN(val) || Double.isInfinite(val) ? 0.0 : Math.max(0.0, Math.min(val, 100.0));
    double consumed = finalUsagePerSec * carData.getTime();

    double currentFuel = driverData.getDriver().getFuelLevel();
    double newFuel = Math.max(0.0, currentFuel - consumed);
    driverData.getDriver().setFuelLevel(newFuel);

    if (consumed > 0) {
      logger.debug(
          "Lane {} (digital) consumed {} fuel. Throttle: {} UsageRate: {} New level: {}",
          lane,
          consumed,
          throttle,
          usageRate,
          newFuel);
    }

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      logger.info("Lane {} (digital) out of fuel. Turning off power.", lane);
      this.race.setLanePower(false, lane);
    }
  }

  private DriverHeatData validateInput(int lane) {
    if (finishedLanes.contains(lane)) {
      logger.debug("Ignored onLap/onSegment - Driver on lane {} already finished", lane);
      return null;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    if (fuelOptions != null && fuelOptions.isEnabled()) {
      Heat heat = this.race.getCurrentHeat();
      if (heat != null && lane >= 0 && lane < heat.getDrivers().size()) {
        DriverHeatData driverData = heat.getDrivers().get(lane);
        if (driverData.getDriver().getFuelLevel() <= 0) {
          logger.debug("Ignored onLap/onSegment - Driver on lane {} is out of fuel", lane);
          return null;
        }
      }
    }

    Heat currentHeat = this.race.getCurrentHeat();
    if (currentHeat == null) {
      logger.debug("Ignored onLap/onSegment - No current heat");
      return null;
    }

    List<DriverHeatData> drivers = currentHeat.getDrivers();
    if (lane < 0 || lane >= drivers.size()) {
      logger.debug("Ignored onLap/onSegment - Invalid lane {}", lane);
      return null;
    }

    DriverHeatData driverData = drivers.get(lane);
    if (driverData == null
        || driverData.getDriver() == null
        || driverData.getDriver().getDriver() == null
        || driverData.getDriver().getDriver().getEntityId() == null
        || driverData.getDriver().getDriver().isEmpty()) {
      logger.debug("Ignored onLap/onSegment - Invalid/Empty driver");
      return null;
    }
    return driverData;
  }

  private boolean checkTeamLimits(DriverHeatData driverData, double lapTime) {
    TeamOptions options = race.getRaceModel().getTeamOptions();
    if (options == null) {
      return false;
    }

    if (driverData.getDriver() != null && !driverData.getDriver().isTeamParticipant()) {
      return false;
    }

    Driver actualDriver = driverData.getActualDriver();
    if (actualDriver == null) {
      return false;
    }

    String driverId = actualDriver.getEntityId();

    // Heat Limits
    if (options.getHeatLapLimit() > 0 || options.getHeatTimeLimit() > 0) {
      int heatLaps = 0;
      double heatTime = 0;
      for (DriverHeatData.LapData lap : driverData.getLaps()) {
        if (driverId.equals(lap.getDriverId())) {
          heatLaps++;
          heatTime += lap.getLapTime();
        }
      }

      if (options.getHeatLapLimit() > 0 && heatLaps >= options.getHeatLapLimit()) {
        logger.info("Team limits - Heat Lap Limit reached for {}", driverId);
        return true;
      }
      if (options.getHeatTimeLimit() > 0 && (heatTime + lapTime) > options.getHeatTimeLimit()) {
        logger.info("Team limits - Heat Time Limit reached for {}", driverId);
        return true;
      }
    }

    // Overall Limits
    if (options.getOverallLapLimit() > 0 || options.getOverallTimeLimit() > 0) {
      int overallLaps = 0;
      double overallTime = 0;

      for (Heat heat : race.getHeats()) {
        for (DriverHeatData hd : heat.getDrivers()) {
          for (DriverHeatData.LapData lap : hd.getLaps()) {
            if (driverId.equals(lap.getDriverId())) {
              overallLaps++;
              overallTime += lap.getLapTime();
            }
          }
        }
      }

      if (options.getOverallLapLimit() > 0 && overallLaps >= options.getOverallLapLimit()) {
        logger.info("Team limits - Overall Lap Limit reached for {}", driverId);
        return true;
      }
      if (options.getOverallTimeLimit() > 0
          && (overallTime + lapTime) > options.getOverallTimeLimit()) {
        logger.info("Team limits - Overall Time Limit reached for {}", driverId);
        return true;
      }
    }

    return false;
  }

  private boolean handleReactionTime(
      DriverHeatData driverData, double lapTime, int lane, int interfaceId) {
    if (driverData.getReactionTime() < 0) {
      double totalReactionTime = lapTime + driverData.getPendingLapTime();
      driverData.setPendingLapTime(0.0);
      driverData.setReactionTime(totalReactionTime);

      Lap rtMsg =
          Lap.newBuilder()
              .setObjectId(driverData.getObjectId())
              .setLapTime(totalReactionTime)
              .setInterfaceId(interfaceId)
              .setType(Lap.LapType.REACTION_TIME)
              .setFlag(race.getState().getLaneFlagType(race, lane))
              .build();
      driverData.setFlag(rtMsg.getFlag());

      RaceData rtDataMsg = RaceData.newBuilder().setLap(rtMsg).build();

      this.race.broadcast(rtDataMsg);
      logger.info("Broadcasted reaction time for lane {}: {}", lane, totalReactionTime);

      StandingsUpdate standingsUpdate =
          this.race.getCurrentHeat().getHeatStandings().updateStandings();
      if (standingsUpdate != null) {
        RaceData standingsDataMsg =
            RaceData.newBuilder().setStandingsUpdate(standingsUpdate).build();
        this.race.broadcast(standingsDataMsg);
      }

      updateProtocolStandings();
      return true;
    }
    return false;
  }

  private void updateProtocolStandings() {
    Heat currentHeat = race.getCurrentHeat();
    if (currentHeat == null || currentHeat.getHeatStandings() == null) {
      return;
    }

    List<String> standingsIds = currentHeat.getStandings();
    List<DriverHeatData> drivers = currentHeat.getDrivers();
    List<Integer> laneIndices = new ArrayList<>();

    for (String objectId : standingsIds) {
      for (int i = 0; i < drivers.size(); i++) {
        DriverHeatData dhd = drivers.get(i);
        if (dhd != null && dhd.getObjectId().equals(objectId)) {
          laneIndices.add(i);
          break;
        }
      }
    }

    if (!laneIndices.isEmpty()) {
      race.setHeatStandings(laneIndices);
    }
  }

  private boolean handleLapTime(
      DriverHeatData driverData, double lapTime, int lane, int interfaceId, boolean isDrift) {
    double effectiveLapTime = lapTime;
    if (driverData.getLapCount() == 0) {
      effectiveLapTime += driverData.getReactionTime();
    }

    driverData.addLap(effectiveLapTime, isDrift);

    // Handle analog fuel usage, but exclude reaction time as it could be extremely
    // high if the driver has technical issues at the start of the heat.
    handleAnalogFuelLapTime(driverData, effectiveLapTime - driverData.getReactionTime(), lane);

    Lap lapMsg =
        Lap.newBuilder()
            .setObjectId(driverData.getObjectId())
            .setLapTime(effectiveLapTime)
            .setLapNumber(driverData.getLapCount())
            .setAverageLapTime(driverData.getAverageLapTime())
            .setMedianLapTime(driverData.getMedianLapTime())
            .setBestLapTime(driverData.getBestLapTime())
            .setInterfaceId(interfaceId)
            .setDriverId(
                driverData.getActualDriver() != null
                    ? driverData.getActualDriver().getEntityId()
                    : "")
            .setFuelLevel(driverData.getDriver().getFuelLevel())
            .setIsDrift(isDrift)
            .setAdjustedLapCount(driverData.getAdjustedLapCount())
            .setType(Lap.LapType.LAP)
            .setFlag(race.getState().getLaneFlagType(race, lane))
            .build();
    driverData.setFlag(lapMsg.getFlag());

    RaceData lapDataMsg = RaceData.newBuilder().setLap(lapMsg).build();

    this.race.broadcast(lapDataMsg);

    StandingsUpdate standingsUpdate =
        this.race.getCurrentHeat().getHeatStandings().onLap(lane, effectiveLapTime);
    if (standingsUpdate != null) {
      RaceData standingsDataMsg = RaceData.newBuilder().setStandingsUpdate(standingsUpdate).build();
      this.race.broadcast(standingsDataMsg);
    }

    updateProtocolStandings();
    this.race.updateAndBroadcastOverallStandings();
    return true;
  }

  private void handleAnalogFuelLapTime(DriverHeatData driverData, double lapTime, int lane) {
    if (!isAnalogFuelEnabled()) {
      return;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
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
      default:
        break;
    }

    if (Double.isNaN(lapFuelUsed) || Double.isInfinite(lapFuelUsed)) {
      lapFuelUsed = 0.0;
    }
    lapFuelUsed = Math.max(0, lapFuelUsed);

    double currentFuel = driverData.getDriver().getFuelLevel();
    double newFuel = Math.max(0, currentFuel - lapFuelUsed);
    driverData.getDriver().setFuelLevel(newFuel);

    logger.debug("Lane {} fuel level: {} (used {})", lane, newFuel, lapFuelUsed);

    if (newFuel <= 0 && fuelOptions.isEndHeatOnOutOfFuel()) {
      logger.info("Lane {} out of fuel. Turning off power.", lane);
      this.race.setLanePower(false, lane);
    }
  }

  public boolean isAnalogFuelEnabled() {
    if (race.getTrack() == null || race.getTrack().hasDigitalFuel()) {
      // No track or the track uses digital fuel.
      return false;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
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

    DigitalFuelOptions fuelOptions = this.race.getRaceModel().getDigitalFuelOptions();
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

  public double[] getTimeSinceLastLap() {
    return timeSinceLastLap;
  }
}
