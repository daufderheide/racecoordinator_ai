package com.antigravity.service;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Car;
import com.antigravity.models.Driver;
import com.antigravity.models.Race;
import com.antigravity.models.RaceHistoryRecord;
import com.antigravity.models.Track;
import com.antigravity.race.DriverHeatData;
import com.antigravity.race.Heat;
import com.antigravity.race.RaceParticipant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.Test;

public class CarStatisticsTest {

  private static final Driver ANN = new Driver("Ann", "Speedy", "d1", null);
  private static final Driver BOB = new Driver("Bob", "", "d2", null);

  private static Car car(String id, String name, String carClass, String tyres) {
    return new Car.Builder()
        .withEntityId(id)
        .withName(name)
        .withCarClass(carClass)
        .withTyres(tyres)
        .build();
  }

  private static final Car AUDI = car("c1", "Audi R8", "GT3", "Ortmann");
  private static final Car FORD = car("c2", "Ford GT40", "Classic", "ortmann ");

  private static DriverHeatData entry(Driver driver, Car car, double... laps) {
    DriverHeatData dhd = new DriverHeatData(new RaceParticipant(driver));
    dhd.setCar(car);
    for (double t : laps) dhd.addLap(t, false, true);
    return dhd;
  }

  private static Heat heat(DriverHeatData... entries) {
    Heat heat = new Heat();
    heat.setDrivers(new ArrayList<>(Arrays.asList(entries)));
    return heat;
  }

  private static RaceHistoryRecord race(
      String id, String trackId, double minLap, long when, Heat... heats) {
    RaceHistoryRecord r = new RaceHistoryRecord();
    r.setId(id);
    r.setTimestamp(when);
    r.setModel(new Race.Builder().withName("R").withMinLapTime(minLap).build());
    r.setTrack(
        new Track.Builder()
            .name("Track " + trackId)
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId(trackId)
            .id(null)
            .build());
    r.setHeats(new ArrayList<>(Arrays.asList(heats)));
    return r;
  }

  private static List<RaceHistoryRecord> twoRaces() {
    return Arrays.asList(
        race(
            "r1",
            "t1",
            0,
            100L,
            heat(entry(ANN, AUDI, 4.0, 3.8), entry(BOB, FORD, 4.5)),
            heat(entry(ANN, FORD, 4.4), entry(BOB, AUDI, 3.9, 4.1))),
        race("r2", "t2", 0, 200L, heat(entry(ANN, AUDI, 3.7), entry(BOB, null, 3.0))));
  }

  private static CarStatistics.Row row(List<CarStatistics.Row> rows, String key) {
    return rows.stream().filter(r -> r.getKey().equals(key)).findFirst().orElse(null);
  }

  @Test
  public void groupsByCarAcrossRacesAndDrivers() {
    List<CarStatistics.Row> rows =
        CarStatistics.compute(twoRaces(), "car", CarStatistics.Filters.none());

    assertEquals(2, rows.size());
    CarStatistics.Row audi = row(rows, "c1");
    assertEquals("Audi R8", audi.getLabel());
    assertEquals(2, audi.getRaces());
    assertEquals(3, audi.getHeats());
    assertEquals(5, audi.getLaps());
    assertEquals(3.7, audi.getBestLapTime(), 1e-9);
    assertEquals("Speedy", audi.getBestLapDriver());
    assertEquals(3.9, audi.getMedianLapTime(), 1e-9);
    assertEquals((4.0 + 3.8 + 3.9 + 4.1 + 3.7) / 5, audi.getAverageLapTime(), 1e-9);
    assertEquals(200L, audi.getLastRaced());
    // Most laps first.
    assertEquals("c1", rows.get(0).getKey());
  }

  @Test
  public void leavesOutHeatsWithoutACar() {
    List<CarStatistics.Row> rows =
        CarStatistics.compute(twoRaces(), "driver", CarStatistics.Filters.none());
    // Bob's 3.0 lap in race 2 had no car.
    assertEquals(3.9, row(rows, "d2").getBestLapTime(), 1e-9);
    assertEquals(3, row(rows, "d2").getLaps());
    assertEquals("Bob", row(rows, "d2").getLabel());
  }

  @Test
  public void groupsByClassAndSetupFieldIgnoringCase() {
    List<CarStatistics.Row> byClass =
        CarStatistics.compute(twoRaces(), "class", CarStatistics.Filters.none());
    assertEquals(Arrays.asList("gt3", "classic"), keys(byClass));

    List<CarStatistics.Row> byTyres =
        CarStatistics.compute(twoRaces(), "tyres", CarStatistics.Filters.none());
    assertEquals(1, byTyres.size());
    assertEquals(7, byTyres.get(0).getLaps());
  }

  @Test
  public void groupsByTheUsersOwnField() {
    Car tuned =
        new Car.Builder()
            .withEntityId("c3")
            .withName("Tuned")
            .withCustomValues(Collections.singletonMap("f1", "Wide"))
            .build();
    List<RaceHistoryRecord> history =
        Arrays.asList(race("r1", "t1", 0, 1L, heat(entry(ANN, tuned, 4.0), entry(BOB, AUDI, 4))));
    List<CarStatistics.Row> rows =
        CarStatistics.compute(history, "custom:f1", CarStatistics.Filters.none());
    assertEquals(1, rows.size());
    assertEquals("Wide", rows.get(0).getLabel());
  }

  @Test
  public void filtersByCarTrackClassAndDriver() {
    assertEquals(
        Arrays.asList("t1", "t2"),
        keys(
            CarStatistics.compute(
                twoRaces(), "track", new CarStatistics.Filters("c1", null, null, null))));
    assertEquals(
        Arrays.asList("c2"),
        keys(
            CarStatistics.compute(
                twoRaces(), "car", new CarStatistics.Filters(null, "classic", null, null))));
    assertEquals(
        Arrays.asList("c1"),
        keys(
            CarStatistics.compute(
                twoRaces(), "car", new CarStatistics.Filters(null, null, "t2", null))));
    CarStatistics.Row bobAudi =
        CarStatistics.compute(twoRaces(), "car", new CarStatistics.Filters("c1", null, null, "d2"))
            .get(0);
    assertEquals(2, bobAudi.getLaps());
  }

  @Test
  public void skipsLapsUnderTheMinimumAndExcludedLaps() {
    DriverHeatData dhd = entry(ANN, AUDI, 1.0, 4.0);
    dhd.addLap(3.0, false, false); // excluded from records
    List<RaceHistoryRecord> history = Arrays.asList(race("r1", "t1", 2.0, 1L, heat(dhd)));
    CarStatistics.Row audi =
        CarStatistics.compute(history, "car", CarStatistics.Filters.none()).get(0);
    assertEquals(1, audi.getLaps());
    assertEquals(4.0, audi.getBestLapTime(), 1e-9);
  }

  @Test
  public void handlesEmptyAndUnknownInput() {
    assertTrue(CarStatistics.compute(null, "car", null).isEmpty());
    assertTrue(CarStatistics.compute(twoRaces(), "nonsense", null).isEmpty());
    assertEquals(2, CarStatistics.compute(twoRaces(), null, null).size());
  }

  private static List<String> keys(List<CarStatistics.Row> rows) {
    List<String> out = new ArrayList<>();
    for (CarStatistics.Row r : rows) out.add(r.getKey());
    return out;
  }
}
