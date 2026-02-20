package com.antigravity.race;

import java.util.ArrayList;
import java.util.Collections;

import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class DriverHeatData extends ServerToClientObject {
  private RaceParticipant driver;
  private com.antigravity.models.Driver actualDriver;

  private ArrayList<Double> laps = new ArrayList<>();
  private double bestLapTime = 0.0f;
  private double reactionTime = 0.0f;
  private double pendingLapTime = 0.0f;
  private double gapLeader = 0.0;
  private double gapPosition = 0.0;

  private static void logToFile(String message) {
    try {
      String tmpDir = System.getProperty("java.io.tmpdir");
      java.nio.file.Path logPath = java.nio.file.Paths.get(tmpDir, "race_debug.log");
      java.nio.file.Files.write(logPath, (message + "\n").getBytes(),
          java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
    } catch (Exception e) {
      // Ignore
    }
  }

  @BsonCreator
  public DriverHeatData(@BsonProperty("driver") RaceParticipant driver,
      @BsonProperty("actualDriver") com.antigravity.models.Driver actualDriver) {
    super();
    this.driver = driver;
    if (actualDriver != null) {
      // logToFile("DriverHeatData (BsonCreator): Loaded with ActualDriver: " +
      // actualDriver.getName());
      this.actualDriver = actualDriver;
    } else {
      // logToFile("DriverHeatData (BsonCreator): Missing ActualDriver, falling back
      // to: " + driver.getDriver().getName());
      this.actualDriver = driver.getDriver(); // Default to participant driver (null if team)
    }
  }

  public DriverHeatData(RaceParticipant driver) {
    this(driver, null);
  }

  public DriverHeatData() {
    super();
  }

  public RaceParticipant getDriver() {
    return driver;
  }

  public void setDriver(RaceParticipant driver) {
    this.driver = driver;
  }

  public com.antigravity.models.Driver getActualDriver() {
    return actualDriver;
  }

  public void setActualDriver(com.antigravity.models.Driver actualDriver) {
    this.actualDriver = actualDriver;
  }

  public void addLap(double lapTime) {
    laps.add(lapTime);
    if (bestLapTime == 0.0f || lapTime < bestLapTime) {
      bestLapTime = lapTime;
    }
  }

  public int getLapCount() {
    return laps.size();
  }

  public java.util.List<Double> getLaps() {
    return java.util.Collections.unmodifiableList(laps);
  }

  public double getLastLapTime() {
    if (laps.isEmpty()) {
      return 0.0f;
    }
    return laps.get(laps.size() - 1);
  }

  public double getAverageLapTime() {
    // TODO(aufderheide): Extract the calculation into a utility class
    if (laps.isEmpty()) {
      return 0.0f;
    }
    double sum = 0.0f;
    for (double time : laps) {
      sum += time;
    }
    return sum / laps.size();
  }

  public double getMedianLapTime() {
    // TODO(aufderheide): Extract the calculation into a utility class
    if (laps.isEmpty()) {
      return 0.0f;
    }
    ArrayList<Double> sortedLaps = new ArrayList<>(laps);
    Collections.sort(sortedLaps);
    int middle = sortedLaps.size() / 2;
    if (sortedLaps.size() % 2 == 1) {
      return sortedLaps.get(middle);
    } else {
      return (sortedLaps.get(middle - 1) + sortedLaps.get(middle)) / 2.0f;
    }
  }

  public double getBestLapTime() {
    return bestLapTime;
  }

  public double getReactionTime() {
    return reactionTime;
  }

  public void setReactionTime(double reactionTime) {
    this.reactionTime = reactionTime;
  }

  public double getTotalTime() {
    double sum = 0.0f;
    for (double time : laps) {
      sum += time;
    }
    return sum;
  }

  public void reset() {
    laps.clear();
    bestLapTime = 0.0f;
    reactionTime = 0.0f;
    pendingLapTime = 0.0f;
    gapLeader = 0.0;
    gapPosition = 0.0;
  }

  public double getPendingLapTime() {
    return pendingLapTime;
  }

  public void setPendingLapTime(double pendingLapTime) {
    this.pendingLapTime = pendingLapTime;
  }

  public void addPendingLapTime(double lapTime) {
    this.pendingLapTime += lapTime;
  }

  public double getGapLeader() {
    return gapLeader;
  }

  public void setGapLeader(double gapLeader) {
    this.gapLeader = gapLeader;
  }

  public double getGapPosition() {
    return gapPosition;
  }

  public void setGapPosition(double gapPosition) {
    this.gapPosition = gapPosition;
  }
}
