package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import com.antigravity.models.DriverLabel;
import com.antigravity.proto.DriverLabelModel;
import org.junit.Test;

public class DriverLabelConverterTest {

  @Test
  public void testNullConversions() {
    assertNull(DriverLabelConverter.toProto(null));
    assertNull(DriverLabelConverter.fromProto(null));
  }

  @Test
  public void testFullConversionCycle() {
    DriverLabel original =
        new DriverLabel.Builder()
            .withEntityId("lbl-42")
            .withName("GT3 Expert")
            .withColor("#ec4899")
            .build();

    DriverLabelModel proto = DriverLabelConverter.toProto(original);
    assertNotNull(proto);
    assertEquals("lbl-42", proto.getModel().getEntityId());
    assertEquals("GT3 Expert", proto.getName());
    assertEquals("#ec4899", proto.getColor());

    DriverLabel converted = DriverLabelConverter.fromProto(proto);
    assertNotNull(converted);
    assertEquals("lbl-42", converted.getEntityId());
    assertEquals("GT3 Expert", converted.getName());
    assertEquals("#ec4899", converted.getColor());
  }

  @Test
  public void testDefaultsOnEmptyFields() {
    DriverLabel original = new DriverLabel.Builder().build();
    DriverLabelModel proto = DriverLabelConverter.toProto(original);
    assertNotNull(proto);
    assertEquals("", proto.getName());
    assertEquals("#3b82f6", proto.getColor());

    DriverLabel converted = DriverLabelConverter.fromProto(proto);
    assertNotNull(converted);
    assertEquals("", converted.getName());
    assertEquals("#3b82f6", converted.getColor());
  }
}
