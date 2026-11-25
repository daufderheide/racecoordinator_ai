package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class CarImportCommitRequestTest {

  @Test
  public void testNullListsBecomeEmpty() {
    CarImportCommitRequest r = new CarImportCommitRequest();
    r.setRows(null);
    r.setNewFields(null);
    assertTrue(r.getRows().isEmpty());
    assertTrue(r.getNewFields().isEmpty());
  }

  @Test
  public void testReadsWhatTheClientSends() throws Exception {
    String json =
        "{\"rows\":[{\"resolvedName\":\"Mini\",\"selectedResolution\":\"SKIP\"}],"
            + "\"newFields\":[{\"name\":\"Club\",\"type\":\"text\",\"options\":[]}]}";
    CarImportCommitRequest r = new ObjectMapper().readValue(json, CarImportCommitRequest.class);
    assertEquals("Mini", r.getRows().get(0).getResolvedName());
    assertEquals("Club", r.getNewFields().get(0).getName());
    r.setRows(Collections.emptyList());
    assertTrue(r.getRows().isEmpty());
  }
}
