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

  @Test
  public void testBodyAsClassWithId_CustomUI_InjectsIdWhenMissing() throws Exception {
    String json =
        "{\"entity_id\":\"new\",\"name\":\"New UI Layout\",\"is_default\":false,\"layoutJson\":\"{\\\"nested\\\":\\\"value\\\"}\"}";
    com.antigravity.models.CustomUI ui =
        DatabaseHandlerUtils.bodyAsClassWithId(json, com.antigravity.models.CustomUI.class);

    assertNotNull(ui);
    assertEquals("New UI Layout", ui.getName());
    assertEquals("new", ui.getEntityId());
  }

  @Test
  public void testBodyAsClassWithId_CustomUI_NestedAtIdInJsonString() throws Exception {
    // If a nested JSON string contains the substring "@id", the root object must still have @id
    // injected
    String json =
        "{\"entity_id\":\"new\",\"name\":\"New UI Layout\",\"is_default\":false,\"layoutJson\":\"{\\\"key\\\":\\\"@id: 99\\\"}\"}";
    com.antigravity.models.CustomUI ui =
        DatabaseHandlerUtils.bodyAsClassWithId(json, com.antigravity.models.CustomUI.class);

    assertNotNull(ui);
    assertEquals("New UI Layout", ui.getName());
  }

  @Test
  public void testBodyAsClassWithId_NullBody() throws Exception {
    Driver driver = DatabaseHandlerUtils.bodyAsClassWithId(null, Driver.class);
    org.junit.Assert.assertNull(driver);
  }
}
