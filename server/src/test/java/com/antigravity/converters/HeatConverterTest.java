package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.Test;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Team;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;

public class HeatConverterTest {

  @Test
  public void testToProto_PopulatesActualDriver() {
    // Setup
    Driver driver = new Driver("driver1", "Driver One", null, null, null, null, null, null, null, null, null, "d1",
        null);
    // Team constructor: name, avatarUrl, driverIds, entityId, id
    Team team = new Team("Team One", null, new ArrayList<>(), "t1", null);

    RaceParticipant participant = new RaceParticipant(team);
    DriverHeatData heatData = new DriverHeatData(participant);
    heatData.setActualDriver(driver);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(heatData);

    HeatScoring scoring = new HeatScoring();
    Heat heat = new Heat(1, heatDrivers, scoring);
    Set<String> sentObjectIds = new HashSet<>();

    // Execute
    com.antigravity.proto.Heat proto = HeatConverter.toProto(heat, sentObjectIds);

    // Verify
    assertNotNull(proto);
    assertEquals(1, proto.getHeatDriversCount());
    com.antigravity.proto.DriverHeatData driverProto = proto.getHeatDrivers(0);

    assertEquals("d1", driverProto.getDriverId());
    assertTrue(driverProto.hasActualDriver());
    assertEquals("driver1", driverProto.getActualDriver().getName());
  }
}
