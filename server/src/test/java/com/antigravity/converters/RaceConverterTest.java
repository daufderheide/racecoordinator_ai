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
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

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
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

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
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

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
            true,
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
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

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
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(
        com.antigravity.proto.HeatRotationType.SINGLE_HEAT_SOLO, proto.getHeatRotationType());
    assertEquals(2, proto.getSoloLaneIndex());
  }
}
