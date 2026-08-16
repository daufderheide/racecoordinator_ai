package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import org.junit.Test;

public class RaceParticipantTest {

  @Test
  public void testStandingsParticipantMethodsWithDriver() {
    Driver driver = new Driver("John Doe", "JD", "driver-456", "driver-456");
    RaceParticipant participant = new RaceParticipant(driver);
    participant.setTotalLaps(15.5);
    participant.setTotalTime(60.2);
    participant.setBestLapTime(3.8);
    participant.setAverageLapTime(4.01);
    participant.setMedianLapTime(3.95);
    participant.setSeed(3);

    assertEquals("driver-456", participant.getParticipantId());
    assertEquals(15.5, participant.getAdjustedLapCount(), 0.001);
    assertEquals(60.2, participant.getTotalTime(), 0.001);
    assertEquals(3.8, participant.getBestLapTime(), 0.001);
    assertEquals(4.01, participant.getAverageLapTime(), 0.001);
    assertEquals(3.95, participant.getMedianLapTime(), 0.001);
    assertEquals(3, participant.getSeed());
    assertFalse(participant.isEmptyParticipant());
  }

  @Test
  public void testStandingsParticipantMethodsWithTeam() {
    Team team = new Team("Red Bull", "avatar.png", null, "team-rb", "team-rb");
    RaceParticipant participant = new RaceParticipant(team);
    assertEquals("t_team-rb", participant.getParticipantId());
  }

  @Test
  public void testEmptyParticipantDetection() {
    RaceParticipant emptyDriver = new RaceParticipant(Driver.EMPTY_DRIVER);
    assertTrue(emptyDriver.isEmptyParticipant());

    Driver emptyLaneDriver = new Driver("Empty Lane", "Empty Lane", null, "EMPTY_LANE");
    RaceParticipant emptyLaneParticipant = new RaceParticipant(emptyLaneDriver);
    assertTrue(emptyLaneParticipant.isEmptyParticipant());
  }

  @Test
  public void testPointsAndBonusPointsGettersSettersAndRounding() {
    Driver driver = new Driver("Racer 1", "d1");
    RaceParticipant participant = new RaceParticipant(driver);

    // Test exact values
    participant.setPositionPoints(25.0);
    participant.setOverallBonusPoints(5.0);
    participant.setHeatPositionPoints(10.0);
    participant.setHeatBonusPoints(3.0);
    participant.setBonusPoints(8.0);
    participant.setTotalPoints(43.0);

    assertEquals(25.0, participant.getPositionPoints(), 0.001);
    assertEquals(5.0, participant.getOverallBonusPoints(), 0.001);
    assertEquals(10.0, participant.getHeatPositionPoints(), 0.001);
    assertEquals(3.0, participant.getHeatBonusPoints(), 0.001);
    assertEquals(8.0, participant.getBonusPoints(), 0.001);
    assertEquals(8.0, participant.getTotalBonusPoints(), 0.001);
    assertEquals(43.0, participant.getTotalPoints(), 0.001);

    // Test 2-decimal rounding on non-integer values
    participant.setPositionPoints(18.33333);
    participant.setOverallBonusPoints(1.66666);
    participant.setHeatPositionPoints(4.1284);
    participant.setHeatBonusPoints(2.4567);
    participant.setBonusPoints(4.12335);
    participant.setTotalPoints(26.58179);

    assertEquals(18.33, participant.getPositionPoints(), 0.001);
    assertEquals(1.67, participant.getOverallBonusPoints(), 0.001);
    assertEquals(4.13, participant.getHeatPositionPoints(), 0.001);
    assertEquals(2.46, participant.getHeatBonusPoints(), 0.001);
    assertEquals(4.12, participant.getBonusPoints(), 0.001);
    assertEquals(4.12, participant.getTotalBonusPoints(), 0.001);
    assertEquals(26.58, participant.getTotalPoints(), 0.001);
  }

  @Test
  public void testBonusBreakdownMaps() {
    Driver driver = new Driver("Racer 2", "d2");
    RaceParticipant participant = new RaceParticipant(driver);

    java.util.Map<String, Double> overallMap = new java.util.HashMap<>();
    overallMap.put("fastest_lap", 5.0);
    participant.setOverallBonusBreakdown(overallMap);

    java.util.Map<String, Double> heatMap = new java.util.HashMap<>();
    heatMap.put("fastest_lap_heat_1", 2.0);
    participant.setHeatBonusBreakdown(heatMap);

    assertEquals(overallMap, participant.getOverallBonusBreakdown());
    assertEquals(heatMap, participant.getHeatBonusBreakdown());

    // Null safety
    participant.setOverallBonusBreakdown(null);
    participant.setHeatBonusBreakdown(null);
    org.junit.Assert.assertNotNull(participant.getOverallBonusBreakdown());
    org.junit.Assert.assertNotNull(participant.getHeatBonusBreakdown());
    assertTrue(participant.getOverallBonusBreakdown().isEmpty());
    assertTrue(participant.getHeatBonusBreakdown().isEmpty());
  }
}
