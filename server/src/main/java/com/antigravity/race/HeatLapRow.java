package com.antigravity.race;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HeatLapRow {

  private final int lapNumber;
  private final List<Double> laneLaps;

  public HeatLapRow(int lapNumber, List<Double> laneLaps) {
    this.lapNumber = lapNumber;
    this.laneLaps =
        laneLaps != null
            ? Collections.unmodifiableList(new ArrayList<>(laneLaps))
            : Collections.emptyList();
  }

  public int getLapNumber() {
    return lapNumber;
  }

  public List<Double> getLaneLaps() {
    return laneLaps;
  }

  public Double getLaneLap(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < laneLaps.size()) {
      return laneLaps.get(laneIndex);
    }
    return null;
  }

  public Double getLapTime(int laneIndex) {
    return getLaneLap(laneIndex);
  }
}
