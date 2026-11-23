package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;

import com.antigravity.models.Car;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

/** The car one team driver uses when a team races with a car per driver (#1210). */
public class ParticipantDriverCarTest {

  private static Car car(String id) {
    return new Car.Builder().withName("Car " + id).withEntityId(id).build();
  }

  @Test
  public void keepsTheDriverAndTheCar() {
    Car c = car("c1");
    ParticipantDriverCar dc = new ParticipantDriverCar("d1", c);
    assertEquals("d1", dc.getDriverId());
    assertSame(c, dc.getCar());
  }

  @Test
  public void startsEmptyAndTakesNewValues() {
    ParticipantDriverCar dc = new ParticipantDriverCar();
    assertNull(dc.getDriverId());
    assertNull(dc.getCar());
    Car c = car("c2");
    dc.setDriverId("d2");
    dc.setCar(c);
    assertEquals("d2", dc.getDriverId());
    assertSame(c, dc.getCar());
  }

  @Test
  public void readsJsonAndIgnoresUnknownFields() throws Exception {
    ParticipantDriverCar dc =
        new ObjectMapper()
            .readValue(
                "{\"driverId\":\"d3\",\"fromANewerVersion\":true}", ParticipantDriverCar.class);
    assertEquals("d3", dc.getDriverId());
    assertNull(dc.getCar());
  }
}
