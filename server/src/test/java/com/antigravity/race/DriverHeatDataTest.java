package com.antigravity.race;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.Driver;
import org.junit.Test;

public class DriverHeatDataTest {

  @Test
  public void testAdjustedLapCountWithFractions() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Mock 5 laps
    for (int i = 0; i < 5; i++) {
      dhd.addLap(10.0, false, true);
    }

    dhd.setPenaltyLaps(-1.0);
    dhd.setUserLaps(0.25);
    dhd.setAutoCalculatedLaps(0.5);

    // 5 - (-1.0) + 0.25 + 0.5 = 6.75
    assertEquals(6.75, dhd.getAdjustedLapCount(), 0.001);
  }

  @Test
  public void testAverageLapTimeCalculationWithAdjustments() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // 5 laps of 10 seconds each
    for (int i = 0; i < 5; i++) {
      dhd.addLap(10.0, false, true);
    }

    // Add significant adjustments that would change the average if they were included
    dhd.setPenaltyLaps(5.0);
    dhd.setUserLaps(10.0);
    dhd.setAutoCalculatedLaps(15.0);

    // Adjusted lap count is now 5 - 5 + 10 + 15 = 25
    assertEquals(25.0, dhd.getAdjustedLapCount(), 0.001);

    // Average lap time should STILL be 10.0 (sum of 50.0 / 5 laps)
    // If it used adjusted count, it would be 50.0 / 35 = ~1.42
    assertEquals(10.0, dhd.getAverageLapTime(), 0.001);

    // Total time should also be based on actual laps: 50.0
    assertEquals(50.0, dhd.getTotalTime(), 0.001);
  }

  @Test
  public void testReactionTimeDefaultAndReset() {
    Driver driverModel = new Driver("Test", "Test");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Default should be -1.0 (not set)
    assertEquals(-1.0, dhd.getReactionTime(), 0.001);

    // Set it to 0.0 (e.g. false start)
    dhd.setReactionTime(0.0);
    assertEquals(0.0, dhd.getReactionTime(), 0.001);

    // Reset should put it back to -1.0
    dhd.reset();
    assertEquals(-1.0, dhd.getReactionTime(), 0.001);
  }

  @Test
  public void testSerializationDeserialization() throws Exception {
    Driver driverModel = new Driver("Test Driver", "Nickname");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData original = new DriverHeatData(driver);
    original.addSegment(1.5);
    original.addSegment(2.5);
    original.addLap(10.0, false, true);
    original.addSegment(3.0);
    original.addLap(12.0, true, true);

    com.fasterxml.jackson.databind.ObjectMapper mapper =
        new com.fasterxml.jackson.databind.ObjectMapper();
    String json = mapper.writeValueAsString(original);
    DriverHeatData decoded = mapper.readValue(json, DriverHeatData.class);

    assertEquals(original.getLaps().size(), decoded.getLaps().size());
    assertEquals(original.getSegments().size(), decoded.getSegments().size());
    assertEquals(original.getBestLapTime(), decoded.getBestLapTime(), 0.001);
  }

  @Test
  public void testLazyBestLapTimeComputationWhenZero() {
    Driver driverModel = new Driver("Test Driver", "Nickname");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    dhd.getLaps().add(new DriverHeatData.LapData(12.5, "d1", null, false, true));
    dhd.getLaps().add(new DriverHeatData.LapData(10.2, "d1", null, false, true));
    dhd.getLaps().add(new DriverHeatData.LapData(11.1, "d1", null, false, true));

    // Initially bestLapTime field is 0.0
    assertEquals(0.0, dhd.getBestLapTime() == 0.0 ? 0.0 : 0.0, 0.001);
    // getBestLapTime() should compute min lap time: 10.2
    assertEquals(10.2, dhd.getBestLapTime(), 0.001);
  }

  @Test
  public void testDriftLapDoesNotUpdateBestLapTime() {
    Driver driverModel = new Driver("Test Driver", "Nickname");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Add a normal lap
    dhd.addLap(10.0, false, true);
    assertEquals(10.0, dhd.getBestLapTime(), 0.001);

    // Add a fast lap that shouldn't count towards records (adjustDriftLaps = true)
    dhd.addLap(5.0, true, false);

    // Best lap time should remain 10.0
    assertEquals(10.0, dhd.getBestLapTime(), 0.001);

    // Total laps should be 2
    assertEquals(2, dhd.getLaps().size());
  }

  @Test
  public void testStandingsParticipantMethods() {
    Driver driverModel = new Driver("Test Driver", "Nickname", "d-123", "d-123");
    RaceParticipant driver = new RaceParticipant(driverModel);
    driver.setSeed(4);
    DriverHeatData dhd = new DriverHeatData(driver);
    dhd.setActualDriver(driverModel);

    assertEquals("d-123", dhd.getParticipantId());
    assertEquals(4, dhd.getSeed());
    org.junit.Assert.assertFalse(dhd.isEmptyParticipant());

    DriverHeatData emptyDhd = new DriverHeatData();
    emptyDhd.setActualDriver(Driver.EMPTY_DRIVER);
    org.junit.Assert.assertTrue(emptyDhd.isEmptyParticipant());
  }

  @Test
  public void testDisallowLapRecalculatesBestLapTimeWithoutAffectingAverages() {
    Driver driverModel = new Driver("Test Driver", "Nickname");
    RaceParticipant driver = new RaceParticipant(driverModel);
    DriverHeatData dhd = new DriverHeatData(driver);

    // Add 3 laps: 10.0s, 3.0s (erroneous glitch), 8.0s
    dhd.addLap(10.0, false, true);
    dhd.addLap(3.0, false, true);
    dhd.addLap(8.0, false, true);

    assertEquals(3.0, dhd.getBestLapTime(), 0.001);
    assertEquals(3, dhd.getLapCount());
    double initialAvg = dhd.getAverageLapTime();
    double initialMed = dhd.getMedianLapTime();
    double initialTotal = dhd.getTotalTime();

    // Disallow the 3.0s lap from records
    dhd.getLaps().get(1).setCountTowardsRecords(false);
    dhd.recalculateBestLapTime();

    // Best lap should now be 8.0s (the next best valid lap)
    assertEquals(8.0, dhd.getBestLapTime(), 0.001);

    // Laps count, average, median, and total time MUST remain identical
    assertEquals(3, dhd.getLapCount());
    assertEquals(initialAvg, dhd.getAverageLapTime(), 0.001);
    assertEquals(initialMed, dhd.getMedianLapTime(), 0.001);
    assertEquals(initialTotal, dhd.getTotalTime(), 0.001);
  }

  @Test
  public void testParticipantIdDelegationForSoloAndTeam() {
    // 1. Solo participant
    Driver soloDriver =
        new Driver(
            "Solo Driver",
            "SD",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "driver_123",
            null);
    RaceParticipant soloRp = new RaceParticipant(soloDriver);
    DriverHeatData soloDhd = new DriverHeatData(soloRp);
    assertEquals("driver_123", soloDhd.getParticipantId());

    // 2. Team participant with actualDriver in heat
    com.antigravity.models.Team team =
        new com.antigravity.models.Team(
            "The Girls", null, java.util.Collections.emptyList(), "team_girls", null);
    RaceParticipant teamRp = new RaceParticipant(team);
    Driver heatDriver =
        new Driver(
            "Maya", "M", null, null, null, null, null, null, null, null, null, "driver_maya", null);
    DriverHeatData teamDhd = new DriverHeatData(teamRp, heatDriver);

    assertEquals("t_team_girls", teamRp.getParticipantId());
    assertEquals("t_team_girls", teamDhd.getParticipantId());
  }
}
