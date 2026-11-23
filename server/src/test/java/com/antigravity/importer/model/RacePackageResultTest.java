package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class RacePackageResultTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    RacePackageResult res = new RacePackageResult();
    assertFalse(res.isSuccess());
    assertNull(res.getImportedRaceId());
    assertNull(res.getRaceName());
    assertEquals(0, res.getDriverCount());
    assertEquals(0, res.getDriversCreated());
    assertEquals(0, res.getDriversLinked());
    assertNull(res.getCommittedToSeasonId());
    assertNull(res.getRaceConfigId());
    assertNull(res.getRaceConfigName());
    assertNull(res.getRaceConfigAction());
    assertNull(res.getAction());
    assertNull(res.getMessage());

    res.setSuccess(true);
    res.setImportedRaceId("imp-1");
    res.setRaceName("Spring Trophy");
    res.setDriverCount(12);
    res.setDriversCreated(4);
    res.setDriversLinked(8);
    res.setCommittedToSeasonId("seas-1");
    res.setRaceConfigId("cfg-1");
    res.setRaceConfigName("Spring Trophy Config");
    res.setRaceConfigAction("CREATED");
    res.setAction("IMPORTED");
    res.setMessage("Import succeeded");

    assertTrue(res.isSuccess());
    assertEquals("imp-1", res.getImportedRaceId());
    assertEquals("Spring Trophy", res.getRaceName());
    assertEquals(12, res.getDriverCount());
    assertEquals(4, res.getDriversCreated());
    assertEquals(8, res.getDriversLinked());
    assertEquals("seas-1", res.getCommittedToSeasonId());
    assertEquals("cfg-1", res.getRaceConfigId());
    assertEquals("Spring Trophy Config", res.getRaceConfigName());
    assertEquals("CREATED", res.getRaceConfigAction());
    assertEquals("IMPORTED", res.getAction());
    assertEquals("Import succeeded", res.getMessage());

    RacePackageResult eightArg =
        new RacePackageResult(
            true, "imp-2", "Race Two", 10, 2, 8, "seas-2", "Imported 8-arg successfully");
    assertTrue(eightArg.isSuccess());
    assertEquals("imp-2", eightArg.getImportedRaceId());
    assertEquals("Race Two", eightArg.getRaceName());
    assertEquals("IMPORTED", eightArg.getAction());
    assertNull(eightArg.getRaceConfigId());

    RacePackageResult elevenArg =
        new RacePackageResult(
            true,
            "imp-3",
            "Race Three",
            6,
            1,
            5,
            "seas-3",
            "cfg-3",
            "Config Three",
            "USE_EXISTING",
            "Eleven arg ok");
    assertTrue(elevenArg.isSuccess());
    assertEquals("cfg-3", elevenArg.getRaceConfigId());
    assertEquals("Config Three", elevenArg.getRaceConfigName());
    assertEquals("USE_EXISTING", elevenArg.getRaceConfigAction());
    assertEquals("IMPORTED", elevenArg.getAction());

    RacePackageResult twelveArg =
        new RacePackageResult(
            true,
            "imp-4",
            "Race Four",
            8,
            0,
            8,
            "seas-4",
            "cfg-4",
            "Config Four",
            "OVERWRITTEN",
            "Overwritten ok",
            "OVERWRITTEN");
    assertTrue(twelveArg.isSuccess());
    assertEquals("OVERWRITTEN", twelveArg.getAction());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RacePackageResult res =
        new RacePackageResult(
            true,
            "imported-id-123",
            "Monaco GP",
            20,
            5,
            15,
            "season-2026",
            "cfg-monaco",
            "Monaco GP Config",
            "CREATED",
            "Successfully imported Monaco GP",
            "IMPORTED");

    String json = mapper.writeValueAsString(res);
    RacePackageResult deserialized = mapper.readValue(json, RacePackageResult.class);

    assertNotNull(deserialized);
    assertTrue(deserialized.isSuccess());
    assertEquals("imported-id-123", deserialized.getImportedRaceId());
    assertEquals("Monaco GP", deserialized.getRaceName());
    assertEquals(20, deserialized.getDriverCount());
    assertEquals(5, deserialized.getDriversCreated());
    assertEquals(15, deserialized.getDriversLinked());
    assertEquals("season-2026", deserialized.getCommittedToSeasonId());
    assertEquals("cfg-monaco", deserialized.getRaceConfigId());
    assertEquals("Monaco GP Config", deserialized.getRaceConfigName());
    assertEquals("CREATED", deserialized.getRaceConfigAction());
    assertEquals("Successfully imported Monaco GP", deserialized.getMessage());
    assertEquals("IMPORTED", deserialized.getAction());
  }
}
