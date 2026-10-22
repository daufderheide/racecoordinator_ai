package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Data transfer object supplying Fastest Lap Times tab data to Jxls and POI export pipelines.
 * Contains track record lap statistics (overall and per-lane) and race best lap statistics.
 */
public class FastestLapsSummary {

  private static final DateTimeFormatter ISO_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

  private List<String> recordLapNames = new ArrayList<>();
  private List<Double> recordLapTimes = new ArrayList<>();
  private List<String> recordLapDates = new ArrayList<>();

  private String overallRecordLapName = "";
  private Double overallRecordLapTime;
  private String overallRecordLapDate = "";

  private List<String> bestLapNames = new ArrayList<>();
  private List<Double> bestLapTimes = new ArrayList<>();

  public FastestLapsSummary() {}

  public static FastestLapsSummary from(Race race, List<Heat> runHeats, List<Integer> activeLanes) {
    FastestLapsSummary summary = new FastestLapsSummary();

    if (activeLanes == null || activeLanes.isEmpty()) {
      activeLanes = java.util.Arrays.asList(0, 1);
    }

    RaceRecords recordsManager = race != null ? race.getRecordsManager() : null;
    RecordData recordData = null;
    OverallRecords overall = null;

    if (recordsManager != null) {
      try {
        recordData = recordsManager.getRecordData();
        if (recordData != null && recordData.hasOverall()) {
          overall = recordData.getOverall();
        }
      } catch (Exception ignored) {
      }
    }

    // 1. Overall record lap (Table 2 Right)
    if (overall != null && overall.hasFastestLap()) {
      RecordEntry overallEntry = overall.getFastestLap();
      double val = overallEntry.getValue();
      if (val > 0.0 && val != Double.MAX_VALUE) {
        summary.overallRecordLapTime = RaceStatisticsUtils.roundToThreeDecimals(val);
      }
      summary.overallRecordLapName = nonNull(overallEntry.getHolderName());
      summary.overallRecordLapDate = formatEpochMillis(overallEntry.getDate());
    }

    // 2. Per-lane record laps (Table 2 Left)
    for (int l : activeLanes) {
      if (overall != null && l >= 0 && l < overall.getLaneFastestLapCount()) {
        RecordEntry laneEntry = overall.getLaneFastestLap(l);
        summary.recordLapNames.add(nonNull(laneEntry.getHolderName()));
        double laneVal = laneEntry.getValue();
        if (laneVal > 0.0 && laneVal != Double.MAX_VALUE) {
          summary.recordLapTimes.add(RaceStatisticsUtils.roundToThreeDecimals(laneVal));
        } else {
          summary.recordLapTimes.add(null);
        }
        summary.recordLapDates.add(formatEpochMillis(laneEntry.getDate()));
      } else {
        summary.recordLapNames.add("");
        summary.recordLapTimes.add(null);
        summary.recordLapDates.add("");
      }
    }

    // 3. Best lap of the current race per lane (Table 3)
    for (int l : activeLanes) {
      double bestTime = Double.MAX_VALUE;
      String bestHolder = "";

      if (runHeats != null) {
        for (Heat h : runHeats) {
          if (h.getDrivers() != null && l >= 0 && l < h.getDrivers().size()) {
            DriverHeatData dhd = h.getDrivers().get(l);
            if (dhd != null && !dhd.isEmptyParticipant()) {
              String name = extractParticipantDisplayName(dhd);
              if (dhd.getLaps() != null) {
                for (DriverHeatData.LapData lap : dhd.getLaps()) {
                  if (lap.getLapTime() > 0.0 && lap.getLapTime() < bestTime) {
                    bestTime = lap.getLapTime();
                    bestHolder = name;
                  }
                }
              }
            }
          }
        }
      }

      if (bestTime == Double.MAX_VALUE && recordsManager != null) {
        double raceLaneLap = recordsManager.getRaceLaneFastestLap(l);
        if (raceLaneLap > 0.0 && raceLaneLap != Double.MAX_VALUE) {
          bestTime = raceLaneLap;
          if (recordData != null
              && recordData.hasCurrent()
              && l < recordData.getCurrent().getLaneFastestLapCount()) {
            bestHolder = recordData.getCurrent().getLaneFastestLap(l).getHolderName();
          }
        }
      }

      if (bestTime != Double.MAX_VALUE && bestTime > 0.0) {
        summary.bestLapTimes.add(RaceStatisticsUtils.roundToThreeDecimals(bestTime));
        summary.bestLapNames.add(nonNull(bestHolder));
      } else {
        summary.bestLapTimes.add(null);
        summary.bestLapNames.add("");
      }
    }

    return summary;
  }

