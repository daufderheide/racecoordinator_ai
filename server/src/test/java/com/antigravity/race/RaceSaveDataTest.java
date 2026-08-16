package com.antigravity.race;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import com.antigravity.models.Driver;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Lane;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Team;
import com.antigravity.models.Track;
import com.antigravity.util.CsvExporter;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class RaceSaveDataTest {

  @Test
  public void testHeatBuilderAssignsActualDriver() {
    Driver d1 =
        new Driver(
            "D1", "Driver One", null, null, null, null, null, null, null, null, null, "d1", null);
    Driver d2 =
        new Driver(
            "D2", "Driver Two", null, null, null, null, null, null, null, null, null, "d2", null);
    List<String> driverIds = new ArrayList<>();
    driverIds.add("d1");
    driverIds.add("d2");

    Team team = new Team("The Team", "avatar", driverIds, "t1", null);

    RaceParticipant rp = new RaceParticipant(team);
    List<Driver> teamDrivers = new ArrayList<>();
    teamDrivers.add(d1);
    teamDrivers.add(d2);
    rp.setTeamDrivers(teamDrivers);

    List<RaceParticipant> drivers = new ArrayList<>();
    drivers.add(rp);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    lanes.add(new Lane("blue", "black", 100, "l2", null));

    Track track =
        new Track.Builder().name("Track").lanes(lanes).entityId("track1").id(null).build();

    Race raceModel =
        new Race.Builder()
            .withName("Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();
    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    List<Heat> heats = HeatBuilder.buildHeats(race, drivers, new ArrayList<>());

    assertNotNull(heats);
    assertEquals(2, heats.size());

    Heat h1 = heats.get(0);
    Heat h2 = heats.get(1);

    DriverHeatData dhd1 =
        h1.getDrivers().stream()
            .filter(d -> d.getDriver().getTeam() != null)
            .findFirst()
            .orElse(null);
    assertNotNull(dhd1);
    assertNotNull(dhd1.getActualDriver());
    assertEquals("D1", dhd1.getActualDriver().getName());

    DriverHeatData dhd2 =
        h2.getDrivers().stream()
            .filter(d -> d.getDriver().getTeam() != null)
            .findFirst()
            .orElse(null);
    assertNotNull(dhd2);
    assertNotNull(dhd2.getActualDriver());
    assertEquals("D2", dhd2.getActualDriver().getName());
  }

  @Test
  public void testRaceRestorationLinksDriverInstances() throws Exception {
    Driver d1 =
        new Driver(
            "D1", "Driver One", null, null, null, null, null, null, null, null, null, "d1", null);
    RaceParticipant masterRp = new RaceParticipant(d1);
    List<RaceParticipant> masterDrivers = new ArrayList<>();
    masterDrivers.add(masterRp);

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    Track track =
        new Track.Builder().name("Track").lanes(lanes).entityId("track1").id(null).build();

    Race raceModel =
        new Race.Builder()
            .withName("Race")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();

    RaceParticipant deserializedRp = new RaceParticipant(d1);
    assertNotSame(masterRp, deserializedRp);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(new DriverHeatData(deserializedRp));
    List<Heat> heats = new ArrayList<>();
    heats.add(new Heat(1, heatDrivers, new HeatScoring(), false));

    com.antigravity.race.Race restoredRace =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(masterDrivers)
            .track(track)
            .heats(heats)
            .isDemoMode(true)
            .build();

    RaceParticipant linkedRp = restoredRace.getHeats().get(0).getDrivers().get(0).getDriver();
    assertSame(masterRp, linkedRp);
  }

  @Test
  public void testRaceSaveLoadPreservesBestLapTimesAndExports() throws Exception {
    Driver d1 = new Driver("Driver 1", "d1");
    RaceParticipant rp1 = new RaceParticipant(d1);
    List<RaceParticipant> masterDrivers = new ArrayList<>();
    masterDrivers.add(rp1);

    DriverHeatData dhd1 = new DriverHeatData(rp1, d1);
    dhd1.addLap(6.543, false, true);
    dhd1.addLap(5.432, false, true);
    dhd1.addLap(7.100, false, true);

    assertEquals(5.432, dhd1.getBestLapTime(), 0.001);

    List<DriverHeatData> heatDrivers = new ArrayList<>();
    heatDrivers.add(dhd1);
    List<Heat> heats = new ArrayList<>();
    heats.add(new Heat(1, heatDrivers, new HeatScoring(), false));

    List<Lane> lanes = new ArrayList<>();
    lanes.add(new Lane("red", "black", 100, "l1", null));
    Track track =
        new Track.Builder().name("Track").lanes(lanes).entityId("track1").id(null).build();

    Race raceModel =
        new Race.Builder()
            .withName("Save Load Export Test")
            .withTrackEntityId("track1")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(new HeatScoring())
            .withOverallScoring(new OverallScoring())
            .withEntityId("race1")
            .build();

    RaceSaveData saveData = new RaceSaveData();
    saveData.setModel(raceModel);
    saveData.setTrack(track);
    saveData.setDrivers(masterDrivers);
    saveData.setHeats(heats);

    ObjectMapper mapper = new ObjectMapper();
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    String json = mapper.writeValueAsString(saveData);
    RaceSaveData decodedSaveData = mapper.readValue(json, RaceSaveData.class);

    DriverHeatData decodedDhd = decodedSaveData.getHeats().get(0).getDrivers().get(0);
    assertEquals(5.432, decodedDhd.getBestLapTime(), 0.001);

    com.antigravity.race.Race loadedRace =
        new com.antigravity.race.Race.Builder()
            .model(decodedSaveData.getModel())
            .drivers(decodedSaveData.getDrivers())
            .track(decodedSaveData.getTrack())
            .heats(decodedSaveData.getHeats())
            .isDemoMode(true)
            .build();

    OverallStandings standings =
        new OverallStandings(
            loadedRace.getRaceModel().getHeatScoring(),
            loadedRace.getRaceModel().getOverallScoring(),
            loadedRace.getRaceModel().getGroupOptions(),
            loadedRace.getRaceModel().isPractice());
    standings.recalculate(loadedRace.getDrivers(), loadedRace.getHeats());

    RaceParticipant loadedParticipant = loadedRace.getDrivers().get(0);
    assertEquals(5.432, loadedParticipant.getBestLapTime(), 0.001);

    String csv = CsvExporter.export(loadedRace);
    assertTrue("CSV export should contain non-zero best lap time 5.432", csv.contains("5.432"));
  }
}
