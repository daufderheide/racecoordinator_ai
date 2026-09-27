package com.antigravity.race.states;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.AllowFinish;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import java.util.List;

public interface IRaceState {

  RaceFlag getFlagType(Race race);

  default RaceFlag getLaneFlagType(Race race, int lane) {
    RaceFlag baseFlag = getFlagType(race);
    if (race == null || race.getCurrentHeat() == null) return baseFlag;

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (lane < 0 || lane >= drivers.size()) return baseFlag;

    DriverHeatData dhd = drivers.get(lane);
    if (dhd == null) return baseFlag;

    // 1) Out of fuel
    if (dhd.getDriver() != null && dhd.getDriver().getFuelLevel() <= 0) {
      // Only if fuel is enabled
      if (race.getHeatExecutionManager().isAnalogFuelEnabled()
          || race.getHeatExecutionManager().isDigitalFuelEnabled()) {
        return race.getTheme() != null
            ? race.getTheme().resolveFlag("flag.penalty", RaceFlag.BLACK, race.getDatabaseContext())
            : RaceFlag.BLACK;
      }
    }

    // 2) False start penalty
    if (dhd.getRemainingFalseStartTimePenalty() > 0) {
      return race.getTheme() != null
          ? race.getTheme().resolveFlag("flag.penalty", RaceFlag.BLACK, race.getDatabaseContext())
          : RaceFlag.BLACK;
    }

    // 3) Driver Finished
    // The driver finished driver state flag should only be shown in allow finish races
    // when the driver has finished but not all drivers have finished.
    if (isAllowFinish(race) && isDriverFinished(race, lane, dhd) && !areAllDriversFinished(race)) {
      RaceFlag warmupFlag =
          race.getTheme() != null
              ? race.getTheme()
                  .resolveFlag("flag.warmup", RaceFlag.GREEN_YELLOW, race.getDatabaseContext())
              : RaceFlag.GREEN_YELLOW;
      if (baseFlag == warmupFlag) {
        return baseFlag;
      }

      return race.getTheme() != null
          ? race.getTheme()
              .resolveFlag("flag.driver_finished", RaceFlag.RED, race.getDatabaseContext())
          : RaceFlag.RED;
    }

    // Once all drivers finish the driver state flag should use the heat over or race over flag
    // depending on the state of the race.
    if (areAllDriversFinished(race)) {
      RaceFlag warmupFlag =
          race.getTheme() != null
              ? race.getTheme()
                  .resolveFlag("flag.warmup", RaceFlag.GREEN_YELLOW, race.getDatabaseContext())
              : RaceFlag.GREEN_YELLOW;
      if (baseFlag == warmupFlag) {
        return baseFlag;
      }

      boolean isRaceOver =
          (this instanceof RaceOver)
              || (race.getState() instanceof RaceOver)
              || (!(this instanceof HeatOver) && race.isLastHeat());
      if (isRaceOver) {
        return race.getTheme() != null
            ? race.getTheme()
                .resolveFlag("flag.race_over", RaceFlag.CHECKERED, race.getDatabaseContext())
            : RaceFlag.CHECKERED;
      } else {
        return race.getTheme() != null
            ? race.getTheme().resolveFlag("flag.heat_over", RaceFlag.RED, race.getDatabaseContext())
            : RaceFlag.RED;
      }
    }

    if (this instanceof Racing || (race.getState() instanceof Racing)) {
      HeatScoring scoring =
          race.getRaceModel() != null ? race.getRaceModel().getHeatScoring() : null;
      if (scoring != null && scoring.getFinishMethod() == FinishMethod.Lap) {
        if (dhd.getLapCount() == scoring.getFinishValue() - 1) {
          return race.getTheme() != null
              ? race.getTheme()
                  .resolveFlag("flag.one_lap_to_go", RaceFlag.WHITE, race.getDatabaseContext())
              : RaceFlag.WHITE;
        }
      }
      return race.getTheme() != null
          ? race.getTheme().resolveFlag("flag.racing", RaceFlag.GREEN, race.getDatabaseContext())
          : RaceFlag.GREEN;
    }

    return baseFlag;
  }

