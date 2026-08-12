package com.antigravity.service;

import com.antigravity.context.DatabaseContext;
import com.antigravity.context.RaceScope;
import com.antigravity.models.DriverStatistics;
import com.antigravity.models.DriverTrackStats;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.prediction.PredictionEngine;
import com.antigravity.repository.SqliteRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DatabaseStatisticsService {
  private static final Logger logger = LoggerFactory.getLogger(DatabaseStatisticsService.class);

  @SuppressWarnings("checkstyle:MethodLength")
  public void updateGlobalStatistics(
      DatabaseContext context, com.antigravity.race.Race runtimeRace) { // fqn-collision
    if (runtimeRace == null) return;
    boolean isDemo = runtimeRace.isDemoMode();
    String raceId =
        runtimeRace.getRaceModel() != null ? runtimeRace.getRaceModel().getEntityId() : "unknown";
    String tableName = getCollectionName("global_statistics", isDemo);
    try {
      SqliteRepository<GlobalStatistics> statsRepo =
          new SqliteRepository<>(context, tableName, GlobalStatistics.class);
      GlobalStatistics stats = statsRepo.findByEntityId(raceId);
      if (stats == null) {
        stats = new GlobalStatistics(raceId);
      }

      stats.addRaceCount();

      if (runtimeRace.getStatistics() != null) {
        stats.addRaceTimeMs(runtimeRace.getStatistics().getDurationMillis());
      }

      double totalLaps = 0;
      for (RaceParticipant p : runtimeRace.getDrivers()) {
        totalLaps += p.getTotalLaps();
      }
      stats.addLaps(totalLaps);

      com.antigravity.proto.RecordData recordData = runtimeRace.getRecordData(); // fqn-collision
      com.antigravity.proto.OverallRecords overall = recordData.getOverall(); // fqn-collision

      if (overall.hasFastestLap()) {
        com.antigravity.proto.RecordEntry fl = overall.getFastestLap(); // fqn-collision
        if (stats.getFastestLapTime() == 0.0 || fl.getValue() < stats.getFastestLapTime()) {
          stats.setFastestLapTime(fl.getValue());
          stats.setFastestLapDriverName(fl.getHolderName());
          stats.setFastestLapDriverNickname(fl.getHolderNickname());
          stats.setFastestLapTeamName(fl.getHolderTeamName());
          stats.setFastestLapDate(fl.getDate());
          if (runtimeRace.getTrack() != null) {
            stats.setFastestLapTrackName(runtimeRace.getTrack().getName());
          }
        }
      }

      if (overall.hasHighestScore()) {
        com.antigravity.proto.RecordEntry hs = overall.getHighestScore(); // fqn-collision
        if (stats.getHighestScore() == 0.0 || hs.getValue() > stats.getHighestScore()) {
          stats.setHighestScore(hs.getValue());
          stats.setHighestScoreHolderName(hs.getHolderName());
          stats.setHighestScoreHolderNickname(hs.getHolderNickname());
          stats.setHighestScoreTeamName(hs.getHolderTeamName());
          stats.setHighestScoreDate(hs.getDate());
          if (runtimeRace.getTrack() != null) {
            stats.setHighestScoreTrackName(runtimeRace.getTrack().getName());
          }
        }
      }

      if (runtimeRace.getTrack() != null) {
        stats.setFastestLapTrackName(runtimeRace.getTrack().getName());
        stats.setHighestScoreTrackName(runtimeRace.getTrack().getName());
      }

      List<Double> laneFastestTimes =
          stats.getLaneFastestLapTimes() != null
              ? new ArrayList<>(stats.getLaneFastestLapTimes())
              : new ArrayList<>();
      List<String> laneFastestHolders =
          stats.getLaneFastestLapDriverNames() != null
              ? new ArrayList<>(stats.getLaneFastestLapDriverNames())
              : new ArrayList<>();
      List<String> laneFastestNicknames =
          stats.getLaneFastestLapDriverNicknames() != null
              ? new ArrayList<>(stats.getLaneFastestLapDriverNicknames())
              : new ArrayList<>();
      List<String> laneFastestTeams =
          stats.getLaneFastestLapTeamNames() != null
              ? new ArrayList<>(stats.getLaneFastestLapTeamNames())
              : new ArrayList<>();
      List<Long> laneFastestDates =
          stats.getLaneFastestLapDates() != null
              ? new ArrayList<>(stats.getLaneFastestLapDates())
              : new ArrayList<>();

      for (int i = 0; i < overall.getLaneFastestLapCount(); i++) {
        com.antigravity.proto.RecordEntry entry = overall.getLaneFastestLap(i); // fqn-collision
        double newVal = entry.getValue();
        if (i >= laneFastestTimes.size()) {
          laneFastestTimes.add(newVal);
          laneFastestHolders.add(entry.getHolderName());
          laneFastestNicknames.add(entry.getHolderNickname());
          laneFastestTeams.add(entry.getHolderTeamName());
          laneFastestDates.add(entry.getDate());
        } else {
          double existingVal = laneFastestTimes.get(i);
          if (newVal > 0.0 && (existingVal == 0.0 || newVal < existingVal)) {
            laneFastestTimes.set(i, newVal);
            laneFastestHolders.set(i, entry.getHolderName());
            laneFastestNicknames.set(i, entry.getHolderNickname());
            laneFastestTeams.set(i, entry.getHolderTeamName());
            while (laneFastestDates.size() <= i) laneFastestDates.add(0L);
            laneFastestDates.set(i, entry.getDate());
          }
        }
      }
      stats.setLaneFastestLapTimes(laneFastestTimes);
      stats.setLaneFastestLapDriverNames(laneFastestHolders);
      stats.setLaneFastestLapDriverNicknames(laneFastestNicknames);
      stats.setLaneFastestLapTeamNames(laneFastestTeams);
      stats.setLaneFastestLapDates(laneFastestDates);

      List<Double> laneHighestScores =
          stats.getLaneHighestScores() != null
              ? new ArrayList<>(stats.getLaneHighestScores())
              : new ArrayList<>();
      List<String> laneHighestHolders =
          stats.getLaneHighestScoreHolderNames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreHolderNames())
              : new ArrayList<>();
      List<String> laneHighestNicknames =
          stats.getLaneHighestScoreHolderNicknames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreHolderNicknames())
              : new ArrayList<>();
      List<String> laneHighestTeams =
          stats.getLaneHighestScoreTeamNames() != null
              ? new ArrayList<>(stats.getLaneHighestScoreTeamNames())
              : new ArrayList<>();
      List<Long> laneHighestDates =
          stats.getLaneHighestScoreDates() != null
              ? new ArrayList<>(stats.getLaneHighestScoreDates())
              : new ArrayList<>();

      for (int i = 0; i < overall.getLaneHighestScoreCount(); i++) {
        com.antigravity.proto.RecordEntry entry = overall.getLaneHighestScore(i); // fqn-collision
        double newVal = entry.getValue();
        if (i >= laneHighestScores.size()) {
          laneHighestScores.add(newVal);
          laneHighestHolders.add(entry.getHolderName());
          laneHighestNicknames.add(entry.getHolderNickname());
          laneHighestTeams.add(entry.getHolderTeamName());
          laneHighestDates.add(entry.getDate());
        } else {
          double existingVal = laneHighestScores.get(i);
          if (existingVal == 0.0 || newVal > existingVal) {
            laneHighestScores.set(i, newVal);
            laneHighestHolders.set(i, entry.getHolderName());
            laneHighestNicknames.set(i, entry.getHolderNickname());
            laneHighestTeams.set(i, entry.getHolderTeamName());
            while (laneHighestDates.size() <= i) laneHighestDates.add(0L);
            laneHighestDates.set(i, entry.getDate());
          }
        }
      }
      stats.setLaneHighestScores(laneHighestScores);
      stats.setLaneHighestScoreHolderNames(laneHighestHolders);
      stats.setLaneHighestScoreHolderNicknames(laneHighestNicknames);
      stats.setLaneHighestScoreTeamNames(laneHighestTeams);
      stats.setLaneHighestScoreDates(laneHighestDates);

      statsRepo.save(stats);
      logger.info("Race statistics updated for race: {}", raceId);
    } catch (Exception e) {
      logger.error("Failed to update global statistics for race {}", raceId, e);
    }
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, RaceScope scope) {
    if (raceEntityId == null) {
      return new GlobalStatistics();
    }
    String tableName = getCollectionName("global_statistics", scope);
    GlobalStatistics stats =
        new SqliteRepository<>(context, tableName, GlobalStatistics.class)
            .findByEntityId(raceEntityId);
    if (stats == null) {
      return new GlobalStatistics(raceEntityId);
    }
    return stats;
  }

  public GlobalStatistics getGlobalStatistics(
      DatabaseContext context, String raceEntityId, boolean isDemo) {
    return getGlobalStatistics(context, raceEntityId, RaceScope.fromBoolean(isDemo));
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public void saveDriverStatistics(
      DatabaseContext context, com.antigravity.race.Race race) { // fqn-collision
    if (context == null || race == null || race.getRaceModel() == null) {
      return;
    }

    try {
      int laneCount = 4;
      if (race.getTrack() != null && race.getTrack().getLanes() != null) {
        laneCount = race.getTrack().getLanes().size();
      }
      final int finalLaneCount = laneCount;
      String tableName = getCollectionName("driver_statistics", race.isDemoMode());
      SqliteRepository<DriverStatistics> repo =
          new SqliteRepository<>(context, tableName, DriverStatistics.class);
      Map<String, DriverStatistics> statsMap = new HashMap<>();
      Map<String, Double> driverRaceLaps = new HashMap<>();

      long raceDate = System.currentTimeMillis();

      if (race.getHeats() != null) {
        for (Heat heat : race.getHeats()) {
          if (heat == null || !heat.isStarted() || heat.getDrivers() == null) continue;
          final int heatLaneCount = heat.getDrivers().size();
          for (int laneIdx = 0; laneIdx < heatLaneCount; laneIdx++) {
            DriverHeatData driverData = heat.getDrivers().get(laneIdx);
            if (driverData != null
                && driverData.getDriver() != null
                && driverData.getDriver().getDriver() != null
                && !driverData.getDriver().getDriver().isEmpty()) {
              String stableId = driverData.getDriver().getStableId();

              driverRaceLaps.put(
                  stableId,
                  driverRaceLaps.getOrDefault(stableId, 0.0) + driverData.getAdjustedLapCount());

              DriverStatistics stats =
                  statsMap.computeIfAbsent(
                      stableId,
                      id -> {
                        DriverStatistics s =
                            repo.findByEntityId(id + "_" + race.getRaceModel().getEntityId());
                        if (s == null) {
                          s = new DriverStatistics();
                          s.setDriverId(id);
                          s.setRaceId(race.getRaceModel().getEntityId());

                          List<Double> bestTimes = new ArrayList<>();
                          List<Double> bestCounts = new ArrayList<>();
                          for (int k = 0; k < finalLaneCount; k++) {
                            bestTimes.add(0.0);
                            bestCounts.add(0.0);
                          }
                          s.setLaneBestLapTimes(bestTimes);
                          s.setLaneBestLapCounts(bestCounts);
                          s.setBestLapTime(0.0);
                          s.setBestLapCount(0.0);
                          s.setLaneBestLapTimesDates(
                              new ArrayList<>(Collections.nCopies(finalLaneCount, 0L)));
                          s.setLaneBestLapCountsDates(
                              new ArrayList<>(Collections.nCopies(finalLaneCount, 0L)));
                        } else {
                          if (s.getLaneBestLapTimes() == null)
                            s.setLaneBestLapTimes(new ArrayList<>());
                          while (s.getLaneBestLapTimes().size() < finalLaneCount) {
                            s.getLaneBestLapTimes().add(0.0);
                          }
                          if (s.getLaneBestLapCounts() == null)
                            s.setLaneBestLapCounts(new ArrayList<>());
                          while (s.getLaneBestLapCounts().size() < finalLaneCount) {
                            s.getLaneBestLapCounts().add(0.0);
                          }
                        }
                        return s;
                      });

              updateDriverStatsForHeat(stats, driverData, raceDate, laneIdx);
            }
          }
        }
      }

      for (Map.Entry<String, DriverStatistics> entry : statsMap.entrySet()) {
        String stableId = entry.getKey();
        DriverStatistics stats = entry.getValue();
        double sessionLapCount = driverRaceLaps.getOrDefault(stableId, 0.0);
        if (sessionLapCount > stats.getBestLapCount()) {
          stats.setBestLapCount(sessionLapCount);
          stats.setBestLapCountDate(raceDate);
        }
        repo.save(stats);
      }

      logger.info(
          "Successfully saved driver statistics for race: {}", race.getRaceModel().getEntityId());
    } catch (Exception e) {
      logger.error("Failed to save driver statistics", e);
    }
  }

  private void updateDriverStatsForHeat(
      DriverStatistics stats, DriverHeatData driverData, long raceDate, int laneIdx) {
    double heatLapCount = driverData.getAdjustedLapCount();

    double heatBestLap = driverData.getBestLapTime();
    if (heatBestLap > 0.0) {
      if (stats.getBestLapTime() == 0.0 || heatBestLap < stats.getBestLapTime()) {
        stats.setBestLapTime(heatBestLap);
        stats.setBestLapTimeDate(raceDate);
      }
    }

    if (laneIdx < stats.getLaneBestLapCounts().size()) {
      double laneLapCount = stats.getLaneBestLapCounts().get(laneIdx);
      if (heatLapCount > laneLapCount) {
        stats.getLaneBestLapCounts().set(laneIdx, heatLapCount);
        stats.getLaneBestLapCountsDates().set(laneIdx, raceDate);
      }
    }

    if (laneIdx < stats.getLaneBestLapTimes().size()) {
      double laneBestLap = stats.getLaneBestLapTimes().get(laneIdx);
      if (heatBestLap > 0.0) {
        if (laneBestLap == 0.0 || heatBestLap < laneBestLap) {
          stats.getLaneBestLapTimes().set(laneIdx, heatBestLap);
          stats.getLaneBestLapTimesDates().set(laneIdx, raceDate);
        }
      }
    }
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, RaceScope scope) {
    if (context == null || driverId == null || driverId.isEmpty()) {
      return null;
    }

    String tableName = getCollectionName("driver_statistics", scope);
    SqliteRepository<DriverStatistics> repo =
        new SqliteRepository<>(context, tableName, DriverStatistics.class);
    List<DriverStatistics> allStats = repo.findAll();
    DriverStatistics match = null;
    for (DriverStatistics s : allStats) {
      if (driverId.equals(s.getDriverId()) && (raceId == null || raceId.equals(s.getRaceId()))) {
        match = s;
        break;
      }
    }
    if (match != null) {
      return match;
    }

    DriverStatistics emptyStats = new DriverStatistics();
    emptyStats.setDriverId(driverId);
    emptyStats.setRaceId(raceId);
    emptyStats.setBestLapTime(0.0);
    emptyStats.setBestLapCount(0.0);
    emptyStats.setLaneBestLapTimes(new ArrayList<>());
    emptyStats.setLaneBestLapCounts(new ArrayList<>());
    emptyStats.setLaneBestLapTimesDates(new ArrayList<>());
    emptyStats.setLaneBestLapCountsDates(new ArrayList<>());
    return emptyStats;
  }

  public DriverStatistics getDriverStatistics(
      DatabaseContext context, String driverId, String raceId, boolean isDemo) {
    return getDriverStatistics(context, driverId, raceId, RaceScope.fromBoolean(isDemo));
  }

  public DriverTrackStats getDriverTrackStats(
      DatabaseContext context, String driverId, String trackId, boolean isDemo) {
    if (context == null || driverId == null || trackId == null) return null;

    String tableName = getCollectionName("driver_track_stats", isDemo);
    SqliteRepository<DriverTrackStats> repo =
        new SqliteRepository<>(context, tableName, DriverTrackStats.class);

    String id = driverId + "_" + trackId;
    return repo.findByEntityId(id);
  }

  @SuppressWarnings("checkstyle:MethodLength")
  public void updateDriverTrackStats(
      DatabaseContext context, com.antigravity.race.Race race, boolean isDemo) { // fqn-collision
    try {
      if (context == null || race == null || race.getRaceModel() == null) return;
      String trackId = race.getRaceModel().getTrackEntityId();
      if (trackId == null || trackId.isEmpty()) return;

      double minLapTime = race.getRaceModel().getMinLapTime();

      for (RaceParticipant rp : race.getDrivers()) {
        if (rp == null) continue;
        String driverId = PredictionEngine.getParticipantId(rp);
        if (driverId == null || driverId.isEmpty()) continue;

        DriverTrackStats stats = getDriverTrackStats(context, driverId, trackId, isDemo);
        if (stats == null) {
          stats = new DriverTrackStats();
          stats.setId(driverId + "_" + trackId);
          stats.setDriverId(driverId);
          stats.setTrackId(trackId);
        }

        stats.setTotalRaces(stats.getTotalRaces() + 1);

        int heatsCompleted = 0;
        int lapsCompleted = 0;
        Map<Integer, List<Double>> laneLaps = new HashMap<>();

        if (race.getHeats() != null) {
          for (Heat heat : race.getHeats()) {
            if (heat.getDrivers() != null) {
              for (int laneIdx = 0; laneIdx < heat.getDrivers().size(); laneIdx++) {
                DriverHeatData dhd = heat.getDrivers().get(laneIdx);
                if (dhd != null && dhd.getDriver() != null) {
                  String heatDriverId = PredictionEngine.getParticipantId(dhd.getDriver());
                  if (driverId.equals(heatDriverId)) {
                    heatsCompleted++;
                    lapsCompleted += dhd.getLapCount();

                    if (dhd.getLaps() != null) {
                      List<Double> validLaps = new ArrayList<>();
                      for (DriverHeatData.LapData lap : dhd.getLaps()) {
                        if (lap.getLapTime() > 0
                            && (minLapTime == 0 || lap.getLapTime() >= minLapTime)) {
                          validLaps.add(lap.getLapTime());
                        }
                      }
                      if (!validLaps.isEmpty()) {
                        laneLaps.computeIfAbsent(laneIdx, k -> new ArrayList<>()).addAll(validLaps);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        List<Double> allValidLaps = new ArrayList<>();
        List<DriverTrackStats.LanePaceStats> laneStatsList = stats.getLaneStats();
        if (laneStatsList == null) {
          laneStatsList = new ArrayList<>();
          stats.setLaneStats(laneStatsList);
        }

        for (Map.Entry<Integer, List<Double>> entry : laneLaps.entrySet()) {
          int laneIdx = entry.getKey();
          List<Double> laps = entry.getValue();
          allValidLaps.addAll(laps);

          if (!laps.isEmpty()) {
            java.util.Collections.sort(laps);
            double median;
            int mid = laps.size() / 2;
            if (laps.size() % 2 == 0) {
              median = (laps.get(mid - 1) + laps.get(mid)) / 2.0;
            } else {
              median = laps.get(mid);
            }

            DriverTrackStats.LanePaceStats existing = null;
            for (DriverTrackStats.LanePaceStats lps : laneStatsList) {
              if (lps.getLaneIndex() == laneIdx) {
                existing = lps;
                break;
              }
            }

            if (existing == null) {
              existing = new DriverTrackStats.LanePaceStats();
              existing.setLaneIndex(laneIdx);
              laneStatsList.add(existing);
            }

            if (existing.getMedianLapTime() > 0 && existing.getSampleSizeLaps() > 0) {
              double totalWeight = existing.getSampleSizeLaps() + laps.size();
              existing.setMedianLapTime(
                  ((existing.getMedianLapTime() * existing.getSampleSizeLaps())
                          + (median * laps.size()))
                      / totalWeight);
              existing.setSampleSizeLaps((int) totalWeight);
            } else {
              existing.setMedianLapTime(median);
              existing.setSampleSizeLaps(laps.size());
            }
          }
        }

        if (!allValidLaps.isEmpty()) {
          java.util.Collections.sort(allValidLaps);
          double sessionMedian;
          int mid = allValidLaps.size() / 2;
          if (allValidLaps.size() % 2 == 0) {
            sessionMedian = (allValidLaps.get(mid - 1) + allValidLaps.get(mid)) / 2.0;
          } else {
            sessionMedian = allValidLaps.get(mid);
          }

          if (stats.getOverallMedianLapTime() > 0 && stats.getTotalLaps() > 0) {
            double totalWeight = stats.getTotalLaps() + allValidLaps.size();
            if (totalWeight > 0) {
              stats.setOverallMedianLapTime(
                  ((stats.getOverallMedianLapTime() * stats.getTotalLaps())
                          + (sessionMedian * allValidLaps.size()))
                      / totalWeight);
            }
          } else {
            stats.setOverallMedianLapTime(sessionMedian);
          }
        }

        stats.setTotalHeats(stats.getTotalHeats() + heatsCompleted);
        stats.setTotalLaps(stats.getTotalLaps() + lapsCompleted);

        stats.setLastUpdated(System.currentTimeMillis());
        saveDriverTrackStats(context, stats, isDemo);
      }
    } catch (Throwable t) {
      logger.error("updateDriverTrackStats: FAILED with throwable!", t);
    }
  }

  public void saveDriverTrackStats(
      DatabaseContext context, DriverTrackStats stats, boolean isDemo) {
    if (context == null
        || stats == null
        || stats.getDriverId() == null
        || stats.getTrackId() == null) {
      return;
    }
    String tableName = getCollectionName("driver_track_stats", isDemo);
    SqliteRepository<DriverTrackStats> repo =
        new SqliteRepository<>(context, tableName, DriverTrackStats.class);
    repo.save(stats);
  }

  private String getCollectionName(String baseName, RaceScope scope) {
    if (scope == null) {
      scope = RaceScope.PRODUCTION;
    }
    return scope.getCollectionName(baseName);
  }

  private String getCollectionName(String baseName, boolean isDemo) {
    return getCollectionName(baseName, RaceScope.fromBoolean(isDemo));
  }
}
