package com.antigravity.race;

import java.util.List;

public class RaceSaveData {
  private com.antigravity.models.Race model;
  private com.antigravity.models.Track track;
  private List<RaceParticipant> drivers;
  private List<Heat> heats;
  private String stateClassName;
  private float accumulatedRaceTime;
  private boolean hasRacedInCurrentHeat;
  private int currentHeatIndex;
  private boolean isDemoMode;
  private boolean autoStartFired;
  private boolean autoAdvanceFired;

  public RaceSaveData() {
  }

  public com.antigravity.models.Race getModel() {
    return model;
  }

  public void setModel(com.antigravity.models.Race model) {
    this.model = model;
  }

  public com.antigravity.models.Track getTrack() {
    return track;
  }

  public void setTrack(com.antigravity.models.Track track) {
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
