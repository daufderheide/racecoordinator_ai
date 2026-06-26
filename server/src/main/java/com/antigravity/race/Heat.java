package com.antigravity.race;

import com.antigravity.models.HeatScoring;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

public class Heat extends ServerToClientObject {

  private int heatNumber;
  private List<DriverHeatData> drivers;
  private RaceHeatStatistics statistics = new RaceHeatStatistics();
  @org.bson.codecs.pojo.annotations.BsonIgnore private HeatStandings heatStandings;
  private boolean started = false;
  private int group = 0;

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

  @JsonIgnore
  @org.bson.codecs.pojo.annotations.BsonIgnore
  public List<String> getStandings() {
    return heatStandings != null ? heatStandings.getStandings() : new ArrayList<>();
  }

  @JsonIgnore
  @org.bson.codecs.pojo.annotations.BsonIgnore
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

  public int getActiveDriverCount() {
    int count = 0;
    for (DriverHeatData driverData : drivers) {
      if (driverData != null
          && driverData.getDriver() != null
          && driverData.getDriver().getDriver() != null
          && driverData.getDriver().getDriver().getEntityId() != null
          && !driverData.getDriver().getDriver().isEmpty()) {
        count++;
      }
    }
    return count;
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
}
