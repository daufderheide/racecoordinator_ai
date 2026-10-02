package com.antigravity.importer.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class ExistingDriverSummaryTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  public void testDefaultConstructorAndGettersSetters() {
    ExistingDriverSummary summary = new ExistingDriverSummary();
    assertNull(summary.getEntityId());
    assertNull(summary.getName());
    assertNull(summary.getNickname());

    summary.setEntityId("d1");
    summary.setName("Bob Smith");
    summary.setNickname("Bob");

    assertEquals("d1", summary.getEntityId());
    assertEquals("Bob Smith", summary.getName());
    assertEquals("Bob", summary.getNickname());
  }

  @Test
  public void testParameterizedConstructor() {
    ExistingDriverSummary summary = new ExistingDriverSummary("d2", "Alice Jones", "Alice");
    assertEquals("d2", summary.getEntityId());
    assertEquals("Alice Jones", summary.getName());
    assertEquals("Alice", summary.getNickname());
  }

  @Test
  public void testEqualsAndHashCode() {
    ExistingDriverSummary s1 = new ExistingDriverSummary("d1", "Bob Smith", "Bob");
    ExistingDriverSummary s2 = new ExistingDriverSummary("d1", "Bob Smith", "Bob");
    ExistingDriverSummary s3 = new ExistingDriverSummary("d2", "Bob Smith", "Bob");
    ExistingDriverSummary s4 = new ExistingDriverSummary("d1", "Other", "Bob");
    ExistingDriverSummary s5 = new ExistingDriverSummary("d1", "Bob Smith", "Other");

    assertTrue(s1.equals(s1));
    assertTrue(s1.equals(s2));
    assertEquals(s1.hashCode(), s2.hashCode());

    assertFalse(s1.equals(null));
    assertFalse(s1.equals("Not a summary"));

    assertFalse(s1.equals(s3));
    assertFalse(s1.equals(s4));
    assertFalse(s1.equals(s5));
    assertNotEquals(s1.hashCode(), s3.hashCode());
  }

  @Test
  public void testJsonSerializationAndDeserialization() throws Exception {
    ExistingDriverSummary original = new ExistingDriverSummary("d1", "Bob Smith", "Bob");
    String json = objectMapper.writeValueAsString(original);
    assertNotNull(json);

    ExistingDriverSummary deserialized = objectMapper.readValue(json, ExistingDriverSummary.class);
    assertEquals(original, deserialized);
    assertEquals("d1", deserialized.getEntityId());
    assertEquals("Bob Smith", deserialized.getName());
    assertEquals("Bob", deserialized.getNickname());
  }
}
