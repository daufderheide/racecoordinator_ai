package com.antigravity.service;

import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Car stats (step 5 of #1210), worked out from the saved races when they are asked for. Each heat
 * keeps the car as it ran, so the numbers follow the car snapshot, not today's car.
 *
 * <p>Results are grouped by car, class, a setup field, track or driver, and can be narrowed to one
 * car, class, track or driver. A lap counts when it is longer than 0, at least the race's minimum
 * lap time, and counts towards records (so drift and excluded laps are left out).
 */
public final class CarStatistics {

  /** Group by: car, class, a fixed setup field, one of the user's own fields, track or driver. */
  public static final String GROUP_CAR = "car";

  public static final String GROUP_CLASS = "class";
  public static final String GROUP_TRACK = "track";
  public static final String GROUP_DRIVER = "driver";

  /** Prefix for the user's own fields: "custom:<fieldId>". */
  public static final String GROUP_CUSTOM_PREFIX = "custom:";

  /** Optional filters; null or empty means "all". */
  public static final class Filters {
    private final String carId;
    private final String carClass;
    private final String trackId;
    private final String driverId;

    public Filters(String carId, String carClass, String trackId, String driverId) {
      this.carId = blankToNull(carId);
      this.carClass = blankToNull(carClass);
      this.trackId = blankToNull(trackId);
      this.driverId = blankToNull(driverId);
    }

    public static Filters none() {
      return new Filters(null, null, null, null);
    }
  }

  /** One row: a group and its numbers. */
  public static final class Row {
    @JsonProperty("key")
    private final String key;

    @JsonProperty("label")
    private String label;

    @JsonProperty("races")
    private int races;

    @JsonProperty("heats")
    private int heats;

    @JsonProperty("laps")
    private int laps;

    @JsonProperty("best_lap_time")
    private double bestLapTime;

    @JsonProperty("median_lap_time")
    private double medianLapTime;

    @JsonProperty("average_lap_time")
    private double averageLapTime;

    @JsonProperty("best_lap_driver")
    private String bestLapDriver = "";

    @JsonProperty("last_raced")
    private long lastRaced;

    private final transient List<Double> lapTimes = new ArrayList<>();
    private final transient Set<String> raceIds = new HashSet<>();

    Row(String key, String label) {
      this.key = key;
      this.label = label;
    }

    public String getKey() {
      return key;
    }

    public String getLabel() {
      return label;
    }

    public int getRaces() {
      return races;
    }

    public int getHeats() {
      return heats;
    }

    public int getLaps() {
      return laps;
    }

    public double getBestLapTime() {
      return bestLapTime;
    }

    public double getMedianLapTime() {
      return medianLapTime;
    }

    public double getAverageLapTime() {
      return averageLapTime;
    }

    public String getBestLapDriver() {
      return bestLapDriver;
    }

    public long getLastRaced() {
      return lastRaced;
    }
  }

  private CarStatistics() {}

  /**
   * Groups every heat that ran with a car. Rows come back with the most laps first; a heat without
   * a car, or without a value for the chosen group (e.g. no class), is left out.
   */
  public static List<Row> compute(List<RaceHistoryRecord> history, String groupBy, Filters f) {
    String group = groupBy == null || groupBy.isEmpty() ? GROUP_CAR : groupBy;
    Filters filters = f == null ? Filters.none() : f;
    Map<String, Row> rows = new LinkedHashMap<>();
    if (history == null) return new ArrayList<>();

    for (RaceHistoryRecord record : history) {
      if (record == null || record.getHeats() == null) continue;
      Track track = record.getTrack();
      String trackId = track != null ? track.getEntityId() : null;
      if (filters.trackId != null && !filters.trackId.equals(trackId)) continue;
      double minLap = record.getModel() != null ? record.getModel().getMinLapTime() : 0;
      long when = record.getTimestamp() != null ? record.getTimestamp() : 0L;
      String raceKey = record.getId() != null ? record.getId() : String.valueOf(when);

      for (Heat heat : record.getHeats()) {
        if (heat == null || heat.getDrivers() == null) continue;
        for (DriverHeatData dhd : heat.getDrivers()) {
          Car car = dhd != null ? dhd.getCar() : null;
          if (car == null || !matches(car, dhd, filters)) continue;
          String[] keyLabel = groupKey(group, car, dhd, track);
          if (keyLabel == null) continue;
          List<Double> laps = validLaps(dhd, minLap);
          Row row = rows.computeIfAbsent(keyLabel[0], k -> new Row(k, keyLabel[1]));
          if (when >= row.lastRaced) {
            row.label = keyLabel[1]; // the newest name wins
            row.lastRaced = when;
          }
          row.raceIds.add(raceKey);
          row.heats++;
          addLaps(row, laps, driverName(dhd));
        }
      }
    }

    List<Row> out = new ArrayList<>(rows.values());
    for (Row row : out) finish(row);
    out.sort(
        (a, b) -> a.laps != b.laps ? Integer.compare(b.laps, a.laps) : a.label.compareTo(b.label));
    return out;
  }

  private static boolean matches(Car car, DriverHeatData dhd, Filters f) {
    if (f.carId != null && !f.carId.equals(car.getEntityId())) return false;
    if (f.carClass != null && !f.carClass.equalsIgnoreCase(trim(car.getCarClass()))) return false;
    if (f.driverId != null) {
      Driver d = driverOf(dhd);
      if (d == null || !f.driverId.equals(d.getEntityId())) return false;
    }
    return true;
  }

  /** The group's key and label, or null when the heat has no value for it. */
  private static String[] groupKey(String group, Car car, DriverHeatData dhd, Track track) {
    switch (group) {
      case GROUP_CAR:
        String id = car.getEntityId() != null ? car.getEntityId() : car.getName();
        return new String[] {id, trim(car.getName())};
      case GROUP_TRACK:
        if (track == null || track.getEntityId() == null) return null;
        return new String[] {track.getEntityId(), trim(track.getName())};
      case GROUP_DRIVER:
        Driver d = driverOf(dhd);
        if (d == null || d.getEntityId() == null) return null;
        return new String[] {d.getEntityId(), driverName(dhd)};
      default:
        String value = fieldValue(group, car);
        if (value.isEmpty()) return null;
        // Values group without regard to case ("Ortmann" and "ortmann" are one row).
        return new String[] {value.toLowerCase(), value};
    }
  }

  /** The car's value for a class, setup field or own field. */
  static String fieldValue(String group, Car car) {
    if (group.startsWith(GROUP_CUSTOM_PREFIX)) {
      Map<String, String> custom = car.getCustomValues();
      return custom == null ? "" : trim(custom.get(group.substring(GROUP_CUSTOM_PREFIX.length())));
    }
    switch (group) {
      case GROUP_CLASS:
        return trim(car.getCarClass());
      case "brand":
        return trim(car.getBrand());
      case "scale":
        return trim(car.getScale());
      case "motor":
        return trim(car.getMotor());
      case "magnet":
        return trim(car.getMagnet());
      case "chassis":
        return trim(car.getChassis());
      case "gears":
        return trim(car.getGears());
      case "tyres":
        return trim(car.getTyres());
      default:
        return "";
    }
  }

  private static List<Double> validLaps(DriverHeatData dhd, double minLap) {
    List<Double> out = new ArrayList<>();
    if (dhd.getLaps() == null) return out;
    for (DriverHeatData.LapData lap : dhd.getLaps()) {
      if (lap == null || !lap.isCountTowardsRecords()) continue;
      double t = lap.getLapTime();
      if (t > 0 && (minLap <= 0 || t >= minLap)) out.add(t);
    }
    return out;
  }

  private static void addLaps(Row row, List<Double> laps, String driver) {
    for (double t : laps) {
      if (row.bestLapTime == 0 || t < row.bestLapTime) {
        row.bestLapTime = t;
        row.bestLapDriver = driver;
      }
      row.lapTimes.add(t);
    }
  }

  private static void finish(Row row) {
    row.races = row.raceIds.size();
    row.laps = row.lapTimes.size();
    if (row.lapTimes.isEmpty()) return;
    double sum = 0;
    for (double t : row.lapTimes) sum += t;
    row.averageLapTime = sum / row.lapTimes.size();
    List<Double> sorted = new ArrayList<>(row.lapTimes);
    Collections.sort(sorted);
    int mid = sorted.size() / 2;
    row.medianLapTime =
        sorted.size() % 2 == 0 ? (sorted.get(mid - 1) + sorted.get(mid)) / 2.0 : sorted.get(mid);
  }

  /** The driver who ran the heat: a team's driver at the time, or the solo driver. */
  private static Driver driverOf(DriverHeatData dhd) {
    if (dhd.getActualDriver() != null && dhd.getActualDriver().getEntityId() != null) {
      return dhd.getActualDriver();
    }
    RaceParticipant p = dhd.getDriver();
    return p != null ? p.getDriver() : null;
  }

  private static String driverName(DriverHeatData dhd) {
    Driver d = driverOf(dhd);
    if (d == null) return "";
    String nick = trim(d.getNickname());
    return nick.isEmpty() ? trim(d.getName()) : nick;
  }

  private static String trim(String s) {
    return s == null ? "" : s.trim();
  }

  private static String blankToNull(String s) {
    return s == null || s.trim().isEmpty() ? null : s.trim();
  }
}
