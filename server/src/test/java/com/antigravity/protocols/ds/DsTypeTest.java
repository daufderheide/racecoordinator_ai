package com.antigravity.protocols.ds;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class DsTypeTest {

  @Test
  public void testBaudRates() {
    assertEquals(4800, DsType.DS_030.getBaudRate());
    assertEquals(4800, DsType.DS_200.getBaudRate());
    assertEquals(57600, DsType.DS_200B.getBaudRate());
    assertEquals(57600, DsType.DS_300.getBaudRate());
    assertEquals(57600, DsType.DS_300RC.getBaudRate());
  }

  @Test
  public void testDisplayNames() {
    assertEquals("DS-030", DsType.DS_030.getDisplayName());
    assertEquals("DS-200", DsType.DS_200.getDisplayName());
    assertEquals("DS-200b", DsType.DS_200B.getDisplayName());
    assertEquals("DS-300", DsType.DS_300.getDisplayName());
    assertEquals("DS-300 RC", DsType.DS_300RC.getDisplayName());
  }

  @Test
  public void testIsDs200() {
    assertFalse(DsType.DS_030.isDs200());
    assertTrue(DsType.DS_200.isDs200());
    assertTrue(DsType.DS_200B.isDs200());
    assertFalse(DsType.DS_300.isDs200());
    assertFalse(DsType.DS_300RC.isDs200());
  }

  @Test
  public void testIsDs030() {
    assertTrue(DsType.DS_030.isDs030());
    assertFalse(DsType.DS_200.isDs030());
    assertFalse(DsType.DS_200B.isDs030());
    assertFalse(DsType.DS_300.isDs030());
    assertFalse(DsType.DS_300RC.isDs030());
  }

  @Test
  public void testJsonValueAndCreator() {
    assertEquals("DS_300", DsType.DS_300.toValue());
    assertEquals(DsType.DS_030, DsType.fromValue("DS_030"));
    assertEquals(DsType.DS_030, DsType.fromValue("DS-030"));
    assertEquals(DsType.DS_200, DsType.fromValue("ds-200"));
    assertEquals(DsType.DS_200B, DsType.fromValue("DS-200b"));
    assertEquals(DsType.DS_300RC, DsType.fromValue("DS-300 RC"));
    assertEquals(DsType.DS_030, DsType.fromValue(0));
    assertEquals(DsType.DS_200, DsType.fromValue(1));
    assertEquals(DsType.DS_200B, DsType.fromValue(2));
    assertEquals(DsType.DS_300, DsType.fromValue(3));
    assertEquals(DsType.DS_300RC, DsType.fromValue(4));
    assertEquals(DsType.DS_030, DsType.fromValue("0"));
    assertEquals(DsType.DS_300, DsType.fromValue(999));
    assertEquals(DsType.DS_300, DsType.fromValue("999"));
    assertEquals(DsType.DS_300, DsType.fromValue(null));
    assertEquals(DsType.DS_300, DsType.fromValue("UNKNOWN_VALUE"));
  }
}
