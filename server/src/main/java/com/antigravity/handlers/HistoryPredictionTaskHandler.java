package com.antigravity.handlers;

import com.antigravity.auth.Role;
import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.PredictionEvaluationRecord;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.RacePredictionRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.HeatExecutionManager;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.Racing;
import com.antigravity.service.DatabaseService;
import com.antigravity.service.RacePredictionService;
import com.antigravity.util.CsvExporter;
import com.antigravity.util.RequestContextUtils;
import com.antigravity.util.SeasonPointsCalculator;
import io.javalin.Javalin;
import io.javalin.http.Context;
import java.util.Collections;
import java.util.HashMap;
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
    app.post("/api/history/races/{id}/load", this::loadRaceHistory, Role.DIRECTOR);
    app.post("/api/history/races/{id}/lap-sections", this::updateHistoryLapSections, Role.DIRECTOR);
    app.put(
        "/api/history/races/{id}/heats/{heatNumber}/drivers/{lane}/laps/{lapIndex}/record-status",
        this::updateHistoryLapRecordStatus,
        Role.DIRECTOR);
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
      if (history != null) {
        for (RaceHistoryRecord rec : history) {
          if (scope == RaceScope.DEMO) {
            rec.setDemo(true);
          }
          if (rec.getTimestamp() != null) {
            rec.setTimestamp(rec.getTimestamp());
          }
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
        RaceScope altScope = (scope == RaceScope.DEMO) ? RaceScope.PRODUCTION : RaceScope.DEMO;
        history = dbService.getRaceHistoryById(databaseContext, id, altScope);
      }
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
        RaceScope altScope = (scope == RaceScope.DEMO) ? RaceScope.PRODUCTION : RaceScope.DEMO;
        history = dbService.getRaceHistoryById(databaseContext, id, altScope);
      }
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

  public void loadRaceHistory(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      Race currentRace = ClientSubscriptionManager.getInstance().getRace();
      if (currentRace != null
          && (currentRace.getState() instanceof Racing
              || currentRace.getState() instanceof Paused)) {
        ctx.status(409)
            .result(
                "A live race is currently in progress. Please pause and save or finish it first.");
        return;
      }

      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history = findHistoryRecord(id, scope, dbService);
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }

      Race race = dbService.buildRuntimeRaceFromHistory(databaseContext, history);
      if (race == null) {
        ctx.status(500).result("Failed to build race from history");
        return;
      }

      ClientSubscriptionManager.getInstance().setRace(race);
      if (!race.isFinished()) {
        race.init();
      }
      ClientSubscriptionManager.getInstance().broadcast(race.createSnapshot());

      ctx.status(200).result("Race history loaded successfully");
    } catch (Exception e) {
      logger.error("Error loading race history", e);
      ctx.status(500).result("Error loading race history: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public void updateHistoryLapSections(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      List<Map<String, Object>> updates = ctx.bodyAsClass(List.class);
      if (updates == null || updates.isEmpty()) {
        ctx.status(400).result("Updates cannot be empty");
        return;
      }

      DatabaseService dbService = DatabaseService.getInstance();
      Race targetRace = resolveTargetRaceForEdit(id, scope, dbService);
      if (targetRace == null) {
        ctx.status(404).result("Race history not found");
        return;
      }

      String applyError = applyLapSectionUpdates(targetRace, updates);
      if (applyError != null) {
        ctx.status(400).result(applyError);
        return;
      }

      postProcessHistoricalSectionUpdates(targetRace, dbService);

      Race currentRace = ClientSubscriptionManager.getInstance().getRace();
      if (currentRace != null && id.equals(currentRace.getHistoryRecordId())) {
        ClientSubscriptionManager.getInstance().broadcast(targetRace.createSnapshot());
      }

      ctx.status(200).result("History lap sections updated successfully");
    } catch (Exception e) {
      logger.error("Error updating history lap sections", e);
      ctx.status(500).result("Error updating history lap sections: " + e.getMessage());
    }
  }

  private RaceHistoryRecord findHistoryRecord(
      String id, RaceScope scope, DatabaseService dbService) {
    RaceHistoryRecord history = dbService.getRaceHistoryById(databaseContext, id, scope);
    if (history == null) {
      RaceScope altScope = (scope == RaceScope.DEMO) ? RaceScope.PRODUCTION : RaceScope.DEMO;
      history = dbService.getRaceHistoryById(databaseContext, id, altScope);
      if (history != null) {
        history.setDemo(altScope.isDemo());
      }
    }
    return history;
  }

  private Race resolveTargetRaceForEdit(String id, RaceScope scope, DatabaseService dbService) {
    Race currentRace = ClientSubscriptionManager.getInstance().getRace();
    if (currentRace != null && id.equals(currentRace.getHistoryRecordId())) {
      return currentRace;
    }
    RaceHistoryRecord history = findHistoryRecord(id, scope, dbService);
    if (history == null) {
      return null;
    }
    Race reconstructed = dbService.buildRuntimeRaceFromHistory(databaseContext, history);
    if (reconstructed != null) {
      reconstructed.init();
    }
    return reconstructed;
  }

  private String applyLapSectionUpdates(Race race, List<Map<String, Object>> updates) {
    Set<Heat> heatsToRecalc = new HashSet<>();
    for (Map<String, Object> u : updates) {
      int heatNumber = ((Number) u.get("heatNumber")).intValue();
      int lane =
          u.containsKey("laneIndex")
              ? ((Number) u.get("laneIndex")).intValue()
              : ((Number) u.get("lane")).intValue();
      double userLaps = ((Number) u.get("userLaps")).doubleValue();

      Heat targetHeat = null;
      for (Heat h : race.getHeats()) {
        if (h.getHeatNumber() == heatNumber) {
          targetHeat = h;
          break;
        }
      }
      if (targetHeat == null) {
        return "Heat not found: " + heatNumber;
      }
      if (lane < 0 || lane >= targetHeat.getDrivers().size()) {
        return "Invalid lane index: " + lane;
      }
      targetHeat.getDrivers().get(lane).setUserLaps(userLaps);
      heatsToRecalc.add(targetHeat);
    }

    for (Heat h : heatsToRecalc) {
      h.initializeStandings(race.getRaceModel().getHeatScoring(), race.getRaceModel().isPractice());
    }
    race.updateAndBroadcastOverallStandings();
    race.updateScoreRecords();
    return null;
  }

  private void postProcessHistoricalSectionUpdates(Race race, DatabaseService dbService) {
    dbService.saveRaceHistory(databaseContext, race);
    String seasonEntityId = race.getSeasonEntityId();
    String raceName = race.getRaceModel() != null ? race.getRaceModel().getName() : "Race";
    long raceStart = race.getStatistics() != null ? race.getStatistics().getStartMillis() : 0L;
    if (seasonEntityId == null || seasonEntityId.isEmpty()) {
      seasonEntityId =
          dbService.findSeasonIdForHistoryRecord(
              databaseContext, race.getHistoryRecordId(), raceStart, raceName, race.isDemoMode());
      if (seasonEntityId != null) {
        race.setSeasonEntityId(seasonEntityId);
      }
    }

    if (seasonEntityId != null && !seasonEntityId.isEmpty()) {
      List<SeasonDriverResult> newSeasonResults =
          SeasonPointsCalculator.calculateDriverResultsForRace(race);
      dbService.updateSeasonRaceResults(
          databaseContext,
          seasonEntityId,
          race.getHistoryRecordId(),
          raceStart,
          raceName,
          race.isDemoMode(),
          newSeasonResults);
    }

    String raceEntityId = race.getRaceModel() != null ? race.getRaceModel().getEntityId() : null;
    if (raceEntityId != null && !raceEntityId.isEmpty()) {
      dbService.recalculateStatisticsAfterHistoryEdit(
          databaseContext, raceEntityId, race.isDemoMode());
    }
    dbService.updateDriverTrackStats(databaseContext, race, race.isDemoMode());
    dbService.saveRaceRecords(databaseContext, race);
  }

  @SuppressWarnings("unchecked")
  public void updateHistoryLapRecordStatus(Context ctx) {
    try {
      String id = ctx.pathParam("id");
      int heatNumber = Integer.parseInt(ctx.pathParam("heatNumber"));
      int lane = Integer.parseInt(ctx.pathParam("lane"));
      int lapIndex = Integer.parseInt(ctx.pathParam("lapIndex"));
      Map<String, Object> body = ctx.bodyAsClass(HashMap.class);
      boolean countTowardsRecords =
          body.containsKey("countTowardsRecords")
              ? (Boolean) body.get("countTowardsRecords")
              : true;

      RaceScope scope = RequestContextUtils.getRaceScope(ctx);
      DatabaseService dbService = DatabaseService.getInstance();
      RaceHistoryRecord history = dbService.getRaceHistoryById(databaseContext, id, scope);
      if (history == null) {
        RaceScope altScope = (scope == RaceScope.DEMO) ? RaceScope.PRODUCTION : RaceScope.DEMO;
        history = dbService.getRaceHistoryById(databaseContext, id, altScope);
        if (history != null) {
          scope = altScope;
          history.setDemo(altScope.isDemo());
        }
      }
      if (history == null) {
        ctx.status(404).result("Race history not found");
        return;
      }

      DriverHeatData dhd = findHistoryDriverHeatData(history, heatNumber, lane);
      if (dhd == null) {
        ctx.status(400).result("Heat or lane not found");
        return;
      }
      if (lapIndex < 0 || lapIndex >= dhd.getLaps().size()) {
        ctx.status(400).result("Invalid lap index: " + lapIndex);
        return;
      }

      DriverHeatData.LapData targetLap = dhd.getLaps().get(lapIndex);
      targetLap.setCountTowardsRecords(countTowardsRecords);
      dhd.recalculateBestLapTime();

      dbService.saveRawRaceHistoryRecord(databaseContext, history);

      String raceEntityId = history.getOriginalEntityId();
      if (raceEntityId == null && history.getModel() != null) {
        raceEntityId = history.getModel().getEntityId();
      }
      if (raceEntityId != null && !raceEntityId.isEmpty()) {
        dbService.recalculateStatisticsAfterHistoryEdit(
            databaseContext, raceEntityId, scope.isDemo());
      }

      ctx.status(200).json(Collections.singletonMap("bestLapTime", dhd.getBestLapTime()));
    } catch (Exception e) {
      logger.error("Error updating history lap record status", e);
      ctx.status(500).result("Error updating history lap record status: " + e.getMessage());
    }
  }

  private DriverHeatData findHistoryDriverHeatData(
      RaceHistoryRecord history, int heatNumber, int lane) {
    if (history.getHeats() == null) return null;
    for (Heat h : history.getHeats()) {
      if (h.getHeatNumber() == heatNumber) {
        if (h.getDrivers() == null) return null;
        if (lane >= 0 && lane < h.getDrivers().size()) {
          DriverHeatData direct = h.getDrivers().get(lane);
          if (direct != null && (direct.getLane() == lane || direct.getLane() == 0)) {
            return direct;
          }
        }
        for (DriverHeatData d : h.getDrivers()) {
          if (d.getLane() == lane) {
            return d;
          }
        }
        if (lane >= 0 && lane < h.getDrivers().size()) {
          return h.getDrivers().get(lane);
        }
        return null;
      }
    }
    return null;
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
