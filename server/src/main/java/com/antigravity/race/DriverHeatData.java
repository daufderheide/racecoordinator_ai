package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.proto.RaceFlag;
import com.antigravity.protocols.CarLocation;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverHeatData extends ServerToClientObject
    implements GapParticipant, StandingsParticipant {

  private RaceParticipant driver;
  private Driver actualDriver;

  public static class LapData {

    private double lapTime;
    private String driverId;
    private List<Double> segments = new ArrayList<>();
    private boolean isDrift;
    private boolean countTowardsRecords = true;

    public LapData(double lapTime, String driverId, List<Double> segments, boolean isDrift) {
      this(lapTime, driverId, segments, isDrift, true);
    }

    public LapData(
        double lapTime,
        String driverId,
        List<Double> segments,
        boolean isDrift,
        boolean countTowardsRecords) {
      this.lapTime = lapTime;
      this.driverId = driverId;
      if (segments != null) {
        this.segments = new ArrayList<>(segments);
      }
      this.isDrift = isDrift;
      this.countTowardsRecords = countTowardsRecords;
    }

    public LapData() {}

    public double getLapTime() {
      return lapTime;
    }

    public void setLapTime(double lapTime) {
      this.lapTime = lapTime;
    }

    public String getDriverId() {
      return driverId;
    }

    public void setDriverId(String driverId) {
      this.driverId = driverId;
    }

    public List<Double> getSegments() {
      return segments;
    }

    public void setSegments(List<Double> segments) {
      this.segments = segments != null ? new ArrayList<>(segments) : new ArrayList<>();
    }

    public boolean isDrift() {
      return isDrift;
    }

    public void setDrift(boolean drift) {
      isDrift = drift;
    }

    public boolean isCountTowardsRecords() {
      return countTowardsRecords;
    }

    public void setCountTowardsRecords(boolean countTowardsRecords) {
      this.countTowardsRecords = countTowardsRecords;
    }
  }

  private ArrayList<LapData> laps = new ArrayList<>();
  private double bestLapTime = 0.0f;
  private double reactionTime = -1.0;
  private double pendingLapTime = 0.0f;
  private double initialFuelLevel = 0.0;
  private double gapLeader = 0.0;
  private double gapPosition = 0.0;
  private double gapLeaderF1 = 0.0;
  private double gapPositionF1 = 0.0;
  private int lapsDownLeader = 0;
  private int lapsDownPosition = 0;
  private ArrayList<Double> segments = new ArrayList<>();
  private CarLocation currentLocation;
  private double penaltyLaps = 0;
  private double userLaps = 0;
  private double autoCalculatedLaps = 0;
  private int falseStarts = 0;
  private boolean isRefueling = false;
  private double remainingFalseStartTimePenalty = 0.0;
  private RaceFlag flag = RaceFlag.UNKNOWN_FLAG;
  private boolean isFinished = false;
  private double carryOverTime = 0.0;
  private boolean hasDriftTime = false;
  private int lane = 0;
  private int lapsLed = 0;

  public int getLapsLed() {
    return lapsLed;
  }

  public void setLapsLed(int lapsLed) {
    this.lapsLed = lapsLed;
  }

  public int getLane() {
    return lane;
  }

  public void setLane(int lane) {
    this.lane = lane;
  }

  public DriverHeatData(RaceParticipant driver, Driver actualDriver) {
    super();
    this.driver = driver;
    if (actualDriver != null) {
      this.actualDriver = actualDriver;
    } else if (driver != null) {
      this.actualDriver = driver.getDriver();
    }
  }

  public DriverHeatData(RaceParticipant driver) {
    this(driver, null);
  }

  public DriverHeatData() {
    super();
  }

  public void setLaps(List<LapData> laps) {
    this.laps.clear();
    if (laps != null) {
      this.laps.addAll(laps);
    }
  }

  public void setSegments(List<Double> segments) {
    this.segments.clear();
    if (segments != null) {
      this.segments.addAll(segments);
    }
  }

  public RaceParticipant getDriver() {
    return driver;
  }

  public void setDriver(RaceParticipant driver) {
    this.driver = driver;
  }

  public Driver getActualDriver() {
    return actualDriver;
  }

  public void setActualDriver(Driver actualDriver) {
    this.actualDriver = actualDriver;
  }

  public void addLap(double lapTime, boolean isDrift, boolean countTowardsRecords) {
    laps.add(
        new LapData(
            lapTime,
            actualDriver != null ? actualDriver.getEntityId() : "",
            new ArrayList<>(segments),
            isDrift,
            countTowardsRecords));
    if (countTowardsRecords) {
      if (bestLapTime == 0.0f || lapTime < bestLapTime) {
        bestLapTime = lapTime;
      }
    }
    segments.clear();
  }

  public double getCarryOverTime() {
    return carryOverTime;
  }

  public void setCarryOverTime(double carryOverTime) {
    this.carryOverTime = carryOverTime;
  }

  public void addSegment(double segmentTime) {
    segments.add(segmentTime);
  }

  public List<Double> getSegments() {
    return segments;
  }

  public int getLapCount() {
    return laps.size();
  }

  @Override
  public int getPhysicalLapCount() {
    return laps.size();
  }

  @Override
  public double getTimeAtLap(int lapIndex) {
    if (lapIndex <= 0) {
      return 0.0;
    }
    if (lapIndex > laps.size()) {
      lapIndex = laps.size();
    }
    double sum = 0.0;
    for (int i = 0; i < lapIndex; i++) {
      sum += laps.get(i).getLapTime();
    }
    return sum;
  }

  public double getAdjustedLapCount() {
    return (double) getLapCount() - penaltyLaps + userLaps + autoCalculatedLaps;
  }

  public List<LapData> getLaps() {
    return laps;
  }

  public double getLastLapTime() {
    if (laps.isEmpty()) {
      return 0.0f;
    }
    return laps.get(laps.size() - 1).getLapTime();
  }

  public double getAverageLapTime() {
    // TODO(aufderheide): Extract the calculation into a utility class
    if (laps.isEmpty()) {
      return 0.0f;
    }
    double sum = 0.0f;
    for (LapData lap : laps) {
      sum += lap.getLapTime();
    }
    return sum / laps.size();
  }

  public double getMedianLapTime() {
    // TODO(aufderheide): Extract the calculation into a utility class
    if (laps.isEmpty()) {
      return 0.0f;
    }
    ArrayList<Double> sortedLaps = new ArrayList<>();
    for (LapData lap : laps) {
      sortedLaps.add(lap.getLapTime());
    }
    Collections.sort(sortedLaps);
    int middle = sortedLaps.size() / 2;
    if (sortedLaps.size() % 2 == 1) {
      return sortedLaps.get(middle);
    } else {
      return (sortedLaps.get(middle - 1) + sortedLaps.get(middle)) / 2.0f;
    }
  }

  public double getBestLapTime() {
    if (bestLapTime == 0.0 && laps != null && !laps.isEmpty()) {
      double best = 0.0;
      for (LapData lap : laps) {
        if (lap != null && lap.isCountTowardsRecords() && lap.getLapTime() > 0) {
          if (best == 0.0 || lap.getLapTime() < best) {
            best = lap.getLapTime();
          }
        }
      }
      bestLapTime = best;
    }
    return bestLapTime;
  }

  public void setBestLapTime(double bestLapTime) {
    this.bestLapTime = bestLapTime;
  }

  public double getReactionTime() {
    return reactionTime;
  }

  public void setReactionTime(double reactionTime) {
    this.reactionTime = reactionTime;
  }

  public double getTotalTime() {
    double sum = 0.0f;
    for (LapData lap : laps) {
      sum += lap.getLapTime();
    }
    return sum;
  }

  public void reset() {
    laps.clear();
    segments.clear();
    bestLapTime = 0.0f;
    reactionTime = -1.0;
    pendingLapTime = 0.0f;
    gapLeader = 0.0;
    gapPosition = 0.0;
    gapLeaderF1 = 0.0;
    gapPositionF1 = 0.0;
    lapsDownLeader = 0;
    lapsDownPosition = 0;
    falseStarts = 0;
    remainingFalseStartTimePenalty = 0.0;
    penaltyLaps = 0.0;
    hasDriftTime = false;
    isFinished = false;
  }

  public void resetForFalseStart() {
    int savedFalseStarts = falseStarts;
    double savedRemainingPenalty = remainingFalseStartTimePenalty;
    double savedPenaltyLaps = penaltyLaps;
    reset();
    falseStarts = savedFalseStarts;
    remainingFalseStartTimePenalty = savedRemainingPenalty;
    penaltyLaps = savedPenaltyLaps;
  }

  @Override
  public boolean hasNoFullLaps() {
    return getLapCount() == 0;
  }

  public double getPendingLapTime() {
    return pendingLapTime;
  }

  public void setPendingLapTime(double pendingLapTime) {
    this.pendingLapTime = pendingLapTime;
  }

  public double getInitialFuelLevel() {
    return initialFuelLevel;
  }

  public void setInitialFuelLevel(double initialFuelLevel) {
    this.initialFuelLevel = initialFuelLevel;
  }

  public void addPendingLapTime(double lapTime) {
    this.pendingLapTime += lapTime;
  }

  public double getGapLeader() {
    if (isEmptyParticipant()) return 0.0;
    return gapLeader;
  }

  public void setGapLeader(double gapLeader) {
    this.gapLeader = gapLeader;
  }

  public double getGapPosition() {
    if (isEmptyParticipant()) return 0.0;
    return gapPosition;
  }

  public void setGapPosition(double gapPosition) {
    this.gapPosition = gapPosition;
  }

  public double getGapLeaderF1() {
    if (isEmptyParticipant()) return 0.0;
    return gapLeaderF1;
  }

  @Override
  public void setGapLeaderF1(double gapLeaderF1) {
    this.gapLeaderF1 = gapLeaderF1;
  }

  public double getGapPositionF1() {
    if (isEmptyParticipant()) return 0.0;
    return gapPositionF1;
  }

  @Override
  public void setGapPositionF1(double gapPositionF1) {
    this.gapPositionF1 = gapPositionF1;
  }

  public int getLapsDownLeader() {
    return lapsDownLeader;
  }

  @Override
  public void setLapsDownLeader(int lapsDownLeader) {
    this.lapsDownLeader = lapsDownLeader;
  }

  public int getLapsDownPosition() {
    return lapsDownPosition;
  }

  @Override
  public void setLapsDownPosition(int lapsDownPosition) {
    this.lapsDownPosition = lapsDownPosition;
  }

  public CarLocation getCurrentLocation() {
    return currentLocation;
  }

  public void setCurrentLocation(CarLocation currentLocation) {
    this.currentLocation = currentLocation;
  }

  public double getPenaltyLaps() {
    return penaltyLaps;
  }

  public void setPenaltyLaps(double penaltyLaps) {
    this.penaltyLaps = penaltyLaps;
  }

  public double getUserLaps() {
    return userLaps;
  }

  public void setUserLaps(double userLaps) {
    this.userLaps = userLaps;
  }

  public double getAutoCalculatedLaps() {
    return autoCalculatedLaps;
  }

  public boolean isRefueling() {
    return isRefueling;
  }

  public void setRefueling(boolean refueling) {
    isRefueling = refueling;
  }

  public void setAutoCalculatedLaps(double autoCalculatedLaps) {
    this.autoCalculatedLaps = autoCalculatedLaps;
  }

  public int getFalseStarts() {
    return falseStarts;
  }

  public void setFalseStarts(int falseStarts) {
    this.falseStarts = falseStarts;
  }

  public void incrementFalseStarts() {
    this.falseStarts++;
  }

  public double getRemainingFalseStartTimePenalty() {
    return remainingFalseStartTimePenalty;
  }

  public void setRemainingFalseStartTimePenalty(double remainingFalseStartTimePenalty) {
    this.remainingFalseStartTimePenalty = remainingFalseStartTimePenalty;
  }

  public RaceFlag getFlag() {
    return flag;
  }

  public void setFlag(RaceFlag flag) {
    this.flag = flag;
  }

  public boolean isFinished() {
    return isFinished;
  }

  public void setFinished(boolean isFinished) {
    this.isFinished = isFinished;
  }

  public void markDriftTime() {
    this.hasDriftTime = true;
  }

  public boolean consumeDriftTime() {
    boolean result = hasDriftTime;
    hasDriftTime = false;
    return result;
  }

  public boolean isHasDriftTime() {
    return hasDriftTime;
  }

  public void setHasDriftTime(boolean hasDriftTime) {
    this.hasDriftTime = hasDriftTime;
  }

  @Override
  @com.fasterxml.jackson.annotation.JsonIgnore
  public boolean isEmptyParticipant() {
    return actualDriver == null || actualDriver.isEmpty();
  }

  @Override
  @com.fasterxml.jackson.annotation.JsonIgnore
  public String getParticipantId() {
    if (actualDriver != null
        && actualDriver.getEntityId() != null
        && !actualDriver.getEntityId().isEmpty()) {
      return actualDriver.getEntityId();
    }
    if (driver != null
        && driver.getDriver() != null
        && driver.getDriver().getEntityId() != null
        && !driver.getDriver().getEntityId().isEmpty()) {
      return driver.getDriver().getEntityId();
    }
    if (getObjectId() != null) {
      return getObjectId();
    }
    return "";
  }

  @Override
  @com.fasterxml.jackson.annotation.JsonIgnore
  public int getSeed() {
    return driver != null ? driver.getSeed() : 0;
  }
}
