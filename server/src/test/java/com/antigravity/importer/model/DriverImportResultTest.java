package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import org.junit.Test;

public class DriverImportResultTest {

  @Test
  public void testConstructorsAndGettersSetters() {
    DriverImportResult res = new DriverImportResult();
    assertFalse(res.isSuccess());
    assertEquals(0, res.getImportedCount());
    assertEquals(0, res.getUpdatedCount());
    assertEquals(0, res.getSkippedCount());
    assertNotNull(res.getCreatedDriverIds());
    assertNotNull(res.getUpdatedDriverIds());
    assertNotNull(res.getMessages());

    res.setSuccess(true);
    res.setImportedCount(5);
    res.setUpdatedCount(2);
    res.setSkippedCount(1);
    res.setCreatedDriverIds(Arrays.asList("d1", "d2"));
    res.setUpdatedDriverIds(Arrays.asList("u1"));
    res.setMessages(Arrays.asList("Import complete"));

    assertTrue(res.isSuccess());
    assertEquals(5, res.getImportedCount());
    assertEquals(2, res.getUpdatedCount());
    assertEquals(1, res.getSkippedCount());
    assertEquals(2, res.getCreatedDriverIds().size());
    assertEquals(1, res.getUpdatedDriverIds().size());
    assertEquals(1, res.getMessages().size());

    res.setCreatedDriverIds(null);
    assertNotNull(res.getCreatedDriverIds());
    res.setUpdatedDriverIds(null);
    assertNotNull(res.getUpdatedDriverIds());
    res.setMessages(null);
    assertNotNull(res.getMessages());

    DriverImportResult parameterized =
        new DriverImportResult(true, 3, 1, 0, Arrays.asList("id-1"), Arrays.asList("Success"));
    assertTrue(parameterized.isSuccess());
    assertEquals(3, parameterized.getImportedCount());
    assertEquals(1, parameterized.getUpdatedCount());
    assertEquals(0, parameterized.getSkippedCount());
    assertEquals(1, parameterized.getCreatedDriverIds().size());
    assertNotNull(parameterized.getUpdatedDriverIds());
    assertEquals("Success", parameterized.getMessages().get(0));

    DriverImportResult withUpdated =
        new DriverImportResult(
            true, 3, 1, 0, Arrays.asList("id-1"), Arrays.asList("up-1"), Arrays.asList("Success"));
    assertTrue(withUpdated.isSuccess());
    assertEquals(1, withUpdated.getUpdatedDriverIds().size());
    assertEquals("up-1", withUpdated.getUpdatedDriverIds().get(0));

    DriverImportResult nullParam = new DriverImportResult(false, 0, 0, 0, null, null, null);
    assertNotNull(nullParam.getCreatedDriverIds());
    assertNotNull(nullParam.getUpdatedDriverIds());
    assertNotNull(nullParam.getMessages());
  }

  @Test
  public void testJsonSerialization() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    DriverImportResult res =
        new DriverImportResult(
            true,
            2,
            1,
            0,
            Arrays.asList("driver-1", "driver-2"),
            Arrays.asList("driver-updated"),
            Arrays.asList("OK"));
    String json = mapper.writeValueAsString(res);
    DriverImportResult deserialized = mapper.readValue(json, DriverImportResult.class);

    assertNotNull(deserialized);
    assertTrue(deserialized.isSuccess());
    assertEquals(2, deserialized.getImportedCount());
    assertEquals(1, deserialized.getUpdatedCount());
    assertEquals(2, deserialized.getCreatedDriverIds().size());
    assertEquals(1, deserialized.getUpdatedDriverIds().size());
    assertEquals("driver-updated", deserialized.getUpdatedDriverIds().get(0));
    assertEquals("OK", deserialized.getMessages().get(0));
  }
}
