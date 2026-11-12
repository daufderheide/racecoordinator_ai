package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class CustomRotationTest {

  @Test
  public void testConstructorsAndGetters() {
    CustomRotation rot1 = new CustomRotation();
    assertEquals(0, rot1.getNumDrivers());
    assertEquals("", rot1.getDescription());
    assertNotNull(rot1.getHeats());

    CustomHeat heat = new CustomHeat(Arrays.asList(0, 1), 0);
    CustomRotation rot2 = new CustomRotation(4, Arrays.asList(heat));
    assertEquals(4, rot2.getNumDrivers());
    assertEquals("", rot2.getDescription());
    assertEquals(1, rot2.getHeats().size());

    CustomRotation rot3 = new CustomRotation(4, Arrays.asList(heat), "Test Rotation");
    assertEquals(4, rot3.getNumDrivers());
    assertEquals("Test Rotation", rot3.getDescription());
    assertEquals(1, rot3.getHeats().size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CustomHeat heat = new CustomHeat(Arrays.asList(0, 1), 0);
    CustomRotation rot = new CustomRotation(4, Arrays.asList(heat), "Sprint Cup 4L");

    String json = mapper.writeValueAsString(rot);
    CustomRotation deserialized = mapper.readValue(json, CustomRotation.class);

    assertNotNull(deserialized);
    assertEquals(4, deserialized.getNumDrivers());
    assertEquals("Sprint Cup 4L", deserialized.getDescription());
    assertEquals(1, deserialized.getHeats().size());
  }
}
