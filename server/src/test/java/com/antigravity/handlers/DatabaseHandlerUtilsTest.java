package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import com.antigravity.models.Driver;
import org.junit.Test;

public class DatabaseHandlerUtilsTest {

  @Test
  public void testBodyAsClassWithId_InjectsIdWhenMissing() throws Exception {
    String json = "{\"name\":\"Dave\",\"nickname\":\"DB\"}";
    Driver driver = DatabaseHandlerUtils.bodyAsClassWithId(json, Driver.class);

    assertNotNull(driver);
    assertEquals("Dave", driver.getName());
    assertEquals("DB", driver.getNickname());
  }

  @Test
  public void testBodyAsClassWithId_PreservesExistingId() throws Exception {
    String json = "{\"@id\":2,\"name\":\"Dave\",\"nickname\":\"DB\"}";
    Driver driver = DatabaseHandlerUtils.bodyAsClassWithId(json, Driver.class);

    assertNotNull(driver);
    assertEquals("Dave", driver.getName());
    assertEquals("DB", driver.getNickname());
  }
}
