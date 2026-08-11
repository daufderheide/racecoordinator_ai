package com.antigravity.util;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.junit.Test;

public class RobustBooleanDeserializerTest {

  private static class Dummy {
    @JsonDeserialize(using = RobustBooleanDeserializer.class)
    public Boolean flag;
  }

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testBooleanTrue() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": true}", Dummy.class);
    assertTrue(dummy.flag);
  }

  @Test
  public void testBooleanFalse() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": false}", Dummy.class);
    assertFalse(dummy.flag);
  }

  @Test
  public void testStringTrue() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": \"true\"}", Dummy.class);
    assertTrue(dummy.flag);
  }

  @Test
  public void testStringFalse() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": \"false\"}", Dummy.class);
    assertFalse(dummy.flag);
  }

  @Test
  public void testIntOne() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": 1}", Dummy.class);
    assertTrue(dummy.flag);
  }

  @Test
  public void testIntZero() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": 0}", Dummy.class);
    assertFalse(dummy.flag);
  }

  @Test
  public void testNull() throws Exception {
    Dummy dummy = mapper.readValue("{\"flag\": null}", Dummy.class);
    assertNull(dummy.flag);
  }
}
