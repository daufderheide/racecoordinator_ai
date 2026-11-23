package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class DriverImportMappingTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverImportMapping mapping = new DriverImportMapping();
    assertNull(mapping.getSourceDriverId());
    assertNull(mapping.getSourceDriverName());
    assertNull(mapping.getSourceDriverNickname());
    assertNull(mapping.getMatchedLocalDriverId());
    assertNull(mapping.getMatchedLocalDriverName());
    assertNull(mapping.getMatchType());
    assertNull(mapping.getSuggestedAction());

    mapping.setSourceDriverId("src-1");
    mapping.setSourceDriverName("Lewis Hamilton");
    mapping.setSourceDriverNickname("LH44");
    mapping.setMatchedLocalDriverId("local-1");
    mapping.setMatchedLocalDriverName("Lewis Hamilton");
    mapping.setMatchType("EXACT_NAME");
    mapping.setSuggestedAction("LINK");

    assertEquals("src-1", mapping.getSourceDriverId());
    assertEquals("Lewis Hamilton", mapping.getSourceDriverName());
    assertEquals("LH44", mapping.getSourceDriverNickname());
    assertEquals("local-1", mapping.getMatchedLocalDriverId());
    assertEquals("Lewis Hamilton", mapping.getMatchedLocalDriverName());
    assertEquals("EXACT_NAME", mapping.getMatchType());
    assertEquals("LINK", mapping.getSuggestedAction());

    DriverImportMapping parameterized =
        new DriverImportMapping(
            "src-2", "Max Verstappen", "MV33", "local-2", "Max Verstappen", "EXACT_NAME", "LINK");
    assertEquals("src-2", parameterized.getSourceDriverId());
    assertEquals("Max Verstappen", parameterized.getSourceDriverName());
    assertEquals("MV33", parameterized.getSourceDriverNickname());
    assertEquals("local-2", parameterized.getMatchedLocalDriverId());
    assertEquals("Max Verstappen", parameterized.getMatchedLocalDriverName());
    assertEquals("EXACT_NAME", parameterized.getMatchType());
    assertEquals("LINK", parameterized.getSuggestedAction());

    DriverImportMapping nullDefaults =
        new DriverImportMapping("src-3", "Lando Norris", "LN4", null, null, null, null);
    assertEquals("NONE", nullDefaults.getMatchType());
    assertEquals("CREATE_NEW", nullDefaults.getSuggestedAction());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DriverImportMapping mapping =
        new DriverImportMapping(
            "src-10", "Charles Leclerc", "CL16", "loc-10", "Charles Leclerc", "EXACT_NAME", "LINK");

    String json = mapper.writeValueAsString(mapping);
    DriverImportMapping deserialized = mapper.readValue(json, DriverImportMapping.class);

    assertNotNull(deserialized);
    assertEquals("src-10", deserialized.getSourceDriverId());
    assertEquals("Charles Leclerc", deserialized.getSourceDriverName());
    assertEquals("CL16", deserialized.getSourceDriverNickname());
    assertEquals("loc-10", deserialized.getMatchedLocalDriverId());
    assertEquals("Charles Leclerc", deserialized.getMatchedLocalDriverName());
    assertEquals("EXACT_NAME", deserialized.getMatchType());
    assertEquals("LINK", deserialized.getSuggestedAction());
  }
}
