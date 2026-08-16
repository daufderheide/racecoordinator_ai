package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public class ServerToClientObjectTest {

  private static class TestServerObject extends ServerToClientObject {
    public TestServerObject() {
      super();
    }

    public TestServerObject(String objectId) {
      super(objectId);
    }
  }

  @Test
  public void testDefaultConstructorGeneratesRandomUUID() {
    TestServerObject obj = new TestServerObject();
    assertNotNull("Default objectId should not be null", obj.getObjectId());
    assertEquals("UUID string length should be 36", 36, obj.getObjectId().length());
  }

  @Test
  public void testCustomObjectIdConstructor() {
    TestServerObject obj = new TestServerObject("custom-id-123");
    assertEquals("custom-id-123", obj.getObjectId());

    TestServerObject nullObj = new TestServerObject(null);
    assertNotNull("Null objectId should fallback to random UUID", nullObj.getObjectId());
  }

  @Test
  public void testSetObjectId() {
    TestServerObject obj = new TestServerObject("id1");
    obj.setObjectId("id2");
    assertEquals("id2", obj.getObjectId());
  }
}
