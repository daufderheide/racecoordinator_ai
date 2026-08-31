package com.antigravity.converters;

import static org.junit.Assert.assertEquals;

import com.antigravity.models.AnalogFuelOptions;
import com.antigravity.models.HeatRotationType;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceModel;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.Test;

public class RaceConverterTest {

  @Test
  public void testToProto_AllowFinish_None() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatScoring(heatScoring)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatScoring.AllowFinish.AF_NONE,
        proto.getHeatScoring().getAllowFinish());
  }

  @Test
  public void testToProto_AllowFinish_Allow() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.Allow);
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatScoring(heatScoring)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatScoring.AllowFinish.AF_ALLOW,
        proto.getHeatScoring().getAllowFinish());
  }

  @Test
  public void testToProto_AllowFinish_SingleLap() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.SingleLap);
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatScoring(heatScoring)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatScoring.AllowFinish.AF_SINGLE_LAP,
        proto.getHeatScoring().getAllowFinish());
  }

  @Test
  public void testToProto_AnalogFuelOptions() {
    HeatScoring heatScoring =
        new HeatScoring(
            HeatScoring.FinishMethod.Timed,
            15,
            HeatScoring.HeatRanking.LAP_COUNT,
            HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
            HeatScoring.AllowFinish.None);
    AnalogFuelOptions fuelOptions =
        new AnalogFuelOptions(
            true,
            false,
            null,
            com.antigravity.models.FuelOptions.OutOfFuelAction.DO_NOT_COUNT_LAPS,
            120.0,
            AnalogFuelOptions.FuelUsageType.LINEAR,
            5.0,
            100.0,
            8.0,
            3.0,
            5.0);
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatRotationType(HeatRotationType.RoundRobin)
            .withHeatScoring(heatScoring)
            .withMinLapTime(0.0)
            .withFuelOptions(fuelOptions)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(true, proto.getFuelOptions().getEnabled());
    assertEquals(120.0, proto.getFuelOptions().getCapacity(), 0.001);
    assertEquals(5.0, proto.getFuelOptions().getUsageRate(), 0.001);
  }

  @Test
  public void testToProto_HeatRotationType() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatRotationType(HeatRotationType.SingleHeatSolo)
            .withSoloLaneIndex(2)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatRotationType.SINGLE_HEAT_SOLO, proto.getHeatRotationType());
    assertEquals(2, proto.getSoloLaneIndex());
  }

  @Test
  public void testToProto_HeatRotationType_SingleHeatSoloAllLanesAccumulate() {
    Race race =
        new Race.Builder()
            .withName("Test Race")
            .withTrackEntityId("track-id")
            .withHeatRotationType(HeatRotationType.SingleHeatSoloAllLanesAccumulate)
            .build();
    Track track =
        new Track.Builder()
            .name("Test Track")
            .lanes(new ArrayList<>())
            .arduinoConfigs(null)
            .entityId("track-id")
            .id(null)
            .build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatRotationType.SINGLE_HEAT_SOLO_ALL_LANES_ACCUMULATE,
        proto.getHeatRotationType());
  }

  @Test
  public void testToProto_RaceSnapshot_PopulatesRecordDataAndHeats() {
    // Setup
    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "white", 10));
    com.antigravity.models.Track trackModel =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(null)
            .entityId("t1")
            .id(null)
            .build();

    List<com.antigravity.race.RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Team("Team", null, new ArrayList<>(), "t1", null)));

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(new com.antigravity.models.Race.Builder().withName("Test Race").build())
            .track(trackModel)
            .drivers(drivers)
            .isDemoMode(true)
            .build();

    Set<String> sentObjectIds = new HashSet<>();

    // Execute
    com.antigravity.proto.Race proto = RaceConverter.toProto(race, sentObjectIds);

    // Verify
    assertNotNull(proto);
    assertNotNull(proto.getRace());
    assertEquals("Test Race", proto.getRace().getName());
    assertNotNull(proto.getRecordData());
  }

  @Test
  public void testToProto_OverloadedMethod() {
    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    com.antigravity.models.Track trackModel =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(lanes)
            .arduinoConfigs(null)
            .entityId("t1")
            .id(null)
            .build();

    List<com.antigravity.race.RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Team("Team", null, new ArrayList<>(), "t1", null)));

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(new com.antigravity.models.Race.Builder().withName("Test Race").build())
            .track(trackModel)
            .drivers(drivers)
            .isDemoMode(true)
            .build();

    com.antigravity.proto.Race proto = RaceConverter.toProto(race);
    assertNotNull(proto);
    assertEquals("Test Race", proto.getRace().getName());
  }

  @Test
  public void testToProto_ThemeId() {
    Race race =
        new Race.Builder()
            .withName("Practice Race")
            .withTrackEntityId("t1")
            .withThemeId("practice_theme_rc_ai")
            .build();
    Track track = new Track.Builder().name("Track").lanes(new ArrayList<>()).entityId("t1").build();

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());
    assertNotNull(proto);
    assertEquals("practice_theme_rc_ai", proto.getThemeId());
  }

  @Test
  public void testToProto_SeasonStandingBreakdownFields() {
    com.antigravity.models.SeasonScoring scoring =
        new com.antigravity.models.SeasonScoring(
            java.util.Arrays.asList(25.0),
            java.util.Arrays.asList(5.0),
            0.0,
            2.0, // heat fastest lap
            0.0,
            0.0,
            false,
            0.0,
            10.0, // overall fastest lap
            0.0,
            0.0,
            0.0,
            false);

    com.antigravity.models.Race raceModel =
        new com.antigravity.models.Race.Builder()
            .withName("Season Race")
            .withSeasonScoring(scoring)
            .build();

    com.antigravity.models.Driver d1 = new com.antigravity.models.Driver("D1", "D1", "d1", null);
    com.antigravity.race.RaceParticipant rp1 = new com.antigravity.race.RaceParticipant(d1);
    rp1.setRank(1);

    com.antigravity.models.Track trackModel =
        new com.antigravity.models.Track.Builder()
            .name("Track")
            .lanes(new ArrayList<>())
            .entityId("t1")
            .build();

    com.antigravity.race.DriverHeatData dhd1 = new com.antigravity.race.DriverHeatData(rp1);
    dhd1.addLap(4.5, false, true);
    com.antigravity.race.Heat heat1 =
        new com.antigravity.race.Heat(1, java.util.Arrays.asList(dhd1), false);

    // Create db context with Season
    com.antigravity.context.DatabaseContext dbCtx =
        org.mockito.Mockito.mock(com.antigravity.context.DatabaseContext.class);
    com.antigravity.models.Season season =
        new com.antigravity.models.Season("2026 Season", 0, new ArrayList<>(), "s1", null);

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .track(trackModel)
            .drivers(java.util.Arrays.asList(rp1))
            .heats(java.util.Arrays.asList(heat1))
            .seasonEntityId("s1")
            .databaseContext(dbCtx)
            .isDemoMode(true)
            .stateClassName("com.antigravity.race.states.RaceOver")
            .build();

    com.antigravity.service.DatabaseService dbService =
        org.mockito.Mockito.mock(com.antigravity.service.DatabaseService.class);
    org.mockito.Mockito.when(dbService.getSeason(dbCtx, "s1")).thenReturn(season);

    com.antigravity.service.DatabaseService origService =
        com.antigravity.service.DatabaseService.getInstance();
    // Swap DatabaseService instance temporarily or test toProto
    com.antigravity.service.DatabaseService.setInstance(dbService);
    try {
      com.antigravity.proto.Race proto = RaceConverter.toProto(race);
      assertNotNull(proto);
      assertEquals(1, proto.getSeasonStandingsCount());
      com.antigravity.proto.SeasonStanding standingProto = proto.getSeasonStandings(0);
      assertEquals("d1", standingProto.getDriverId());
      assertEquals(25.0, standingProto.getCurrentRaceOverallPoints(), 0.001);
      assertEquals(10.0, standingProto.getCurrentRaceOverallBonusPoints(), 0.001);
      assertEquals(5.0, standingProto.getCurrentRaceHeatPoints(), 0.001);
      assertEquals(2.0, standingProto.getCurrentRaceHeatBonusPoints(), 0.001);
      assertEquals(1, standingProto.getCurrentRaceOverallRank());
      assertEquals(42.0, standingProto.getCurrentRacePoints(), 0.001);
      assertEquals(
          10.0,
          standingProto.getCurrentRaceOverallBonusBreakdownMap().getOrDefault("fastest_lap", 0.0),
          0.001);
      assertEquals(
          2.0,
          standingProto
              .getCurrentRaceHeatBonusBreakdownMap()
              .getOrDefault("fastest_lap_heat_1", 0.0),
          0.001);
    } finally {
      com.antigravity.service.DatabaseService.setInstance(
          origService != null ? origService : new com.antigravity.service.DatabaseService());
    }
  }

  @Test
  public void testSerializeRaceWithEmptyLanes() {
    com.antigravity.models.Race raceModel =
        org.mockito.Mockito.mock(com.antigravity.models.Race.class);
    Track track = org.mockito.Mockito.mock(Track.class);
    List<com.antigravity.race.RaceParticipant> drivers = new ArrayList<>();

    // 1 real driver
    drivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Real Driver", "Real Nick", "real1", "1")));

    // 2 lanes
    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("Red", "red", 1));
    lanes.add(new com.antigravity.models.Lane("Blue", "blue", 2));
    org.mockito.Mockito.when(track.getLanes()).thenReturn(lanes);
    org.mockito.Mockito.when(track.getArduinoConfigs()).thenReturn(new ArrayList<>());
    org.mockito.Mockito.when(track.getEntityId()).thenReturn("track1");
    org.mockito.Mockito.when(track.getObjectId()).thenReturn("track1");
    org.mockito.Mockito.when(track.getName()).thenReturn("Track 1");

    org.mockito.Mockito.when(raceModel.getHeatRotationType())
        .thenReturn(HeatRotationType.RoundRobin);
    org.mockito.Mockito.when(raceModel.getHeatScoring()).thenReturn(new HeatScoring());
    org.mockito.Mockito.when(raceModel.getOverallScoring())
        .thenReturn(new com.antigravity.models.OverallScoring());
    org.mockito.Mockito.when(raceModel.getTrackEntityId()).thenReturn("track1");
    org.mockito.Mockito.when(raceModel.getEntityId()).thenReturn("race1");
    org.mockito.Mockito.when(raceModel.getObjectId()).thenReturn("race1");
    org.mockito.Mockito.when(raceModel.getName()).thenReturn("Race 1");

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(raceModel)
            .drivers(drivers)
            .track(track)
            .isDemoMode(true)
            .build();

    Set<String> sentObjectIds = new HashSet<>();
    com.antigravity.proto.Race proto = RaceConverter.toProto(race, sentObjectIds);

    assertNotNull(proto);
    assertEquals(2, proto.getDriversCount());

    com.antigravity.proto.RaceParticipant emptyParticipant = null;
    com.antigravity.proto.RaceParticipant realParticipant = null;

    for (com.antigravity.proto.RaceParticipant p : proto.getDriversList()) {
      if ("Real Driver".equals(p.getDriver().getName())) {
        realParticipant = p;
      } else if ("Empty".equals(p.getDriver().getName())) {
        emptyParticipant = p;
      }
    }

    assertNotNull(realParticipant);
    assertNotNull(emptyParticipant);

    assertEquals("Empty", emptyParticipant.getDriver().getName());
    assertEquals("Empty", emptyParticipant.getDriver().getNickname());
    assertEquals(
        com.antigravity.models.Driver.EMPTY_DRIVER_ID,
        emptyParticipant.getDriver().getModel().getEntityId());

    org.junit.Assert.assertTrue(proto.getHeatsCount() > 0);
    com.antigravity.proto.Heat heat0 = proto.getHeats(0);
    assertEquals(2, heat0.getHeatDriversCount());
  }

  @Test
  public void testToProto_PopulatesStartTimeMillis() {
    List<com.antigravity.models.Lane> lanes = new ArrayList<>();
    lanes.add(new com.antigravity.models.Lane("red", "white", 10));
    Track track =
        new Track.Builder().name("Track").lanes(lanes).arduinoConfigs(null).entityId("t1").build();

    List<com.antigravity.race.RaceParticipant> drivers = new ArrayList<>();
    drivers.add(
        new com.antigravity.race.RaceParticipant(
            new com.antigravity.models.Driver("Driver 1", "D1", "d1", null)));

    com.antigravity.race.Race race =
        new com.antigravity.race.Race.Builder()
            .model(new com.antigravity.models.Race.Builder().withName("Test Race").build())
            .track(track)
            .drivers(drivers)
            .isDemoMode(true)
            .build();

    long testStartMillis = 1756578000000L;
    race.getStatistics().setStartMillis(testStartMillis);

    com.antigravity.proto.Race proto = RaceConverter.toProto(race);
    assertNotNull(proto);
    assertEquals(testStartMillis, proto.getStartTimeMillis());
  }

  private void assertNotNull(Object obj) {
    org.junit.Assert.assertNotNull(obj);
  }
}
