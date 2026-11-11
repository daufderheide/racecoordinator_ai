package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class PointsScoringTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testDefaultConstructor() {
    PointsScoring scoring = new PointsScoring();
    assertEquals(10, scoring.getPositionPoints().size());
    assertEquals(25.0, scoring.getPositionPoints().get(0), 0.001);
    assertEquals(4, scoring.getHeatPositionPoints().size());
    assertEquals(3.0, scoring.getHeatPositionPoints().get(0), 0.001);

    assertEquals(0.0, scoring.getHeatCarryOverPct(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusLedLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusMostLapsLed(), 0.001);
    assertFalse(scoring.isHeatOneBonusPerDriver());

    assertEquals(0.0, scoring.getOverallBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusFastestLapPerLane(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusLedLap(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusMostLapsLed(), 0.001);
    assertFalse(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testTwoArgConstructor() {
    List<Double> pos = Arrays.asList(50.0, 30.0, 20.0);
    List<Double> heatPos = Arrays.asList(5.0, 3.0);
    PointsScoring scoring = new PointsScoring(pos, heatPos);

    assertEquals(3, scoring.getPositionPoints().size());
    assertEquals(50.0, scoring.getPositionPoints().get(0), 0.001);
    assertEquals(2, scoring.getHeatPositionPoints().size());
    assertEquals(5.0, scoring.getHeatPositionPoints().get(0), 0.001);

    assertEquals(0.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusFastestLap(), 0.001);
    assertFalse(scoring.isHeatOneBonusPerDriver());
    assertFalse(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testFullConstructorWithNulls() {
    PointsScoring scoring =
        new PointsScoring(null, null, null, null, null, null, null, null, null, null, null, null);

    assertNotNull(scoring.getPositionPoints());
    assertEquals(10, scoring.getPositionPoints().size());
    assertNotNull(scoring.getHeatPositionPoints());
    assertEquals(4, scoring.getHeatPositionPoints().size());
    assertEquals(0.0, scoring.getHeatCarryOverPct(), 0.001);
    assertFalse(scoring.isHeatOneBonusPerDriver());
    assertFalse(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testCustomValues() {
    List<Double> pos = Arrays.asList(10.0, 8.0, 6.0);
    List<Double> heatPos = Arrays.asList(4.0, 3.0, 2.0, 1.0);
    PointsScoring scoring =
        new PointsScoring(pos, heatPos, 15.0, 1.0, 2.0, 3.0, true, 5.0, 2.5, 3.5, 4.5, true);

    assertEquals(pos, scoring.getPositionPoints());
    assertEquals(heatPos, scoring.getHeatPositionPoints());
    assertEquals(15.0, scoring.getHeatCarryOverPct(), 0.001);
    assertEquals(1.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(2.0, scoring.getHeatBonusLedLap(), 0.001);
    assertEquals(3.0, scoring.getHeatBonusMostLapsLed(), 0.001);
    assertTrue(scoring.isHeatOneBonusPerDriver());

    assertEquals(5.0, scoring.getOverallBonusFastestLap(), 0.001);
    assertEquals(2.5, scoring.getOverallBonusFastestLapPerLane(), 0.001);
    assertEquals(3.5, scoring.getOverallBonusLedLap(), 0.001);
    assertEquals(4.5, scoring.getOverallBonusMostLapsLed(), 0.001);
    assertTrue(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    PointsScoring scoring =
        new PointsScoring(
            Arrays.asList(10.0, 8.0),
            Arrays.asList(4.0, 2.0),
            10.0,
            1.0,
            2.0,
            3.0,
            true,
            4.0,
            2.0,
            1.5,
            3.5,
            false);

    String json = mapper.writeValueAsString(scoring);
    PointsScoring deserialized = mapper.readValue(json, PointsScoring.class);

    assertEquals(scoring, deserialized);
    assertEquals(scoring.hashCode(), deserialized.hashCode());
  }

  @Test
  public void testEqualsAndHashCode() {
    PointsScoring s1 = new PointsScoring();
    PointsScoring s2 = new PointsScoring();
    PointsScoring s3 =
        new PointsScoring(
            Arrays.asList(1.0),
            Arrays.asList(1.0),
            1.0,
            1.0,
            1.0,
            1.0,
            true,
            1.0,
            1.0,
            1.0,
            1.0,
            true);

    assertEquals(s1, s2);
    assertEquals(s1.hashCode(), s2.hashCode());
    assertNotEquals(s1, s3);
    assertNotEquals(s1, null);
    assertNotEquals(s1, "other");
  }
}
