package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Heat extends ServerToClientObject {

  private int heatNumber;
  private List<DriverHeatData> drivers;
  private RaceHeatStatistics statistics = new RaceHeatStatistics();
  @com.fasterxml.jackson.annotation.JsonIgnore private HeatStandings heatStandings;
  private boolean started = false;
  private int group = 0;
  private int masterTrackCalls = 0;
  private int trackCalls = 0;

  public int getMasterTrackCalls() {
    return masterTrackCalls;
  }

  public void setMasterTrackCalls(int masterTrackCalls) {
    this.masterTrackCalls = masterTrackCalls;
  }

  public void incrementMasterTrackCalls() {
    this.masterTrackCalls++;
  }

  public int getTrackCalls() {
    return trackCalls;
  }

  public void setTrackCalls(int trackCalls) {
    this.trackCalls = trackCalls;
  }

  public void incrementTrackCalls() {
    this.trackCalls++;
  }

  public void resetTrackCalls() {
    this.masterTrackCalls = 0;
    this.trackCalls = 0;
  }

  public Heat(int heatNumber, List<DriverHeatData> drivers, HeatScoring scoring, boolean practice) {
    super();
    this.heatNumber = heatNumber;
    this.drivers = drivers != null ? drivers : new ArrayList<>();
    if (this.drivers != null) {
      HeatScoring safeScoring = scoring != null ? scoring : new HeatScoring();
      this.heatStandings = new HeatStandings(this.drivers, safeScoring, practice);
    }
  }

  public Heat(int heatNumber, List<DriverHeatData> drivers, boolean practice) {
    this(heatNumber, drivers, null, practice);
  }

  public Heat(
      int heatNumber,
      List<DriverHeatData> drivers,
      int group,
      HeatScoring scoring,
      boolean practice) {
    this(heatNumber, drivers, scoring, practice);
    this.group = group;
  }

  public Heat() {
    super();
    this.drivers = new ArrayList<>();
  }

  public void setDrivers(List<DriverHeatData> drivers) {
    this.drivers = drivers != null ? drivers : new ArrayList<>();
  }

  public void initializeStandings(HeatScoring scoring, boolean practice) {
    HeatScoring safeScoring = scoring != null ? scoring : new HeatScoring();
    this.heatStandings = new HeatStandings(this.drivers, safeScoring, practice);
  }

  public int getHeatNumber() {
    return heatNumber;
  }

  public List<DriverHeatData> getDrivers() {
    return drivers;
  }

  public String getDriverNameOnLane(int laneIndex) {
    if (drivers != null && laneIndex >= 0 && laneIndex < drivers.size()) {
      DriverHeatData dhd = drivers.get(laneIndex);
      if (dhd != null) {
        if (dhd.getActualDriver() != null
            && dhd.getActualDriver().getName() != null
            && !dhd.getActualDriver().getName().trim().isEmpty()) {
          return dhd.getActualDriver().getName();
        }
        if (dhd.getDriver() != null
            && dhd.getDriver().getDriver() != null
            && dhd.getDriver().getDriver().getName() != null) {
          return dhd.getDriver().getDriver().getName();
        }
      }
    }
    return "";
  }

  @JsonIgnore
  public List<String> getStandings() {
    return heatStandings != null ? heatStandings.getStandings() : new ArrayList<>();
  }

  @JsonIgnore
  public HeatStandings getHeatStandings() {
    return heatStandings;
  }

  public RaceHeatStatistics getStatistics() {
    return statistics;
  }

  public void setStatistics(RaceHeatStatistics statistics) {
    this.statistics = statistics;
  }

  public void setHeatNumber(int heatNumber) {
    this.heatNumber = heatNumber;
  }

  @JsonIgnore
  public int getActiveDriverCount() {
    int count = 0;
    if (drivers != null) {
      for (DriverHeatData driverData : drivers) {
        if (driverData != null) {
          if (driverData.getActualDriver() != null
              && driverData.getActualDriver().getEntityId() != null
              && !driverData.getActualDriver().isEmpty()) {
            count++;
          } else if (driverData.getDriver() != null
              && driverData.getDriver().getDriver() != null
              && driverData.getDriver().getDriver().getEntityId() != null
              && !driverData.getDriver().getDriver().isEmpty()) {
            count++;
          }
        }
      }
    }
    return count;
  }

  @JsonIgnore
  public boolean isEmpty() {
    return getActiveDriverCount() == 0;
  }

  public boolean isStarted() {
    return started;
  }

  public void setStarted(boolean started) {
    this.started = started;
  }

  public int getGroup() {
    return group;
  }

  public void setGroup(int group) {
    this.group = group;
  }

  public DriverHeatData getDriverOnLane(int laneIndex) {
    if (drivers != null && laneIndex >= 0 && laneIndex < drivers.size()) {
      return drivers.get(laneIndex);
    }
    return null;
  }

  public Double getLaneTotalLaps(int laneIndex) {
    DriverHeatData dhd = getDriverOnLane(laneIndex);
    if (dhd != null && !dhd.isEmptyParticipant()) {
      return dhd.getAdjustedLapCount();
    }
    return null;
  }

  @JsonIgnore
  public int getMaxSegments() {
    if (drivers == null) {
      return 0;
    }
    int max = 0;
    for (DriverHeatData dhd : drivers) {
      if (dhd != null && dhd.getLaps() != null) {
        for (DriverHeatData.LapData lap : dhd.getLaps()) {
          if (lap != null && lap.getSegments() != null) {
            max = Math.max(max, lap.getSegments().size());
          }
        }
      }
    }
    return max;
  }

  @JsonIgnore
  public List<String> getColumnHeaders() {
    List<String> headers = new ArrayList<>();
    if (drivers == null || drivers.isEmpty()) {
      return headers;
    }
    int maxSegs = getMaxSegments();
    for (int i = 0; i < drivers.size(); i++) {
      headers.add("Lane " + (i + 1));
      if (maxSegs == 1) {
        headers.add("Segments");
      } else if (maxSegs > 1) {
        for (int s = 0; s < maxSegs; s++) {
          headers.add("Seg " + (s + 1));
        }
      }
    }
    return headers;
  }

  @JsonIgnore
  public List<Object> getDriverHeaders() {
    List<Object> headers = new ArrayList<>();
    if (drivers == null || drivers.isEmpty()) {
      return headers;
    }
    int maxSegs = getMaxSegments();
    for (int i = 0; i < drivers.size(); i++) {
      headers.add(getDriverNameOnLane(i));
      for (int s = 0; s < maxSegs; s++) {
        headers.add(null);
      }
    }
    return headers;
  }

  @JsonIgnore
  public List<Object> getTotalLapHeaders() {
    List<Object> headers = new ArrayList<>();
    if (drivers == null || drivers.isEmpty()) {
      return headers;
    }
    int maxSegs = getMaxSegments();
    for (int i = 0; i < drivers.size(); i++) {
      headers.add(getLaneTotalLaps(i));
      for (int s = 0; s < maxSegs; s++) {
        headers.add(null);
      }
    }
    return headers;
  }

  @JsonIgnore
  public List<HeatLapRow> getLapRows() {
    List<HeatLapRow> rows = new ArrayList<>();
    if (drivers == null || drivers.isEmpty()) {
      return rows;
    }
    int maxLaps = 0;
    for (DriverHeatData dhd : drivers) {
      if (dhd != null && dhd.getLaps() != null) {
        maxLaps = Math.max(maxLaps, dhd.getLaps().size());
      }
    }
    int laneCount = drivers.size();
    int maxSegs = getMaxSegments();
    for (int lapIdx = 0; lapIdx < maxLaps; lapIdx++) {
      List<Double> laneLaps = new ArrayList<>(laneCount);
      List<List<Double>> laneSegments = new ArrayList<>(laneCount);
      for (int laneIdx = 0; laneIdx < laneCount; laneIdx++) {
        DriverHeatData dhd = drivers.get(laneIdx);
        if (dhd != null && dhd.getLaps() != null && lapIdx < dhd.getLaps().size()) {
          DriverHeatData.LapData lapData = dhd.getLaps().get(lapIdx);
          laneLaps.add(lapData != null ? lapData.getLapTime() : null);
          if (lapData != null
              && lapData.getSegments() != null
              && !lapData.getSegments().isEmpty()) {
            List<Double> roundedSegs = new ArrayList<>(lapData.getSegments().size());
            for (Double s : lapData.getSegments()) {
              roundedSegs.add(s != null ? RaceStatisticsUtils.roundToThreeDecimals(s) : null);
            }
            laneSegments.add(roundedSegs);
          } else {
            laneSegments.add(Collections.emptyList());
          }
        } else {
          laneLaps.add(null);
          laneSegments.add(Collections.emptyList());
        }
      }
      rows.add(new HeatLapRow(lapIdx + 1, laneLaps, laneSegments, maxSegs));
    }
    return rows;
  }

  @JsonIgnore
  public boolean hasSegments() {
    return getMaxSegments() > 0;
  }
}
