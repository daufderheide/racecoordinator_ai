package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class RacePackagePreviewTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    RacePackagePreview preview = new RacePackagePreview();
    assertNull(preview.getManifest());
    assertFalse(preview.isDuplicateRace());
    assertNull(preview.getExistingRaceId());
    assertNull(preview.getExistingRaceName());
    assertFalse(preview.isConfigConflict());
    assertNull(preview.getExistingConfigName());
    assertNull(preview.getSuggestedConfigName());
    assertNotNull(preview.getDriverMappings());
    assertEquals(0, preview.getDriverMappings().size());
    assertNull(preview.getTempPackageToken());

    RacePackageManifest manifest = new RacePackageManifest();
    manifest.setRaceName("Sample Race");

    preview.setManifest(manifest);
    preview.setDuplicateRace(true);
    preview.setExistingRaceId("r-1");
    preview.setExistingRaceName("Sample Race Old");
    preview.setConfigConflict(true);
    preview.setExistingConfigName("Existing Config");
    preview.setSuggestedConfigName("Config (Copy)");
    preview.setTempPackageToken("tok-preview");

    List<DriverImportMapping> mappings = new ArrayList<>();
    mappings.add(
        new DriverImportMapping(
            "s-1", "Driver One", "D1", "l-1", "Driver One", "EXACT_NAME", "LINK"));
    preview.setDriverMappings(mappings);

    assertEquals("Sample Race", preview.getManifest().getRaceName());
    assertTrue(preview.isDuplicateRace());
    assertEquals("r-1", preview.getExistingRaceId());
    assertEquals("Sample Race Old", preview.getExistingRaceName());
    assertTrue(preview.isConfigConflict());
    assertEquals("Existing Config", preview.getExistingConfigName());
    assertEquals("Config (Copy)", preview.getSuggestedConfigName());
    assertEquals("tok-preview", preview.getTempPackageToken());
    assertEquals(1, preview.getDriverMappings().size());

    preview.setDriverMappings(null);
    assertNotNull(preview.getDriverMappings());
    assertEquals(0, preview.getDriverMappings().size());

    RacePackagePreview sixArg =
        new RacePackagePreview(manifest, true, "r-2", "Race Two", mappings, "tok-2");
    assertTrue(sixArg.isDuplicateRace());
    assertEquals("r-2", sixArg.getExistingRaceId());
    assertFalse(sixArg.isConfigConflict());
    assertEquals(1, sixArg.getDriverMappings().size());

    RacePackagePreview nineArg =
        new RacePackagePreview(
            manifest, true, "r-3", "Race Three", true, "Cfg", "Cfg (Copy)", mappings, "tok-3");
    assertTrue(nineArg.isDuplicateRace());
    assertTrue(nineArg.isConfigConflict());
    assertEquals("Cfg", nineArg.getExistingConfigName());
    assertEquals("Cfg (Copy)", nineArg.getSuggestedConfigName());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    RacePackageManifest manifest = new RacePackageManifest();
    manifest.setRaceId("r-10");
    manifest.setRaceName("Test Grand Prix");

    List<DriverImportMapping> mappings = new ArrayList<>();
    mappings.add(
        new DriverImportMapping("s-1", "Alice", "A1", "l-1", "Alice", "EXACT_NAME", "LINK"));

    RacePackagePreview preview =
        new RacePackagePreview(
            manifest,
            true,
            "r-10",
            "Test Grand Prix",
            true,
            "Test Grand Prix",
            "Test Grand Prix (Copy)",
            mappings,
            "token-xyz");

    String json = mapper.writeValueAsString(preview);
    RacePackagePreview deserialized = mapper.readValue(json, RacePackagePreview.class);

    assertNotNull(deserialized);
    assertEquals("r-10", deserialized.getManifest().getRaceId());
    assertTrue(deserialized.isDuplicateRace());
    assertEquals("r-10", deserialized.getExistingRaceId());
    assertEquals("Test Grand Prix", deserialized.getExistingRaceName());
    assertTrue(deserialized.isConfigConflict());
    assertEquals("Test Grand Prix", deserialized.getExistingConfigName());
    assertEquals("Test Grand Prix (Copy)", deserialized.getSuggestedConfigName());
    assertEquals(1, deserialized.getDriverMappings().size());
    assertEquals("token-xyz", deserialized.getTempPackageToken());
  }
}