  private static String extractParticipantDisplayName(DriverHeatData dhd) {
    if (dhd == null) return "";
    Driver actualDriver = dhd.getActualDriver();
    if (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER) {
      return actualDriver.getName();
    }
    if (dhd.getDriver() != null) {
      if (dhd.getDriver().isTeamParticipant() && dhd.getDriver().getTeam() != null) {
        return dhd.getDriver().getTeam().getName();
      }
      if (dhd.getDriver().getDriver() != null) {
        return dhd.getDriver().getDriver().getName();
      }
    }
    return "";
  }

  public static String formatEpochMillis(long epochMillis) {
    if (epochMillis <= 0L) {
      return "";
    }
    try {
      return Instant.ofEpochMilli(epochMillis)
          .atZone(ZoneId.systemDefault())
          .toLocalDateTime()
          .format(ISO_FORMATTER);
    } catch (Exception e) {
      return "";
    }
  }

  private static String nonNull(String s) {
    return s == null ? "" : s.trim();
  }

  public List<String> getRecordLapNames() {
    return recordLapNames;
  }

  public void setRecordLapNames(List<String> recordLapNames) {
    this.recordLapNames = recordLapNames != null ? recordLapNames : new ArrayList<>();
  }

  public List<Double> getRecordLapTimes() {
    return recordLapTimes;
  }

  public void setRecordLapTimes(List<Double> recordLapTimes) {
    this.recordLapTimes = recordLapTimes != null ? recordLapTimes : new ArrayList<>();
  }

  public List<String> getRecordLapDates() {
    return recordLapDates;
  }

  public void setRecordLapDates(List<String> recordLapDates) {
    this.recordLapDates = recordLapDates != null ? recordLapDates : new ArrayList<>();
  }

  public String getOverallRecordLapName() {
    return overallRecordLapName;
  }

  public void setOverallRecordLapName(String overallRecordLapName) {
    this.overallRecordLapName = nonNull(overallRecordLapName);
  }

  public Double getOverallRecordLapTime() {
    return overallRecordLapTime;
  }

  public void setOverallRecordLapTime(Double overallRecordLapTime) {
    this.overallRecordLapTime = overallRecordLapTime;
  }

  public String getOverallRecordLapDate() {
    return overallRecordLapDate;
  }

  public void setOverallRecordLapDate(String overallRecordLapDate) {
    this.overallRecordLapDate = nonNull(overallRecordLapDate);
  }

  public List<String> getBestLapNames() {
    return bestLapNames;
  }

  public void setBestLapNames(List<String> bestLapNames) {
    this.bestLapNames = bestLapNames != null ? bestLapNames : new ArrayList<>();
  }

  public List<Double> getBestLapTimes() {
    return bestLapTimes;
  }

  public void setBestLapTimes(List<Double> bestLapTimes) {
    this.bestLapTimes = bestLapTimes != null ? bestLapTimes : new ArrayList<>();
  }

  public String getRecordLapName(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < recordLapNames.size()) {
      return recordLapNames.get(laneIndex);
    }
    return "";
  }

  public Double getRecordLapTime(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < recordLapTimes.size()) {
      return recordLapTimes.get(laneIndex);
    }
    return null;
  }

  public String getRecordLapDate(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < recordLapDates.size()) {
      return recordLapDates.get(laneIndex);
    }
    return "";
  }

  public String getBestLapName(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < bestLapNames.size()) {
      return bestLapNames.get(laneIndex);
    }
    return "";
  }

  public Double getBestLapTime(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < bestLapTimes.size()) {
      return bestLapTimes.get(laneIndex);
    }
    return null;
  }
}
