package com.antigravity.race;

import com.antigravity.models.FuelCurvePoint;
import java.util.List;

public final class FuelCalculationUtils {

  private FuelCalculationUtils() {
    // Utility class
  }

  public static double interpolateFuelCurve(List<FuelCurvePoint> points, double x) {
    if (points == null || points.isEmpty()) {
      return 1.0;
    }
    if (points.size() == 1) {
      return points.get(0).getY();
    }
    if (x <= points.get(0).getX()) {
      return points.get(0).getY();
    }
    if (x >= points.get(points.size() - 1).getX()) {
      return points.get(points.size() - 1).getY();
    }

    for (int i = 0; i < points.size() - 1; i++) {
      FuelCurvePoint p1 = points.get(i);
      FuelCurvePoint p2 = points.get(i + 1);
      if (x >= p1.getX() && x <= p2.getX()) {
        double dx = p2.getX() - p1.getX();
        if (dx <= 0.00001) {
          return p1.getY();
        }
        double t = (x - p1.getX()) / dx;
        return p1.getY() + t * (p2.getY() - p1.getY());
      }
    }
    return points.get(points.size() - 1).getY();
  }
}
