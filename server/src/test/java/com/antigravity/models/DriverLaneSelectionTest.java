package com.antigravity.models;

import static org.junit.Assert.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class DriverLaneSelectionTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testEnumValues() {
    assertEquals(4, DriverLaneSelection.values().length);
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.valueOf("NONE"));
    assertEquals(DriverLaneSelection.RACE_START, DriverLaneSelection.valueOf("RACE_START"));
    assertEquals(DriverLaneSelection.HEAT_START, DriverLaneSelection.valueOf("HEAT_START"));
    assertEquals(DriverLaneSelection.STEP_START, DriverLaneSelection.valueOf("STEP_START"));
  }

  @Test
  public void testFromStringCaseInsensitive() {
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.fromString(null));
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.fromString(""));
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.fromString("none"));
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.fromString("NONE"));
    assertEquals(DriverLaneSelection.RACE_START, DriverLaneSelection.fromString("race_start"));
    assertEquals(DriverLaneSelection.RACE_START, DriverLaneSelection.fromString("RACE_START"));
    assertEquals(DriverLaneSelection.HEAT_START, DriverLaneSelection.fromString("heat_start"));
    assertEquals(DriverLaneSelection.HEAT_START, DriverLaneSelection.fromString("HEAT_START"));
    assertEquals(DriverLaneSelection.STEP_START, DriverLaneSelection.fromString("step_start"));
    assertEquals(DriverLaneSelection.STEP_START, DriverLaneSelection.fromString("STEP_START"));
    assertEquals(DriverLaneSelection.NONE, DriverLaneSelection.fromString("invalid_value"));
  }

  @Test
  public void testFromJson() throws Exception {
    assertEquals(DriverLaneSelection.NONE, mapper.readValue("\"NONE\"", DriverLaneSelection.class));
    assertEquals(
        DriverLaneSelection.RACE_START,
        mapper.readValue("\"race_start\"", DriverLaneSelection.class));
    assertEquals(
        DriverLaneSelection.HEAT_START,
        mapper.readValue("\"HEAT_START\"", DriverLaneSelection.class));
    assertEquals(
        DriverLaneSelection.STEP_START,
        mapper.readValue("\"step_start\"", DriverLaneSelection.class));
    assertEquals(DriverLaneSelection.NONE, mapper.readValue("0", DriverLaneSelection.class));
    assertEquals(DriverLaneSelection.RACE_START, mapper.readValue("1", DriverLaneSelection.class));
    assertEquals(DriverLaneSelection.HEAT_START, mapper.readValue("2", DriverLaneSelection.class));
    assertEquals(DriverLaneSelection.STEP_START, mapper.readValue("3", DriverLaneSelection.class));
    assertEquals(DriverLaneSelection.NONE, mapper.readValue("99", DriverLaneSelection.class));
  }
}
