package com.antigravity.race.states;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.RacePredictionRecord.DriverProjection;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.RacePredictionService;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceOver implements IRaceState {
  private static final Logger logger = LoggerFactory.getLogger(RaceOver.class);

  @Override
  public RaceFlag getFlagType(Race race) {
    // Show checkered flag at the end of the last heat when finish is not allowed
    if (race.isLastHeat()
        && race.getRaceModel().getHeatScoring().getAllowFinish() == HeatScoring.AllowFinish.None) {
      return RaceFlag.CHECKERED;
    }
    return RaceFlag.RED;
  }

  @Override
  public void enter(Race race) {
    logger.info("RaceOver state entered.");
    race.broadcastFlag(getFlagType(race));

    race.getStatistics().setEndTime(OffsetDateTime.now().toString());
    long raceStart = race.getStatistics().getStartMillis();
    if (raceStart > 0) {
      race.getStatistics().setDurationMillis(System.currentTimeMillis() - raceStart);
    }

    if (race.getCurrentHeat() != null
        && race.getCurrentHeat().getStatistics().getEndTime() == null) {
      race.getCurrentHeat().getStatistics().setEndTime(OffsetDateTime.now().toString());
      long heatStart = race.getCurrentHeat().getStatistics().getStartMillis();
      // Broadcast final standings one last time
      race.updateAndBroadcastOverallStandings();
      race.updateScoreRecords();
      if (heatStart > 0) {
        race.getCurrentHeat()
            .getStatistics()
            .setDurationMillis(System.currentTimeMillis() - heatStart);
      }
    }

    race.broadcast(race.createSnapshot());

    // Notify EventExecutionManager if running as part of an Event
    try {
      EventExecutionManager.getInstance().onRaceOver(race);
    } catch (Exception e) {
      logger.error("Error notifying EventExecutionManager on race over", e);
    }

    // Save history and update stats (separately if in demo mode)
    try {
      DatabaseContext dbCtx = ClientSubscriptionManager.getInstance().getDatabaseContext();
      if (dbCtx != null) {
        DatabaseService dbService = DatabaseService.getInstance();
        com.mongodb.client.MongoDatabase db = dbCtx.getDatabase();
        if (db != null) {
          // The RaceOver state may be entered from a ScheduledExecutorService thread that
          // has its interrupt flag set when the timer fires. MongoDB's connection pool uses
          // lockInterruptibly() which throws MongoInterruptedException if interrupted.
          // Clear the flag before DB operations so saves succeed, and restore it after.
          boolean wasInterrupted = Thread.interrupted();
          try {
            dbService.saveRaceHistory(db, race);
            dbService.updateGlobalStatistics(db, race);
            dbService.saveDriverStatistics(db, race);
            dbService.updateDriverTrackStats(db, race, race.isDemoMode());
            dbService.saveRaceRecords(db, race);

            if (race.getSeasonEntityId() != null
                && !race.getSeasonEntityId().isEmpty()
                && !com.antigravity.race.EventExecutionManager.getInstance().isEventActive()) { // fqn-collision
              String raceName =
                  race.getRaceModel() != null ? race.getRaceModel().getName() : "Race";
              List<com.antigravity.models.SeasonRaceRecord.SeasonDriverResult> seasonResults = // fqn-collision
                  com.antigravity.util.SeasonPointsCalculator.calculateDriverResultsForRace(race); // fqn-collision
              dbService.commitRaceToSeason(db, race.getSeasonEntityId(), raceName, seasonResults);
            }

            List<DriverProjection> actuals = new ArrayList<>();
            if (race.getDrivers() != null) {
              List<RaceParticipant> sorted = new ArrayList<>(race.getDrivers());
              sorted.sort(Comparator.comparingInt(RaceParticipant::getRank));
              for (int i = 0; i < sorted.size(); i++) {
                RaceParticipant rp = sorted.get(i);
                DriverProjection dp = new DriverProjection();
                dp.setDriverId(
                    PredictionEngine.getParticipantId(rp) != null
                        ? PredictionEngine.getParticipantId(rp)
                        : (rp.getDriver() != null
                            ? rp.getDriver().getEntityId()
                            : rp.getObjectId()));
                dp.setDriverName(rp.getDriver() != null ? rp.getDriver().getName() : "");
                dp.setProjectedRank(rp.getRank() > 0 ? rp.getRank() : i + 1);
                dp.setProjectedLaps(rp.getTotalLaps());
                actuals.add(dp);
              }
            }
            RacePredictionService.getInstance()
                .evaluateAndSavePostRacePrediction(
                    db,
                    race.getRaceModel() != null ? race.getRaceModel().getEntityId() : "current",
                    actuals,
                    race.isDemoMode());
          } finally {
            if (wasInterrupted) {
              Thread.currentThread().interrupt(); // restore the interrupted status
            }
          }
        } else {
          logger.warn("Database is null; skipping race history and statistics persistence.");
        }
      } else {
        logger.info("DatabaseContext is null; skipping race history and statistics persistence.");
      }
    } catch (Exception e) {
      logger.error("Failed to insert race history", e);
    }
  }

  @Override
  public void exit(Race race) {
    logger.info("RaceOver state exited.");
  }

  @Override
  public void nextHeat(Race race) {
    if (EventExecutionManager.getInstance().isEventActive()) {
      try {
        boolean advanced = EventExecutionManager.getInstance().advanceToNextRace();
        if (advanced) {
          return;
        }
      } catch (Exception e) {
        logger.error("Error advancing to next race in event via nextHeat", e);
        throw new IllegalStateException(
            "Failed to advance to next race in event: " + e.getMessage(), e);
      }
    }
    throw new IllegalStateException(
        "Cannot move to next heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void start(Race race) {
    throw new IllegalStateException(
        "Cannot start race: Race is not in NotStarted or Paused state.");
  }

  @Override
  public void pause(Race race) {
    if (EventExecutionManager.getInstance().getAutoAdvanceRemainingSeconds() > 0) {
      EventExecutionManager.getInstance().cancelAutoAdvanceTimer();
      race.broadcast(race.createSnapshot());
      return;
    }
    throw new IllegalStateException("Cannot pause race: Race is not in Starting or Racing state.");
  }

  @Override
  public void restartHeat(Race race) {
    throw new IllegalStateException(
        "Cannot restart heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void skipHeat(Race race) {
    throw new IllegalStateException(
        "Cannot skip heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public void deferHeat(Race race) {
    throw new IllegalStateException(
        "Cannot defer heat from state: " + this.getClass().getSimpleName());
  }

  @Override
  public boolean onLap(int lane, double lapTime, int interfaceId, boolean isDrift) {
    return false;
  }

  @Override
  public void onSegment(int lane, double segmentTime, int interfaceId) {}

  @Override
  public void onCarData(CarData carData) {}

  @Override
  public void onCallbutton(Race race, int lane) {
    logger.info("RaceOver: Ignored onCallbutton - Race is over");
  }
}
