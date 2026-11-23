package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class RacePackageManifestTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    RacePackageManifest manifest = new RacePackageManifest();
    assertEquals(1, manifest.getFormatVersion());
    assertEquals("1.0.0", manifest.getMinCompatibleAppVersion());
    assertEquals("race_package", manifest.getPackageType());
    assertNull(manifest.getCreatedByAppVersion());
    assertNull(manifest.getRaceId());
    assertNull(manifest.getRaceName());
    assertNull(manifest.getStartTime());
    assertNull(manifest.getEndTime());
    assertEquals(0, manifest.getHeatCount());
    assertEquals(0, manifest.getDriverCount());
    assertNull(manifest.getFingerprint());

    manifest.setFormatVersion(2);
    manifest.setCreatedByAppVersion("1.2.0");
    manifest.setMinCompatibleAppVersion("1.1.0");
    manifest.setPackageType("RACE_WITH_CONFIG");
    manifest.setRaceId("r-1");
    manifest.setRaceName("Super GP");
    manifest.setStartTime(1700000000000L);
    manifest.setEndTime(1700003600000L);
    manifest.setHeatCount(10);
    manifest.setDriverCount(8);
    manifest.setFingerprint("sha256hash");

    assertEquals(2, manifest.getFormatVersion());
    assertEquals("1.2.0", manifest.getCreatedByAppVersion());
    assertEquals("1.1.0", manifest.getMinCompatibleAppVersion());
    assertEquals("RACE_WITH_CONFIG", manifest.getPackageType());
    assertEquals("r-1", manifest.getRaceId());
    assertEquals("Super GP", manifest.getRaceName());
    assertEquals(Long.valueOf(1700000000000L), manifest.getStartTime());
    assertEquals(Long.valueOf(1700003600000L), manifest.getEndTime());
    assertEquals(10, manifest.getHeatCount());
    assertEquals(8, manifest.getDriverCount());
    assertEquals("sha256hash", manifest.getFingerprint());

    RacePackageManifest parameterized =
        new RacePackageManifest(
            1, "1.0.0", "1.0.0", "race_package", "r-2", "Sprint", 100L, 200L, 4, 6, "fp123");
    assertEquals(1, parameterized.getFormatVersion());
    assertEquals("1.0.0", parameterized.getCreatedByAppVersion());
    assertEquals("r-2", parameterized.getRaceId());
    assertEquals("Sprint", parameterized.getRaceName());
    assertEquals(Long.valueOf(100L), parameterized.getStartTime());
    assertEquals(Long.valueOf(200L), parameterized.getEndTime());
    assertEquals(4, parameterized.getHeatCount());
    assertEquals(6, parameterized.getDriverCount());
    assertEquals("fp123", parameterized.getFingerprint());

    RacePackageManifest nullDefaults =
        new RacePackageManifest(0, "1.0.0", null, null, "r-3", "Test", null, null, 1, 1, null);
    assertEquals(1, nullDefaults.getFormatVersion());
    assertEquals("1.0.0", nullDefaults.getMinCompatibleAppVersion());
    assertEquals("race_package", nullDefaults.getPackageType());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RacePackageManifest manifest =
        new RacePackageManifest(
            1,
            "1.1.0",
            "1.0.0",
            "race_package",
            "r-99",
            "Endurance Cup",
            1710000000000L,
            1710010000000L,
            24,
            16,
            "fprint99");

    String json = mapper.writeValueAsString(manifest);
    RacePackageManifest deserialized = mapper.readValue(json, RacePackageManifest.class);

    assertNotNull(deserialized);
    assertEquals(1, deserialized.getFormatVersion());
    assertEquals("1.1.0", deserialized.getCreatedByAppVersion());
    assertEquals("r-99", deserialized.getRaceId());
    assertEquals("Endurance Cup", deserialized.getRaceName());
    assertEquals(Long.valueOf(1710000000000L), deserialized.getStartTime());
    assertEquals(Long.valueOf(1710010000000L), deserialized.getEndTime());
    assertEquals(24, deserialized.getHeatCount());
    assertEquals(16, deserialized.getDriverCount());
    assertEquals("fprint99", deserialized.getFingerprint());
  }
}
