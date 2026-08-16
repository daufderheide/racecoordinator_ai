package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public class ModelTest {

  @Test
  public void testConstructorsAndGetters() {
    Model model1 = new Model("id1", "entity1");
    assertEquals("id1", model1.getId());
    assertEquals("entity1", model1.getEntityId());

    Model model2 = new Model(null, null);
    assertNotNull(model2.getId());
    assertEquals(model2.getId(), model2.getEntityId());
  }
}
