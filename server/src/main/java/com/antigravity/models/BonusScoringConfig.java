package com.antigravity.models;

import java.util.List;

public interface BonusScoringConfig {

  List<Double> getHeatPositionPoints();

  double getHeatCarryOverPct();

  double getHeatBonusFastestLap();

  double getHeatBonusLedLap();

  double getHeatBonusMostLapsLed();

  boolean isHeatOneBonusPerDriver();

  double getOverallBonusFastestLap();

  double getOverallBonusFastestLapPerLane();

  double getOverallBonusLedLap();

  double getOverallBonusMostLapsLed();

  boolean isOverallOneBonusPerDriver();
}
