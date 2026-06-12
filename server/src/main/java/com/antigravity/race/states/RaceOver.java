package com.antigravity.race.states;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.HeatScoring;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarData;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.Race;
import com.antigravity.service.DatabaseService;
import java.time.OffsetDateTime;
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
            dbService.saveRaceRecords(db, race);
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
