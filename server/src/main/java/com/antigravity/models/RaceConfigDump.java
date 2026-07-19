package com.antigravity.models;

import com.antigravity.race.RaceParticipant;
import java.util.List;

public class RaceConfigDump {
  private Race race;
  private Track track;
  private List<RaceParticipant> drivers;
  private List<CustomRotation> customRotations;
  private String recordDataBase64;

  public RaceConfigDump() {}

  public RaceConfigDump(
      Race race,
      Track track,
      List<RaceParticipant> drivers,
      List<CustomRotation> customRotations,
      String recordDataBase64) {
    this.race = race;
    this.track = track;
    this.drivers = drivers;
    this.customRotations = customRotations;
    this.recordDataBase64 = recordDataBase64;
  }

  public Race getRace() {
    return race;
  }

  public void setRace(Race race) {
    this.race = race;
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

  public List<CustomRotation> getCustomRotations() {
    return customRotations;
  }

  public void setCustomRotations(List<CustomRotation> customRotations) {
    this.customRotations = customRotations;
  }

  public String getRecordDataBase64() {
    return recordDataBase64;
  }

  public void setRecordDataBase64(String recordDataBase64) {
    this.recordDataBase64 = recordDataBase64;
  }
}
