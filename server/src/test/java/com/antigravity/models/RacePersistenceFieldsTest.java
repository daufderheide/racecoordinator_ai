package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.bson.types.ObjectId;
import org.junit.Test;

public class RacePersistenceFieldsTest {

  @Test
  public void testRaceBuilderWithGroupOptions() {
    GroupOptions groupOptions = new GroupOptions(true, 4, true, false, true, false, 2);

    Race race = new Race.Builder().withName("Test Race").withGroupOptions(groupOptions).build();

    assertNotNull(race.getGroupOptions());
    assertTrue(race.getGroupOptions().isEnabled());
    assertEquals(4, race.getGroupOptions().getMaxGroups());
    assertTrue(race.getGroupOptions().isBalance());
    assertFalse(race.getGroupOptions().isAllowEmptyLanes());
    assertTrue(race.getGroupOptions().isForceMultipleOfMax());
    assertFalse(race.getGroupOptions().isRotateGroupHeats());
    assertEquals(2, race.getGroupOptions().getMinAdvancing());
  }

  @Test
  public void testRaceCloneWithGroupOptions() {
    GroupOptions groupOptions = new GroupOptions(true, 3, false, true, false, true, 1);
    Race original = new Race.Builder().withName("Original").withGroupOptions(groupOptions).build();

    Race cloned = new Race.Builder().from(original).build();

    assertNotNull(cloned.getGroupOptions());
    assertTrue(cloned.getGroupOptions().isEnabled());
    assertEquals(3, cloned.getGroupOptions().getMaxGroups());
    assertEquals(1, cloned.getGroupOptions().getMinAdvancing());
    assertTrue(cloned.getGroupOptions().isRotateGroupHeats());
  }

  @Test
  public void testRaceConstructorWithNulls() {
    Race race =
        new Race(
            "Race",
            "track1",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            false,
            "race1",
            new ObjectId());

    assertNotNull(race.getGroupOptions());
    assertFalse(race.getGroupOptions().isEnabled());
    assertEquals(1, race.getGroupOptions().getMaxGroups());
    assertEquals(0, race.getGroupOptions().getMinAdvancing());
  }
}
