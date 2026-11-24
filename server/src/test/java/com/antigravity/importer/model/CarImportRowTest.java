package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class CarImportRowTest {

  @Test
  public void testDefaultsAndNullSafety() {
    CarImportRow row = new CarImportRow();
    assertEquals(CarImportRow.STATUS_VALID, row.getStatus());
    assertEquals(CarImportRow.CONFLICT_NONE, row.getConflictType());
    row.setRawName(null);
    row.setResolvedName(null);
    row.setValues(null);
    row.setCustomValues(null);
    assertEquals("", row.getRawName());
    assertEquals("", row.getResolvedName());
    assertTrue(row.getValues().isEmpty());
    assertTrue(row.getCustomValues().isEmpty());
    assertNull(row.getSelectedResolution());
  }

  @Test
  public void testJsonRoundTrip() throws Exception {
    CarImportRow row = new CarImportRow();
    row.setRowIndex(3);
    row.setRawName("Audi");
    row.setResolvedName("Audi (2)");
    row.setValues(Collections.singletonMap("brand", "Scalextric"));
    row.setCustomValues(Collections.singletonMap("Weight", "80"));
    row.setStatus(CarImportRow.STATUS_CONFLICT);
    row.setConflictType(CarImportRow.CONFLICT_NAME);
    row.setMessage("m");
    row.setSelectedResolution(CarImportRow.RESOLUTION_AUTO_RENAME);
    row.setExistingCarId("7");

    ObjectMapper mapper = new ObjectMapper();
    CarImportRow back = mapper.readValue(mapper.writeValueAsString(row), CarImportRow.class);
    assertEquals(3, back.getRowIndex());
    assertEquals("Audi", back.getRawName());
    assertEquals("Audi (2)", back.getResolvedName());
    assertEquals("Scalextric", back.getValues().get("brand"));
    assertEquals("80", back.getCustomValues().get("Weight"));
    assertEquals(CarImportRow.CONFLICT_NAME, back.getConflictType());
    assertEquals("m", back.getMessage());
    assertEquals(CarImportRow.RESOLUTION_AUTO_RENAME, back.getSelectedResolution());
    assertEquals("7", back.getExistingCarId());
  }
}
