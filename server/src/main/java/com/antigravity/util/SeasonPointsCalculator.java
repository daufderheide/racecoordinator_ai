package com.antigravity.util;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Driver;
import com.antigravity.models.Season;
import com.antigravity.models.SeasonRaceRecord;
import com.antigravity.models.SeasonRaceRecord.SeasonDriverResult;
import com.antigravity.models.SeasonScoring;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.EventExecutionManager;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.states.HeatOver;
import com.antigravity.race.states.IRaceState;
import com.antigravity.race.states.Paused;
import com.antigravity.race.states.RaceOver;
import com.antigravity.race.states.Racing;
import com.antigravity.service.DatabaseService;
import com.mongodb.client.MongoDatabase;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class SeasonPointsCalculator {

  private static boolean hasAnyLaps(Heat heat) {
    if (heat == null || heat.getDrivers() == null) {
      return false;
    }
    for (DriverHeatData dhd : heat.getDrivers()) {
      if (dhd != null && dhd.getLaps() != null && !dhd.getLaps().isEmpty()) {
        return true;
      }
    }
    return false;
  }

  public static class DriverSeasonStanding {
    private final String driverId;
    private final String driverName;
    private final int netPoints;
    private final int grossPoints;
    private final int racesRun;
    private final List<DriverRaceScoreDetail> raceScores;

    public DriverSeasonStanding(
        String driverId,
        String driverName,
        int netPoints,
        int grossPoints,
        int racesRun,
        List<DriverRaceScoreDetail> raceScores) {
      this.driverId = driverId;
      this.driverName = driverName;
      this.netPoints = netPoints;
      this.grossPoints = grossPoints;
      this.racesRun = racesRun;
      this.raceScores = raceScores;
    }

    public String getDriverId() {
      return driverId;
    }

    public String getDriverName() {
      return driverName;
    }

    public int getNetPoints() {
      return netPoints;
    }

    public int getGrossPoints() {
      return grossPoints;
    }

    public int getRacesRun() {
      return racesRun;
    }

    public List<DriverRaceScoreDetail> getRaceScores() {
      return raceScores;
    }

    public int getCurrentRacePoints() {
      if (raceScores != null) {
        for (DriverRaceScoreDetail detail : raceScores) {
          if ("live_race".equals(detail.getRaceId()) || "live_event".equals(detail.getRaceId())) {
            return detail.getTotalPoints();
          }
        }
      }
      return 0;
    }
  }

  public static class DriverRaceScoreDetail {
    private final String raceId;
    private final String raceName;
    private final int overallRank;
    private final int overallPoints;
    private final int heatPoints;
    private final int totalPoints;
    private boolean isDropped;

    public DriverRaceScoreDetail(
        String raceId,
        String raceName,
        int overallRank,
        int overallPoints,
        int heatPoints,
        int totalPoints) {
      this.raceId = raceId;
      this.raceName = raceName;
      this.overallRank = overallRank;
      this.overallPoints = overallPoints;
      this.heatPoints = heatPoints;
      this.totalPoints = totalPoints;
      this.isDropped = false;
    }

    public String getRaceId() {
      return raceId;
    }

    public String getRaceName() {
      return raceName;
    }

    public int getOverallRank() {
      return overallRank;
    }

    public int getOverallPoints() {
      return overallPoints;
    }

    public int getHeatPoints() {
      return heatPoints;
    }

    public int getTotalPoints() {
      return totalPoints;
    }

    public boolean isDropped() {
      return isDropped;
    }

    public void setDropped(boolean isDropped) {
      this.isDropped = isDropped;
    }
  }

  private static boolean isHeatCompleted(
      Heat heat, int hIdx, int currentHeatIdx, IRaceState raceState) {
    if (raceState instanceof RaceOver) {
      return true;
    }
    if (currentHeatIdx >= 0) {
      if (hIdx < currentHeatIdx) {
        return true;
      }
      if (hIdx == currentHeatIdx) {
        if (raceState instanceof HeatOver) {
          return true;
        }
        if ((raceState instanceof Racing || raceState instanceof Paused) && hasAnyLaps(heat)) {
          return true;
        }
      }
    } else {
      if (heat.getStatistics() != null && heat.getStatistics().getEndTime() != null) {
        return true;
      }
      if (heat.isStarted() && hasAnyLaps(heat)) {
        return true;
      }
    }
    return false;
  }

  public static List<SeasonDriverResult> calculateDriverResultsForRace(
      com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null || runtimeRace.getDrivers() == null) {
      return new ArrayList<>();
    }

    SeasonScoring scoring =
        runtimeRace.getRaceModel() != null && runtimeRace.getRaceModel().getSeasonScoring() != null
            ? runtimeRace.getRaceModel().getSeasonScoring()
            : new SeasonScoring();

    List<Integer> posPointsList = scoring.getPositionPoints();
    List<Integer> heatPosPointsList = scoring.getHeatPositionPoints();

    // 1. Calculate overall position points per driver
    List<RaceParticipant> sortedParticipants = new ArrayList<>(runtimeRace.getDrivers());
    sortedParticipants.sort(Comparator.comparingInt(RaceParticipant::getRank));

    Map<String, Integer> driverOverallPoints = new HashMap<>();
    Map<String, Integer> driverOverallRanks = new HashMap<>();
    Map<String, String> driverNames = new HashMap<>();

    for (int i = 0; i < sortedParticipants.size(); i++) {
      RaceParticipant rp = sortedParticipants.get(i);
      if (rp == null || rp.getDriver() == null || Driver.isEmpty(rp.getDriver())) {
        continue;
      }
      String driverId = rp.getDriver().getEntityId();
      String driverName = rp.getDriver().getDisplayName();
      int rank = rp.getRank() > 0 ? rp.getRank() : (i + 1);

      int posPoints = 0;
      int pointIdx = rank - 1;
      if (pointIdx >= 0 && pointIdx < posPointsList.size()) {
        posPoints = posPointsList.get(pointIdx);
      }

      driverOverallPoints.put(driverId, posPoints);
      driverOverallRanks.put(driverId, rank);
      driverNames.put(driverId, driverName);
    }

    // 2. Calculate heat position points per driver across completed or active heats
    Map<String, Integer> driverHeatPoints = new HashMap<>();
    List<Heat> heats = runtimeRace.getHeats();
    Heat currentHeat = runtimeRace.getCurrentHeat();
    int currentHeatIdx = (heats != null && currentHeat != null) ? heats.indexOf(currentHeat) : -1;
    IRaceState raceState = runtimeRace.getState();

    if (heats != null) {
      for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
        Heat heat = heats.get(hIdx);
        if (heat == null || heat.getDrivers() == null) continue;

        if (!isHeatCompleted(heat, hIdx, currentHeatIdx, raceState)) {
          continue;
        }

        List<DriverHeatData> heatDrivers = new ArrayList<>(heat.getDrivers());
        // Sort drivers in heat by performance (laps desc, then total time asc)
        heatDrivers.sort(
            (a, b) -> {
              int aLaps = a.getLaps() != null ? a.getLaps().size() : 0;
              int bLaps = b.getLaps() != null ? b.getLaps().size() : 0;
              if (aLaps != bLaps) {
                return Integer.compare(bLaps, aLaps);
              }
              return Double.compare(a.getTotalTime(), b.getTotalTime());
            });

        for (int laneIdx = 0; laneIdx < heatDrivers.size(); laneIdx++) {
          DriverHeatData dhd = heatDrivers.get(laneIdx);
          Driver drv = null;
          if (dhd != null && dhd.getDriver() != null && dhd.getDriver().getDriver() != null) {
            drv = dhd.getDriver().getDriver();
          } else if (dhd != null) {
            drv = dhd.getActualDriver();
          }
          if (drv == null || Driver.isEmpty(drv)) {
            continue;
          }
          String driverId = drv.getEntityId();
          int heatPoints = 0;
          if (laneIdx < heatPosPointsList.size()) {
            heatPoints = heatPosPointsList.get(laneIdx);
          }
          driverHeatPoints.put(driverId, driverHeatPoints.getOrDefault(driverId, 0) + heatPoints);
        }
      }
    }

    // 3. Combine into SeasonDriverResult list
    List<SeasonDriverResult> results = new ArrayList<>();
    for (String driverId : driverNames.keySet()) {
      String name = driverNames.get(driverId);
      int rank = driverOverallRanks.getOrDefault(driverId, 0);
      int overallPts = driverOverallPoints.getOrDefault(driverId, 0);
      int heatPts = driverHeatPoints.getOrDefault(driverId, 0);
      int totalPts = overallPts + heatPts;

      results.add(new SeasonDriverResult(driverId, name, rank, overallPts, heatPts, totalPts));
    }

    results.sort(Comparator.comparingInt(SeasonDriverResult::getOverallRank));
    return results;
  }

  public static List<DriverSeasonStanding> calculateLiveStandings(
      Season dbSeason, Race runtimeRace) {
    Season baseSeason = dbSeason != null ? dbSeason : new Season("", 0);
    List<SeasonRaceRecord> races = new ArrayList<>(baseSeason.getRaces());

    if (runtimeRace != null
        && runtimeRace.getDrivers() != null
        && !runtimeRace.getDrivers().isEmpty()) {
      EventExecutionManager eventMgr = EventExecutionManager.getInstance();
      if (eventMgr.isEventActive()) {
        Map<String, SeasonDriverResult> eventLiveMap = new HashMap<>();
        Map<String, SeasonDriverResult> accumulated = eventMgr.getEventDriverResultsMap();
        if (accumulated != null) {
          eventLiveMap.putAll(accumulated);
        }

        List<SeasonDriverResult> activeRaceResults = calculateDriverResultsForRace(runtimeRace);
        for (SeasonDriverResult r : activeRaceResults) {
          String dId = r.getDriverId();
          SeasonDriverResult existing = eventLiveMap.get(dId);
          if (existing != null) {
            int combinedPosPts = existing.getOverallPoints() + r.getOverallPoints();
            int combinedHeatPts = existing.getHeatPoints() + r.getHeatPoints();
            int combinedTotal = combinedPosPts + combinedHeatPts;
            int bestRank = Math.min(existing.getOverallRank(), r.getOverallRank());
            eventLiveMap.put(
                dId,
                new SeasonDriverResult(
                    dId,
                    r.getDriverName(),
                    bestRank,
                    combinedPosPts,
                    combinedHeatPts,
                    combinedTotal));
          } else {
            eventLiveMap.put(dId, r);
          }
        }

        List<SeasonDriverResult> liveEventResults = new ArrayList<>(eventLiveMap.values());
        String eventName =
            eventMgr.getActiveEvent() != null ? eventMgr.getActiveEvent().getName() : "Event";
        long liveStart =
            runtimeRace != null && runtimeRace.getStatistics() != null
                ? runtimeRace.getStatistics().getStartMillis()
                : 0L;
        long recordTimestamp = liveStart > 0 ? liveStart : System.currentTimeMillis();
        SeasonRaceRecord liveRecord =
            new SeasonRaceRecord("live_event", eventName, recordTimestamp, liveEventResults);
        races.add(liveRecord);
      } else {
        List<SeasonDriverResult> liveResults = calculateDriverResultsForRace(runtimeRace);
        if (liveResults != null && !liveResults.isEmpty()) {
          String raceName =
              runtimeRace.getRaceModel() != null ? runtimeRace.getRaceModel().getName() : "Race";
          long liveStart =
              runtimeRace != null && runtimeRace.getStatistics() != null
                  ? runtimeRace.getStatistics().getStartMillis()
                  : 0L;
          long recordTimestamp = liveStart > 0 ? liveStart : System.currentTimeMillis();
          SeasonRaceRecord liveRecord =
              new SeasonRaceRecord("live_race", raceName, recordTimestamp, liveResults);
          races.add(liveRecord);
        }
      }
    }

    Season transientSeason =
        new Season(
            baseSeason.getName(),
            baseSeason.getDrops(),
            races,
            baseSeason.getEntityId(),
            baseSeason.getId());

    return calculateStandings(transientSeason);
  }

  public static List<DriverSeasonStanding> calculateStandings(Season season) {
    DatabaseContext dbCtx = null;
    try {
      dbCtx = ClientSubscriptionManager.getInstance().getDatabaseContext();
    } catch (Exception ignored) {
    }
    MongoDatabase db = dbCtx != null ? dbCtx.getDatabase() : null;
    return calculateStandings(season, db);
  }

  public static List<DriverSeasonStanding> calculateStandings(
      Season season, MongoDatabase database) {
    if (season == null || season.getRaces() == null) {
      return new ArrayList<>();
    }

    int dropsConfigured = Math.max(0, season.getDrops());
    List<SeasonRaceRecord> raceRecords = season.getRaces();

    // Map driverId -> list of (raceRecord, SeasonDriverResult)
    Map<String, String> driverNames = new HashMap<>();
    Map<String, List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>>> driverRaceMap =
        new HashMap<>();

    for (SeasonRaceRecord raceRecord : raceRecords) {
      if (raceRecord == null || raceRecord.getDriverResults() == null) continue;
      for (SeasonDriverResult result : raceRecord.getDriverResults()) {
        if (result == null || result.getDriverId() == null || result.getDriverId().isEmpty()) {
          continue;
        }
        String driverId = result.getDriverId();
        driverNames.put(driverId, result.getDriverName());
        driverRaceMap
            .computeIfAbsent(driverId, k -> new ArrayList<>())
            .add(new java.util.AbstractMap.SimpleEntry<>(raceRecord, result));
      }
    }

    if (database != null) {
      for (String dId : driverRaceMap.keySet()) {
        Driver d = DatabaseService.getInstance().getDriver(database, dId);
        if (d != null && d.getDisplayName() != null && !d.getDisplayName().trim().isEmpty()) {
          driverNames.put(dId, d.getDisplayName());
        }
      }
    }

    List<DriverSeasonStanding> standings = new ArrayList<>();

    for (Map.Entry<String, List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>>> entry :
        driverRaceMap.entrySet()) {
      String driverId = entry.getKey();
      String driverName = driverNames.getOrDefault(driverId, "Driver " + driverId);
      List<Map.Entry<SeasonRaceRecord, SeasonDriverResult>> raceEntries = entry.getValue();

      int K = raceEntries.size(); // number of races driver participated in
      int numDrops = (K > dropsConfigured) ? dropsConfigured : 0;

      // Identify lowest numDrops scores to drop
      Set<Integer> droppedIndices = new HashSet<>();
      if (numDrops > 0) {
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i < K; i++) {
          indices.add(i);
        }
        indices.sort(Comparator.comparingInt(i -> raceEntries.get(i).getValue().getTotalPoints()));
        for (int i = 0; i < numDrops; i++) {
          droppedIndices.add(indices.get(i));
        }
      }

      int grossPoints = 0;
      int netPoints = 0;
      List<DriverRaceScoreDetail> scoreDetails = new ArrayList<>();

      for (int i = 0; i < K; i++) {
        SeasonRaceRecord raceRec = raceEntries.get(i).getKey();
        SeasonDriverResult res = raceEntries.get(i).getValue();
        boolean isDropped = droppedIndices.contains(i);

        grossPoints += res.getTotalPoints();
        if (!isDropped) {
          netPoints += res.getTotalPoints();
        }

        DriverRaceScoreDetail detail =
            new DriverRaceScoreDetail(
                raceRec.getRaceId(),
                raceRec.getRaceName(),
                res.getOverallRank(),
                res.getOverallPoints(),
                res.getHeatPoints(),
                res.getTotalPoints());
        if (isDropped) {
          detail.setDropped(true);
        }
        scoreDetails.add(detail);
      }

      standings.add(
          new DriverSeasonStanding(driverId, driverName, netPoints, grossPoints, K, scoreDetails));
    }

    // Sort standings by Net Points descending, then Gross Points descending
    standings.sort(
        (a, b) -> {
          if (a.getNetPoints() != b.getNetPoints()) {
            return Integer.compare(b.getNetPoints(), a.getNetPoints());
          }
          return Integer.compare(b.getGrossPoints(), a.getGrossPoints());
        });

    return standings;
  }
}
