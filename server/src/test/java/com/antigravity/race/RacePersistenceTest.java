package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.bson.codecs.configuration.CodecRegistry;
import org.junit.Test;

import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import com.antigravity.service.DatabaseService;
// Mocking the DB context/service might be complex, so we'll test object serialization if possible, 
// or test the logic flow without DB if we suspect logic. 
// But issue is likely persistence.
// We can use a real Mongo connection or just test the PojoCodecImpl if accessible, 
// strictly speaking we don't have easy access to the configured CodecRegistry here without spinning up the app.
// Instead, let's verify HeatBuilder logic first.

public class RacePersistenceTest {

  @Test
  public void testHeatBuilderAssignsActualDriver() {
    // Setup
    Driver d1 = new Driver("D1", "Driver One", null, null, null, null, null, null, null, null, null, "d1", null);
    Driver d2 = new Driver("D2", "Driver Two", null, null, null, null, null, null, null, null, null, "d2", null);
    List<String> driverIds = new ArrayList<>();
    driverIds.add("d1");
    driverIds.add("d2");

    Team team = new Team("The Team", "avatar", driverIds, "t1", null);

    RaceParticipant rp = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(d1);
    teamDrivers.add(d2);
    rp.setTeamDrivers(teamDrivers);

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(rp);

    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "black", 100, "l1", null));
    lanes.add(new com.antigravity.models.Lane("blue", "black", 100, "l2", null));

    com.antigravity.models.Track track = new com.antigravity.models.Track("Track", lanes, "track1", null);

    com.antigravity.models.Race raceModel = new com.antigravity.models.Race("Race", "track1",
        com.antigravity.models.HeatRotationType.RoundRobin, new com.antigravity.models.HeatScoring(),
        new com.antigravity.models.OverallScoring(), "race1", null);
    Race race = new Race(raceModel, drivers, track, true);

    // Execute
    List<Heat> heats = HeatBuilder.buildHeats(race, drivers);

    // Verify
    assertNotNull(heats);
    assertEquals(2, heats.size()); // 2 drivers, round robin likely 2 heats if 2 lanes?
    // Round robin with 2 lanes and 1 driver (team) -> 1 driver means 1 heat?
    // Wait, drivers.size() = 1.
    // RoundRobin uses max(drivers.size(), rotationSequence.size())
    // rotationSequence size = 2 (2 lanes). So 2 heats.

    Heat h1 = heats.get(0);
    Heat h2 = heats.get(1);

    // Find the team in h1
    DriverHeatData dhd1 = h1.getDrivers().stream().filter(d -> d.getDriver().getTeam() != null).findFirst()
        .orElse(null);
    assertNotNull(dhd1);
    assertNotNull(dhd1.getActualDriver());
    System.out.println("Heat 1 Driver: " + dhd1.getActualDriver().getName());

    // Find the team in h2
    DriverHeatData dhd2 = h2.getDrivers().stream().filter(d -> d.getDriver().getTeam() != null).findFirst()
        .orElse(null);
    assertNotNull(dhd2);
    assertNotNull(dhd2.getActualDriver());
    System.out.println("Heat 2 Driver: " + dhd2.getActualDriver().getName());

    // Verify they are different drivers (d1 and d2)
    // Logic: int driverIdx = h % participant.getTeamDrivers().size();
    // h=0 => idx 0 => d1
    // h=1 => idx 1 => d2
    System.out.println("Expected: D1, Actual: " + dhd1.getActualDriver().getName());
    assertEquals("D1", dhd1.getActualDriver().getName());
    System.out.println("Expected: D2, Actual: " + dhd2.getActualDriver().getName());
    assertEquals("D2", dhd2.getActualDriver().getName());
  }
}
