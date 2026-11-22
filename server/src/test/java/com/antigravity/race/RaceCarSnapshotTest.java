package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;

import com.antigravity.converters.HeatConverter;
import com.antigravity.converters.RaceParticipantConverter;
import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Track;
import java.util.Arrays;
import java.util.HashSet;
import org.junit.Test;

/** The car saved with each heat (#1210). */
public class RaceCarSnapshotTest {

  private static Car car(String id) {
    return new Car.Builder().withName("Car " + id).withEntityId(id).build();
  }

  private final Driver ann = new Driver("Ann", "A", "d1", "1");
  private final Driver bob = new Driver("Bob", "B", "d2", "2");
  private final RaceParticipant p1 = new RaceParticipant(ann);
  private final RaceParticipant p2 = new RaceParticipant(bob);

  private Race race() {
    Track track =
        new Track.Builder()
            .name("Track 1")
            .lanes(Arrays.asList(new Lane("red", "black", 100), new Lane("blue", "white", 100)))
            .build();
    com.antigravity.models.Race model = // fqn-collision
        new com.antigravity.models.Race.Builder() // fqn-collision
            .withName("Race")
            .withEntityId("r1")
            .build();
    return new Race.Builder()
        .model(model)
        .drivers(Arrays.asList(p1, p2))
        .track(track)
        .isDemoMode(true)
        .build();
  }

  private DriverHeatData heatOf(Race race, RaceParticipant p) {
    return race.getCurrentHeat().getDrivers().stream()
        .filter(d -> d.getDriver() == p)
        .findFirst()
        .orElseThrow(AssertionError::new);
  }

  @Test
  public void copiesEachEntrysCarOntoTheHeatBeforeItRuns() {
    Car c1 = car("c1");
    p1.setCar(c1);
    Race race = race();
    race.refreshCarSnapshots();
    assertSame(c1, heatOf(race, p1).getCar());
    assertNull("no car picked", heatOf(race, p2).getCar());
  }

  @Test
  public void prepareHeatTakesTheSnapshot() {
    Race race = race();
    p2.setCar(car("c2"));
    race.prepareHeat();
    assertEquals("c2", heatOf(race, p2).getCar().getEntityId());
  }

  @Test
  public void keepsTheSnapshotOnceTheHeatHasRun() {
    p1.setCar(car("c1"));
    Race race = race();
    race.refreshCarSnapshots();
    race.setHasRacedInCurrentHeat(true);
    p1.setCar(car("c9"));
    race.refreshCarSnapshots();
    assertEquals("c1", heatOf(race, p1).getCar().getEntityId());
  }

  @Test
  public void sendsTheCarsToTheClients() {
    p1.setCar(car("c1"));
    p1.setCarPerDriver(true);
    p1.setDriverCar("d1", car("c3"));
    com.antigravity.proto.RaceParticipant proto = // fqn-collision
        RaceParticipantConverter.toProto(p1, new HashSet<>());
    assertEquals("c1", proto.getCar().getModel().getEntityId());
    assertEquals(true, proto.getCarPerDriver());
    assertEquals(1, proto.getDriverCarsCount());
    assertEquals("d1", proto.getDriverCars(0).getDriverId());
    assertEquals("c3", proto.getDriverCars(0).getCar().getModel().getEntityId());

    Race race = race();
    race.refreshCarSnapshots();
    com.antigravity.proto.DriverHeatData heatProto = // fqn-collision
        HeatConverter.toProto(heatOf(race, p1), new HashSet<>());
    assertEquals("c3", heatProto.getCar().getModel().getEntityId());
    assertEquals(false, HeatConverter.toProto(heatOf(race, p2), new HashSet<>()).hasCar());
  }
}
