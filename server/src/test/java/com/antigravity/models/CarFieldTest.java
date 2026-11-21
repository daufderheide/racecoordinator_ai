package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.CarFieldModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class CarFieldTest {

  @Test
  public void testConstructorAndGetters() {
    CarField f = new CarField("Weight", "number", null, 3, "f1", "id-1");
    assertEquals("Weight", f.getName());
    assertEquals("number", f.getType());
    assertTrue(f.getOptions().isEmpty());
    assertEquals(3, f.getPosition());
    assertEquals("f1", f.getEntityId());
    assertEquals("id-1", f.getId());
  }

  @Test
  public void testOptionsAreCopied() {
    List<String> options = new java.util.ArrayList<>(Arrays.asList("Soft", "Hard"));
    CarField f = new CarField("Compound", "choice", options, 0, "f1", null);
    options.add("Wet");
    f.getOptions().add("Other");
    assertEquals(Arrays.asList("Soft", "Hard"), f.getOptions());
  }

  @Test
  public void testBuilder() {
    CarField original =
        new CarField.Builder()
            .withName("Compound")
            .withType("choice")
            .withOptions(Arrays.asList("Soft", "Hard"))
            .withPosition(2)
            .withEntityId("f2")
            .withId("id-2")
            .build();
    CarField copy = CarField.Builder.from(original).withName("Tyre compound").build();
    assertEquals("Tyre compound", copy.getName());
    assertEquals("choice", copy.getType());
    assertEquals(Arrays.asList("Soft", "Hard"), copy.getOptions());
    assertEquals(2, copy.getPosition());
    assertEquals("f2", copy.getEntityId());
    assertEquals("id-2", copy.getId());

    CarField empty = CarField.Builder.from(null).withOptions(null).build();
    assertNull(empty.getName());
    assertTrue(empty.getOptions().isEmpty());
  }

  @Test
  public void testProtoConstructor() {
    CarFieldModel proto =
        CarFieldModel.newBuilder()
            .setName("Pinion")
            .setType("text")
            .addAllOptions(Arrays.asList("a"))
            .setPosition(4)
            .setModel(com.antigravity.proto.Model.newBuilder().setEntityId("p1").build())
            .build();
    CarField f = new CarField(proto);
    assertEquals("Pinion", f.getName());
    assertEquals("text", f.getType());
    assertEquals(Arrays.asList("a"), f.getOptions());
    assertEquals(4, f.getPosition());
    assertEquals("p1", f.getEntityId());
  }

  @Test
  public void testJsonRoundTrip() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    CarField f = new CarField("Compound", "choice", Arrays.asList("Soft"), 1, "f1", "f1");
    CarField back = mapper.readValue(mapper.writeValueAsString(f), CarField.class);
    assertEquals("Compound", back.getName());
    assertEquals("choice", back.getType());
    assertEquals(Arrays.asList("Soft"), back.getOptions());
    assertEquals(1, back.getPosition());
  }

  @Test
  public void testTypes() {
    assertEquals(Arrays.asList("text", "number", "boolean", "choice"), CarField.TYPES);
  }
}
