package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class TeamOptionsTest {

  @Test
  public void testConstructorsAndGetters() {
    TeamOptions options = new TeamOptions(50, 60.0, 200, 300.0, true);
    assertEquals(50, options.getHeatLapLimit());
    assertEquals(60.0, options.getHeatTimeLimit(), 0.001);
    assertEquals(200, options.getOverallLapLimit());
    assertEquals(300.0, options.getOverallTimeLimit(), 0.001);
    assertTrue(options.isRequirePitStopChangeDriver());

    TeamOptions defaultOptions = new TeamOptions();
    assertEquals(0, defaultOptions.getHeatLapLimit());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    TeamOptions options = new TeamOptions(50, 60.0, 200, 300.0, true);

    String json = mapper.writeValueAsString(options);
    TeamOptions deserialized = mapper.readValue(json, TeamOptions.class);

    assertNotNull(deserialized);
    assertEquals(50, deserialized.getHeatLapLimit());
    assertTrue(deserialized.isRequirePitStopChangeDriver());
  }
}
