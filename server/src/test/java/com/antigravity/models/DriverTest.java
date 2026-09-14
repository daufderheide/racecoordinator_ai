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
            .build();

    assertEquals("custom_race_leader", driver.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", driver.getNewHeatLeaderAudio().getUrl());
    assertEquals("custom_pit_in", driver.getPitInAudio().getUrl());
    assertEquals("custom_fuel_set", driver.getFuelAudio().getUrl());

    Driver copy = Driver.Builder.from(driver).build();
    assertEquals("custom_race_leader", copy.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", copy.getNewHeatLeaderAudio().getUrl());
    assertEquals("custom_pit_in", copy.getPitInAudio().getUrl());
    assertEquals("custom_fuel_set", copy.getFuelAudio().getUrl());
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
}
