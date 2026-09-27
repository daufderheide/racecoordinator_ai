package com.antigravity.race;

import com.antigravity.models.Driver;
import com.antigravity.models.GlobalStatistics;
import com.antigravity.models.OverallScoring.OverallRanking;
import com.antigravity.proto.CurrentRecords;
import com.antigravity.proto.Lap.RecordTier;
import com.antigravity.proto.OverallRecords;
import com.antigravity.proto.RaceData;
import com.antigravity.proto.RecordData;
import com.antigravity.proto.RecordEntry;
import com.antigravity.service.DatabaseService;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RaceRecords {
  private static final Logger logger = LoggerFactory.getLogger(RaceRecords.class);

  private final Race race;

  // Record tracking - Overall (All-time)
  private double overallFastestLap = Double.MAX_VALUE;
  private String overallFastestLapHolder = "";
  private String overallFastestLapHolderNickname = "";
  private String overallFastestLapHolderTeamName = "";
  private long overallFastestLapDate = 0;

  private double overallHighestScore = 0;
  private String overallHighestScoreHolder = "";
  private String overallHighestScoreHolderNickname = "";
  private String overallHighestScoreHolderTeamName = "";
  private long overallHighestScoreDate = 0;

  private List<Double> overallLaneFastestLapTimes = new ArrayList<>();
  private List<String> overallLaneFastestLapHolders = new ArrayList<>();
  private List<String> overallLaneFastestLapHolderNicknames = new ArrayList<>();
  private List<String> overallLaneFastestLapHolderTeamNames = new ArrayList<>();
  private List<Long> overallLaneFastestLapDates = new ArrayList<>();

  private List<Double> overallLaneHighestScores = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolders = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolderNicknames = new ArrayList<>();
  private List<String> overallLaneHighestScoreHolderTeamNames = new ArrayList<>();
  private List<Long> overallLaneHighestScoreDates = new ArrayList<>();

  // Baseline overall records prior to this race session
  private double baselineOverallFastestLap = Double.MAX_VALUE;
  private String baselineOverallFastestLapHolder = "";
  private String baselineOverallFastestLapHolderNickname = "";
  private String baselineOverallFastestLapHolderTeamName = "";
  private long baselineOverallFastestLapDate = 0;

  private double baselineOverallHighestScore = 0;
  private String baselineOverallHighestScoreHolder = "";
  private String baselineOverallHighestScoreHolderNickname = "";
  private String baselineOverallHighestScoreHolderTeamName = "";
  private long baselineOverallHighestScoreDate = 0;

  private List<Double> baselineOverallLaneFastestLapTimes = new ArrayList<>();
  private List<String> baselineOverallLaneFastestLapHolders = new ArrayList<>();
  private List<String> baselineOverallLaneFastestLapHolderNicknames = new ArrayList<>();
  private List<String> baselineOverallLaneFastestLapHolderTeamNames = new ArrayList<>();
  private List<Long> baselineOverallLaneFastestLapDates = new ArrayList<>();

  private List<Double> baselineOverallLaneHighestScores = new ArrayList<>();
  private List<String> baselineOverallLaneHighestScoreHolders = new ArrayList<>();
  private List<String> baselineOverallLaneHighestScoreHolderNicknames = new ArrayList<>();
  private List<String> baselineOverallLaneHighestScoreHolderTeamNames = new ArrayList<>();
  private List<Long> baselineOverallLaneHighestScoreDates = new ArrayList<>();

  // Session-established overall records tracking (to retain date across recalculations)
  private double currentRaceOverallFastestLap = Double.MAX_VALUE;
  private long currentRaceOverallFastestLapDate = 0;

  private double currentRaceOverallHighestScore = 0;
  private long currentRaceOverallHighestScoreDate = 0;

  private List<Double> currentRaceOverallLaneFastestLapTimes = new ArrayList<>();
  private List<Long> currentRaceOverallLaneFastestLapDates = new ArrayList<>();

  private List<Double> currentRaceOverallLaneHighestScores = new ArrayList<>();
  private List<Long> currentRaceOverallLaneHighestScoreDates = new ArrayList<>();

  // Record tracking - Current Race
  private double raceFastestLap = Double.MAX_VALUE;
  private String raceFastestLapHolder = "";
  private String raceFastestLapHolderNickname = "";
  private String raceFastestLapHolderTeamName = "";
  private int raceFastestLapHeatNumber = 0;

  private double raceHighestScore = 0;
  private String raceHighestScoreHolder = "";
  private String raceHighestScoreHolderNickname = "";
  private String raceHighestScoreHolderTeamName = "";

  private List<Double> raceLaneFastestLapTimes = new ArrayList<>();
  private List<String> raceLaneFastestLapHolders = new ArrayList<>();
  private List<String> raceLaneFastestLapHolderNicknames = new ArrayList<>();
  private List<String> raceLaneFastestLapHolderTeamNames = new ArrayList<>();
  private List<Integer> raceLaneFastestLapHeatNumbers = new ArrayList<>();

  private List<Double> raceLaneHighestScores = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolders = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolderNicknames = new ArrayList<>();
  private List<String> raceLaneHighestScoreHolderTeamNames = new ArrayList<>();

  // Record tracking - Current Heat
  private double heatFastestLap = Double.MAX_VALUE;
  private String heatFastestLapHolder = "";
  private String heatFastestLapHolderNickname = "";
  private String heatFastestLapHolderTeamName = "";
  private int heatFastestLapHeatNumber = 0;

  private GlobalStatistics baseStatistics;

  public RaceRecords(Race race) {
    this.race = race;
    initializeLaneRecords();
  }

  public void resetHeatRecords() {
    this.heatFastestLap = Double.MAX_VALUE;
    this.heatFastestLapHolder = "";
    this.heatFastestLapHolderNickname = "";
    this.heatFastestLapHolderTeamName = "";
    this.heatFastestLapHeatNumber = 0;
  }

  public void resetAllRecords() {
    boolean isTimeBased = race.isTimeBasedRanking();
    this.overallFastestLap = Double.MAX_VALUE;
    this.overallFastestLapHolder = "";
    this.overallFastestLapHolderNickname = "";
    this.overallFastestLapHolderTeamName = "";
    this.overallFastestLapDate = 0;

    this.overallHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
    this.overallHighestScoreHolder = "";
    this.overallHighestScoreHolderNickname = "";
    this.overallHighestScoreHolderTeamName = "";
    this.overallHighestScoreDate = 0;

    this.baselineOverallFastestLap = Double.MAX_VALUE;
    this.baselineOverallFastestLapHolder = "";
    this.baselineOverallFastestLapHolderNickname = "";
    this.baselineOverallFastestLapHolderTeamName = "";
    this.baselineOverallFastestLapDate = 0;
    this.baselineOverallLaneFastestLapTimes.clear();
    this.baselineOverallLaneFastestLapHolders.clear();
    this.baselineOverallLaneFastestLapHolderNicknames.clear();
    this.baselineOverallLaneFastestLapHolderTeamNames.clear();
    this.baselineOverallLaneFastestLapDates.clear();

    this.baselineOverallHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
    this.baselineOverallHighestScoreHolder = "";
    this.baselineOverallHighestScoreHolderNickname = "";
    this.baselineOverallHighestScoreHolderTeamName = "";
    this.baselineOverallHighestScoreDate = 0;
    this.baselineOverallLaneHighestScores.clear();
    this.baselineOverallLaneHighestScoreHolders.clear();
    this.baselineOverallLaneHighestScoreHolderNicknames.clear();
    this.baselineOverallLaneHighestScoreHolderTeamNames.clear();
    this.baselineOverallLaneHighestScoreDates.clear();

    this.currentRaceOverallFastestLap = Double.MAX_VALUE;
    this.currentRaceOverallFastestLapDate = 0;
    this.currentRaceOverallHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
    this.currentRaceOverallHighestScoreDate = 0;
    this.currentRaceOverallLaneFastestLapTimes.clear();
    this.currentRaceOverallLaneFastestLapDates.clear();
    this.currentRaceOverallLaneHighestScores.clear();
    this.currentRaceOverallLaneHighestScoreDates.clear();

    resetHeatRecords();
    resetRaceSessionRecords(isTimeBased);
    resetRaceFastestLapRecords();
    initializeLaneRecords();
  }

  public void initializeLaneRecords() {
    // TODO(aufderheide): Figure out how lanes could be empty here and fix it.
    // Defaulting to 4 isn't a solution.
    int laneCount =
        race.getTrack() != null
                && race.getTrack().getLanes() != null
                && !race.getTrack().getLanes().isEmpty()
            ? race.getTrack().getLanes().size()
            : 4;
    if (race.getHeats() != null) {
      for (Heat heat : race.getHeats()) {
        if (heat.getDrivers() != null && heat.getDrivers().size() > laneCount) {
          laneCount = heat.getDrivers().size();
        }
      }
    }
    boolean isTimeBased = race.isTimeBasedRanking();

    overallLaneFastestLapTimes = new ArrayList<>(laneCount);
    overallLaneFastestLapHolders = new ArrayList<>(laneCount);
    overallLaneFastestLapHolderNicknames = new ArrayList<>(laneCount);
    overallLaneFastestLapHolderTeamNames = new ArrayList<>(laneCount);
    overallLaneFastestLapDates = new ArrayList<>(laneCount);
    overallLaneHighestScores = new ArrayList<>(laneCount);
    overallLaneHighestScoreHolders = new ArrayList<>(laneCount);
    overallLaneHighestScoreHolderNicknames = new ArrayList<>(laneCount);
    overallLaneHighestScoreHolderTeamNames = new ArrayList<>(laneCount);
    overallLaneHighestScoreDates = new ArrayList<>(laneCount);

    raceLaneFastestLapTimes = new ArrayList<>(laneCount);
    raceLaneFastestLapHolders = new ArrayList<>(laneCount);
    raceLaneFastestLapHolderNicknames = new ArrayList<>(laneCount);
    raceLaneFastestLapHolderTeamNames = new ArrayList<>(laneCount);
    raceLaneFastestLapHeatNumbers = new ArrayList<>(laneCount);
    raceLaneHighestScores = new ArrayList<>(laneCount);
    raceLaneHighestScoreHolders = new ArrayList<>(laneCount);
    raceLaneHighestScoreHolderNicknames = new ArrayList<>(laneCount);
    raceLaneHighestScoreHolderTeamNames = new ArrayList<>(laneCount);

    currentRaceOverallLaneFastestLapTimes = new ArrayList<>(laneCount);
    currentRaceOverallLaneFastestLapDates = new ArrayList<>(laneCount);
    currentRaceOverallLaneHighestScores = new ArrayList<>(laneCount);
    currentRaceOverallLaneHighestScoreDates = new ArrayList<>(laneCount);

    for (int i = 0; i < laneCount; i++) {
      overallLaneFastestLapTimes.add(Double.MAX_VALUE);
      overallLaneFastestLapHolders.add("");
      overallLaneFastestLapHolderNicknames.add("");
      overallLaneFastestLapHolderTeamNames.add("");
      overallLaneFastestLapDates.add(0L);
      overallLaneHighestScores.add(isTimeBased ? Double.MAX_VALUE : 0.0);
      overallLaneHighestScoreHolders.add("");
      overallLaneHighestScoreHolderNicknames.add("");
      overallLaneHighestScoreHolderTeamNames.add("");
      overallLaneHighestScoreDates.add(0L);

      raceLaneFastestLapTimes.add(Double.MAX_VALUE);
      raceLaneFastestLapHolders.add("");
      raceLaneFastestLapHolderNicknames.add("");
      raceLaneFastestLapHolderTeamNames.add("");
      raceLaneFastestLapHeatNumbers.add(0);
      raceLaneHighestScores.add(isTimeBased ? Double.MAX_VALUE : 0.0);
      raceLaneHighestScoreHolders.add("");
      raceLaneHighestScoreHolderNicknames.add("");
      raceLaneHighestScoreHolderTeamNames.add("");

      currentRaceOverallLaneFastestLapTimes.add(Double.MAX_VALUE);
      currentRaceOverallLaneFastestLapDates.add(0L);
      currentRaceOverallLaneHighestScores.add(isTimeBased ? Double.MAX_VALUE : 0.0);
      currentRaceOverallLaneHighestScoreDates.add(0L);
    }
  }

  public void loadOverallRaceRecords(
      com.antigravity.proto.OverallRecords overall) { // fqn-collision
    if (overall == null) {
      initializeLaneRecords();
      return;
    }

    boolean isTimeBased = race.isTimeBasedRanking();

    if (overall.hasFastestLap()) {
      this.overallFastestLap = overall.getFastestLap().getValue();
      if (this.overallFastestLap == 0) this.overallFastestLap = Double.MAX_VALUE;
      this.overallFastestLapHolder = overall.getFastestLap().getHolderName();
      this.overallFastestLapHolderNickname = overall.getFastestLap().getHolderNickname();
      this.overallFastestLapHolderTeamName = overall.getFastestLap().getHolderTeamName();
      this.overallFastestLapDate = overall.getFastestLap().getDate();
    }

    if (overall.hasHighestScore()) {
      this.overallHighestScore = overall.getHighestScore().getValue();
      if (isTimeBased && this.overallHighestScore == 0) this.overallHighestScore = Double.MAX_VALUE;
      this.overallHighestScoreHolder = overall.getHighestScore().getHolderName();
      this.overallHighestScoreHolderNickname = overall.getHighestScore().getHolderNickname();
      this.overallHighestScoreHolderTeamName = overall.getHighestScore().getHolderTeamName();
      this.overallHighestScoreDate = overall.getHighestScore().getDate();
    }

    initializeLaneRecords();
    int laneCount = this.overallLaneFastestLapTimes.size();

    for (int i = 0; i < overall.getLaneFastestLapCount() && i < laneCount; i++) {
      com.antigravity.proto.RecordEntry entry = overall.getLaneFastestLap(i); // fqn-collision
      this.overallLaneFastestLapTimes.set(
          i, entry.getValue() == 0 ? Double.MAX_VALUE : entry.getValue());
      this.overallLaneFastestLapHolders.set(i, entry.getHolderName());
      this.overallLaneFastestLapHolderNicknames.set(i, entry.getHolderNickname());
      this.overallLaneFastestLapHolderTeamNames.set(i, entry.getHolderTeamName());
      this.overallLaneFastestLapDates.set(i, entry.getDate());
    }

    for (int i = 0; i < overall.getLaneHighestScoreCount() && i < laneCount; i++) {
      com.antigravity.proto.RecordEntry entry = overall.getLaneHighestScore(i); // fqn-collision
      this.overallLaneHighestScores.set(i, entry.getValue());
      this.overallLaneHighestScoreHolders.set(i, entry.getHolderName());
      this.overallLaneHighestScoreHolderNicknames.set(i, entry.getHolderNickname());
      this.overallLaneHighestScoreHolderTeamNames.set(i, entry.getHolderTeamName());
      this.overallLaneHighestScoreDates.set(i, entry.getDate());
    }

    this.baselineOverallFastestLap = this.overallFastestLap;
    this.baselineOverallFastestLapHolder = this.overallFastestLapHolder;
    this.baselineOverallFastestLapHolderNickname = this.overallFastestLapHolderNickname;
    this.baselineOverallFastestLapHolderTeamName = this.overallFastestLapHolderTeamName;
    this.baselineOverallFastestLapDate = this.overallFastestLapDate;

    this.baselineOverallHighestScore = this.overallHighestScore;
    this.baselineOverallHighestScoreHolder = this.overallHighestScoreHolder;
    this.baselineOverallHighestScoreHolderNickname = this.overallHighestScoreHolderNickname;
    this.baselineOverallHighestScoreHolderTeamName = this.overallHighestScoreHolderTeamName;
    this.baselineOverallHighestScoreDate = this.overallHighestScoreDate;

    this.baselineOverallLaneFastestLapTimes = new ArrayList<>(this.overallLaneFastestLapTimes);
    this.baselineOverallLaneFastestLapHolders = new ArrayList<>(this.overallLaneFastestLapHolders);
    this.baselineOverallLaneFastestLapHolderNicknames =
        new ArrayList<>(this.overallLaneFastestLapHolderNicknames);
    this.baselineOverallLaneFastestLapHolderTeamNames =
        new ArrayList<>(this.overallLaneFastestLapHolderTeamNames);
    this.baselineOverallLaneFastestLapDates = new ArrayList<>(this.overallLaneFastestLapDates);

    this.baselineOverallLaneHighestScores = new ArrayList<>(this.overallLaneHighestScores);
    this.baselineOverallLaneHighestScoreHolders =
        new ArrayList<>(this.overallLaneHighestScoreHolders);
    this.baselineOverallLaneHighestScoreHolderNicknames =
        new ArrayList<>(this.overallLaneHighestScoreHolderNicknames);
    this.baselineOverallLaneHighestScoreHolderTeamNames =
        new ArrayList<>(this.overallLaneHighestScoreHolderTeamNames);
    this.baselineOverallLaneHighestScoreDates = new ArrayList<>(this.overallLaneHighestScoreDates);

    this.currentRaceOverallFastestLap = Double.MAX_VALUE;
    this.currentRaceOverallFastestLapDate = 0;
    this.currentRaceOverallHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
    this.currentRaceOverallHighestScoreDate = 0;
    for (int i = 0; i < laneCount; i++) {
      currentRaceOverallLaneFastestLapTimes.set(i, Double.MAX_VALUE);
      currentRaceOverallLaneFastestLapDates.set(i, 0L);
      currentRaceOverallLaneHighestScores.set(i, isTimeBased ? Double.MAX_VALUE : 0.0);
      currentRaceOverallLaneHighestScoreDates.set(i, 0L);
    }
  }

  public void loadCurrentRaceRecords(
      com.antigravity.proto.CurrentRecords current) { // fqn-collision
    if (current == null) return;

    if (current.hasFastestLap()) {
      this.raceFastestLap = current.getFastestLap().getValue();
      if (this.raceFastestLap == 0) this.raceFastestLap = Double.MAX_VALUE;
      this.raceFastestLapHolder = current.getFastestLap().getHolderName();
      this.raceFastestLapHolderNickname = current.getFastestLap().getHolderNickname();
      this.raceFastestLapHolderTeamName = current.getFastestLap().getHolderTeamName();
      this.raceFastestLapHeatNumber = current.getFastestLap().getHeatNumber();
    }

    if (current.hasHighestScore()) {
      this.raceHighestScore = current.getHighestScore().getValue();
      this.raceHighestScoreHolder = current.getHighestScore().getHolderName();
      this.raceHighestScoreHolderNickname = current.getHighestScore().getHolderNickname();
      this.raceHighestScoreHolderTeamName = current.getHighestScore().getHolderTeamName();
    }

    if (current.hasHeatFastestLap()) {
      this.heatFastestLap = current.getHeatFastestLap().getValue();
      if (this.heatFastestLap == 0) this.heatFastestLap = Double.MAX_VALUE;
      this.heatFastestLapHolder = current.getHeatFastestLap().getHolderName();
      this.heatFastestLapHolderNickname = current.getHeatFastestLap().getHolderNickname();
      this.heatFastestLapHolderTeamName = current.getHeatFastestLap().getHolderTeamName();
      this.heatFastestLapHeatNumber = current.getHeatFastestLap().getHeatNumber();
    }

    int laneCount = this.raceLaneFastestLapTimes.size();
    for (int i = 0; i < current.getLaneFastestLapCount() && i < laneCount; i++) {
      com.antigravity.proto.RecordEntry entry = current.getLaneFastestLap(i); // fqn-collision
      this.raceLaneFastestLapTimes.set(
          i, entry.getValue() == 0 ? Double.MAX_VALUE : entry.getValue());
      this.raceLaneFastestLapHolders.set(i, entry.getHolderName());
      this.raceLaneFastestLapHolderNicknames.set(i, entry.getHolderNickname());
      this.raceLaneFastestLapHolderTeamNames.set(i, entry.getHolderTeamName());
      this.raceLaneFastestLapHeatNumbers.set(i, entry.getHeatNumber());
    }

    for (int i = 0; i < current.getLaneHighestScoreCount() && i < laneCount; i++) {
      com.antigravity.proto.RecordEntry entry = current.getLaneHighestScore(i); // fqn-collision
      this.raceLaneHighestScores.set(i, entry.getValue());
      this.raceLaneHighestScoreHolders.set(i, entry.getHolderName());
      this.raceLaneHighestScoreHolderNicknames.set(i, entry.getHolderNickname());
      this.raceLaneHighestScoreHolderTeamNames.set(i, entry.getHolderTeamName());
    }
  }

  public void recalculateScoreRecords() {
    long timestamp = System.currentTimeMillis();
    boolean isTimeBased = race.isTimeBasedRanking();
    resetRaceSessionRecords(isTimeBased);
    recalculateRaceBestScore(isTimeBased);
    recalculateRaceLaneBestScores(isTimeBased);
    resetRaceFastestLapRecords();
    recalculateHeatBestLap();
    recalculateRaceBestLap();
    recalculateRaceLaneBestLaps();
    recalculateOverallRecords(timestamp);
  }

  private void resetRaceSessionRecords(boolean isTimeBased) {
    raceHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
    raceHighestScoreHolder = "";
    raceHighestScoreHolderNickname = "";
    raceHighestScoreHolderTeamName = "";
    for (int i = 0; i < raceLaneHighestScores.size(); i++) {
      raceLaneHighestScores.set(i, isTimeBased ? Double.MAX_VALUE : 0.0);
      raceLaneHighestScoreHolders.set(i, "");
      raceLaneHighestScoreHolderNicknames.set(i, "");
      raceLaneHighestScoreHolderTeamNames.set(i, "");
    }
  }

  private void recalculateRaceBestScore(boolean isTimeBased) {
    for (RaceParticipant p : race.getDrivers()) {
      double score = p.getRankValue();
      if (score <= 0) continue;
      if (isTimeBased ? (score < raceHighestScore) : (score > raceHighestScore))
        updateRaceBestScore(p, score);
    }
  }

  private void updateRaceBestScore(RaceParticipant p, double score) {
    raceHighestScore = score;
    raceHighestScoreHolder = p.getDriver().getName();
    raceHighestScoreHolderNickname = p.getDriver().getNickname();
    if (race.getCurrentHeat() != null) {
      for (DriverHeatData dhd : race.getCurrentHeat().getDrivers()) {
        if (dhd.getDriver() == p) {
          Driver actualDriver = dhd.getActualDriver();
          if (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER) {
            raceHighestScoreHolder = actualDriver.getName();
            raceHighestScoreHolderNickname = actualDriver.getNickname();
          }
          break;
        }
      }
    }
    if (raceHighestScoreHolderNickname == null || raceHighestScoreHolderNickname.isEmpty())
      raceHighestScoreHolderNickname = raceHighestScoreHolder;
    raceHighestScoreHolderTeamName = p.getTeam() != null ? p.getTeam().getName() : "";
  }

  private void recalculateRaceLaneBestScores(boolean isTimeBased) {
    for (Heat heat : race.getHeats()) {
      for (int i = 0; i < heat.getDrivers().size(); i++) {
        DriverHeatData dhd = heat.getDrivers().get(i);
        RaceParticipant p = dhd.getDriver();
        if (p == null || p.getDriver() == Driver.EMPTY_DRIVER) continue;
        double score = getParticipantScore(dhd);
        if (score <= 0) continue;
        if (isTimeBased
            ? (score < raceLaneHighestScores.get(i))
            : (score > raceLaneHighestScores.get(i))) updateRaceLaneBestScore(i, dhd, score);
      }
    }
  }

  private double getParticipantScore(DriverHeatData dhd) {
    OverallRanking method = race.getRaceModel().getOverallScoring().getRankingMethod();
    if (method == OverallRanking.LAP_COUNT) return dhd.getAdjustedLapCount();
    if (method == OverallRanking.FASTEST_LAP) return dhd.getBestLapTime();
    if (method == OverallRanking.TOTAL_TIME) return dhd.getTotalTime();
    if (method == OverallRanking.AVERAGE_LAP) return dhd.getAverageLapTime();
    return 0;
  }

  private void updateRaceLaneBestScore(int lane, DriverHeatData dhd, double score) {
    raceLaneHighestScores.set(lane, score);
    Driver actualDriver = dhd.getActualDriver();
    if (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER) {
      raceLaneHighestScoreHolders.set(lane, actualDriver.getName());
      raceLaneHighestScoreHolderNicknames.set(lane, actualDriver.getNickname());
    } else {
      raceLaneHighestScoreHolders.set(lane, dhd.getDriver().getDriver().getName());
      raceLaneHighestScoreHolderNicknames.set(lane, dhd.getDriver().getDriver().getNickname());
    }
    if (raceLaneHighestScoreHolderNicknames.get(lane) == null
        || raceLaneHighestScoreHolderNicknames.get(lane).isEmpty())
      raceLaneHighestScoreHolderNicknames.set(lane, raceLaneHighestScoreHolders.get(lane));
    raceLaneHighestScoreHolderTeamNames.set(
        lane, dhd.getDriver().getTeam() != null ? dhd.getDriver().getTeam().getName() : "");
  }

  private void resetRaceFastestLapRecords() {
    raceFastestLap = Double.MAX_VALUE;
    raceFastestLapHolder = "";
    raceFastestLapHolderNickname = "";
    raceFastestLapHolderTeamName = "";
    raceFastestLapHeatNumber = 0;
    for (int i = 0; i < raceLaneFastestLapTimes.size(); i++) {
      raceLaneFastestLapTimes.set(i, Double.MAX_VALUE);
      raceLaneFastestLapHolders.set(i, "");
      raceLaneFastestLapHolderNicknames.set(i, "");
      raceLaneFastestLapHolderTeamNames.set(i, "");
      raceLaneFastestLapHeatNumbers.set(i, 0);
    }
  }

  public void recalculateHeatBestLap() {
    resetHeatRecords();
    if (race.getCurrentHeat() != null && race.getCurrentHeat().getDrivers() != null) {
      int currentHeatNumber = race.getCurrentHeat().getHeatNumber();
      for (DriverHeatData dhd : race.getCurrentHeat().getDrivers()) {
        double lapTime = dhd.getBestLapTime();
        if (lapTime > 0 && lapTime < heatFastestLap) {
          updateHeatFastestLap(dhd, lapTime, currentHeatNumber);
        }
      }
    }
  }

  private void recalculateRaceBestLap() {
    for (Heat heat : race.getHeats()) {
      for (DriverHeatData dhd : heat.getDrivers()) {
        double lapTime = dhd.getBestLapTime();
        if (lapTime > 0 && lapTime < raceFastestLap)
          updateRaceBestLap(dhd, lapTime, heat.getHeatNumber());
      }
    }
  }

  private void updateRaceBestLap(DriverHeatData dhd, double lapTime, int heatNumber) {
    raceFastestLap = lapTime;
    raceFastestLapHeatNumber = heatNumber;
    Driver actualDriver = dhd.getActualDriver();
    if (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER) {
      raceFastestLapHolder = actualDriver.getName();
      raceFastestLapHolderNickname = actualDriver.getNickname();
    } else {
      raceFastestLapHolder = dhd.getDriver().getDriver().getName();
      raceFastestLapHolderNickname = dhd.getDriver().getDriver().getNickname();
    }
    if (raceFastestLapHolderNickname == null || raceFastestLapHolderNickname.isEmpty())
      raceFastestLapHolderNickname = raceFastestLapHolder;
    raceFastestLapHolderTeamName =
        dhd.getDriver().getTeam() != null ? dhd.getDriver().getTeam().getName() : "";
  }

  private void recalculateRaceLaneBestLaps() {
    for (Heat heat : race.getHeats()) {
      for (int i = 0; i < heat.getDrivers().size(); i++) {
        DriverHeatData dhd = heat.getDrivers().get(i);
        double lapTime = dhd.getBestLapTime();
        if (lapTime > 0 && lapTime < raceLaneFastestLapTimes.get(i))
          updateRaceLaneBestLap(i, dhd, lapTime, heat.getHeatNumber());
      }
    }
  }

  private void updateRaceLaneBestLap(int lane, DriverHeatData dhd, double lapTime, int heatNumber) {
    raceLaneFastestLapTimes.set(lane, lapTime);
    raceLaneFastestLapHeatNumbers.set(lane, heatNumber);
    Driver actualDriver = dhd.getActualDriver();
    if (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER) {
      raceLaneFastestLapHolders.set(lane, actualDriver.getName());
      raceLaneFastestLapHolderNicknames.set(lane, actualDriver.getNickname());
    } else {
      raceLaneFastestLapHolders.set(lane, dhd.getDriver().getDriver().getName());
      raceLaneFastestLapHolderNicknames.set(lane, dhd.getDriver().getDriver().getNickname());
    }
    if (raceLaneFastestLapHolderNicknames.get(lane) == null
        || raceLaneFastestLapHolderNicknames.get(lane).isEmpty())
      raceLaneFastestLapHolderNicknames.set(lane, raceLaneFastestLapHolders.get(lane));
    raceLaneFastestLapHolderTeamNames.set(
        lane, dhd.getDriver().getTeam() != null ? dhd.getDriver().getTeam().getName() : "");
  }

  private void recalculateOverallRecords(long timestamp) {
    boolean isTimeBased = race.isTimeBasedRanking();
    updateOverallBestScore(isTimeBased, timestamp);
    updateOverallLaneBestScores(isTimeBased, timestamp);
    updateOverallBestLap(timestamp);
    updateOverallLaneBestLaps(timestamp);
  }

  private void updateOverallBestScore(boolean isTimeBased, long timestamp) {
    overallHighestScore = baselineOverallHighestScore;
    overallHighestScoreHolder = baselineOverallHighestScoreHolder;
    overallHighestScoreHolderNickname = baselineOverallHighestScoreHolderNickname;
    overallHighestScoreHolderTeamName = baselineOverallHighestScoreHolderTeamName;
    overallHighestScoreDate = baselineOverallHighestScoreDate;

    boolean isRaceBetter = false;
    if (raceHighestScore > 0 && raceHighestScore != Double.MAX_VALUE) {
      if (overallHighestScore == 0 || overallHighestScore == Double.MAX_VALUE) {
        isRaceBetter = true;
      } else {
        isRaceBetter =
            isTimeBased
                ? (raceHighestScore < overallHighestScore)
                : (raceHighestScore > overallHighestScore);
      }
    }
    if (isRaceBetter) {
      overallHighestScore = raceHighestScore;
      overallHighestScoreHolder = raceHighestScoreHolder;
      overallHighestScoreHolderNickname = raceHighestScoreHolderNickname;
      overallHighestScoreHolderTeamName = raceHighestScoreHolderTeamName;
      if (raceHighestScore != currentRaceOverallHighestScore) {
        currentRaceOverallHighestScore = raceHighestScore;
        currentRaceOverallHighestScoreDate = timestamp;
      }
      overallHighestScoreDate = currentRaceOverallHighestScoreDate;
    } else {
      currentRaceOverallHighestScore = isTimeBased ? Double.MAX_VALUE : 0;
      currentRaceOverallHighestScoreDate = 0;
    }
  }

  private void updateOverallLaneBestScores(boolean isTimeBased, long timestamp) {
    for (int i = 0; i < overallLaneHighestScores.size(); i++) {
      if (i < baselineOverallLaneHighestScores.size()) {
        overallLaneHighestScores.set(i, baselineOverallLaneHighestScores.get(i));
        overallLaneHighestScoreHolders.set(i, baselineOverallLaneHighestScoreHolders.get(i));
        overallLaneHighestScoreHolderNicknames.set(
            i, baselineOverallLaneHighestScoreHolderNicknames.get(i));
        overallLaneHighestScoreHolderTeamNames.set(
            i, baselineOverallLaneHighestScoreHolderTeamNames.get(i));
        overallLaneHighestScoreDates.set(i, baselineOverallLaneHighestScoreDates.get(i));
      }
      double overallLaneScore = overallLaneHighestScores.get(i);
      boolean isLaneBetter = false;
      double raceLaneScore = raceLaneHighestScores.get(i);
      if (raceLaneScore > 0 && raceLaneScore != Double.MAX_VALUE) {
        if (overallLaneScore == 0 || overallLaneScore == Double.MAX_VALUE) {
          isLaneBetter = true;
        } else {
          isLaneBetter =
              isTimeBased ? (raceLaneScore < overallLaneScore) : (raceLaneScore > overallLaneScore);
        }
      }
      if (isLaneBetter) {
        overallLaneHighestScores.set(i, raceLaneScore);
        overallLaneHighestScoreHolders.set(i, raceLaneHighestScoreHolders.get(i));
        overallLaneHighestScoreHolderNicknames.set(i, raceLaneHighestScoreHolderNicknames.get(i));
        overallLaneHighestScoreHolderTeamNames.set(i, raceLaneHighestScoreHolderTeamNames.get(i));
        if (i < currentRaceOverallLaneHighestScores.size()) {
          if (raceLaneScore != currentRaceOverallLaneHighestScores.get(i)) {
            currentRaceOverallLaneHighestScores.set(i, raceLaneScore);
            currentRaceOverallLaneHighestScoreDates.set(i, timestamp);
          }
          overallLaneHighestScoreDates.set(i, currentRaceOverallLaneHighestScoreDates.get(i));
        } else {
          overallLaneHighestScoreDates.set(i, timestamp);
        }
      } else {
        if (i < currentRaceOverallLaneHighestScores.size()) {
          currentRaceOverallLaneHighestScores.set(i, isTimeBased ? Double.MAX_VALUE : 0.0);
          currentRaceOverallLaneHighestScoreDates.set(i, 0L);
        }
      }
    }
  }

  private void updateOverallBestLap(long timestamp) {
    overallFastestLap = baselineOverallFastestLap;
    overallFastestLapHolder = baselineOverallFastestLapHolder;
    overallFastestLapHolderNickname = baselineOverallFastestLapHolderNickname;
    overallFastestLapHolderTeamName = baselineOverallFastestLapHolderTeamName;
    overallFastestLapDate = baselineOverallFastestLapDate;

    boolean isRaceLapBetter = false;
    if (raceFastestLap > 0 && raceFastestLap != Double.MAX_VALUE) {
      if (overallFastestLap == 0 || overallFastestLap == Double.MAX_VALUE) {
        isRaceLapBetter = true;
      } else {
        isRaceLapBetter = raceFastestLap < overallFastestLap;
      }
    }
    if (isRaceLapBetter) {
      overallFastestLap = raceFastestLap;
      overallFastestLapHolder = raceFastestLapHolder;
      overallFastestLapHolderNickname = raceFastestLapHolderNickname;
      overallFastestLapHolderTeamName = raceFastestLapHolderTeamName;
      if (raceFastestLap != currentRaceOverallFastestLap) {
        currentRaceOverallFastestLap = raceFastestLap;
        currentRaceOverallFastestLapDate = timestamp;
      }
      overallFastestLapDate = currentRaceOverallFastestLapDate;
    } else {
      currentRaceOverallFastestLap = Double.MAX_VALUE;
      currentRaceOverallFastestLapDate = 0;
    }
  }

  private void updateOverallLaneBestLaps(long timestamp) {
    for (int i = 0; i < overallLaneFastestLapTimes.size(); i++) {
      if (i < baselineOverallLaneFastestLapTimes.size()) {
        overallLaneFastestLapTimes.set(i, baselineOverallLaneFastestLapTimes.get(i));
        overallLaneFastestLapHolders.set(i, baselineOverallLaneFastestLapHolders.get(i));
        overallLaneFastestLapHolderNicknames.set(
            i, baselineOverallLaneFastestLapHolderNicknames.get(i));
        overallLaneFastestLapHolderTeamNames.set(
            i, baselineOverallLaneFastestLapHolderTeamNames.get(i));
        overallLaneFastestLapDates.set(i, baselineOverallLaneFastestLapDates.get(i));
      }
      double overallLaneLap = overallLaneFastestLapTimes.get(i);
      boolean isLaneLapBetter = false;
      double raceLaneLap = raceLaneFastestLapTimes.get(i);
      if (raceLaneLap > 0 && raceLaneLap != Double.MAX_VALUE) {
        if (overallLaneLap == 0 || overallLaneLap == Double.MAX_VALUE) {
          isLaneLapBetter = true;
        } else {
          isLaneLapBetter = raceLaneLap < overallLaneLap;
        }
      }
      if (isLaneLapBetter) {
        overallLaneFastestLapTimes.set(i, raceLaneLap);
        overallLaneFastestLapHolders.set(i, raceLaneFastestLapHolders.get(i));
        overallLaneFastestLapHolderNicknames.set(i, raceLaneFastestLapHolderNicknames.get(i));
        overallLaneFastestLapHolderTeamNames.set(i, raceLaneFastestLapHolderTeamNames.get(i));
        if (i < currentRaceOverallLaneFastestLapTimes.size()) {
          if (raceLaneLap != currentRaceOverallLaneFastestLapTimes.get(i)) {
            currentRaceOverallLaneFastestLapTimes.set(i, raceLaneLap);
            currentRaceOverallLaneFastestLapDates.set(i, timestamp);
          }
          overallLaneFastestLapDates.set(i, currentRaceOverallLaneFastestLapDates.get(i));
        } else {
          overallLaneFastestLapDates.set(i, timestamp);
        }
      } else {
        if (i < currentRaceOverallLaneFastestLapTimes.size()) {
          currentRaceOverallLaneFastestLapTimes.set(i, Double.MAX_VALUE);
          currentRaceOverallLaneFastestLapDates.set(i, 0L);
        }
      }
    }
  }

  public RecordData getRecordData() {
    recalculateScoreRecords();
    OverallRecords.Builder overallBuilder =
        OverallRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(overallFastestLap == Double.MAX_VALUE ? 0 : overallFastestLap)
                    .setHolderName(nonNull(overallFastestLapHolder))
                    .setHolderNickname(nonNull(overallFastestLapHolderNickname))
                    .setHolderTeamName(nonNull(overallFastestLapHolderTeamName))
                    .setDate(overallFastestLapDate)
                    .build())
            .setHighestScore(
                RecordEntry.newBuilder()
                    .setValue(overallHighestScore == Double.MAX_VALUE ? 0 : overallHighestScore)
                    .setHolderName(nonNull(overallHighestScoreHolder))
                    .setHolderNickname(nonNull(overallHighestScoreHolderNickname))
                    .setHolderTeamName(nonNull(overallHighestScoreHolderTeamName))
                    .setDate(overallHighestScoreDate)
                    .build());
    for (int i = 0; i < overallLaneFastestLapTimes.size(); i++) {
      overallBuilder.addLaneFastestLap(
          RecordEntry.newBuilder()
              .setValue(
                  overallLaneFastestLapTimes.get(i) == Double.MAX_VALUE
                      ? 0
                      : overallLaneFastestLapTimes.get(i))
              .setHolderName(nonNull(overallLaneFastestLapHolders.get(i)))
              .setHolderNickname(nonNull(overallLaneFastestLapHolderNicknames.get(i)))
              .setHolderTeamName(nonNull(overallLaneFastestLapHolderTeamNames.get(i)))
              .setDate(overallLaneFastestLapDates.get(i))
              .build());
      overallBuilder.addLaneHighestScore(
          RecordEntry.newBuilder()
              .setValue(
                  overallLaneHighestScores.get(i) == Double.MAX_VALUE
                      ? 0
                      : overallLaneHighestScores.get(i))
              .setHolderName(nonNull(overallLaneHighestScoreHolders.get(i)))
              .setHolderNickname(nonNull(overallLaneHighestScoreHolderNicknames.get(i)))
              .setHolderTeamName(nonNull(overallLaneHighestScoreHolderTeamNames.get(i)))
              .setDate(overallLaneHighestScoreDates.get(i))
              .build());
    }
    CurrentRecords.Builder currentBuilder =
        CurrentRecords.newBuilder()
            .setFastestLap(
                RecordEntry.newBuilder()
                    .setValue(raceFastestLap == Double.MAX_VALUE ? 0 : raceFastestLap)
                    .setHolderName(nonNull(raceFastestLapHolder))
                    .setHolderNickname(nonNull(raceFastestLapHolderNickname))
                    .setHolderTeamName(nonNull(raceFastestLapHolderTeamName))
                    .setHeatNumber(raceFastestLapHeatNumber)
                    .build())
            .setHighestScore(
                RecordEntry.newBuilder()
                    .setValue(raceHighestScore == Double.MAX_VALUE ? 0 : raceHighestScore)
                    .setHolderName(nonNull(raceHighestScoreHolder))
                    .setHolderNickname(nonNull(raceHighestScoreHolderNickname))
                    .setHolderTeamName(nonNull(raceHighestScoreHolderTeamName))
                    .build())
            .setHeatFastestLap(
                RecordEntry.newBuilder()
                    .setValue(heatFastestLap == Double.MAX_VALUE ? 0 : heatFastestLap)
                    .setHolderName(nonNull(heatFastestLapHolder))
                    .setHolderNickname(nonNull(heatFastestLapHolderNickname))
                    .setHolderTeamName(nonNull(heatFastestLapHolderTeamName))
                    .setHeatNumber(heatFastestLapHeatNumber)
                    .build());
    for (int i = 0; i < raceLaneFastestLapTimes.size(); i++) {
      currentBuilder.addLaneFastestLap(
          RecordEntry.newBuilder()
              .setValue(
                  raceLaneFastestLapTimes.get(i) == Double.MAX_VALUE
                      ? 0
                      : raceLaneFastestLapTimes.get(i))
              .setHolderName(nonNull(raceLaneFastestLapHolders.get(i)))
              .setHolderNickname(nonNull(raceLaneFastestLapHolderNicknames.get(i)))
              .setHolderTeamName(nonNull(raceLaneFastestLapHolderTeamNames.get(i)))
              .setHeatNumber(raceLaneFastestLapHeatNumbers.get(i))
              .build());
      currentBuilder.addLaneHighestScore(
          RecordEntry.newBuilder()
              .setValue(raceLaneHighestScores.get(i))
              .setHolderName(nonNull(raceLaneHighestScoreHolders.get(i)))
              .setHolderNickname(nonNull(raceLaneHighestScoreHolderNicknames.get(i)))
              .setHolderTeamName(nonNull(raceLaneHighestScoreHolderTeamNames.get(i)))
              .build());
    }
    return RecordData.newBuilder()
        .setOverall(overallBuilder.build())
        .setCurrent(currentBuilder.build())
        .build();
  }

  public void broadcastRecords() {
    race.broadcast(RaceData.newBuilder().setRecordData(getRecordData()).build());
  }

  public void updateScoreRecords() {
    recalculateScoreRecords();
    broadcastRecords();
  }

  public void onLap(DriverHeatData driverData, double lapTime, int lane) {
    int currentHeatNumber =
        race.getCurrentHeat() != null ? race.getCurrentHeat().getHeatNumber() : 0;
    boolean changed = updateHeatFastestLap(driverData, lapTime, currentHeatNumber);
    if (updateSessionFastestLap(driverData, lapTime, currentHeatNumber)) changed = true;
    if (updateLaneFastestLap(driverData, lapTime, lane, currentHeatNumber)) changed = true;
    if (changed) broadcastRecords();
  }

  private boolean updateHeatFastestLap(
      DriverHeatData driverData, double lapTime, int currentHeatNumber) {
    if (lapTime >= heatFastestLap) return false;
    heatFastestLap = lapTime;
    heatFastestLapHeatNumber = currentHeatNumber;
    Driver actualDriver = driverData.getActualDriver();
    heatFastestLapHolder =
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getName()
            : driverData.getDriver().getDriver().getName();
    heatFastestLapHolderNickname =
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getNickname()
            : driverData.getDriver().getDriver().getNickname();
    if (heatFastestLapHolderNickname == null || heatFastestLapHolderNickname.isEmpty())
      heatFastestLapHolderNickname = heatFastestLapHolder;
    heatFastestLapHolderTeamName =
        driverData.getDriver().getTeam() != null ? driverData.getDriver().getTeam().getName() : "";
    return true;
  }

  private boolean updateSessionFastestLap(
      DriverHeatData driverData, double lapTime, int currentHeatNumber) {
    if (lapTime >= raceFastestLap) return false;
    raceFastestLap = lapTime;
    raceFastestLapHeatNumber = currentHeatNumber;
    Driver actualDriver = driverData.getActualDriver();
    raceFastestLapHolder =
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getName()
            : driverData.getDriver().getDriver().getName();
    raceFastestLapHolderNickname =
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getNickname()
            : driverData.getDriver().getDriver().getNickname();
    if (raceFastestLapHolderNickname == null || raceFastestLapHolderNickname.isEmpty())
      raceFastestLapHolderNickname = raceFastestLapHolder;
    raceFastestLapHolderTeamName =
        driverData.getDriver().getTeam() != null ? driverData.getDriver().getTeam().getName() : "";
    return true;
  }

  private boolean updateLaneFastestLap(
      DriverHeatData driverData, double lapTime, int lane, int currentHeatNumber) {
    if (lane < 0
        || lane >= raceLaneFastestLapTimes.size()
        || lapTime >= raceLaneFastestLapTimes.get(lane)) return false;
    raceLaneFastestLapTimes.set(lane, lapTime);
    raceLaneFastestLapHeatNumbers.set(lane, currentHeatNumber);
    Driver actualDriver = driverData.getActualDriver();
    raceLaneFastestLapHolders.set(
        lane,
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getName()
            : driverData.getDriver().getDriver().getName());
    raceLaneFastestLapHolderNicknames.set(
        lane,
        (actualDriver != null && actualDriver != Driver.EMPTY_DRIVER)
            ? actualDriver.getNickname()
            : driverData.getDriver().getDriver().getNickname());
    if (raceLaneFastestLapHolderNicknames.get(lane) == null
        || raceLaneFastestLapHolderNicknames.get(lane).isEmpty())
      raceLaneFastestLapHolderNicknames.set(lane, raceLaneFastestLapHolders.get(lane));
    raceLaneFastestLapHolderTeamNames.set(
        lane,
        driverData.getDriver().getTeam() != null ? driverData.getDriver().getTeam().getName() : "");
    return true;
  }

  public void saveGlobalRecords() {
    if (race.getDatabaseContext() == null) return;
    try {
      DatabaseService dbService = DatabaseService.getInstance();
      if (dbService == null) return;
      GlobalStatistics stats = new GlobalStatistics();
      stats.setFastestLapTime(overallFastestLap);
      stats.setFastestLapDriverName(overallFastestLapHolder);
      stats.setFastestLapDriverNickname(overallFastestLapHolderNickname);
      stats.setFastestLapTeamName(overallFastestLapHolderTeamName);
      stats.setFastestLapDate(overallFastestLapDate);
      stats.setHighestScore(overallHighestScore);
      stats.setHighestScoreHolderName(overallHighestScoreHolder);
      stats.setHighestScoreHolderNickname(overallHighestScoreHolderNickname);
      stats.setHighestScoreTeamName(overallHighestScoreHolderTeamName);
      stats.setHighestScoreDate(overallHighestScoreDate);
      stats.setLaneFastestLapTimes(new ArrayList<>(overallLaneFastestLapTimes));
      stats.setLaneFastestLapDriverNames(new ArrayList<>(overallLaneFastestLapHolders));
      stats.setLaneFastestLapDriverNicknames(new ArrayList<>(overallLaneFastestLapHolderNicknames));
      stats.setLaneFastestLapTeamNames(new ArrayList<>(overallLaneFastestLapHolderTeamNames));
      stats.setLaneFastestLapDates(new ArrayList<>(overallLaneFastestLapDates));
      stats.setLaneHighestScores(new ArrayList<>(overallLaneHighestScores));
      stats.setLaneHighestScoreHolderNames(new ArrayList<>(overallLaneHighestScoreHolders));
      stats.setLaneHighestScoreHolderNicknames(
          new ArrayList<>(overallLaneHighestScoreHolderNicknames));
      stats.setLaneHighestScoreTeamNames(new ArrayList<>(overallLaneHighestScoreHolderTeamNames));
      stats.setLaneHighestScoreDates(new ArrayList<>(overallLaneHighestScoreDates));
      new Thread(() -> dbService.updateGlobalStatistics(race.getDatabaseContext(), race)).start();
    } catch (Exception e) {
      logger.error("Failed to save global statistics", e);
    }
  }

  public GlobalStatistics getBaseStatistics() {
    return baseStatistics;
  }

  public double getOverallFastestLap() {
    return overallFastestLap;
  }

  public double getOverallLaneFastestLap(int lane) {
    if (lane >= 0 && lane < overallLaneFastestLapTimes.size()) {
      return overallLaneFastestLapTimes.get(lane);
    }
    return Double.MAX_VALUE;
  }

  public double getRaceFastestLap() {
    return raceFastestLap;
  }

  public double getRaceLaneFastestLap(int lane) {
    if (lane >= 0 && lane < raceLaneFastestLapTimes.size()) {
      return raceLaneFastestLapTimes.get(lane);
    }
    return Double.MAX_VALUE;
  }

  public double getHeatFastestLap() {
    return heatFastestLap;
  }

  public RecordTier determineRecordTier(
      DriverHeatData driverData,
      double lapTime,
      int lane,
      boolean countTowardsRecords,
      double previousDriverBestLap) {
    if (!countTowardsRecords || lapTime <= 0) {
      return RecordTier.RECORD_TIER_NONE;
    }

    // 1. Overall / Track Best (fastest lap for all races run)
    boolean isOverallBest =
        (overallFastestLap == Double.MAX_VALUE || overallFastestLap == 0.0)
            || lapTime < overallFastestLap;
    if (isOverallBest) {
      return RecordTier.RECORD_TIER_OVERALL_BEST;
    }

    // 2. Overall Lane Best (fastest lap for all races run in specific lane, but not overall)
    double overallLaneBest =
        (lane >= 0 && lane < overallLaneFastestLapTimes.size())
            ? overallLaneFastestLapTimes.get(lane)
            : Double.MAX_VALUE;
    boolean isOverallLaneBest =
        (overallLaneBest == Double.MAX_VALUE || overallLaneBest == 0.0)
            || lapTime < overallLaneBest;
    if (isOverallLaneBest) {
      return RecordTier.RECORD_TIER_OVERALL_LANE_BEST;
    }

    // 3. Race Best (fastest lap for this race, but not overall)
    boolean isRaceBest =
        (raceFastestLap == Double.MAX_VALUE || raceFastestLap == 0.0) || lapTime < raceFastestLap;
    if (isRaceBest) {
      return RecordTier.RECORD_TIER_RACE_BEST;
    }

    // 4. Race Lane Best (fastest lap for this race in this lane, but not race best or overall lane
    // best)
    double raceLaneBest =
        (lane >= 0 && lane < raceLaneFastestLapTimes.size())
            ? raceLaneFastestLapTimes.get(lane)
            : Double.MAX_VALUE;
    boolean isRaceLaneBest =
        (raceLaneBest == Double.MAX_VALUE || raceLaneBest == 0.0) || lapTime < raceLaneBest;
    if (isRaceLaneBest) {
      return RecordTier.RECORD_TIER_RACE_LANE_BEST;
    }

    // 5. Heat Best (fastest lap in current heat, but none of the above)
    boolean isHeatBest =
        (heatFastestLap == Double.MAX_VALUE || heatFastestLap == 0.0) || lapTime < heatFastestLap;
    if (isHeatBest) {
      return RecordTier.RECORD_TIER_HEAT_BEST;
    }

    // 6. Personal Best (driver's best lap, but none of the above)
    boolean isPersonalBest = previousDriverBestLap <= 0.0 || lapTime < previousDriverBestLap;
    if (isPersonalBest) {
      return RecordTier.RECORD_TIER_PERSONAL_BEST;
    }

    return RecordTier.RECORD_TIER_NONE;
  }

  private String nonNull(String s) {
    return s == null ? "" : s;
  }
}
