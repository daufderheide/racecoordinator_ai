package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class CarImportPreviewTest {

  @Test
  public void testNullListsBecomeEmpty() {
    CarImportPreview p = new CarImportPreview();
    p.setRows(null);
    p.setImportedAssetNames(null);
    p.setExistingCars(null);
    p.setNewFields(null);
    p.setNewOptions(null);
    assertTrue(p.getRows().isEmpty());
    assertTrue(p.getImportedAssetNames().isEmpty());
    assertTrue(p.getExistingCars().isEmpty());
    assertTrue(p.getNewFields().isEmpty());
    assertTrue(p.getNewOptions().isEmpty());
    CarImportPreview.FieldChange f = new CarImportPreview.FieldChange("A", "text", null);
    assertTrue(f.getOptions().isEmpty());
    f.setOptions(null);
    assertTrue(f.getOptions().isEmpty());
  }

  @Test
  public void testJsonRoundTrip() throws Exception {
    CarImportPreview p = new CarImportPreview();
    p.setRows(Collections.singletonList(new CarImportRow()));
    p.setTotalRows(1);
    p.setValidCount(1);
    p.setConflictCount(2);
    p.setErrorCount(3);
    p.setImportedAssetNames(Collections.singletonList("a.png"));
    p.setExistingCars(Collections.singletonList(new CarImportPreview.ExistingCar("7", "Audi")));
    p.setNewFields(
        Collections.singletonList(
            new CarImportPreview.FieldChange(
                "Compound", "choice", Collections.singletonList("Soft"))));
    p.setNewOptions(
        Collections.singletonList(new CarImportPreview.FieldChange("X", "choice", null)));

    ObjectMapper mapper = new ObjectMapper();
    CarImportPreview back = mapper.readValue(mapper.writeValueAsString(p), CarImportPreview.class);
    assertEquals(1, back.getRows().size());
    assertEquals(1, back.getTotalRows());
    assertEquals(1, back.getValidCount());
    assertEquals(2, back.getConflictCount());
    assertEquals(3, back.getErrorCount());
    assertEquals("a.png", back.getImportedAssetNames().get(0));
    assertEquals("7", back.getExistingCars().get(0).getEntityId());
    assertEquals("Audi", back.getExistingCars().get(0).getName());
    assertEquals("choice", back.getNewFields().get(0).getType());
    assertEquals("Soft", back.getNewFields().get(0).getOptions().get(0));
    assertEquals("X", back.getNewOptions().get(0).getName());
  }
}
