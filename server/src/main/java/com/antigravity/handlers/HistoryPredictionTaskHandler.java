package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.RacePredictionService;
import com.antigravity.util.CsvExporter;
import com.antigravity.util.RequestContextUtils;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HistoryPredictionTaskHandler {

  private static final Logger logger = LoggerFactory.getLogger(HistoryPredictionTaskHandler.class);
  private final DatabaseContext databaseContext;

  public HistoryPredictionTaskHandler(DatabaseContext databaseContext, Javalin app) {
    this.databaseContext = databaseContext;

    app.get("/api/history/races", this::getRaceHistoryList, Role.VIEWER);
    app.get("/api/history/races/{id}", this::getRaceHistoryById, Role.VIEWER);
    app.get("/api/history/races/{id}/export", this::exportRaceHistoryCsv, Role.VIEWER);
    app.get("/api/history/stats", this::getGlobalStatistics, Role.VIEWER);
    app.get("/api/history/drivers/{driverId}/stats", this::getDriverStatistics, Role.VIEWER);
    app.get("/api/predictions/races/{id}", this::getRacePredictionRecord, Role.VIEWER);
    app.get("/api/predictions/evaluations/{id}", this::getPredictionEvaluationRecord, Role.VIEWER);
  }

  public void getRaceHistoryList(Context ctx) {
    try {
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      List<RaceHistoryRecord> history = dbService.getRaceHistory(databaseContext, scope);
      if (scope == RaceScope.DEMO && history != null) {
        for (RaceHistoryRecord rec : history) {
          rec.setDemo(true);
        }
      }
      ctx.json(history);
    } catch (Exception e) {
      logger.error("Error fetching race history list", e);
      ctx.status(500).result("Error fetching race history list: " + e.getMessage());
    }
  }

  public void getRaceHistoryById(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history = dbService.getRaceHistoryById(databaseContext, id, scope);
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }
      ctx.json(history);
    } catch (Exception e) {
      logger.error("Error fetching race history", e);
      ctx.status(500).result("Error fetching race history: " + e.getMessage());
    }
  }

  public void exportRaceHistoryCsv(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history = dbService.getRaceHistoryById(databaseContext, id, scope);
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }

      com.antigravity.race.Race tempRace = // fqn-collision
          new com.antigravity.race.Race.Builder() // fqn-collision
              .model(history.getModel())
              .track(history.getTrack())
              .drivers(history.getDrivers())
              .heats(history.getHeats())
              .accumulatedRaceTime(history.getAccumulatedRaceTime())
              .statistics(history.getStatistics())
              .build();

      String csvContent = CsvExporter.export(tempRace);

      String raceName =
          history.getModel() != null ? history.getModel().getName() : "Historical_Race";
      String filename =
          raceName.replaceAll("[^a-zA-Z0-9.-]", "_") + "_" + System.currentTimeMillis() + ".csv";
      ctx.header("Content-Disposition", "attachment; filename=\"" + filename + "\"");
      ctx.contentType("text/csv");
      ctx.result(csvContent);

    } catch (Exception e) {
      logger.error("Error exporting race history", e);
      ctx.status(500).result("Error exporting race history: " + e.getMessage());
    }
  }

  public void getGlobalStatistics(Context ctx) {
    try {
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      String raceId = ctx.queryParam("raceId");
      if (raceId == null || raceId.isEmpty()) {
        raceId = "global";
      }
      DatabaseService dbService = DatabaseService.getInstance();
      GlobalStatistics stats = dbService.getGlobalStatistics(databaseContext, raceId, scope);
      ctx.json(stats);
    } catch (Exception e) {
      logger.error("Error fetching global statistics", e);
      ctx.status(500).result("Error fetching global statistics: " + e.getMessage());
    }
  }

  public void getDriverStatistics(Context ctx) {
    try {
      String driverId = ctx.pathParam("driverId");
      String raceId = ctx.queryParam("raceId");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);

      if (!scope.isDemo()) {
        com.antigravity.race.Race activeRace = // fqn-collision
            ClientSubscriptionManager.getInstance().getRace();
        if (activeRace != null && activeRace.getRaceModel() != null) {
          if (raceId == null
              || raceId.isEmpty()
              || activeRace.getRaceModel().getEntityId().equals(raceId)) {
            scope = RaceScope.fromBoolean(activeRace.isDemoMode());
          }
        }
      }

      DatabaseService dbService = DatabaseService.getInstance();
      DriverStatistics stats =
          dbService.getDriverStatistics(databaseContext, driverId, raceId, scope);

      if (stats == null) {
        ctx.status(404).result("Driver statistics not found");
        return;
      }
      ctx.json(stats);
    } catch (Exception e) {
      logger.error("Error fetching driver statistics", e);
      ctx.status(500).result("Error fetching driver statistics: " + e.getMessage());
    }
  }

  public boolean isStalePredictionRecord(
      DatabaseContext database,
      RacePredictionRecord record,
      com.antigravity.race.Race activeRace, // fqn-collision
      boolean isDemo) {
    if (record == null || record.getPreRace() == null) {
      logger.debug("PREDICTION: Stale because record or preRace is null");
      return true;
    }
    if (activeRace != null && activeRace.getState() != null) {
      Object state = activeRace.getState();
      if (state instanceof com.antigravity.race.states.Starting // fqn-collision
          || state instanceof com.antigravity.race.states.Racing // fqn-collision
          || state instanceof com.antigravity.race.states.HeatOver // fqn-collision
          || state instanceof com.antigravity.race.states.RaceOver) { // fqn-collision
        return false;
      }
    }

    List<RacePredictionRecord.DriverProjection> standings =
        record.getPreRace().getProjectedStandings();
    if (standings == null || standings.isEmpty()) {
      logger.debug("PREDICTION: Stale because standings is null or empty");
      return true;
    }

    if (activeRace != null && activeRace.getDrivers() != null) {
      Set<String> activeDriverIds = new HashSet<>();
      for (RaceParticipant rp : activeRace.getDrivers()) {
        if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
          String pId = PredictionEngine.getParticipantId(rp);
          if (pId != null && !pId.isEmpty() && !"EMPTY_LANE".equals(pId)) {
            activeDriverIds.add(pId);
          }
        }
      }

      Set<String> standingDriverIds = new HashSet<>();
      for (RacePredictionRecord.DriverProjection dp : standings) {
        if (dp != null
            && dp.getDriverId() != null
            && !"EMPTY_LANE".equalsIgnoreCase(dp.getDriverId())) {
          standingDriverIds.add(dp.getDriverId());
        }
      }

      if (!standingDriverIds.equals(activeDriverIds)) {
        logger.debug(
            "PREDICTION: Stale because active race drivers do not match prediction standings (active: {}, prediction: {})",
            activeDriverIds.size(),
            standingDriverIds.size());
        return true;
      }

      if (isDriverTrackStatsUpdated(database, record, activeRace, isDemo)) {
        return true;
      }
    }

    double totalWinProb = 0.0;
    Set<Integer> ranks = new HashSet<>();
    for (RacePredictionRecord.DriverProjection dp : standings) {
      if (dp == null || dp.getDriverId() == null) {
        logger.debug("PREDICTION: Stale because driver projection is null");
        return true;
      }
      if (dp.getTotalSimulations() <= 0) {
        logger.trace(
            "PREDICTION: Stale because DriverProjection is missing diagnostic metadata for driver: {}",
            dp.getDriverId());
        return true;
      }
      if ("EMPTY_LANE".equalsIgnoreCase(dp.getDriverId())
          || "Empty Lane".equalsIgnoreCase(dp.getDriverName())) {
        logger.trace("PREDICTION: Stale because empty lane driver found");
        return true;
      }
      if (dp.getProjectedRank() != -1) {
        if (ranks.contains(dp.getProjectedRank())) {
          logger.debug("PREDICTION: Stale because duplicate rank found: " + dp.getProjectedRank());
          return true;
        }
        ranks.add(dp.getProjectedRank());
      } else {
        logger.debug("PREDICTION: Stale because rank is -1 (fallback prediction)");
        return true;
      }
      totalWinProb += dp.getWinProbability();
    }

    if (standings.size() > 1 && totalWinProb >= 0.0 && totalWinProb < 0.95) {
      logger.debug("PREDICTION: Stale because totalWinProb < 0.95: " + totalWinProb);
    }

    return false;
  }

  public boolean isDriverTrackStatsUpdated(
      DatabaseContext context,
      RacePredictionRecord record,
      com.antigravity.race.Race activeRace, // fqn-collision
      boolean isDemo) {
    if (activeRace == null || activeRace.getRaceModel() == null || context == null) {
      return false;
    }
    String trackId = activeRace.getRaceModel().getTrackEntityId();
    if (trackId == null || trackId.isEmpty() || activeRace.getDrivers() == null) {
      return false;
    }
    long recordTimestamp = record.getTimestamp();
    for (RaceParticipant rp : activeRace.getDrivers()) {
      if (rp != null && !PredictionEngine.isParticipantEmpty(rp)) {
        String driverId = PredictionEngine.getParticipantId(rp);
        if (driverId != null && !driverId.isEmpty()) {
          com.antigravity.models.DriverTrackStats dts = // fqn-collision
              DatabaseService.getInstance().getDriverTrackStats(context, driverId, trackId, isDemo);
          if (dts != null && dts.getLastUpdated() > recordTimestamp) {
            logger.info(
                "PREDICTION: Stale in NotStarted state because driver {} track stats updated at {} > record timestamp {}",
                driverId,
                dts.getLastUpdated(),
                recordTimestamp);
            return true;
          }
        }
      }
    }
    return false;
  }

  public void getRacePredictionRecord(Context ctx) {
    try {
      String raceId = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      boolean forceRecalc =
          "true".equals(ctx.queryParam("force")) || "true".equals(ctx.queryParam("recalculate"));
      DatabaseService dbService = DatabaseService.getInstance();
      DatabaseContext reqCtx = (DatabaseContext) ctx.attribute(DatabaseContext.class.getName());
      DatabaseContext dbContext = reqCtx != null ? reqCtx : databaseContext;

      com.antigravity.race.Race activeRace = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();

      if (activeRace != null && activeRace.getRaceModel() != null) {
        String activeId = activeRace.getRaceModel().getEntityId();
        if ("current".equals(raceId) || (activeId != null && activeId.equals(raceId))) {
          scope = RaceScope.fromBoolean(activeRace.isDemoMode());
        }
      }

      String targetRaceId = raceId;
      if ("current".equals(raceId) && activeRace != null && activeRace.getRaceModel() != null) {
        targetRaceId = activeRace.getRaceModel().getEntityId();
      }

      RacePredictionRecord record = null;
      if (!forceRecalc && dbContext != null && targetRaceId != null && !targetRaceId.isEmpty()) {
        record = dbService.getRacePredictionRecord(dbContext, targetRaceId, scope.isDemo());
      }

      boolean isStale = isStalePredictionRecord(dbContext, record, activeRace, scope.isDemo());

      if ((record == null || isStale || forceRecalc)
          && activeRace != null
          && activeRace.getRaceModel() != null) {
        String activeRaceId = activeRace.getRaceModel().getEntityId();
        if (activeRaceId != null && !activeRaceId.isEmpty()) {
          record =
              RacePredictionService.getInstance()
                  .generateAndSavePreRacePrediction(
                      dbContext,
                      activeRaceId,
                      activeRace.getRaceModel(),
                      activeRace.getDrivers(),
                      activeRace.getHeats(),
                      scope.isDemo(),
                      true);

          int currentHeatIdx =
              activeRace.getHeats() != null && activeRace.getCurrentHeat() != null
                  ? activeRace.getHeats().indexOf(activeRace.getCurrentHeat())
                  : 0;
          if (currentHeatIdx < 0) currentHeatIdx = 0;

          Map<String, PredictionEngine.DriverHeatState> actualLaps =
              HeatExecutionManager.buildDriverHeatStates(activeRace);

          RacePredictionService.getInstance()
              .updateRealtimePrediction(
                  dbContext,
                  activeRaceId,
                  activeRace.getRaceModel(),
                  activeRace.getDrivers(),
                  activeRace.getHeats(),
                  currentHeatIdx,
                  actualLaps,
                  scope.isDemo());

          record = dbService.getRacePredictionRecord(dbContext, activeRaceId, scope.isDemo());
        }
      }

      if (record == null) {
        ctx.status(404).result("Race prediction record not found");
        return;
      }
      ctx.json(record);
    } catch (Exception e) {
      logger.error("Error fetching race prediction record", e);
      ctx.status(500).result("Error fetching race prediction record: " + e.getMessage());
    }
  }

  public void getPredictionEvaluationRecord(Context ctx) {
    try {
      ctx.header("Cache-Control", "no-cache, no-store, must-revalidate");
      String raceId = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();

      com.antigravity.race.Race activeRace = // fqn-collision
          ClientSubscriptionManager.getInstance().getRace();

      if (!scope.isDemo() && activeRace != null && activeRace.getRaceModel() != null) {
        if ("current".equals(raceId) || activeRace.getRaceModel().getEntityId().equals(raceId)) {
          scope = RaceScope.fromBoolean(activeRace.isDemoMode());
        }
      }

      String targetRaceId = raceId;
      if ("current".equals(raceId) && activeRace != null && activeRace.getRaceModel() != null) {
        targetRaceId = activeRace.getRaceModel().getEntityId();
      }

      if (activeRace != null && activeRace.getRaceModel() != null) {
        String activeEntityId = activeRace.getRaceModel().getEntityId();
        if ("current".equals(raceId)
            || (activeEntityId != null && activeEntityId.equals(targetRaceId))) {
          if (!(activeRace.getState()
              instanceof com.antigravity.race.states.RaceOver)) { // fqn-collision
            ctx.status(404)
                .result("Prediction evaluation unavailable while race is pre-race or in-race");
            return;
          }
        }
      }

      PredictionEvaluationRecord eval =
          dbService.getPredictionEvaluationRecord(databaseContext, targetRaceId, scope.isDemo());
      if (eval == null) {
        ctx.status(404).result("Prediction evaluation record not found");
        return;
      }
      ctx.json(eval);
    } catch (Exception e) {
      logger.error("Error fetching prediction evaluation record", e);
      ctx.status(500).result("Error fetching prediction evaluation record: " + e.getMessage());
    }
  }
}
