package com.antigravity.protocols.ds;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class DsConfigTest {

  @Test
  public void testDefaultConstructor() {
    DsConfig config = new DsConfig();
    assertEquals("DS-300", config.getName());
    assertEquals("", config.getCommPort());
    assertEquals(DsType.DS_300, config.getType());
    assertEquals(57600, config.getBaudRate());
    assertFalse(config.isDs030());
    assertFalse(config.isDs200());
  }

  @Test
  public void testParameterizedConstructorWithNulls() {
    DsConfig config = new DsConfig(null, null, null);
    assertEquals("DS-300", config.getName());
    assertEquals("", config.getCommPort());
    assertEquals(DsType.DS_300, config.getType());
  }

  @Test
  public void testGettersAndSetters() {
    DsConfig config = new DsConfig();
    config.setName("My DS");
    config.setCommPort("COM5");
    config.setType(DsType.DS_030);

    assertEquals("My DS", config.getName());
    assertEquals("COM5", config.getCommPort());
    assertEquals(DsType.DS_030, config.getType());
    assertEquals(4800, config.getBaudRate());
    assertTrue(config.isDs030());
    assertFalse(config.isDs200());

    config.setType(DsType.DS_200);
    assertTrue(config.isDs200());
    assertFalse(config.isDs030());

    config.setType(null);
    assertEquals(DsType.DS_300, config.getType());
  }

  @Test
  public void testBuilder() {
    DsConfig config =
        DsConfig.builder().name("Custom DS").commPort("/dev/ttyUSB0").type(DsType.DS_200B).build();

    assertEquals("Custom DS", config.getName());
    assertEquals("/dev/ttyUSB0", config.getCommPort());
    assertEquals(DsType.DS_200B, config.getType());

    DsConfig copy = DsConfig.Builder.from(config).build();
    assertEquals(config, copy);
    assertEquals(config.hashCode(), copy.hashCode());
  }

  @Test
  public void testBuilderFromNull() {
    DsConfig config = DsConfig.Builder.from(null).build();
    assertNotNull(config);
    assertEquals("DS-300", config.getName());
  }

  @Test
  public void testEqualsAndHashCode() {
    DsConfig c1 = new DsConfig("A", "COM1", DsType.DS_300);
    DsConfig c2 = new DsConfig("A", "COM1", DsType.DS_300);
    DsConfig c3 = new DsConfig("B", "COM1", DsType.DS_300);

    assertEquals(c1, c2);
    assertEquals(c1.hashCode(), c2.hashCode());
    assertNotEquals(c1, c3);
    assertNotEquals(c1, null);
    assertNotEquals(c1, "other");
    assertEquals(c1, c1);
  }

  @Test
  public void testToString() {
    DsConfig config = new DsConfig("DS-300", "COM1", DsType.DS_300);
    String str = config.toString();
    assertTrue(str.contains("DS-300"));
    assertTrue(str.contains("COM1"));
    assertTrue(str.contains("57600"));
  }
}
