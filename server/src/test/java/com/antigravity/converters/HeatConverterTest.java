package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Team;
import com.antigravity.proto.DriverHeatData;
import com.antigravity.proto.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.Test;

public class HeatConverterTest {

  @Test
  public void testToProto_PopulatesActualDriver() {
    // Setup
    Driver driver =
        new Driver(
            "driver1",
            "Driver One",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "d1",
            null);
    // Team constructor: name, avatarUrl, driverIds, entityId, id
    Team team = new Team("Team One", null, new ArrayList<>(), "t1", null);

    RaceParticipant participant = new RaceParticipant(team);
    com.antigravity.race.DriverHeatData heatData =
        new com.antigravity.race.DriverHeatData(participant);
    heatData.setActualDriver(driver);

    List<com.antigravity.race.DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(heatData);

    HeatScoring scoring = new HeatScoring();
    com.antigravity.race.Heat heat = new com.antigravity.race.Heat(1, heatDrivers, scoring, false);
    Set<String> sentObjectIds = new HashSet<>();

    // Execute
    Heat proto = HeatConverter.toProto(heat, sentObjectIds);

    // Verify
    assertNotNull(proto);
    assertEquals(1, proto.getHeatDriversCount());
    DriverHeatData driverProto = proto.getHeatDrivers(0);

    assertEquals("d1", driverProto.getDriverId());
    assertTrue(driverProto.hasActualDriver());
    assertEquals("driver1", driverProto.getActualDriver().getName());
  }

  @Test
  public void testToProto_PopulatesAllFields() {
    // Setup
    com.antigravity.models.Team team =
        new com.antigravity.models.Team("Team", null, new ArrayList<>(), "t1", null);
    com.antigravity.race.RaceParticipant participant =
        new com.antigravity.race.RaceParticipant(team);
    com.antigravity.race.DriverHeatData dhd = new com.antigravity.race.DriverHeatData(participant);
    dhd.setReactionTime(0.5);
    dhd.setGapLeader(1.2);
    dhd.setGapPosition(0.3);
    dhd.setRefueling(true);
    dhd.setCurrentLocation(com.antigravity.protocols.CarLocation.PitRow);
    dhd.setInitialFuelLevel(100.0);
    dhd.addLap(10.0, false);
    dhd.addLap(11.0, false);
    dhd.addLap(13.5, false);
    dhd.setUserLaps(2.0);
    dhd.setPenaltyLaps(-1.0);
    dhd.setAutoCalculatedLaps(0.5);

    Set<String> sentObjectIds = new HashSet<>();

    // Execute
    com.antigravity.proto.DriverHeatData proto = HeatConverter.toProto(dhd, sentObjectIds);

    // Verify
    assertEquals(0.5, proto.getReactionTime(), 0.001);
    assertEquals(1.2, proto.getGapLeader(), 0.001);
    assertEquals(0.3, proto.getGapPosition(), 0.001);
    assertTrue(proto.getIsRefueling());
    assertEquals(
        com.antigravity.protocols.CarLocation.PitRow.getValue(), proto.getCurrentLocation());
    assertEquals(100.0, proto.getInitialFuelLevel(), 0.001);
    assertEquals(10.0, proto.getBestLapTime(), 0.001);
    assertEquals(11.0, proto.getMedianLapTime(), 0.001);
    assertEquals(11.5, proto.getAverageLapTime(), 0.001);
    assertEquals(2.0, proto.getUserLaps(), 0.001);
    assertEquals(-1.0, proto.getPenaltyLaps(), 0.001);
    assertEquals(0.5, proto.getAutoCalculatedLaps(), 0.001);
    assertEquals(6.5, proto.getAdjustedLapCount(), 0.001); // 3 (laps) + 2 - (-1) + 0.5 = 6.5
  }
}
