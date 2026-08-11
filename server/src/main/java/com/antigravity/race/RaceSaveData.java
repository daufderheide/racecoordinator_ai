package com.antigravity.race;

import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class RaceSaveData {

  @JsonProperty("_id")
  private String id;

  @JsonProperty("saveName")
  private String saveName;

  @JsonProperty("isAutoSave")
  private boolean isAutoSave;

  private Race model;
  private Track track;
  private List<RaceParticipant> drivers;
  private List<Heat> heats;
  private String stateClassName;
  private float accumulatedRaceTime;
  private boolean hasRacedInCurrentHeat;
  private int currentHeatIndex;
  private boolean isDemoMode;
  private boolean autoStartFired;
  private boolean autoAdvanceFired;
  private RaceStatistics statistics;

  public RaceSaveData() {}

  public RaceSaveData(
      String id,
      String saveName,
      boolean isAutoSave,
      Race model,
      Track track,
      List<RaceParticipant> drivers,
      List<Heat> heats,
      String stateClassName,
      float accumulatedRaceTime,
      boolean hasRacedInCurrentHeat,
      int currentHeatIndex,
      boolean isDemoMode,
      boolean autoStartFired,
      boolean autoAdvanceFired,
      RaceStatistics statistics) {
    this.id = id;
    this.saveName = saveName;
    this.isAutoSave = isAutoSave;
    this.model = model;
    this.track = track;
    this.drivers = drivers;
    this.heats = heats;
    this.stateClassName = stateClassName;
    this.accumulatedRaceTime = accumulatedRaceTime;
    this.hasRacedInCurrentHeat = hasRacedInCurrentHeat;
    this.currentHeatIndex = currentHeatIndex;
    this.isDemoMode = isDemoMode;
    this.autoStartFired = autoStartFired;
    this.autoAdvanceFired = autoAdvanceFired;
    this.statistics = statistics;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getSaveName() {
    return saveName;
  }

  public void setSaveName(String saveName) {
    this.saveName = saveName;
  }

  public boolean isAutoSave() {
    return isAutoSave;
  }

  public void setAutoSave(boolean isAutoSave) {
    this.isAutoSave = isAutoSave;
  }

  public RaceStatistics getStatistics() {
    return statistics;
  }

  public void setStatistics(RaceStatistics statistics) {
    this.statistics = statistics;
  }

  public Race getModel() {
    return model;
  }

  public void setModel(Race model) {
    this.model = model;
  }

  public Track getTrack() {
    return track;
  }

  public void setTrack(Track track) {
    this.track = track;
  }

  public List<RaceParticipant> getDrivers() {
    return drivers;
  }

  public void setDrivers(List<RaceParticipant> drivers) {
    this.drivers = drivers;
  }

  public List<Heat> getHeats() {
    return heats;
  }

  public void setHeats(List<Heat> heats) {
    this.heats = heats;
  }

  public String getStateClassName() {
    return stateClassName;
  }

  public void setStateClassName(String stateClassName) {
    this.stateClassName = stateClassName;
  }

  public float getAccumulatedRaceTime() {
    return accumulatedRaceTime;
  }

  public void setAccumulatedRaceTime(float accumulatedRaceTime) {
    this.accumulatedRaceTime = accumulatedRaceTime;
  }

  public boolean isHasRacedInCurrentHeat() {
    return hasRacedInCurrentHeat;
  }

  public void setHasRacedInCurrentHeat(boolean hasRacedInCurrentHeat) {
    this.hasRacedInCurrentHeat = hasRacedInCurrentHeat;
  }

  public int getCurrentHeatIndex() {
    return currentHeatIndex;
  }

  public void setCurrentHeatIndex(int currentHeatIndex) {
    this.currentHeatIndex = currentHeatIndex;
  }

  public boolean isDemoMode() {
    return isDemoMode;
  }

  public void setDemoMode(boolean demoMode) {
    isDemoMode = demoMode;
  }

  public boolean isAutoStartFired() {
    return autoStartFired;
  }

  public void setAutoStartFired(boolean autoStartFired) {
    this.autoStartFired = autoStartFired;
  }

  public boolean isAutoAdvanceFired() {
    return autoAdvanceFired;
  }

  public void setAutoAdvanceFired(boolean autoAdvanceFired) {
    this.autoAdvanceFired = autoAdvanceFired;
  }
}
