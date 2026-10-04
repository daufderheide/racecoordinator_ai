package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class DriverImportCommitRequestTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverImportCommitRequest req = new DriverImportCommitRequest();
    assertNotNull(req.getRows());
    assertEquals(0, req.getRows().size());

    List<DriverImportRow> rows = new ArrayList<>();
    DriverImportRow row = new DriverImportRow();
    row.setResolvedName("Alice");
    rows.add(row);

    req.setRows(rows);
    assertEquals(1, req.getRows().size());
    assertEquals("Alice", req.getRows().get(0).getResolvedName());

    req.setRows(null);
    assertNotNull(req.getRows());
    assertEquals(0, req.getRows().size());

    DriverImportCommitRequest parameterized = new DriverImportCommitRequest(rows);
    assertEquals(1, parameterized.getRows().size());

    DriverImportCommitRequest nullConstructor = new DriverImportCommitRequest(null);
    assertNotNull(nullConstructor.getRows());
    assertEquals(0, nullConstructor.getRows().size());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    List<DriverImportRow> rows = new ArrayList<>();
    DriverImportRow row = new DriverImportRow();
    row.setResolvedName("Bob");
    rows.add(row);

    DriverImportCommitRequest req = new DriverImportCommitRequest(rows);
    String json = mapper.writeValueAsString(req);
    DriverImportCommitRequest deserialized =
        mapper.readValue(json, DriverImportCommitRequest.class);

    assertNotNull(deserialized);
    assertEquals(1, deserialized.getRows().size());
    assertEquals("Bob", deserialized.getRows().get(0).getResolvedName());
  }
}
