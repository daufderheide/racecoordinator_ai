package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class DriverImportPreviewTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverImportPreview preview = new DriverImportPreview();
    assertNotNull(preview.getRows());
    assertEquals(0, preview.getTotalRows());
    assertEquals(0, preview.getValidCount());
    assertEquals(0, preview.getConflictCount());
    assertEquals(0, preview.getErrorCount());
    assertNotNull(preview.getImportedAssetNames());
    assertEquals("system", preview.getDetectedAudioDefault());

    List<DriverImportRow> rows = new ArrayList<>();
    DriverImportRow row = new DriverImportRow();
    row.setResolvedName("John");
    rows.add(row);

    preview.setRows(rows);
    preview.setTotalRows(1);
    preview.setValidCount(1);
    preview.setConflictCount(0);
    preview.setErrorCount(0);
    preview.setImportedAssetNames(Arrays.asList("avatar.png"));
    preview.setDetectedAudioDefault("none");

    assertEquals(1, preview.getRows().size());
    assertEquals(1, preview.getTotalRows());
    assertEquals(1, preview.getValidCount());
    assertEquals(0, preview.getConflictCount());
    assertEquals(0, preview.getErrorCount());
    assertEquals(1, preview.getImportedAssetNames().size());
    assertEquals("avatar.png", preview.getImportedAssetNames().get(0));
    assertEquals("none", preview.getDetectedAudioDefault());

    preview.setRows(null);
    assertNotNull(preview.getRows());
    preview.setImportedAssetNames(null);
    assertNotNull(preview.getImportedAssetNames());

    DriverImportPreview parameterized =
        new DriverImportPreview(rows, 5, 3, 1, 1, Arrays.asList("sound.wav"), "system");
    assertEquals(1, parameterized.getRows().size());
    assertEquals(5, parameterized.getTotalRows());
    assertEquals(3, parameterized.getValidCount());
    assertEquals(1, parameterized.getConflictCount());
    assertEquals(1, parameterized.getErrorCount());
    assertEquals(1, parameterized.getImportedAssetNames().size());
    assertEquals("system", parameterized.getDetectedAudioDefault());

    DriverImportPreview nullParam = new DriverImportPreview(null, 0, 0, 0, 0, null, null);
    assertNotNull(nullParam.getRows());
    assertNotNull(nullParam.getImportedAssetNames());
    assertEquals("system", nullParam.getDetectedAudioDefault());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    List<DriverImportRow> rows = new ArrayList<>();
    DriverImportRow row = new DriverImportRow();
    row.setResolvedName("Alice");
    rows.add(row);

    DriverImportPreview preview =
        new DriverImportPreview(rows, 1, 1, 0, 0, Arrays.asList("car.png"), "none");
    String json = mapper.writeValueAsString(preview);
    DriverImportPreview deserialized = mapper.readValue(json, DriverImportPreview.class);

    assertNotNull(deserialized);
    assertEquals(1, deserialized.getTotalRows());
    assertEquals("Alice", deserialized.getRows().get(0).getResolvedName());
    assertEquals("car.png", deserialized.getImportedAssetNames().get(0));
    assertEquals("none", deserialized.getDetectedAudioDefault());
  }
}
