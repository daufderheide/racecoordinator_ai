package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class DriverTest {

  @Test
  public void testEmptyDriverConstant() {
    assertTrue(Driver.EMPTY_DRIVER.isEmpty());
    assertEquals(Driver.EMPTY_DRIVER_ID, Driver.EMPTY_DRIVER.getEntityId());
    assertTrue(Driver.isEmptyId(Driver.EMPTY_DRIVER_ID));
  }

  @Test
  public void testIsEmptyWithNullOrEmptyId() {
    assertTrue(Driver.isEmpty((Driver) null));
    assertTrue(Driver.isEmptyId(null));
    assertTrue(Driver.isEmptyId(""));
    assertTrue(Driver.isEmptyId("EMPTY_LANE"));
  }

  @Test
  public void testValidDriverIsNotEmpty() {
    Driver driver = new Driver("Alice", "The Rocket", "d_alice_123", null);
    assertFalse(driver.isEmpty());
    assertFalse(Driver.isEmpty(driver));
    assertFalse(Driver.isEmptyId(driver.getEntityId()));
    assertEquals("d_alice_123", driver.getEntityId());
  }

  @Test
  public void testDriverNameOnlyIsNotEmpty() {
    Driver driver = new Driver("Bob");
    assertFalse(driver.isEmpty());
  }

  @Test
  public void testAudioDefaultsAndBuilder() {
    Driver driver =
        new Driver.Builder()
            .withName("Charlie")
            .withNewRaceLeaderAudio(new AudioConfig("preset", "custom_race_leader", ""))
            .withNewHeatLeaderAudio(new AudioConfig("preset", "custom_heat_leader", ""))
            .withPitInAudio(new AudioConfig("preset", "custom_pit_in", ""))
            .withFuelAudio(new AudioConfig("audio_set", "custom_fuel_set", ""))
            .withDriftLapAudio(new AudioConfig("tts", null, "Custom drift"))
            .build();

    assertEquals("custom_race_leader", driver.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", driver.getNewHeatLeaderAudio().getUrl());
    assertEquals("custom_pit_in", driver.getPitInAudio().getUrl());
    assertEquals("custom_fuel_set", driver.getFuelAudio().getUrl());
    assertEquals("Custom drift", driver.getDriftLapAudio().getText());

    Driver copy = Driver.Builder.from(driver).build();
    assertEquals("custom_race_leader", copy.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", copy.getNewHeatLeaderAudio().getUrl());
    assertEquals("custom_pit_in", copy.getPitInAudio().getUrl());
    assertEquals("custom_fuel_set", copy.getFuelAudio().getUrl());
    assertEquals("Custom drift", copy.getDriftLapAudio().getText());
  }

  @Test
  public void testDriftLapAudioDefault() {
    Driver driver = new Driver.Builder().withName("Default Drift").build();
    assertNotNull(driver.getDriftLapAudio());
    assertEquals("tts", driver.getDriftLapAudio().getType());
    assertEquals("Drift lap for {driver.nickname}", driver.getDriftLapAudio().getText());
  }

  @Test
  public void testCoerceFuelAudioPresetToAudioSet() {
    Driver driver =
        new Driver.Builder()
            .withId("1")
            .withEntityId("d_1")
            .withName("Driver 1")
            .withNickname("D1")
            .withFuelAudio(new AudioConfig("preset", "default_fuel_level", ""))
            .build();

    assertNotNull(driver.getFuelAudio());
    assertEquals("audio_set", driver.getFuelAudio().getType());
    assertEquals("default_fuel_level", driver.getFuelAudio().getUrl());
  }

  @Test
  public void testBlankPresetUrlsFallbackToDefaults() {
    Driver driver =
        new Driver.Builder()
            .withName("Dave")
            .withLapAudio(new AudioConfig("preset", "", ""))
            .withBestLapAudio(new AudioConfig("preset", "   ", ""))
            .withPenaltyAudio(new AudioConfig("preset", "", ""))
            .withOverallBestLapAudio(new AudioConfig("preset", "", ""))
            .withPitInAudio(new AudioConfig("preset", "  ", ""))
            .withFuelAudio(new AudioConfig("audio_set", "", ""))
            .build();

    assertEquals("default_beep", driver.getLapAudio().getUrl());
    assertEquals("default_driveby", driver.getBestLapAudio().getUrl());
    assertEquals("default_penalty", driver.getPenaltyAudio().getUrl());
    assertEquals("default_record_lap", driver.getOverallBestLapAudio().getUrl());
    assertEquals("default_pit_in", driver.getPitInAudio().getUrl());
    assertEquals("default_fuel_level", driver.getFuelAudio().getUrl());
  }

  @Test
  public void testLabelIdsAndBuilder() {
    java.util.List<String> labels = java.util.Arrays.asList("label-1", "label-2");
    Driver driver = new Driver.Builder().withName("Dave").withLabelIds(labels).build();

    assertEquals(2, driver.getLabelIds().size());
    assertTrue(driver.getLabelIds().contains("label-1"));
    assertTrue(driver.getLabelIds().contains("label-2"));

    Driver copy = Driver.Builder.from(driver).build();
    assertEquals(2, copy.getLabelIds().size());
    assertTrue(copy.getLabelIds().contains("label-1"));
    assertTrue(copy.getLabelIds().contains("label-2"));
  }
}
