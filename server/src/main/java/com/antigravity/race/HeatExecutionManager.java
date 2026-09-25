package com.antigravity.race;

import com.antigravity.context.DatabaseContext;
import com.antigravity.converters.HeatConverter;
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
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.race.prediction.PredictionEngine.DriverHeatState;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.RaceOver;
import com.antigravity.service.RacePredictionService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
  private double[] excludedPendingLapTime;
  private double[] stutterAccumulatedTime;
  private double[] partialLapTimes;
  private boolean partialLapTimesCaptured = false;

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
    return allowFinish == AllowFinish.Allow
        || allowFinish == AllowFinish.SingleLap
        || allowFinish == AllowFinish.SingleLapAutoSegments;
  }

  public void initialize(int laneCount) {
    this.finishedLanes.clear();
    this.refuelDelayRemaining = new double[laneCount];
    this.isRefueling = new boolean[laneCount];
    this.accumulatedRefuelTime = new double[laneCount];
    this.timeSinceLastLap = new double[laneCount];
    this.excludedPendingLapTime = new double[laneCount];
    this.stutterAccumulatedTime = new double[laneCount];
    this.partialLapTimes = new double[laneCount];
    this.partialLapTimesCaptured = false;
    for (int i = 0; i < laneCount; i++) {
      this.refuelDelayRemaining[i] = -1.0;
      this.isRefueling[i] = false;
      this.accumulatedRefuelTime[i] = 0.0;
      this.timeSinceLastLap[i] = 0.0;
      this.excludedPendingLapTime[i] = 0.0;
      this.stutterAccumulatedTime[i] = 0.0;
      this.partialLapTimes[i] = 0.0;

      if (race.getRaceModel().isStartAtCurrent() && race.getCurrentHeat() != null) {
        List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
        if (i < drivers.size()) {
          DriverHeatData dhd = drivers.get(i);
          if (dhd != null
              && dhd.getDriver() != null
              && !race.isFirstHeatForDriver(dhd.getDriver().getStableId(), race.getCurrentHeat())) {
            Heat lastHeat =
                race.getLastHeatForDriver(dhd.getDriver().getStableId(), race.getCurrentHeat());
            if (lastHeat != null) {
              DriverHeatData lastDhd = null;
              if (lastHeat.getDrivers() != null) {
                for (DriverHeatData lDhd : lastHeat.getDrivers()) {
                  if (lDhd != null
                      && lDhd.getDriver() != null
                      && lDhd.getDriver().getStableId().equals(dhd.getDriver().getStableId())) {
                    lastDhd = lDhd;
                    break;
                  }
                }
              }
              if (lastDhd != null) {
                double carry = lastDhd.getCarryOverTime();
                this.timeSinceLastLap[i] = carry;
                dhd.setPendingLapTime(carry);
                dhd.markDriftTime();
              }
            }
          }
        }
      }
    }
  }

  public void processTicker(float delta) {
    handleRefueling(delta);
    handlePowerStutter(delta);
    if (timeSinceLastLap != null) {
      for (int i = 0; i < timeSinceLastLap.length; i++) {
        if (!finishedLanes.contains(i)) {
          timeSinceLastLap[i] += delta;
        }
      }
    }
  }

  private void handlePowerStutter(float delta) {
    if (!isAnalogFuelEnabled()) {
      return;
    }
    AnalogFuelOptions analogFuel = race.getRaceModel().getFuelOptions();
    if (analogFuel.getOutOfFuelAction() != FuelOptions.OutOfFuelAction.POWER_STUTTER) {
      return;
    }

    double offTime = analogFuel.getPowerStutterOffTime();
    double cycleTime = analogFuel.getPowerStutterOnTime() + analogFuel.getPowerStutterOffTime();
    if (cycleTime <= 0) cycleTime = 1.0;

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    for (int i = 0; i < drivers.size(); i++) {
      if (finishedLanes.contains(i)) {
        continue;
      }
      double fuelLevel = drivers.get(i).getDriver().getFuelLevel();
      if (fuelLevel <= 0) {
        stutterAccumulatedTime[i] += delta;
        double mod = stutterAccumulatedTime[i] % cycleTime;
        if (mod < offTime) {
          race.setLanePower(false, i);
        } else {
          race.setLanePower(true, i);
        }
      } else {
        if (stutterAccumulatedTime[i] > 0) {
          stutterAccumulatedTime[i] = 0.0;
          race.setLanePower(true, i);
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
  private enum RejectionReason {
    OUT_OF_FUEL(true, false, true),
    TEAM_LIMITS(true, true, true),
    MIN_LAP_TIME(true, false, false);

    private final boolean accumulateTime;
    private final boolean consumeFuel;
    private final boolean excludeFromFinalFuel;

    RejectionReason(boolean accumulateTime, boolean consumeFuel, boolean excludeFromFinalFuel) {
      this.accumulateTime = accumulateTime;
      this.consumeFuel = consumeFuel;
      this.excludeFromFinalFuel = excludeFromFinalFuel;
    }

    public boolean shouldAccumulateTime() {
      return accumulateTime;
    }

    public boolean shouldConsumeFuel() {
      return consumeFuel;
    }

    public boolean shouldExcludeFromFinalFuel() {
      return excludeFromFinalFuel;
    }
  }

  private void handleRejection(
      DriverHeatData driverData, int lane, double lapTime, RejectionReason reason) {
    if (reason.shouldAccumulateTime()) {
      driverData.addPendingLapTime(lapTime);
      if (reason.shouldExcludeFromFinalFuel()) {
        excludedPendingLapTime[lane] += lapTime;
      }
    }
    if (reason.shouldConsumeFuel()) {
      handleAnalogFuelLapTime(driverData, lapTime, lane);
    }
  }

  private boolean checkMinLapTime(
      DriverHeatData driverData, int lane, double lapTime, int interfaceId) {
    double minLapTime = this.race.getRaceModel().getMinLapTime();
    if (minLapTime > 0) {
      double minCheckTime = driverData.getPendingLapTime() - excludedPendingLapTime[lane] + lapTime;
      if (minCheckTime < minLapTime) {
        logger.warn(
            "Lane {} lap rejected due to min lap time: {}s < {}s", lane, lapTime, minLapTime);
        handleRejection(driverData, lane, lapTime, RejectionReason.MIN_LAP_TIME);
        if (this.race.getStatistics() != null) {
          this.race.getStatistics().incrementMinLapTimeRejectionCount();
        }
        Lap minLapMsg =
            Lap.newBuilder()
                .setObjectId(driverData.getObjectId())
                .setLapTime(minCheckTime)
                .setInterfaceId(interfaceId)
                .setType(Lap.LapType.MIN_LAP_TIME)
                .setFlag(race.getState().getLaneFlagType(race, lane))
                .setFuelLevel(driverData.getDriver().getFuelLevel())
                .build();
        driverData.setFlag(minLapMsg.getFlag());
        race.broadcast(RaceData.newBuilder().setLap(minLapMsg).build());
        return true;
      }
    }
    return false;
  }

  private void checkFinishCondition(DriverHeatData driverData, int lane) {
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring == null) {
      return;
    }
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
      } else if (scoring.getAllowFinish() == AllowFinish.SingleLap && !finishedLanes.isEmpty()) {
        driverFinished = true;
      }
    }

    if (driverFinished) {
      finishedLanes.add(lane);
      driverData.setFinished(true);
      driverData.setFlag(race.getState().getLaneFlagType(race, lane));
      logger.info(
          "Driver {} finished on lane {} ({} laps)",
          driverData.getDriver().getDriver().getName(),
          lane,
          driverData.getLapCount());

      if (allowFinish == AllowFinish.SingleLapAutoSegments) {
        capturePartialLapTimes();
      }

      if (allowFinish == AllowFinish.None
          || allowFinish == AllowFinish.NoneAutoSegments
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
        if (race.getCurrentHeat() != null) {
          race.broadcast(
              RaceData.newBuilder()
                  .setHeat(HeatConverter.toProto(race.getCurrentHeat(), new HashSet<>()))
                  .build());
        }
      }
    }
  }

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

    if (handleReactionTime(driverData, lapTime, lane, interfaceId)) {
      timeSinceLastLap[lane] = 0.0;
      return false;
    }

    if (checkMinLapTime(driverData, lane, lapTime, interfaceId)) {
      return false;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    boolean outOfFuel =
        fuelOptions != null
            && fuelOptions.isEnabled()
            && driverData.getDriver().getFuelLevel() <= 0;
    if (outOfFuel
        && fuelOptions.getOutOfFuelAction() != FuelOptions.OutOfFuelAction.POWER_STUTTER) {
      logger.info("Lane {} lap rejected due to out of fuel", lane);
      handleRejection(driverData, lane, lapTime, RejectionReason.OUT_OF_FUEL);
      return false;
    }

    if (!ignoreTeamLimits && checkTeamLimits(driverData, lapTime)) {
      logger.info("Lane {} lap rejected due to team limits", lane);
      handleRejection(driverData, lane, lapTime, RejectionReason.TEAM_LIMITS);
      return false;
    }

    boolean lapCounted = false;
    double finalLapTime = lapTime + driverData.getPendingLapTime();
    driverData.setPendingLapTime(0.0);

    HeatScoring scoring = this.race.getRaceModel().getHeatScoring();
    if (isSingleLapAutoSegmentsFinish(scoring)) {
      handleSingleLapAutoSegments(driverData, finalLapTime, lane);
      return false;
    }

    lapCounted = handleLapTime(driverData, finalLapTime, lane, interfaceId, isDrift);

    if (lapCounted) {
      timeSinceLastLap[lane] = 0.0;
      if (isDrift && this.race.getStatistics() != null) {
        this.race.getStatistics().incrementDriftLapCount();
      }
    }

    // Check for finish condition immediately after a lap if requested
    if (lapCounted && checkFinish) {
      checkFinishCondition(driverData, lane);
    }

    return lapCounted;
  }

  public void onSegment(int lane, double segmentTime, int interfaceId) {
    logger.debug("Received onSegment for lane {} time {}", lane, segmentTime);

    DriverHeatData driverData = validateInput(lane);
    if (driverData == null) {
      return;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    if (fuelOptions != null
        && fuelOptions.isEnabled()
        && driverData.getDriver().getFuelLevel() <= 0) {
      logger.debug("Ignored onSegment - Driver on lane {} is out of fuel", lane);
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
          race.setFuelLevel(i, newFuel, capacity);

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

    double tempExcludedPending = excludedPendingLapTime[from];
    excludedPendingLapTime[from] = excludedPendingLapTime[to];
    excludedPendingLapTime[to] = tempExcludedPending;

    double tempStutter = stutterAccumulatedTime[from];
    stutterAccumulatedTime[from] = stutterAccumulatedTime[to];
    stutterAccumulatedTime[to] = tempStutter;

    if (partialLapTimes != null) {
      double tempPartial = partialLapTimes[from];
      partialLapTimes[from] = partialLapTimes[to];
      partialLapTimes[to] = tempPartial;
    }

    logger.info("Swapped transient lane state for lanes {} and {}", from, to);
  }

  public void resetLane(int lane) {
    if (lane >= 0) {
      if (refuelDelayRemaining != null && lane < refuelDelayRemaining.length) {
        refuelDelayRemaining[lane] = -1.0;
      }
      if (isRefueling != null && lane < isRefueling.length) {
        isRefueling[lane] = false;
      }
      if (accumulatedRefuelTime != null && lane < accumulatedRefuelTime.length) {
        accumulatedRefuelTime[lane] = 0.0;
      }
      if (timeSinceLastLap != null && lane < timeSinceLastLap.length) {
        timeSinceLastLap[lane] = 0.0;
      }
      if (excludedPendingLapTime != null && lane < excludedPendingLapTime.length) {
        excludedPendingLapTime[lane] = 0.0;
      }
      if (stutterAccumulatedTime != null && lane < stutterAccumulatedTime.length) {
        stutterAccumulatedTime[lane] = 0.0;
      }
      if (partialLapTimes != null && lane < partialLapTimes.length) {
        partialLapTimes[lane] = 0.0;
      }
      finishedLanes.remove(lane);
      logger.info("Reset transient lane execution state for lane {}", lane);
    }
  }

  public void resetAllLanes() {
    if (timeSinceLastLap != null) {
      for (int i = 0; i < timeSinceLastLap.length; i++) {
        resetLane(i);
      }
    }
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
      case CUSTOM_CURVE:
      case CUSTOM:
        val =
            usageRate
                * FuelCalculationUtils.interpolateFuelCurve(fuelOptions.getCustomCurve(), tRatio);
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
    race.setFuelLevel(lane, newFuel, fuelOptions.getCapacity());

    if (consumed > 0) {
      logger.debug(
          "Lane {} (digital) consumed {} fuel. Throttle: {} UsageRate: {} New level: {}",
          lane,
          consumed,
          throttle,
          usageRate,
          newFuel);
    }

    if (newFuel <= 0 && fuelOptions.getOutOfFuelAction() == FuelOptions.OutOfFuelAction.END_HEAT) {
      logger.info("Lane {} (digital) out of fuel. Turning off power.", lane);
      this.race.setLanePower(false, lane);
    }
  }

  private DriverHeatData validateInput(int lane) {
    if (finishedLanes.contains(lane)) {
      logger.debug("Ignored onLap/onSegment - Driver on lane {} already finished", lane);
      return null;
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
    boolean useStartBehindSensor = race.getRaceModel().isStartBehindSensor();
    if (race.getRaceModel().isStartAtCurrent()
        && driverData != null
        && driverData.getDriver() != null
        && !race.isFirstHeatForDriver(
            driverData.getDriver().getStableId(), race.getCurrentHeat())) {
      useStartBehindSensor = false;
    }

    if (!useStartBehindSensor) {
      if (driverData.getReactionTime() < 0) {
        driverData.setReactionTime(0.0);
      }
      return false;
    }
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
              .setFuelLevel(driverData.getDriver().getFuelLevel())
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

    double previousDriverBestLap = driverData.getBestLapTime();
    boolean driftInvolved = isDrift || driverData.consumeDriftTime();
    boolean countTowardsRecords = !(race.getRaceModel().isAdjustDriftLaps() && driftInvolved);

    Lap.RecordTier recordTier = Lap.RecordTier.RECORD_TIER_NONE;
    if (race.getRecordsManager() != null) {
      recordTier =
          race.getRecordsManager()
              .determineRecordTier(
                  driverData, effectiveLapTime, lane, countTowardsRecords, previousDriverBestLap);
    }

    String previousRaceLeaderId = getRaceLeaderParticipantId();
    String previousHeatLeaderId = getHeatLeaderParticipantId();

    driverData.addLap(effectiveLapTime, isDrift, countTowardsRecords);
    updateRealtimePredictionOnLap();

    // Handle analog fuel usage, but exclude reaction time as it could be extremely
    // high if the driver has technical issues at the start of the heat. Also exclude
    // any pending times that are flagged for exclusion from final fuel calculation.
    double fuelLapTime = Math.max(0.0, lapTime - excludedPendingLapTime[lane]);
    excludedPendingLapTime[lane] = 0.0;
    handleAnalogFuelLapTime(driverData, fuelLapTime, lane);

    StandingsUpdate standingsUpdate = null;
    if (this.race.getCurrentHeat() != null
        && this.race.getCurrentHeat().getHeatStandings() != null) {
      standingsUpdate = this.race.getCurrentHeat().getHeatStandings().onLap(lane, effectiveLapTime);
    }
    this.race.recalculateOverallStandings();

    boolean[] leaderChange =
        evaluateLeaderChange(
            previousRaceLeaderId, previousHeatLeaderId, driverData.getParticipantId());
    boolean isNewRaceLeader = leaderChange[0];
    boolean isNewHeatLeader = leaderChange[1];

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
            .setCountTowardsRecords(countTowardsRecords)
            .setRecordTier(recordTier)
            .setIsNewRaceLeader(isNewRaceLeader)
            .setIsNewHeatLeader(isNewHeatLeader)
            .build();
    driverData.setFlag(lapMsg.getFlag());

    RaceData lapDataMsg = RaceData.newBuilder().setLap(lapMsg).build();

    this.race.broadcast(lapDataMsg);

    if (standingsUpdate != null) {
      RaceData standingsDataMsg = RaceData.newBuilder().setStandingsUpdate(standingsUpdate).build();
      this.race.broadcast(standingsDataMsg);
    }

    updateProtocolStandings();
    this.race.updateAndBroadcastOverallStandings();
    return true;
  }

  boolean[] evaluateLeaderChange(
      String previousRaceLeaderId, String previousHeatLeaderId, String myParticipantId) {
    String newRaceLeaderId = getRaceLeaderParticipantId();
    String newHeatLeaderId = getHeatLeaderParticipantId();

    boolean isNewRaceLeader = false;
    boolean isNewHeatLeader = false;

    if (!race.isPractice() && myParticipantId != null && !myParticipantId.isEmpty()) {
      if (myParticipantId.equals(newRaceLeaderId)
          && !myParticipantId.equals(previousRaceLeaderId)) {
        isNewRaceLeader = true;
      }
      if (myParticipantId.equals(newHeatLeaderId)
          && !myParticipantId.equals(previousHeatLeaderId)) {
        isNewHeatLeader = true;
      }
    }
    return new boolean[] {isNewRaceLeader, isNewHeatLeader};
  }

  String getHeatLeaderParticipantId() {
    if (race == null
        || race.getCurrentHeat() == null
        || race.getCurrentHeat().getHeatStandings() == null) {
      return null;
    }
    List<String> standings = race.getCurrentHeat().getStandings();
    if (standings == null || standings.isEmpty()) {
      return null;
    }
    List<DriverHeatData> heatDrivers = race.getCurrentHeat().getDrivers();
    if (heatDrivers == null) {
      return null;
    }
    for (String objectId : standings) {
      for (DriverHeatData dhd : heatDrivers) {
        if (dhd.getObjectId().equals(objectId)) {
          if (dhd.getActualDriver() != null
              && !dhd.getActualDriver().isEmpty()
              && dhd.getLapCount() > 0) {
            return dhd.getParticipantId();
          }
          break;
        }
      }
    }
    return null;
  }

  String getRaceLeaderParticipantId() {
    if (race == null || race.getDrivers() == null) {
      return null;
    }
    List<RaceParticipant> participants = new ArrayList<>(race.getDrivers());
    participants.sort(Comparator.comparingInt(RaceParticipant::getRank));
    for (RaceParticipant participant : participants) {
      if (participant.getRank() < 99
          && !participant.isEmptyParticipant()
          && (participant.getTotalLaps() > 0
              || (participant.getAllScoringLaps() != null
                  && !participant.getAllScoringLaps().isEmpty()))) {
        return participant.getParticipantId();
      }
    }
    return null;
  }

  private void handleAnalogFuelLapTime(DriverHeatData driverData, double lapTime, int lane) {
    if (!isAnalogFuelEnabled()) {
      return;
    }

    AnalogFuelOptions fuelOptions = this.race.getRaceModel().getFuelOptions();
    double lapFuelUsed = 0.0;
    double fastestTime = Math.max(0.1, fuelOptions.getFastestTime());
    double slowestTime = Math.max(fastestTime + 0.001, fuelOptions.getSlowestTime());
    double maxUsage = Math.max(0.0, fuelOptions.getMaxUsage());
    double minUsage = Math.max(0.0, fuelOptions.getMinUsage());

    double racingTime = Math.max(0.1, lapTime - accumulatedRefuelTime[lane]);
    accumulatedRefuelTime[lane] = 0.0; // reset for next lap

    if (racingTime <= fastestTime) {
      lapFuelUsed = maxUsage;
    } else if (racingTime >= slowestTime) {
      lapFuelUsed = minUsage;
    } else {
      switch (fuelOptions.getUsageType()) {
        case LINEAR:
          double progressL = (racingTime - fastestTime) / (slowestTime - fastestTime);
          lapFuelUsed = maxUsage - progressL * (maxUsage - minUsage);
          break;
        case QUADRATIC:
          double invT2 = 1.0 / (racingTime * racingTime);
          double invFast2 = 1.0 / (fastestTime * fastestTime);
          double invSlow2 = 1.0 / (slowestTime * slowestTime);
          double progressQ = (invT2 - invSlow2) / (invFast2 - invSlow2);
          lapFuelUsed = minUsage + progressQ * (maxUsage - minUsage);
          break;
        case CUBIC:
          double invT3 = 1.0 / (racingTime * racingTime * racingTime);
          double invFast3 = 1.0 / (fastestTime * fastestTime * fastestTime);
          double invSlow3 = 1.0 / (slowestTime * slowestTime * slowestTime);
          double progressC = (invT3 - invSlow3) / (invFast3 - invSlow3);
          lapFuelUsed = minUsage + progressC * (maxUsage - minUsage);
          break;
        case CUSTOM_CURVE:
        case CUSTOM:
          double xNorm = (racingTime - fastestTime) / (slowestTime - fastestTime);
          xNorm = Math.max(0.0, Math.min(1.0, xNorm));
          double mult =
              FuelCalculationUtils.interpolateFuelCurve(fuelOptions.getCustomCurve(), xNorm);
          lapFuelUsed = minUsage + mult * (maxUsage - minUsage);
          break;
        default:
          break;
      }
    }

    if (Double.isNaN(lapFuelUsed) || Double.isInfinite(lapFuelUsed)) {
      lapFuelUsed = 0.0;
    }
    lapFuelUsed = Math.max(0, lapFuelUsed);

    double currentFuel = driverData.getDriver().getFuelLevel();
    double newFuel = Math.max(0, currentFuel - lapFuelUsed);
    driverData.getDriver().setFuelLevel(newFuel);
    race.setFuelLevel(lane, newFuel, fuelOptions.getCapacity());

    logger.debug("Lane {} fuel level: {} (used {})", lane, newFuel, lapFuelUsed);

    if (newFuel <= 0 && fuelOptions.getOutOfFuelAction() == FuelOptions.OutOfFuelAction.END_HEAT) {
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

  public double[] getPartialLapTimes() {
    return partialLapTimes;
  }

  public void setPartialLapTime(int lane, double time) {
    if (partialLapTimes != null && lane >= 0 && lane < partialLapTimes.length) {
      partialLapTimes[lane] = time;
      partialLapTimesCaptured = true;
    }
  }

  public void capturePartialLapTimes() {
    if (partialLapTimesCaptured) {
      return;
    }
    partialLapTimesCaptured = true;
    if (timeSinceLastLap != null && partialLapTimes != null) {
      double overshoot = 0.0;
      if (race != null
          && race.getRaceModel() != null
          && race.getRaceModel().getHeatScoring() != null
          && race.getRaceModel().getHeatScoring().getFinishMethod() == FinishMethod.Timed
          && race.getRaceTime() < 0) {
        overshoot = -race.getRaceTime();
      }
      for (int i = 0; i < timeSinceLastLap.length; i++) {
        if (!finishedLanes.contains(i)) {
          partialLapTimes[i] = Math.max(0.0, timeSinceLastLap[i] - overshoot);
        }
      }
    }
  }

  private boolean isSingleLapAutoSegmentsFinish(HeatScoring scoring) {
    if (scoring == null || scoring.getAllowFinish() != AllowFinish.SingleLapAutoSegments) {
      return false;
    }
    if (scoring.getFinishMethod() == FinishMethod.Timed) {
      return race.getRaceTime() <= 0;
    } else {
      return !finishedLanes.isEmpty();
    }
  }

  private void handleSingleLapAutoSegments(
      DriverHeatData driverData, double finalLapTime, int lane) {
    if (!partialLapTimesCaptured) {
      capturePartialLapTimes();
    }
    double partial =
        (partialLapTimes != null && lane < partialLapTimes.length) ? partialLapTimes[lane] : 0.0;
    double median = driverData.getMedianLapTime();
    double pctTraveled = 0.0;
    if (median > 0) {
      pctTraveled = partial / median;
    }
    if (pctTraveled >= 1.0) {
      pctTraveled = 0.99;
    } else if (pctTraveled < 0.0) {
      pctTraveled = 0.0;
    }

    driverData.setAutoCalculatedLaps(pctTraveled);
    finishedLanes.add(lane);
    driverData.setFinished(true);
    driverData.setFlag(race.getState().getLaneFlagType(race, lane));
    logger.info(
        "Driver {} finished single lap (auto segments) on lane {}: partial={}s, lap={}s, median={}s, autoLaps={}",
        driverData.getDriver().getDriver().getName(),
        lane,
        partial,
        finalLapTime,
        median,
        pctTraveled);

    race.setLanePower(false, lane);

    StandingsUpdate standingsUpdate = null;
    if (this.race.getCurrentHeat() != null
        && this.race.getCurrentHeat().getHeatStandings() != null) {
      standingsUpdate = this.race.getCurrentHeat().getHeatStandings().updateStandings();
    }
    this.race.recalculateOverallStandings();

    if (standingsUpdate != null) {
      RaceData standingsDataMsg = RaceData.newBuilder().setStandingsUpdate(standingsUpdate).build();
      this.race.broadcast(standingsDataMsg);
    }
    this.race.updateAndBroadcastOverallStandings();
    if (this.race.getCurrentHeat() != null) {
      this.race.broadcast(
          RaceData.newBuilder()
              .setHeat(HeatConverter.toProto(this.race.getCurrentHeat(), new HashSet<>()))
              .build());
    }

    if (finishedLanes.size() >= race.getCurrentHeat().getActiveDriverCount()) {
      if (race.isLastHeat()) {
        race.changeState(new RaceOver());
      } else {
        race.changeState(new HeatOver());
      }
    }
  }

  public static Map<String, DriverHeatState> buildDriverHeatStates(Race race) {
    Map<String, DriverHeatState> actualDriverStates = new HashMap<>();
    if (race == null) {
      return actualDriverStates;
    }
    List<Heat> heats = race.getHeats();
    int heatIdx = heats != null ? heats.indexOf(race.getCurrentHeat()) : 0;
    if (heatIdx < 0) {
      heatIdx = 0;
    }

    if (heats != null) {
      for (int i = 0; i <= heatIdx; i++) {
        Heat h;
        if (i == heatIdx && race.getCurrentHeat() != null) {
          h = race.getCurrentHeat();
        } else {
          h = heats.get(i);
        }
        if (h != null && h.getDrivers() != null) {
          for (DriverHeatData dhd : h.getDrivers()) {
            if (dhd == null || dhd.getDriver() == null) continue;

            String driverId = PredictionEngine.getParticipantId(dhd.getDriver());

            if (driverId != null && !driverId.isEmpty()) {
              DriverHeatState state =
                  actualDriverStates.computeIfAbsent(driverId, k -> new DriverHeatState());

              if (i < heatIdx) {
                state.totalLapsCompleted += dhd.getLapCount();
                double pastElapsed = Math.max(0, dhd.getReactionTime());
                if (dhd.getLaps() != null) {
                  for (DriverHeatData.LapData lap : dhd.getLaps()) {
                    if (lap != null && lap.getLapTime() > 0) {
                      pastElapsed += lap.getLapTime();
                      state.allRaceLapTimes.add(lap.getLapTime());
                    }
                  }
                }
                state.totalElapsedSec += pastElapsed;
              } else {
                state.totalLapsCompleted += dhd.getLapCount();
                state.currentHeatLapsCompleted = dhd.getLapCount();
                double elapsed = Math.max(0, dhd.getReactionTime());
                if (dhd.getLaps() != null) {
                  for (DriverHeatData.LapData lap : dhd.getLaps()) {
                    if (lap != null && lap.getLapTime() > 0) {
                      state.currentHeatLapTimes.add(lap.getLapTime());
                      state.allRaceLapTimes.add(lap.getLapTime());
                      elapsed += lap.getLapTime();
                    }
                  }
                }
                elapsed += Math.max(0, dhd.getPendingLapTime());
                state.currentHeatPendingLapTime = Math.max(0, dhd.getPendingLapTime());
                state.currentHeatElapsedSec = elapsed;
              }
            }
          }
        }
      }
    }
    return actualDriverStates;
  }

  private void updateRealtimePredictionOnLap() {
    try {
      if (this.race == null || this.race.getRaceModel() == null) {
        return;
      }
      String raceId = this.race.getRaceModel().getEntityId();
      if (raceId == null || raceId.isEmpty()) {
        return;
      }

      DatabaseContext dbCtx = this.race.getDatabaseContext();

      Map<String, DriverHeatState> actualDriverStates = buildDriverHeatStates(this.race);
      List<Heat> heats = this.race.getHeats();
      int heatIdx = heats != null ? heats.indexOf(this.race.getCurrentHeat()) : 0;
      if (heatIdx < 0) {
        heatIdx = 0;
      }

      RacePredictionService.getInstance()
          .updateRealtimePrediction(
              dbCtx,
              raceId,
              this.race.getRaceModel(),
              new ArrayList<>(this.race.getDrivers()),
              this.race.getHeats(),
              heatIdx,
              actualDriverStates,
              this.race.isDemoMode());
    } catch (Exception e) {
      logger.error("Error updating realtime prediction on lap", e);
      try {
        java.io.PrintWriter pw =
            new java.io.PrintWriter(new java.io.FileWriter("/tmp/antigravity_error.log", true));
        pw.println("ERROR IN updateRealtimePredictionOnLap:");
        e.printStackTrace(pw);
        pw.close();
      } catch (Exception ex) {
      }
    }
  }
}
