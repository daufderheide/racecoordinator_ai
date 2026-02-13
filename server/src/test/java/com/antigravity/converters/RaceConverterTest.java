package com.antigravity.converters;

import com.antigravity.models.HeatScoring;
import com.antigravity.models.Race;
import com.antigravity.models.Track;
import com.antigravity.proto.RaceModel;
import org.junit.Test;

import java.util.HashSet;
import java.util.ArrayList;

import static org.junit.Assert.assertEquals;

public class RaceConverterTest {

  @Test
  public void testToProto_AllowFinish_None() {
    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        15,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.None);
    Race race = new Race("Test Race", "track-id", null, heatScoring, null);
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(com.antigravity.proto.HeatScoring.AllowFinish.AF_NONE, proto.getHeatScoring().getAllowFinish());
  }

  @Test
  public void testToProto_AllowFinish_Allow() {
    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        15,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.Allow);
    Race race = new Race("Test Race", "track-id", null, heatScoring, null);
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(com.antigravity.proto.HeatScoring.AllowFinish.AF_ALLOW, proto.getHeatScoring().getAllowFinish());
  }

  @Test
  public void testToProto_AllowFinish_SingleLap() {
    HeatScoring heatScoring = new HeatScoring(
        HeatScoring.FinishMethod.Timed,
        15,
        HeatScoring.HeatRanking.LAP_COUNT,
        HeatScoring.HeatRankingTiebreaker.FASTEST_LAP_TIME,
        HeatScoring.AllowFinish.SingleLap);
    Race race = new Race("Test Race", "track-id", null, heatScoring, null);
    Track track = new Track("Test Track", new ArrayList<>(), null, "track-id", null);

    RaceModel proto = RaceConverter.toProto(race, track, new HashSet<>());

    assertEquals(com.antigravity.proto.HeatScoring.AllowFinish.AF_SINGLE_LAP, proto.getHeatScoring().getAllowFinish());
  }
}
