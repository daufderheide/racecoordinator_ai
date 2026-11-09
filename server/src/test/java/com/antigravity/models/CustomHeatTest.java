package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class CustomHeatTest {

  @Test
  public void testConstructorsAndGetters() {
    CustomHeat heat1 = new CustomHeat();
    assertNotNull(heat1.getDriverIndices());
    assertEquals(0, heat1.getGroup());
    assertFalse(heat1.isStepUpBoundary());
    assertEquals(0, heat1.getStep());

    CustomHeat heat2 = new CustomHeat(Arrays.asList(0, 1, 2));
    assertEquals(3, heat2.getDriverIndices().size());
    assertEquals(0, heat2.getGroup());
    assertFalse(heat2.isStepUpBoundary());
    assertEquals(0, heat2.getStep());

    CustomHeat heat3 = new CustomHeat(Arrays.asList(3, 4), 2);
    assertEquals(2, heat3.getDriverIndices().size());
    assertEquals(2, heat3.getGroup());
    assertFalse(heat3.isStepUpBoundary());
    assertEquals(0, heat3.getStep());

    CustomHeat heat4 = new CustomHeat(Arrays.asList(-1, 2), 1, true, 2);
    assertEquals(2, heat4.getDriverIndices().size());
    assertEquals(1, heat4.getGroup());
    assertTrue(heat4.isStepUpBoundary());
    assertEquals(2, heat4.getStep());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CustomHeat heat = new CustomHeat(Arrays.asList(1, 2, -1), 1, true, 2);

    String json = mapper.writeValueAsString(heat);
    CustomHeat deserialized = mapper.readValue(json, CustomHeat.class);

    assertNotNull(deserialized);
    assertEquals(3, deserialized.getDriverIndices().size());
    assertEquals(1, deserialized.getGroup());
    assertTrue(deserialized.isStepUpBoundary());
    assertEquals(2, deserialized.getStep());
  }
}
