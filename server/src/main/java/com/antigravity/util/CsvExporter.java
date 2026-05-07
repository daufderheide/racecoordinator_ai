package com.antigravity.util;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.DigitalFuelOptions;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.DriverHeatData.LapData;
import com.antigravity.race.Heat;
import com.antigravity.race.Race;
import com.antigravity.race.RaceHeatStatistics;
import com.antigravity.race.RaceParticipant;
import com.antigravity.race.RaceStatistics;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

public class CsvExporter {

  public static String export(Race race) {
    StringBuilder sb = new StringBuilder();
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    sdf.setTimeZone(TimeZone.getDefault());

    // Section 0: Race Record Data
    sb.append("#Section,Race Record Data\n");
    RecordData recordData = race.getRecordData();
    OverallRecords overall = recordData.getOverall();
    CurrentRecords current = recordData.getCurrent();

    // --- Overall Records (All-time) ---
    sb.append("#--- Overall Records (All-time) ---\n");
    // Overall Fastest Lap
    RecordEntry fastestLap = overall.getFastestLap();
    sb.append("#Overall Fastest Lap,Holder,Nickname,Team,Date,Time\n");
    String fastestLapDate =
        fastestLap.getDate() > 0 ? sdf.format(new Date(fastestLap.getDate())) : "N/A";
    sb.append("Overall Fastest Lap,")
        .append(escape(fastestLap.getHolderName()))
        .append(",")
        .append(escape(fastestLap.getHolderNickname()))
        .append(",")
        .append(escape(fastestLap.getHolderTeamName()))
        .append(",")
        .append(escape(fastestLapDate))
        .append(",")
        .append(fastestLap.getValue())
        .append("\n\n");

    // Overall Highest Score
    RecordEntry highestScore = overall.getHighestScore();
    sb.append("#Overall Highest Score,Holder,Nickname,Team,Date,Score\n");
    String highestScoreDate =
        highestScore.getDate() > 0 ? sdf.format(new Date(highestScore.getDate())) : "N/A";
    sb.append("Overall Highest Score,")
        .append(escape(highestScore.getHolderName()))
        .append(",")
        .append(escape(highestScore.getHolderNickname()))
        .append(",")
        .append(escape(highestScore.getHolderTeamName()))
        .append(",")
        .append(escape(highestScoreDate))
        .append(",")
        .append(highestScore.getValue())
        .append("\n\n");

    // Overall Lane Records
    sb.append("#Overall Lane Records\n");
    sb.append(
        "#Lane,Fastest Lap Holder,Nickname,Team,Date,Time,Highest Score Holder,Nickname,Team,Date,Score\n");
    List<RecordEntry> oLaneLaps = overall.getLaneFastestLapList();
    List<RecordEntry> oLaneScores = overall.getLaneHighestScoreList();

    for (int i = 0; i < oLaneLaps.size(); i++) {
      RecordEntry lLap = oLaneLaps.get(i);
      RecordEntry lScore = oLaneScores.get(i);

      String lLapDate = lLap.getDate() > 0 ? sdf.format(new Date(lLap.getDate())) : "N/A";
      String lScoreDate = lScore.getDate() > 0 ? sdf.format(new Date(lScore.getDate())) : "N/A";

      sb.append(i + 1)
          .append(",")
          .append(escape(lLap.getHolderName()))
          .append(",")
          .append(escape(lLap.getHolderNickname()))
          .append(",")
          .append(escape(lLap.getHolderTeamName()))
          .append(",")
          .append(escape(lLapDate))
          .append(",")
          .append(lLap.getValue())
          .append(",")
          .append(escape(lScore.getHolderName()))
          .append(",")
          .append(escape(lScore.getHolderNickname()))
          .append(",")
          .append(escape(lScore.getHolderTeamName()))
          .append(",")
          .append(escape(lScoreDate))
          .append(",")
          .append(lScore.getValue())
          .append("\n");
    }
    sb.append("\n");

    // --- Current Race Records ---
    sb.append("#--- Current Race Records ---\n");
    // Race Fastest Lap
    RecordEntry rFastestLap = current.getFastestLap();
    sb.append("#Race Fastest Lap,Holder,Nickname,Team,Time\n");
    sb.append("Race Fastest Lap,")
        .append(escape(rFastestLap.getHolderName()))
        .append(",")
        .append(escape(rFastestLap.getHolderNickname()))
        .append(",")
        .append(escape(rFastestLap.getHolderTeamName()))
        .append(",")
        .append(rFastestLap.getValue())
        .append("\n\n");

    // Race Highest Score
    RecordEntry rHighestScore = current.getHighestScore();
    sb.append("#Race Highest Score,Holder,Nickname,Team,Score\n");
    sb.append("Race Highest Score,")
        .append(escape(rHighestScore.getHolderName()))
        .append(",")
        .append(escape(rHighestScore.getHolderNickname()))
        .append(",")
        .append(escape(rHighestScore.getHolderTeamName()))
        .append(",")
        .append(rHighestScore.getValue())
        .append("\n\n");

    // Lane Records (Current Race)
    sb.append("#Lane Records (Current Race)\n");
    sb.append(
        "#Lane,Fastest Lap Holder,Nickname,Fastest Lap Team,Time,Highest Score Holder,Nickname,Highest Score Team,Score\n");
    List<RecordEntry> rLaneLaps = current.getLaneFastestLapList();
    List<RecordEntry> rLaneScores = current.getLaneHighestScoreList();

    for (int i = 0; i < rLaneLaps.size(); i++) {
      RecordEntry lLap = rLaneLaps.get(i);
      RecordEntry lScore = rLaneScores.get(i);

      sb.append(i + 1)
          .append(",")
          .append(escape(lLap.getHolderName()))
          .append(",")
          .append(escape(lLap.getHolderNickname()))
          .append(",")
          .append(escape(lLap.getHolderTeamName()))
          .append(",")
          .append(lLap.getValue())
          .append(",")
          .append(escape(lScore.getHolderName()))
          .append(",")
          .append(escape(lScore.getHolderNickname()))
          .append(",")
          .append(escape(lScore.getHolderTeamName()))
          .append(",")
          .append(lScore.getValue())
          .append("\n");
    }
    sb.append("\n");

    // Section 1: Track Information
    sb.append("#Section,Track Information\n");
    Track track = race.getTrack();
    if (track != null) {
      sb.append("#Property,Value\n");
      sb.append("Name,").append(escape(track.getName())).append("\n");
      sb.append("Geolocation,").append(escape(track.getGeolocation())).append("\n");
      sb.append("Lanes,").append(track.getLanes().size()).append("\n");
      sb.append("\n");

      sb.append("#Lane,Color,Foreground,Length\n");
      for (int i = 0; i < track.getLanes().size(); i++) {
        Lane lane = track.getLanes().get(i);
        sb.append(i + 1)
            .append(",")
            .append(escape(lane.getBackground_color()))
            .append(",")
            .append(escape(lane.getForeground_color()))
            .append(",")
            .append(lane.getLength())
            .append("\n");
      }
      sb.append("\n");
    }

    // Section 2: Race Configuration
    sb.append("#Section,Race Configuration\n");
    sb.append("#Property,Value\n");
    if (race.getRaceModel() != null) {
      sb.append("Name,").append(escape(race.getRaceModel().getName())).append("\n");
      sb.append("Car Class,").append(escape(race.getRaceModel().getCarClass())).append("\n");

      AnalogFuelOptions fuel = race.getRaceModel().getFuelOptions();
      if (fuel != null && fuel.isEnabled()) {
        sb.append("Analog Fuel,Enabled\n");
        sb.append("Capacity,").append(fuel.getCapacity()).append("\n");
        sb.append("Start Level,").append(fuel.getStartLevel()).append("\n");
      }

      DigitalFuelOptions digiFuel = race.getRaceModel().getDigitalFuelOptions();
      if (digiFuel != null && digiFuel.isEnabled()) {
        sb.append("Digital Fuel,Enabled\n");
        sb.append("Capacity,").append(digiFuel.getCapacity()).append("\n");
        sb.append("Start Level,").append(digiFuel.getStartLevel()).append("\n");
      }
    }
    sb.append("\n");

    // Section: Race Statistics
    RaceStatistics stats = race.getStatistics();
    if (stats != null) {
      sb.append("#Section, Race Statistics\n");
      sb.append("#Property, Value\n");
      sb.append("Start Time,").append(escape(stats.getStartTime())).append("\n");
      String endTime = stats.getEndTime() != null ? stats.getEndTime() : "N/A";
      sb.append("End Time,").append(escape(endTime)).append("\n");
      String duration =
          stats.getEndTime() != null ? String.valueOf(stats.getDurationMillis()) : "N/A";
      sb.append("Duration (ms),").append(duration).append("\n");
      sb.append("Yellow Flags,").append(stats.getYellowFlagCount()).append("\n");
      sb.append("Total Paused Time (ms),").append(stats.getTotalPausedTimeMillis()).append("\n");
      sb.append("Restarts,").append(stats.getRestartCount()).append("\n");
      sb.append("\n");
    }

    // Section 3: Overall Standings
    sb.append("#Section,Overall Standings\n");
    sb.append(
        "#Rank,Seed,Driver,Nickname,Team,Total Laps,Rank Value,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap,Total Time\n");
    List<RaceParticipant> drivers = race.getDrivers(); // Usually sorted after standings recalculate
    for (int i = 0; i < drivers.size(); i++) {
      RaceParticipant p = drivers.get(i);
      double gapLeader = 0;
      double gapPosition = 0;
      if (i > 0 && drivers.get(0) != p) {
        RaceParticipant leader = drivers.get(0);
        RaceParticipant prev = drivers.get(i - 1);
        gapLeader = Math.abs(leader.getRankValue() - p.getRankValue());
        gapPosition = Math.abs(prev.getRankValue() - p.getRankValue());
      }
      sb.append(p.getRank())
          .append(",")
          .append(p.getSeed())
          .append(",")
          .append(escape(p.getDriver() != null ? p.getDriver().getName() : "N/A"))
          .append(",")
          .append(
              escape(
                  p.getDriver() != null && p.getDriver().getNickname() != null
                      ? p.getDriver().getNickname()
                      : ""))
          .append(",")
          .append(escape(p.getTeam() != null ? p.getTeam().getName() : ""))
          .append(",")
          .append(p.getTotalLaps())
          .append(",")
          .append(p.getRankValue())
          .append(",")
          .append(gapLeader)
          .append(",")
          .append(gapPosition)
          .append(",")
          .append(p.getBestLapTime())
          .append(",")
          .append(p.getAverageLapTime())
          .append(",")
          .append(p.getMedianLapTime())
          .append(",")
          .append(p.getTotalTime())
          .append("\n");
    }
    sb.append("\n");

    // Section 4: Heats
    sb.append("#Section,Heats\n");
    List<Heat> heats = race.getHeats();
    if (heats != null) {
      for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
        Heat heat = heats.get(hIdx);
        sb.append("#Heat, Start Time, End Time, Duration\n");

        RaceHeatStatistics hStats = heat.getStatistics();
        String hStartTime = "N/A";
        String hEndTime = "N/A";
        String hDuration = "N/A";

        if (hStats != null) {
          hStartTime = hStats.getStartTime() != null ? hStats.getStartTime() : "N/A";
          hEndTime = hStats.getEndTime() != null ? hStats.getEndTime() : "N/A";
          hDuration =
              hStats.getEndTime() != null ? String.valueOf(hStats.getDurationMillis()) : "N/A";
        }

        sb.append(hIdx + 1)
            .append(",")
            .append(escape(hStartTime))
            .append(",")
            .append(escape(hEndTime))
            .append(",")
            .append(hDuration)
            .append("\n\n");
            "#Lane,Driver,Nickname,Team,Reaction Time,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap,Laps,Penalty Laps,False Starts,User Laps,Auto Calculated Laps,Adjusted Laps,Total Time\n");
        for (int lIdx = 0; lIdx < heat.getDrivers().size(); lIdx++) {
          DriverHeatData dhd = heat.getDrivers().get(lIdx);
          String driverName = "N/A";
          String nickname = "";
          String teamName = "";
          if (dhd.getDriver() != null && dhd.getDriver().getTeam() != null) {
            teamName = dhd.getDriver().getTeam().getName();
          }

          if (dhd.getActualDriver() != null) {
            driverName = dhd.getActualDriver().getName();
            nickname =
                dhd.getActualDriver().getNickname() != null
                    ? dhd.getActualDriver().getNickname()
                    : "";
          } else if (dhd.getDriver() != null && dhd.getDriver().getDriver() != null) {
            driverName = dhd.getDriver().getDriver().getName();
            nickname =
                dhd.getDriver().getDriver().getNickname() != null
                    ? dhd.getDriver().getDriver().getNickname()
                    : "";
          }
          sb.append(lIdx + 1)
              .append(",")
              .append(escape(driverName))
              .append(",")
              .append(escape(nickname))
              .append(",")
              .append(escape(teamName))
              .append(",")
              .append(dhd.getReactionTime())
              .append(",")
              .append(dhd.getGapLeader())
              .append(",")
              .append(dhd.getGapPosition())
              .append(",")
              .append(dhd.getBestLapTime())
              .append(",")
              .append(dhd.getAverageLapTime())
              .append(",")
              .append(dhd.getMedianLapTime())
              .append(",")
              .append(dhd.getLapCount())
              .append(",")
              .append(dhd.getPenaltyLaps())
              .append(",")
              .append(dhd.getFalseStarts())
              .append(",")
              .append(dhd.getUserLaps())
              .append(",")
              .append(dhd.getAutoCalculatedLaps())
              .append(",")
              .append(dhd.getAdjustedLapCount())
              .append(",")
              .append(dhd.getTotalTime())
              .append("\n");

          // Lap Data
          int maxSegments = dhd.getSegments().size();
          if (dhd.getLaps() != null) {
            for (LapData lap : dhd.getLaps()) {
              if (lap.getSegments() != null) {
                maxSegments = Math.max(maxSegments, lap.getSegments().size());
              }
            }
          }

          boolean hasSegments = maxSegments > 0;
          boolean hasLaps = dhd.getLaps() != null && !dhd.getLaps().isEmpty();

          if (hasLaps || dhd.getSegments().size() > 0) {
            // Build driver lookup for this lane
            Map<String, Driver> driverLookup = new HashMap<>();
            if (dhd.getDriver() != null) {
              if (dhd.getDriver().getDriver() != null) {
                driverLookup.put(
                    dhd.getDriver().getDriver().getEntityId(), dhd.getDriver().getDriver());
              }
              if (dhd.getDriver().getTeamDrivers() != null) {
                for (Driver td : dhd.getDriver().getTeamDrivers()) {
                  driverLookup.put(td.getEntityId(), td);
                }
              }
            }

            if (hasSegments) {
              sb.append("#Lap,Driver,Nickname,Team,Lap Time,Drift");
              for (int i = 0; i < maxSegments; i++) {
                sb.append(",Segment ").append(i + 1);
              }
              sb.append("\n");
            } else {
              sb.append("#Lap,Driver,Nickname,Team,Lap Time,Drift\n");
            }

            if (hasLaps) {
              for (int lapIdx = 0; lapIdx < dhd.getLaps().size(); lapIdx++) {
                LapData lap = dhd.getLaps().get(lapIdx);
                Driver lapDriver = driverLookup.get(lap.getDriverId());
                String lapDriverName = lapDriver != null ? lapDriver.getName() : "Unknown";
                String lapNickname =
                    (lapDriver != null && lapDriver.getNickname() != null)
                        ? lapDriver.getNickname()
                        : "";

                sb.append(lapIdx + 1)
                    .append(",")
                    .append(escape(lapDriverName))
                    .append(",")
                    .append(escape(lapNickname))
                    .append(",")
                    .append(escape(teamName)) // Global team name for this lane
                    .append(",")
                    .append(lap.getLapTime())
                    .append(",")
                    .append(lap.isDrift());

                if (hasSegments) {
                  for (int i = 0; i < maxSegments; i++) {
                    if (lap.getSegments() != null && i < lap.getSegments().size()) {
                      sb.append(",").append(lap.getSegments().get(i));
                    } else {
                      sb.append(",");
                    }
                  }
                }
                sb.append("\n");
              }
            }

            if (dhd.getSegments().size() > 0) {
              sb.append("#Current Lap\n");
              sb.append("#");
              for (int i = 0; i < dhd.getSegments().size(); i++) {
                sb.append("Segment ").append(i + 1);
                if (i < dhd.getSegments().size() - 1) {
                  sb.append(", ");
                }
              }
              sb.append("\n");

              for (int i = 0; i < dhd.getSegments().size(); i++) {
                sb.append(dhd.getSegments().get(i));
                if (i < dhd.getSegments().size() - 1) {
                  sb.append(",");
                }
              }
              sb.append("\n");
            }
          }
        }
        sb.append("\n");
      }
    }

    return sb.toString();
  }

  private static String escape(String value) {
    if (value == null) {
      return "";
    }
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }
}
