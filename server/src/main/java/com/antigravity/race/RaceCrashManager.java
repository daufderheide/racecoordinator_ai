package com.antigravity.race;

import com.antigravity.converters.HeatConverter;
import com.antigravity.models.CrashAndLearnOptions;
import com.antigravity.models.Race;
import com.antigravity.proto.RaceFlag;
import java.util.HashSet;

public class RaceCrashManager {
  private final com.antigravity.race.Race race; // fqn-collision

  public RaceCrashManager(com.antigravity.race.Race race) { // fqn-collision
    this.race = race;
  }

  public CrashAndLearnOptions getCrashAndLearnOptions() {
    Race raceModel = race.getRaceModel();
    if (raceModel != null && raceModel.getCrashAndLearnOptions() != null) {
      return raceModel.getCrashAndLearnOptions();
    }
    return new CrashAndLearnOptions.Builder().build();
  }

  public boolean isCnlEnabled() {
    Race raceModel = race.getRaceModel();
    return raceModel != null
        && raceModel.getCrashAndLearnOptions() != null
        && raceModel.getCrashAndLearnOptions().isEnabled();
  }

  public synchronized void recordCrash(int lane) {
    if (!isCnlEnabled()
        || race.getCurrentHeat() == null
        || lane < 0
        || lane >= race.getCurrentHeat().getDrivers().size()) {
      return;
    }
    DriverHeatData dhd = race.getCurrentHeat().getDrivers().get(lane);
    if (dhd == null || dhd.isDisqualified()) {
      return;
    }
    if (race.getHeatExecutionManager() != null) {
      race.getHeatExecutionManager().recordCrash(lane);
    }
    updateDriverCrashes(race.getCurrentHeat(), dhd, dhd.getCrashes() + 1);
  }

  public synchronized void updateDriverCrashes(Heat heat, DriverHeatData dhd, int newCrashes) {
    if (dhd == null) {
      return;
    }
    newCrashes = Math.max(0, newCrashes);
    dhd.setCrashes(newCrashes);

    if (isCnlEnabled()) {
      CrashAndLearnOptions cnl = getCrashAndLearnOptions();
      dhd.setPenaltyLaps(newCrashes * cnl.getHeatCrashLapPenalty());
      dhd.setPenaltyTime(newCrashes * cnl.getHeatTimePenalty());

      boolean shouldDq = (newCrashes > cnl.getMaxCrashes());
      boolean wasDq = dhd.isDisqualified();

      if (shouldDq != wasDq) {
        dhd.setDisqualified(shouldDq);
        if (dhd.getDriver() != null) {
          dhd.getDriver().setDisqualified(shouldDq);
        }
        if (shouldDq) {
          dhd.setDqScorePercentage(cnl.getDqHeatScorePercentage());
          if (heat != null && heat.getDrivers() != null) {
            int laneIdx = heat.getDrivers().indexOf(dhd);
            if (laneIdx >= 0) {
              race.setLanePower(false, laneIdx);
              dhd.setFlag(
                  race.getState() != null
                      ? race.getState().getLaneFlagType(race, laneIdx)
                      : RaceFlag.BLACK);
              dhd.setFinished(true);
              if (race.getHeatExecutionManager() != null) {
                race.getHeatExecutionManager().getFinishedLanes().add(laneIdx);
              }
              calculateDqAutoSegments(dhd, laneIdx);
            }
          }
        } else {
          dhd.setDqScorePercentage(100.0);
          if (heat != null && heat.getDrivers() != null) {
            int laneIdx = heat.getDrivers().indexOf(dhd);
            if (laneIdx >= 0) {
              dhd.setFlag(
                  race.getState() != null
                      ? race.getState().getLaneFlagType(race, laneIdx)
                      : RaceFlag.GREEN);
              dhd.setFinished(false);
              if (race.getHeatExecutionManager() != null) {
                race.getHeatExecutionManager().getFinishedLanes().remove(laneIdx);
              }
              dhd.setAutoCalculatedLaps(0.0);
            }
          }
          race.syncLanePowerWithState(race.isMainPower());
        }
      }
    }

    if (dhd.getDriver() != null) {
      dhd.getDriver().setCrashes(newCrashes);
    }

    if (heat != null && heat.getHeatStandings() != null) {
      heat.getHeatStandings().updateStandings();
    }
    race.updateAndBroadcastOverallStandings();
    if (heat != null) {
      race.broadcast(HeatConverter.toProto(heat, new HashSet<>()));
    }
  }

  public void calculateDqAutoSegments(DriverHeatData dhd, int lane) {
    if (race.getHeatExecutionManager() != null) {
      race.getHeatExecutionManager().calculateDqAutoSegments(dhd, lane);
    }
  }

  public void initializeHeatDrivers(Heat currentHeat) {
    if (!isCnlEnabled() || currentHeat == null || currentHeat.getDrivers() == null) {
      return;
    }
    CrashAndLearnOptions cnl = getCrashAndLearnOptions();
    boolean resetDq = cnl.isResetDqEachHeat();
    boolean resetCrashes = cnl.isResetCrashesEachHeat();

    for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
      DriverHeatData heatData = currentHeat.getDrivers().get(i);
      RaceParticipant participant = heatData.getDriver();
      if (participant == null) {
        continue;
      }

      if (resetDq && participant.isDisqualified()) {
        participant.setDisqualified(false);
        participant.setCrashes(0);
      }
      if (resetCrashes) {
        participant.setCrashes(0);
      }

      heatData.setCrashes(participant.getCrashes());
      heatData.setDisqualified(participant.isDisqualified());
      heatData.setDqScorePercentage(cnl.getDqHeatScorePercentage());
      heatData.setPenaltyLaps(heatData.getCrashes() * cnl.getHeatCrashLapPenalty());
      heatData.setPenaltyTime(heatData.getCrashes() * cnl.getHeatTimePenalty());
      if (heatData.isDisqualified()) {
        heatData.setFinished(true);
        if (race.getHeatExecutionManager() != null) {
          race.getHeatExecutionManager().getFinishedLanes().add(i);
        }
        heatData.setAutoCalculatedLaps(0.0);
      }
    }
  }

  public void resetCurrentHeat(Heat currentHeat) {
    if (!isCnlEnabled() || currentHeat == null || currentHeat.getDrivers() == null) {
      return;
    }
    CrashAndLearnOptions cnl = getCrashAndLearnOptions();
    for (int i = 0; i < currentHeat.getDrivers().size(); i++) {
      DriverHeatData dhd = currentHeat.getDrivers().get(i);
      RaceParticipant p = dhd.getDriver();
      if (p != null) {
        dhd.setCrashes(p.getCrashes());
        dhd.setDisqualified(p.isDisqualified());
        dhd.setDqScorePercentage(cnl.getDqHeatScorePercentage());
        dhd.setPenaltyLaps(dhd.getCrashes() * cnl.getHeatCrashLapPenalty());
        dhd.setPenaltyTime(dhd.getCrashes() * cnl.getHeatTimePenalty());
        if (dhd.isDisqualified()) {
          dhd.setFinished(true);
          if (race.getHeatExecutionManager() != null) {
            race.getHeatExecutionManager().getFinishedLanes().add(i);
          }
          dhd.setAutoCalculatedLaps(0.0);
        }
      }
    }
  }
}
