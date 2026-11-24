package com.antigravity.converters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Car;
import com.antigravity.proto.CarModel;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class CarConverterTest {

  private static Car car() {
    Map<String, String> values = new HashMap<>();
    values.put("f-weight", "78");
    return new Car.Builder()
        .withName("Porsche 911 RSR #92")
        .withBrand("Scalextric")
        .withCarClass("GT3")
        .withScale("1/32")
        .withMotor("V12/4")
        .withTyres("Ortmann")
        .withModified(true)
        .withNotes("Weight in the nose")
        .withCustomValues(values)
        .withEntityId("c1")
        .build();
  }

  @Test
  public void copiesEveryFieldToTheProto() {
    CarModel proto = CarConverter.toProto(car());
    assertEquals("c1", proto.getModel().getEntityId());
    assertEquals("Porsche 911 RSR #92", proto.getName());
    assertEquals("Scalextric", proto.getBrand());
    assertEquals("GT3", proto.getCarClass());
    assertEquals("1/32", proto.getScale());
    assertEquals("V12/4", proto.getMotor());
    assertEquals("Ortmann", proto.getTyres());
    assertTrue(proto.getModified());
    assertEquals("Weight in the nose", proto.getNotes());
    assertEquals(1, proto.getCustomValuesCount());
    assertEquals("f-weight", proto.getCustomValues(0).getFieldId());
    assertEquals("78", proto.getCustomValues(0).getValue());
    assertEquals("", proto.getMagnet());
  }

  @Test
  public void roundTripsThroughTheProto() {
    Car back = CarConverter.fromProto(CarConverter.toProto(car()));
    assertEquals("c1", back.getEntityId());
    assertEquals("GT3", back.getCarClass());
    assertEquals("78", back.getCustomValues().get("f-weight"));
    assertTrue(back.isModified());
  }

  @Test
  public void hasNoCarForNullOrAnEmptyProto() {
    assertNull(CarConverter.toProto(null));
    assertNull(CarConverter.fromProto(null));
    assertNull(CarConverter.fromProto(CarModel.getDefaultInstance()));
  }
}
