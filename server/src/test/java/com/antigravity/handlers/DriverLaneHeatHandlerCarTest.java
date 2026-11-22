package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.context.DatabaseContext;
import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.Lane;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.race.ClientSubscriptionManager;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Race;
import com.antigravity.race.RaceParticipant;
import com.antigravity.repository.SqliteRepository;
import io.javalin.http.Context;
import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/** Quick car swap on race day (#1210). */
public class DriverLaneHeatHandlerCarTest {

  private DatabaseContext databaseContext;
  private DriverLaneHeatHandler handler;
  private Context ctx;
  private final Driver ann = new Driver("Ann", "A", "d1", "1");
  private final Driver bob = new Driver("Bob", "B", "d2", "2");

  @Before
  public void setUp() {
    File dir = new File(System.getProperty("java.io.tmpdir"), "car_swap_" + System.nanoTime());
    dir.mkdirs();
    databaseContext = new DatabaseContext("testdb", null, dir.toString() + File.separator);
    SqliteRepository<Car> cars = new SqliteRepository<>(databaseContext, "cars", Car.class);
    cars.insert(new Car.Builder().withName("Audi R8").withEntityId("c1").build());
    cars.insert(new Car.Builder().withName("Ford GT40").withEntityId("c2").build());
    ClientSubscriptionManager.setInstance(null);
    handler = new DriverLaneHeatHandler(databaseContext);
    ctx = mock(Context.class);
    when(ctx.status(any(Integer.class))).thenReturn(ctx);
    when(ctx.result(any(String.class))).thenReturn(ctx);
  }

  @After
  public void tearDown() {
    ClientSubscriptionManager.setInstance(null);
  }

  private Race startRace(RaceParticipant... participants) {
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
    Race race =
        new Race.Builder()
            .model(model)
            .drivers(Arrays.asList(participants))
            .track(track)
            .isDemoMode(true)
            .build();
    ClientSubscriptionManager.getInstance().setRace(race);
    return race;
  }

  private void swap(int lane, String carId) {
    when(ctx.pathParam("lane")).thenReturn(String.valueOf(lane));
    HashMap<String, String> body = new HashMap<>();
    body.put("carId", carId);
    when(ctx.bodyAsClass(HashMap.class)).thenReturn(body);
    handler.changeCar(ctx);
  }

  private int laneOf(Race race, RaceParticipant p) {
    for (int i = 0; i < race.getCurrentHeat().getDrivers().size(); i++) {
      if (race.getCurrentHeat().getDrivers().get(i).getDriver() == p) return i;
    }
    throw new AssertionError("not in the heat");
  }

  @Test
  public void returns404WithoutARace() {
    swap(0, "c1");
    verify(ctx).status(404);
  }

  @Test
  public void givesTheRacerAnotherCarBetweenHeats() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    int lane = laneOf(race, p1);

    swap(lane, "c2");

    verify(ctx).status(200);
    assertEquals("c2", p1.getCar().getEntityId());
    DriverHeatData heat = race.getCurrentHeat().getDrivers().get(lane);
    assertEquals("Ford GT40", heat.getCar().getName());
  }

  @Test
  public void anEmptyCarIdRemovesTheCar() {
    RaceParticipant p1 = new RaceParticipant(ann);
    p1.setCar(new Car.Builder().withName("Audi R8").withEntityId("c1").build());
    Race race = startRace(p1, new RaceParticipant(bob));
    swap(laneOf(race, p1), "");
    verify(ctx).status(200);
    assertNull(p1.getCar());
  }

  @Test
  public void refusesAnUnknownCar() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    swap(laneOf(race, p1), "nope");
    verify(ctx).status(404);
    verify(ctx).result("RD_ERR_CAR_NOT_FOUND");
  }

  @Test
  public void refusesABadLane() {
    startRace(new RaceParticipant(ann), new RaceParticipant(bob));
    swap(7, "c1");
    verify(ctx).status(400);
  }

  @Test
  public void keepsTheCarOfAHeatThatHasRun() {
    RaceParticipant p1 = new RaceParticipant(ann);
    Race race = startRace(p1, new RaceParticipant(bob));
    int lane = laneOf(race, p1);
    swap(lane, "c1");
    race.setHasRacedInCurrentHeat(true);

    swap(lane, "c2");

    assertEquals("the next heats get the new car", "c2", p1.getCar().getEntityId());
    assertEquals(
        "the heat that ran keeps its car",
        "c1",
        race.getCurrentHeat().getDrivers().get(lane).getCar().getEntityId());
  }

  @Test
  public void changesTheCarOfTheTeamDriverOnTheLane() {
    Team team = new Team("Ferrari", null, Arrays.asList("d1", "d2"), "t1", "1");
    RaceParticipant tp = new RaceParticipant(team);
    tp.setTeamDrivers(Arrays.asList(ann, bob));
    tp.setCarPerDriver(true);
    Race race = startRace(tp, new RaceParticipant(bob));
    int lane = laneOf(race, tp);
    Driver onLane = race.getCurrentHeat().getDrivers().get(lane).getActualDriver();

    swap(lane, "c1");

    verify(ctx).status(200);
    assertEquals("c1", tp.carFor(onLane).getEntityId());
    assertNull("the shared car stays unset", tp.getCar());
  }
}
