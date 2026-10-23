package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

import org.junit.Test;

public class DriverLabelTest {

  @Test
  public void testDriverLabelDefaultsAndBuilder() {
    DriverLabel label =
        new DriverLabel.Builder()
            .withId("lbl-1")
            .withEntityId("lbl-1")
            .withName("Pro Driver")
            .withColor("#ef4444")
            .build();

    assertEquals("lbl-1", label.getId());
    assertEquals("lbl-1", label.getEntityId());
    assertEquals("Pro Driver", label.getName());
    assertEquals("#ef4444", label.getColor());

    DriverLabel copy = DriverLabel.Builder.from(label).build();
    assertEquals(label, copy);
    assertEquals(label.hashCode(), copy.hashCode());
  }

  @Test
  public void testDriverLabelConstructors() {
    DriverLabel l1 = new DriverLabel("Rookie", "#10b981", "entity-123", "id-123");
    assertEquals("Rookie", l1.getName());
    assertEquals("#10b981", l1.getColor());
    assertEquals("entity-123", l1.getEntityId());

    DriverLabel l2 = new DriverLabel("Kids", "#f59e0b", "entity-456");
    assertEquals("Kids", l2.getName());
    assertEquals("#f59e0b", l2.getColor());
    assertEquals("entity-456", l2.getEntityId());

    DriverLabel l3 = new DriverLabel("Class A", null);
    assertEquals("Class A", l3.getName());
    assertEquals("#3b82f6", l3.getColor());
  }

  @Test
  public void testDriverLabelEqualsAndHashCode() {
    DriverLabel l1 = new DriverLabel("Rookie", "#10b981", "e-1");
    DriverLabel l2 = new DriverLabel("Rookie", "#10b981", "e-1");
    DriverLabel l3 = new DriverLabel("Pro", "#10b981", "e-1");
    DriverLabel l4 = new DriverLabel("Rookie", "#ef4444", "e-1");

    assertEquals(l1, l2);
    assertEquals(l1.hashCode(), l2.hashCode());
    assertNotEquals(l1, l3);
    assertNotEquals(l1, l4);
    assertNotEquals(l1, null);
    assertNotEquals(l1, "not a label");
  }
}
