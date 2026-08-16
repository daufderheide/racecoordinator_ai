package com.antigravity.handlers.dto;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SavedRaceDescriptorTest {

  @Test
  public void testGettersAndSetters() {
    SavedRaceDescriptor desc = new SavedRaceDescriptor("my_race.json", false);
    assertEquals("my_race.json", desc.getFilename());
    assertEquals(false, desc.isCorrupt());

    desc.setFilename("corrupt_race.json");
    desc.setCorrupt(true);

    assertEquals("corrupt_race.json", desc.getFilename());
    assertTrue(desc.isCorrupt());
  }
}
