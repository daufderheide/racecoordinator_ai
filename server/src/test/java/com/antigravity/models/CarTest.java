package com.antigravity.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.antigravity.proto.CarModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

public class CarTest {

  private static Car fullCar() {
    return new Car(
        "Porsche 911 #92",
        "porsche.png",
        "Scalextric",
        "GT3",
        "1/32",
        "Slot.it V12/4 21.5k",
        "None",
        "Sidewinder",
        "9/27",
        "Ortmann urethane",
        true,
        "Lowered body",
        "car-1",
        "id-1");
  }

  @Test
  public void testConstructorAndGetters() {
    Car car = fullCar();
    assertEquals("Porsche 911 #92", car.getName());
    assertEquals("porsche.png", car.getAvatarUrl());
    assertEquals("Scalextric", car.getBrand());
    assertEquals("GT3", car.getCarClass());
    assertEquals("1/32", car.getScale());
    assertEquals("Slot.it V12/4 21.5k", car.getMotor());
    assertEquals("None", car.getMagnet());
    assertEquals("Sidewinder", car.getChassis());
    assertEquals("9/27", car.getGears());
    assertEquals("Ortmann urethane", car.getTyres());
    assertTrue(car.isModified());
    assertEquals("Lowered body", car.getNotes());
    assertEquals("car-1", car.getEntityId());
    assertEquals("id-1", car.getId());
  }

  @Test
  public void testBuilderCopiesEveryField() {
    Car original = fullCar();
    Car copy = Car.Builder.from(original).withName("Porsche 911 #93").build();

    assertEquals("Porsche 911 #93", copy.getName());
    assertEquals("porsche.png", copy.getAvatarUrl());
    assertEquals("Scalextric", copy.getBrand());
    assertEquals("GT3", copy.getCarClass());
    assertEquals("1/32", copy.getScale());
    assertEquals("Slot.it V12/4 21.5k", copy.getMotor());
    assertEquals("None", copy.getMagnet());
    assertEquals("Sidewinder", copy.getChassis());
    assertEquals("9/27", copy.getGears());
    assertEquals("Ortmann urethane", copy.getTyres());
    assertTrue(copy.isModified());
    assertEquals("Lowered body", copy.getNotes());
    assertEquals("car-1", copy.getEntityId());
    assertEquals("id-1", copy.getId());
  }

  @Test
  public void testBuilderSetters() {
    Car car =
        new Car.Builder()
            .withName("Ford GT40")
            .withAvatarUrl("gt40.png")
            .withBrand("Carrera")
            .withCarClass("Classic")
            .withScale("1/24")
            .withMotor("Inline")
            .withMagnet("Strong")
            .withChassis("Plastic")
            .withGears("10/30")
            .withTyres("Rubber")
            .withModified(true)
            .withNotes("Club car")
            .withEntityId("c2")
            .withId("id-2")
            .build();

    assertEquals("Ford GT40", car.getName());
    assertEquals("gt40.png", car.getAvatarUrl());
    assertEquals("Carrera", car.getBrand());
    assertEquals("Classic", car.getCarClass());
    assertEquals("1/24", car.getScale());
    assertEquals("Inline", car.getMotor());
    assertEquals("Strong", car.getMagnet());
    assertEquals("Plastic", car.getChassis());
    assertEquals("10/30", car.getGears());
    assertEquals("Rubber", car.getTyres());
    assertTrue(car.isModified());
    assertEquals("Club car", car.getNotes());
    assertEquals("c2", car.getEntityId());
    assertEquals("id-2", car.getId());
  }

  @Test
  public void testBuilderFromNullGivesEmptyCar() {
    Car car = Car.Builder.from(null).build();
    assertNull(car.getName());
    assertNull(car.getCarClass());
    assertFalse(car.isModified());
  }

  @Test
  public void testProtoConstructor() {
    CarModel proto =
        CarModel.newBuilder()
            .setName("Proto Car")
            .setAvatarUrl("proto.png")
            .setBrand("NSR")
            .setCarClass("LMP")
            .setScale("1/32")
            .setMotor("King 21k")
            .setMagnet("None")
            .setChassis("Evo")
            .setGears("12/36")
            .setTyres("Zero grip")
            .setModified(true)
            .setNotes("From proto")
            .setModel(com.antigravity.proto.Model.newBuilder().setEntityId("proto-1").build())
            .build();

    Car car = new Car(proto);
    assertEquals("Proto Car", car.getName());
    assertEquals("proto.png", car.getAvatarUrl());
    assertEquals("NSR", car.getBrand());
    assertEquals("LMP", car.getCarClass());
    assertEquals("1/32", car.getScale());
    assertEquals("King 21k", car.getMotor());
    assertEquals("None", car.getMagnet());
    assertEquals("Evo", car.getChassis());
    assertEquals("12/36", car.getGears());
    assertEquals("Zero grip", car.getTyres());
    assertTrue(car.isModified());
    assertEquals("From proto", car.getNotes());
    assertEquals("proto-1", car.getEntityId());
  }

  @Test
  public void testJsonRoundTrip() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(fullCar());
    assertTrue(json.contains("\"carClass\":\"GT3\""));

    Car back = mapper.readValue(json, Car.class);
    assertEquals("Porsche 911 #92", back.getName());
    assertEquals("GT3", back.getCarClass());
    assertEquals("1/32", back.getScale());
    assertEquals("Ortmann urethane", back.getTyres());
    assertTrue(back.isModified());
    assertEquals("Lowered body", back.getNotes());
  }

  @Test
  public void testJsonAcceptsSnakeCaseClassAndMissingFields() throws Exception {
    Car car =
        com.antigravity.handlers.DatabaseHandlerUtils.bodyAsClassWithId(
            "{\"name\":\"Mini\",\"car_class\":\"Touring\"}", Car.class);
    assertEquals("Mini", car.getName());
    assertEquals("Touring", car.getCarClass());
    assertNull(car.getMotor());
    assertFalse(car.isModified());
  }
}
