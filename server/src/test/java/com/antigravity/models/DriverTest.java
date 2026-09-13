package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
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
            .build();

    assertEquals("custom_race_leader", driver.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", driver.getNewHeatLeaderAudio().getUrl());

    Driver copy = Driver.Builder.from(driver).build();
    assertEquals("custom_race_leader", copy.getNewRaceLeaderAudio().getUrl());
    assertEquals("custom_heat_leader", copy.getNewHeatLeaderAudio().getUrl());
  }
}
