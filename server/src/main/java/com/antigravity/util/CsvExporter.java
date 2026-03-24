package com.antigravity.util;

import com.antigravity.race.Race;
import com.antigravity.race.Heat;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.RaceParticipant;
import com.antigravity.models.Track;
import com.antigravity.models.Lane;

import java.util.List;

public class CsvExporter {

    public static String export(Race race) {
        StringBuilder sb = new StringBuilder();
        
        // Section 1: Track Information
        sb.append("#Section,Track Information\n");
        Track track = race.getTrack();
        if (track != null) {
            sb.append("#Property,Value\n");
            sb.append("Name,").append(escape(track.getName())).append("\n");
            sb.append("Lanes,").append(track.getLanes().size()).append("\n");
            sb.append("\n");
            
            sb.append("#Lane,Color,Foreground,Length\n");
            for (int i = 0; i < track.getLanes().size(); i++) {
                Lane lane = track.getLanes().get(i);
                sb.append(i + 1).append(",")
                  .append(escape(lane.getBackground_color())).append(",")
                  .append(escape(lane.getForeground_color())).append(",")
                  .append(lane.getLength()).append("\n");
            }
            sb.append("\n");
        }

        // Section 2: Race Configuration
        sb.append("#Section,Race Configuration\n");
        sb.append("#Property,Value\n");
        if (race.getRaceModel() != null) {
            sb.append("Name,").append(escape(race.getRaceModel().getName())).append("\n");
            
            com.antigravity.models.AnalogFuelOptions fuel = race.getRaceModel().getFuelOptions();
            if (fuel != null && fuel.isEnabled()) {
                sb.append("Analog Fuel,Enabled\n");
                sb.append("Capacity,").append(fuel.getCapacity()).append("\n");
                sb.append("Start Level,").append(fuel.getStartLevel()).append("\n");
            }
            
            com.antigravity.models.DigitalFuelOptions digiFuel = race.getRaceModel().getDigitalFuelOptions();
            if (digiFuel != null && digiFuel.isEnabled()) {
                sb.append("Digital Fuel,Enabled\n");
                sb.append("Capacity,").append(digiFuel.getCapacity()).append("\n");
                sb.append("Start Level,").append(digiFuel.getStartLevel()).append("\n");
            }
        }
        sb.append("\n");

        // Section 3: Overall Standings
        sb.append("#Section,Overall Standings\n");
        sb.append("#Rank,Seed,Driver,Nickname,Total Laps,Total Time,Rank Value,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap\n");
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
            sb.append(p.getRank()).append(",")
              .append(p.getSeed()).append(",")
              .append(escape(p.getDriver() != null ? p.getDriver().getName() : "N/A")).append(",")
              .append(escape(p.getDriver() != null && p.getDriver().getNickname() != null ? p.getDriver().getNickname() : "")).append(",")
              .append(p.getTotalLaps()).append(",")
              .append(p.getTotalTime()).append(",")
              .append(p.getRankValue()).append(",")
              .append(gapLeader).append(",")
              .append(gapPosition).append(",")
              .append(p.getBestLapTime()).append(",")
              .append(p.getAverageLapTime()).append(",")
              .append(p.getMedianLapTime()).append("\n");
        }
        sb.append("\n");

        // Section 4: Heats
        sb.append("#Section,Heats\n");
        List<Heat> heats = race.getHeats();
        if (heats != null) {
            for (int hIdx = 0; hIdx < heats.size(); hIdx++) {
                Heat heat = heats.get(hIdx);
                sb.append("#Heat,").append(hIdx + 1).append("\n");
                sb.append("#Lane,Driver,Nickname,Reaction Time,Gap Leader,Gap Position,Best Lap,Avg Lap,Median Lap,Total Laps\n");
                for (int lIdx = 0; lIdx < heat.getDrivers().size(); lIdx++) {
                    DriverHeatData dhd = heat.getDrivers().get(lIdx);
                    String driverName = "N/A";
                    String nickname = "";
                    if (dhd.getActualDriver() != null) {
                        driverName = dhd.getActualDriver().getName();
                        nickname = dhd.getActualDriver().getNickname() != null ? dhd.getActualDriver().getNickname() : "";
                    } else if (dhd.getDriver() != null && dhd.getDriver().getDriver() != null) {
                        driverName = dhd.getDriver().getDriver().getName();
                        nickname = dhd.getDriver().getDriver().getNickname() != null ? dhd.getDriver().getDriver().getNickname() : "";
                    }
                    sb.append(lIdx + 1).append(",")
                      .append(escape(driverName)).append(",")
                      .append(escape(nickname)).append(",")
                      .append(dhd.getReactionTime()).append(",")
                      .append(dhd.getGapLeader()).append(",")
                      .append(dhd.getGapPosition()).append(",")
                      .append(dhd.getBestLapTime()).append(",")
                      .append(dhd.getAverageLapTime()).append(",")
                      .append(dhd.getMedianLapTime()).append(",")
                      .append(dhd.getLapCount()).append("\n");
                    
                    // Lap Data
                    int maxSegments = dhd.getSegments().size();
                    if (dhd.getLaps() != null) {
                        for (com.antigravity.race.DriverHeatData.LapData lap : dhd.getLaps()) {
                            if (lap.getSegments() != null) {
                                maxSegments = Math.max(maxSegments, lap.getSegments().size());
                            }
                        }
                    }
                    
                    boolean hasSegments = maxSegments > 0;
                    boolean hasLaps = dhd.getLaps() != null && !dhd.getLaps().isEmpty();

                    if (hasLaps || dhd.getSegments().size() > 0) {
                        if (hasSegments) {
                            sb.append("#Lap,Lap Time");
                            for (int i = 0; i < maxSegments; i++) {
                                sb.append(",Segment ").append(i + 1);
                            }
                            sb.append("\n");
                        } else {
                            sb.append("#Lap,Lap Time\n");
                        }

                        if (hasLaps) {
                            for (int lapIdx = 0; lapIdx < dhd.getLaps().size(); lapIdx++) {
                                com.antigravity.race.DriverHeatData.LapData lap = dhd.getLaps().get(lapIdx);
                                sb.append(lapIdx + 1).append(",").append(lap.getLapTime());
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
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
