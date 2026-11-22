package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;

import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.Team;
import java.util.Arrays;
import org.junit.Test;

/** Slotcars on a race entry (#1210). */
public class RaceParticipantCarTest {

  private static Car car(String id) {
    return new Car.Builder().withName("Car " + id).withEntityId(id).build();
  }

  private final Driver ann = new Driver("Ann", "A", "d1", "1");
  private final Driver bob = new Driver("Bob", "B", "d2", "2");

  @Test
  public void aSoloDriverRacesTheEntryCar() {
    RaceParticipant p = new RaceParticipant(ann);
    assertNull(p.carFor(ann));
    Car c = car("c1");
    p.setCar(c);
    assertSame(c, p.carFor(ann));
  }

  @Test
  public void aTeamSharesOneCarByDefault() {
    Team team = new Team("Ferrari", null, Arrays.asList("d1", "d2"), "t1", "1");
    RaceParticipant p = new RaceParticipant(team);
    Car shared = car("c1");
    p.setCar(shared);
    assertSame(shared, p.carFor(ann));
    assertSame(shared, p.carFor(bob));
  }

  @Test
  public void aTeamCanRaceACarPerDriver() {
    Team team = new Team("Ferrari", null, Arrays.asList("d1", "d2"), "t1", "1");
    RaceParticipant p = new RaceParticipant(team);
    p.setCar(car("shared"));
    p.setCarPerDriver(true);
    Car annsCar = car("c1");
    p.setDriverCar("d1", annsCar);
    assertSame(annsCar, p.carFor(ann));
    assertNull("Bob has no car picked", p.carFor(bob));
    assertNull(p.carFor(null));
  }

  @Test
  public void replacesOrRemovesOneDriversCar() {
    RaceParticipant p = new RaceParticipant(ann);
    p.setCarPerDriver(true);
    p.setDriverCar("d1", car("c1"));
    Car second = car("c2");
    p.setDriverCar("d1", second);
    assertEquals(1, p.getDriverCars().size());
    assertSame(second, p.carFor(ann));
    p.setDriverCar("d1", null);
    assertEquals(0, p.getDriverCars().size());
  }

  @Test
  public void keepsAnEmptyListForNullDriverCars() {
    RaceParticipant p = new RaceParticipant(ann);
    p.setDriverCars(null);
    assertEquals(0, p.getDriverCars().size());
  }
}
