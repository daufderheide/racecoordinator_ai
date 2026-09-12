package com.antigravity.race;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HeatLapRow {

  private final int lapNumber;
  private final List<Double> laneLaps;
  private final List<List<Double>> laneSegments;
  private final List<Object> values;

  public HeatLapRow(int lapNumber, List<Double> laneLaps) {
    this(lapNumber, laneLaps, null, 0);
  }

  public HeatLapRow(int lapNumber, List<Double> laneLaps, List<List<Double>> laneSegments) {
    this(lapNumber, laneLaps, laneSegments, 0);
  }

  public HeatLapRow(
      int lapNumber,
      List<Double> laneLaps,
      List<List<Double>> laneSegments,
      int explicitMaxSegments) {
    this.lapNumber = lapNumber;
    this.laneLaps =
        laneLaps != null
            ? Collections.unmodifiableList(new ArrayList<>(laneLaps))
            : Collections.emptyList();
    if (laneSegments != null) {
      List<List<Double>> copy = new ArrayList<>(laneSegments.size());
      for (List<Double> segs : laneSegments) {
        copy.add(
            segs != null
                ? Collections.unmodifiableList(new ArrayList<>(segs))
                : Collections.emptyList());
      }
      this.laneSegments = Collections.unmodifiableList(copy);
    } else {
      this.laneSegments = Collections.emptyList();
    }

    int maxSegs = Math.max(0, explicitMaxSegments);
    for (List<Double> segList : this.laneSegments) {
      if (segList != null) {
        maxSegs = Math.max(maxSegs, segList.size());
      }
    }

    List<Object> vals = new ArrayList<>();
    for (int l = 0; l < this.laneLaps.size(); l++) {
      vals.add(this.laneLaps.get(l));
      if (maxSegs > 0) {
        List<Double> segs = (l < this.laneSegments.size()) ? this.laneSegments.get(l) : null;
        for (int s = 0; s < maxSegs; s++) {
          if (segs != null && s < segs.size()) {
            vals.add(segs.get(s));
          } else {
            vals.add(null);
          }
        }
      }
    }
    this.values = Collections.unmodifiableList(vals);
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

  public List<List<Double>> getLaneSegments() {
    return laneSegments;
  }

  public List<Double> getLaneSegments(int laneIndex) {
    if (laneIndex >= 0 && laneIndex < laneSegments.size()) {
      return laneSegments.get(laneIndex);
    }
    return Collections.emptyList();
  }

  public Object getLaneSegment(int laneIndex) {
    List<Double> segs = getLaneSegments(laneIndex);
    if (segs == null || segs.isEmpty()) {
      return null;
    }
    if (segs.size() == 1) {
      return segs.get(0);
    }
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < segs.size(); i++) {
      if (i > 0) {
        sb.append(", ");
      }
      sb.append(segs.get(i));
    }
    return sb.toString();
  }

  public Double getLaneSegment(int laneIndex, int segmentIndex) {
    List<Double> segs = getLaneSegments(laneIndex);
    if (segmentIndex >= 0 && segmentIndex < segs.size()) {
      return segs.get(segmentIndex);
    }
    return null;
  }

  public Object getSegment(int laneIndex) {
    return getLaneSegment(laneIndex);
  }

  public Double getSegment(int laneIndex, int segmentIndex) {
    return getLaneSegment(laneIndex, segmentIndex);
  }

  public List<Object> getValues() {
    return values;
  }
}
