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

    // 3) Finished in Allow Finish mode - show driver_finished instead of CHECKERED for the driver
    if (race.getRaceModel() != null && race.getRaceModel().getHeatScoring() != null) {
      HeatScoring scoring = race.getRaceModel().getHeatScoring();
      if (scoring.getAllowFinish() != null
          && scoring.getAllowFinish() != AllowFinish.None
          && scoring.getAllowFinish() != AllowFinish.NoneAutoSegments) {
        if (isDriverFinished(race, lane, dhd)) {
          return race.getTheme() != null
              ? race.getTheme()
                  .resolveFlag("flag.driver_finished", RaceFlag.RED, race.getDatabaseContext())
              : RaceFlag.RED;
        }
      }
    }

    return baseFlag;
  }

  default boolean isDriverFinished(Race race, int laneIndex, DriverHeatData hd) {
    if (race == null || race.getRaceModel() == null || hd == null) return false;
    HeatScoring scoring = race.getRaceModel().getHeatScoring();
    if (scoring == null) return false;

    // Check if they are already in the finished lanes list (most authoritative)
    if (race.getHeatExecutionManager() != null
        && race.getHeatExecutionManager().getFinishedLanes().contains(laneIndex)) {
      return true;
    }

    if (scoring.getFinishMethod() == FinishMethod.Lap) {
      return hd.getLapCount() >= scoring.getFinishValue();
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
}
