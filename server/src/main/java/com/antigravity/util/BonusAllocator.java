package com.antigravity.util;

import java.util.*;

public class BonusAllocator {

  public static class BonusDef implements Comparable<BonusDef> {
    public String name;
    public double points;
    public List<String> fallbackDrivers;

    public BonusDef(String name, double points, List<String> fallbackDrivers) {
      this.name = name;
      this.points = points;
      this.fallbackDrivers = new ArrayList<>(fallbackDrivers);
    }

    @Override
    public int compareTo(BonusDef o) {
      return Double.compare(o.points, this.points); // descending
    }
  }

  public static Map<String, List<Double>> allocate(List<BonusDef> bonuses, boolean onePerDriver) {
    Map<String, List<Double>> results = new HashMap<>();

    if (!onePerDriver) {
      for (BonusDef b : bonuses) {
        if (!b.fallbackDrivers.isEmpty()) {
          String winner = b.fallbackDrivers.get(0);
          results.computeIfAbsent(winner, k -> new ArrayList<>()).add(b.points);
        }
      }
      return results;
    }

    // Sort descending by points
    Collections.sort(bonuses);

    Set<String> awardedDrivers = new HashSet<>();

    for (BonusDef b : bonuses) {
      for (String driverId : b.fallbackDrivers) {
        if (!awardedDrivers.contains(driverId)) {
          awardedDrivers.add(driverId);
          results.computeIfAbsent(driverId, k -> new ArrayList<>()).add(b.points);
          break;
        }
      }
    }

    return results;
  }
}
