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
    assertNotNull(rot1.getHeats());

    CustomHeat heat = new CustomHeat(Arrays.asList(0, 1), 0);
    CustomRotation rot2 = new CustomRotation(4, Arrays.asList(heat));
    assertEquals(4, rot2.getNumDrivers());
    assertEquals(1, rot2.getHeats().size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CustomHeat heat = new CustomHeat(Arrays.asList(0, 1), 0);
    CustomRotation rot = new CustomRotation(4, Arrays.asList(heat));

    String json = mapper.writeValueAsString(rot);
    CustomRotation deserialized = mapper.readValue(json, CustomRotation.class);

    assertNotNull(deserialized);
    assertEquals(4, deserialized.getNumDrivers());
    assertEquals(1, deserialized.getHeats().size());
  }
}
