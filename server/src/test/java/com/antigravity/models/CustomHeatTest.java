package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class CustomHeatTest {

  @Test
  public void testConstructorsAndGetters() {
    CustomHeat heat1 = new CustomHeat();
    assertNotNull(heat1.getDriverIndices());
    assertEquals(0, heat1.getGroup());

    CustomHeat heat2 = new CustomHeat(Arrays.asList(0, 1, 2));
    assertEquals(3, heat2.getDriverIndices().size());
    assertEquals(0, heat2.getGroup());

    CustomHeat heat3 = new CustomHeat(Arrays.asList(3, 4), 2);
    assertEquals(2, heat3.getDriverIndices().size());
    assertEquals(2, heat3.getGroup());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CustomHeat heat = new CustomHeat(Arrays.asList(1, 2, 3), 1);

    String json = mapper.writeValueAsString(heat);
    CustomHeat deserialized = mapper.readValue(json, CustomHeat.class);

    assertNotNull(deserialized);
    assertEquals(3, deserialized.getDriverIndices().size());
    assertEquals(1, deserialized.getGroup());
  }
}