  default boolean isAllowFinish(Race race) {
    if (race == null || race.getRaceModel() == null) return false;
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    return scoring != null
        && scoring.getAllowFinish() != null
        && scoring.getAllowFinish() != AllowFinish.None
        && scoring.getAllowFinish() != AllowFinish.NoneAutoSegments;
  }

  default boolean areAllDriversFinished(Race race) {
    if (race == null || race.getCurrentHeat() == null) return false;

    // In HeatOver or RaceOver, all active drivers in the current heat have finished
    if (this instanceof HeatOver || this instanceof RaceOver) {
      return true;
    }

    if (this instanceof NotStarted || this instanceof Starting) {
      return false;
    }

    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (drivers == null || drivers.isEmpty()) return false;

    int activeCount = race.getCurrentHeat().getActiveDriverCount();
    if (activeCount > 0
        && race.getHeatExecutionManager() != null
        && race.getHeatExecutionManager().getFinishedLanes().size() >= activeCount) {
      return true;
    }

    int checkedCount = 0;
    for (int i = 0; i < drivers.size(); i++) {
      DriverHeatData dhd = drivers.get(i);
      if (dhd != null && (activeCount == 0 || isDriverActive(dhd))) {
        checkedCount++;
        if (!isDriverFinished(race, i, dhd)) {
          return false;
        }
      }
    }
    return checkedCount > 0;
  }

  default boolean isDriverActive(DriverHeatData driverData) {
    if (driverData == null) return false;
    if (driverData.getActualDriver() != null
        && driverData.getActualDriver().getEntityId() != null
        && !driverData.getActualDriver().isEmpty()) {
      return true;
    }
    return driverData.getDriver() != null
        && driverData.getDriver().getDriver() != null
        && driverData.getDriver().getDriver().getEntityId() != null
        && !driverData.getDriver().getDriver().isEmpty();
  }

  default boolean isDriverFinished(Race race, int laneIndex, DriverHeatData hd) {
    if (race == null || race.getRaceModel() == null || hd == null) return false;
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring == null) return false;

    // In HeatOver or RaceOver, all active drivers in the current heat have finished
    if (this instanceof HeatOver || this instanceof RaceOver) {
      return true;
    }

    if (this instanceof NotStarted || this instanceof Starting) {
      return false;
    }

    // Check if they are already in the finished lanes list (most authoritative)
    if (race.getHeatExecutionManager() != null
        && race.getHeatExecutionManager().getFinishedLanes().contains(laneIndex)) {
      return true;
    }

    if (scoring.getFinishMethod() == FinishMethod.Lap) {
      return hd.getLapCount() >= scoring.getFinishValue();
    } else if (scoring.getFinishMethod() == FinishMethod.Timed) {
      if (scoring.getAllowFinish() == AllowFinish.None
          || scoring.getAllowFinish() == AllowFinish.NoneAutoSegments) {
        return race.getRaceTime() <= 0;
      }
    }
    return false;
  }

  void enter(Race race);

  void exit(Race race);

  void start(Race race);

  void pause(Race race);

  void nextHeat(Race race);

  void restartHeat(Race race);

  void skipHeat(Race race);

  void deferHeat(Race race);

  // From the protocol listener
  boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift);

  default boolean handleLap(Race race, int lane, double lapTime, int interfaceId, boolean isDrift) {
    if (race != null && race.getHeatExecutionManager() != null) {
      return race.getHeatExecutionManager().onLap(lane, lapTime, interfaceId, false, true, isDrift);
    }
    return false;
  }

  void onSegment(int lane, double segmentTime, int interfaceId);

  void onCarData(CarData carData);

  void onCallbutton(Race race, int lane);

  default boolean canChangeLane(Race race) {
    return false;
  }

  default void syncDriverFlags(Race race) {
    if (race == null || race.getCurrentHeat() == null) return;
    List<DriverHeatData> drivers = race.getCurrentHeat().getDrivers();
    if (drivers != null) {
      for (int lane = 0; lane < drivers.size(); lane++) {
        DriverHeatData dhd = drivers.get(lane);
        if (dhd != null) {
          RaceFlag flag = getLaneFlagType(race, lane);
          dhd.setFlag(flag);
        }
      }
    }
  }
}
