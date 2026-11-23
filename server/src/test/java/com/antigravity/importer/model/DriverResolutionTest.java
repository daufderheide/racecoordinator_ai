package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class DriverResolutionTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverResolution resolution = new DriverResolution();
    assertNull(resolution.getSourceDriverId());
    assertNull(resolution.getAction());
    assertNull(resolution.getTargetDriverId());
    assertNull(resolution.getNewDriverName());

    resolution.setSourceDriverId("src-1");
    resolution.setAction("LINK");
    resolution.setTargetDriverId("target-1");
    resolution.setNewDriverName("Renamed Driver");

    assertEquals("src-1", resolution.getSourceDriverId());
    assertEquals("LINK", resolution.getAction());
    assertEquals("target-1", resolution.getTargetDriverId());
    assertEquals("Renamed Driver", resolution.getNewDriverName());

    DriverResolution parameterized =
        new DriverResolution("src-2", "CREATE_NEW", null, "New Driver");
    assertEquals("src-2", parameterized.getSourceDriverId());
    assertEquals("CREATE_NEW", parameterized.getAction());
    assertNull(parameterized.getTargetDriverId());
    assertEquals("New Driver", parameterized.getNewDriverName());

    DriverResolution nullAction = new DriverResolution("src-3", null, "t-3", null);
    assertEquals("LINK", nullAction.getAction());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DriverResolution resolution = new DriverResolution("src-1", "LINK", "target-1", "Local Driver");

    String json = mapper.writeValueAsString(resolution);
    DriverResolution deserialized = mapper.readValue(json, DriverResolution.class);

    assertNotNull(deserialized);
    assertEquals("src-1", deserialized.getSourceDriverId());
    assertEquals("LINK", deserialized.getAction());
    assertEquals("target-1", deserialized.getTargetDriverId());
    assertEquals("Local Driver", deserialized.getNewDriverName());
  }
}
