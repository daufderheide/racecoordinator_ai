package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import org.junit.Test;

public class CarImportResultTest {

  @Test
  public void testNullListsBecomeEmpty() {
    CarImportResult r = new CarImportResult();
    r.setCreatedCarIds(null);
    r.setUpdatedCarIds(null);
    r.setCreatedFieldNames(null);
    r.setMessages(null);
    assertTrue(r.getCreatedCarIds().isEmpty());
    assertTrue(r.getUpdatedCarIds().isEmpty());
    assertTrue(r.getCreatedFieldNames().isEmpty());
    assertTrue(r.getMessages().isEmpty());
  }

  @Test
  public void testJsonRoundTrip() throws Exception {
    CarImportResult r = new CarImportResult();
    r.setSuccess(true);
    r.setImportedCount(2);
    r.setUpdatedCount(1);
    r.setSkippedCount(3);
    r.setCreatedCarIds(Collections.singletonList("9"));
    r.setUpdatedCarIds(Collections.singletonList("7"));
    r.setCreatedFieldNames(Collections.singletonList("Club"));
    r.setMessages(Collections.singletonList("ok"));
    ObjectMapper mapper = new ObjectMapper();
    CarImportResult back = mapper.readValue(mapper.writeValueAsString(r), CarImportResult.class);
    assertTrue(back.isSuccess());
    assertEquals(2, back.getImportedCount());
    assertEquals(1, back.getUpdatedCount());
    assertEquals(3, back.getSkippedCount());
    assertEquals("9", back.getCreatedCarIds().get(0));
    assertEquals("7", back.getUpdatedCarIds().get(0));
    assertEquals("Club", back.getCreatedFieldNames().get(0));
    assertEquals("ok", back.getMessages().get(0));
  }
}
