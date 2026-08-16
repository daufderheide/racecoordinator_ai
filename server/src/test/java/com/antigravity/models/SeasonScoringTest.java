package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class SeasonScoringTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testDefaultConstructor() {
    SeasonScoring scoring = new SeasonScoring();
    assertEquals(10, scoring.getPositionPoints().size());
    assertEquals(25.0, scoring.getPositionPoints().get(0), 0.001);
    assertEquals(4, scoring.getHeatPositionPoints().size());
    assertEquals(3.0, scoring.getHeatPositionPoints().get(0), 0.001);

    assertEquals(0.0, scoring.getHeatCarryOverPct(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusLedLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusMostLapsLed(), 0.001);
    assertFalse(scoring.isHeatOneBonusPerDriver());

    assertEquals(0.0, scoring.getOverallCarryOverPct(), 0.001);
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
    SeasonScoring scoring = new SeasonScoring(pos, heatPos);

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
    SeasonScoring scoring =
        new SeasonScoring(
            null, null, null, null, null, null, null, null, null, null, null, null, null);

    assertEquals(10, scoring.getPositionPoints().size());
    assertEquals(4, scoring.getHeatPositionPoints().size());
    assertEquals(0.0, scoring.getHeatCarryOverPct(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusLedLap(), 0.001);
    assertEquals(0.0, scoring.getHeatBonusMostLapsLed(), 0.001);
    assertFalse(scoring.isHeatOneBonusPerDriver());
    assertEquals(0.0, scoring.getOverallCarryOverPct(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusFastestLap(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusFastestLapPerLane(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusLedLap(), 0.001);
    assertEquals(0.0, scoring.getOverallBonusMostLapsLed(), 0.001);
    assertFalse(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testFullConstructorAndGetters() {
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(100.0, 75.0),
            Arrays.asList(10.0, 5.0),
            50.0,
            5.0,
            2.0,
            4.0,
            true,
            25.0,
            15.0,
            3.0,
            1.0,
            6.0,
            true);

    assertEquals(2, scoring.getPositionPoints().size());
    assertEquals(100.0, scoring.getPositionPoints().get(0), 0.001);
    assertEquals(75.0, scoring.getPositionPoints().get(1), 0.001);
    assertEquals(2, scoring.getHeatPositionPoints().size());
    assertEquals(10.0, scoring.getHeatPositionPoints().get(0), 0.001);
    assertEquals(5.0, scoring.getHeatPositionPoints().get(1), 0.001);

    assertEquals(50.0, scoring.getHeatCarryOverPct(), 0.001);
    assertEquals(5.0, scoring.getHeatBonusFastestLap(), 0.001);
    assertEquals(2.0, scoring.getHeatBonusLedLap(), 0.001);
    assertEquals(4.0, scoring.getHeatBonusMostLapsLed(), 0.001);
    assertTrue(scoring.isHeatOneBonusPerDriver());

    assertEquals(25.0, scoring.getOverallCarryOverPct(), 0.001);
    assertEquals(15.0, scoring.getOverallBonusFastestLap(), 0.001);
    assertEquals(3.0, scoring.getOverallBonusFastestLapPerLane(), 0.001);
    assertEquals(1.0, scoring.getOverallBonusLedLap(), 0.001);
    assertEquals(6.0, scoring.getOverallBonusMostLapsLed(), 0.001);
    assertTrue(scoring.isOverallOneBonusPerDriver());
  }

  @Test
  public void testJsonSerializationAndDeserialization() throws Exception {
    SeasonScoring scoring =
        new SeasonScoring(
            Arrays.asList(20.0, 10.0),
            Arrays.asList(4.0, 2.0),
            30.0,
            8.0,
            3.0,
            6.0,
            true,
            40.0,
            12.0,
            4.0,
            2.0,
            7.0,
            true);

    String json = mapper.writeValueAsString(scoring);
    assertNotNull(json);
    assertTrue(json.contains("\"heat_carry_over_pct\":30.0"));
    assertTrue(json.contains("\"heat_bonus_fastest_lap\":8.0"));
    assertTrue(json.contains("\"heat_bonus_led_lap\":3.0"));
    assertTrue(json.contains("\"heat_bonus_most_laps_led\":6.0"));
    assertTrue(json.contains("\"heat_one_bonus_per_driver\":true"));
    assertTrue(json.contains("\"overall_carry_over_pct\":40.0"));
    assertTrue(json.contains("\"overall_bonus_fastest_lap\":12.0"));
    assertTrue(json.contains("\"overall_bonus_fastest_lap_per_lane\":4.0"));
    assertTrue(json.contains("\"overall_bonus_led_lap\":2.0"));
    assertTrue(json.contains("\"overall_bonus_most_laps_led\":7.0"));
    assertTrue(json.contains("\"overall_one_bonus_per_driver\":true"));

    SeasonScoring deserialized = mapper.readValue(json, SeasonScoring.class);
    assertNotNull(deserialized);
    assertEquals(2, deserialized.getPositionPoints().size());
    assertEquals(20.0, deserialized.getPositionPoints().get(0), 0.001);
    assertEquals(30.0, deserialized.getHeatCarryOverPct(), 0.001);
    assertEquals(8.0, deserialized.getHeatBonusFastestLap(), 0.001);
    assertEquals(3.0, deserialized.getHeatBonusLedLap(), 0.001);
    assertEquals(6.0, deserialized.getHeatBonusMostLapsLed(), 0.001);
    assertTrue(deserialized.isHeatOneBonusPerDriver());
    assertEquals(40.0, deserialized.getOverallCarryOverPct(), 0.001);
    assertEquals(12.0, deserialized.getOverallBonusFastestLap(), 0.001);
    assertEquals(4.0, deserialized.getOverallBonusFastestLapPerLane(), 0.001);
    assertEquals(2.0, deserialized.getOverallBonusLedLap(), 0.001);
    assertEquals(7.0, deserialized.getOverallBonusMostLapsLed(), 0.001);
    assertTrue(deserialized.isOverallOneBonusPerDriver());
  }
}
