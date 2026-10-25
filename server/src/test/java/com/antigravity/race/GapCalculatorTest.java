package com.antigravity.race;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.antigravity.models.HeatScoring;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;

public class GapCalculatorTest {

  @Test
  public void testGapCalculator_EqualLaps() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.0);
    when(leader.getTotalTime()).thenReturn(100.0);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(20.0);
    when(current.getTotalTime()).thenReturn(102.5);

    List<GapParticipant> participants = Arrays.asList(leader, current);

    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    org.mockito.Mockito.verify(leader).setGapLeader(0.0);
    org.mockito.Mockito.verify(leader).setGapPosition(0.0);

    org.mockito.Mockito.verify(current).setGapLeader(2.5); // 102.5 - 100.0
    org.mockito.Mockito.verify(current).setGapPosition(2.5);
  }

  @Test
  public void testGapCalculator_NoFullLaps() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(1.0);
    when(leader.getTotalTime()).thenReturn(5.0);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(0.0);
    when(current.getTotalTime()).thenReturn(0.0);
    when(current.hasNoFullLaps()).thenReturn(true);

    List<GapParticipant> participants = Arrays.asList(leader, current);

    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    org.mockito.Mockito.verify(current).setGapLeader(5.0); // leadTotalTime
    org.mockito.Mockito.verify(current).setGapPosition(5.0);
  }

  @Test
  public void testGapCalculator_TimedFinish() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(18.53);
    when(leader.getTotalTime()).thenReturn(88.0);
    when(leader.getAverageLapTime()).thenReturn(4.857);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(18.32);
    when(current.getTotalTime()).thenReturn(89.0);
    when(current.getAverageLapTime()).thenReturn(4.918);

    List<GapParticipant> participants = Arrays.asList(leader, current);

    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Timed);

    // lapDiff = 18.53 - 18.32 = 0.21
    // avgLapTime = 4.918
    org.mockito.Mockito.verify(current)
        .setGapLeader(org.mockito.AdditionalMatchers.eq(1.03278, 0.0001));
  }

  @Test
  public void testGapCalculator_LapFinish() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.25);
    when(leader.getTotalTime()).thenReturn(100.0);
    when(leader.getAverageLapTime()).thenReturn(5.0);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(18.0);
    when(current.getTotalTime()).thenReturn(95.0);
    when(current.getAverageLapTime()).thenReturn(5.5);

    List<GapParticipant> participants = Arrays.asList(leader, current);

    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    // timeDiff = 95 - 100 = -5.0
    // lapDiff = 20.25 - 18.0 = 2.25
    // projectedGap = -5.0 + 2.25 * 5.5 = -5.0 + 12.375 = 7.375
    org.mockito.Mockito.verify(current).setGapLeader(7.375);
  }

  @Test
  public void testGapCalculator_F1_SameLap() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.0);
    when(leader.getPhysicalLapCount()).thenReturn(20);
    when(leader.getTotalTime()).thenReturn(100.0);
    when(leader.getTimeAtLap(20)).thenReturn(100.0);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(20.0);
    when(current.getPhysicalLapCount()).thenReturn(20);
    when(current.getTotalTime()).thenReturn(102.5);
    when(current.getTimeAtLap(20)).thenReturn(102.5);

    List<GapParticipant> participants = Arrays.asList(leader, current);
    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    // F1 Gap Leader
    org.mockito.Mockito.verify(leader).setGapLeaderF1(0.0);
    org.mockito.Mockito.verify(leader).setLapsDownLeader(0);

    // F1 Gap Current
    org.mockito.Mockito.verify(current).setGapLeaderF1(2.5);
    org.mockito.Mockito.verify(current).setLapsDownLeader(0);
  }

  @Test
  public void testGapCalculator_F1_LapsDown() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.0);
    when(leader.getPhysicalLapCount()).thenReturn(20);
    when(leader.getTotalTime()).thenReturn(100.0);

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(18.0);
    when(current.getPhysicalLapCount()).thenReturn(18);
    when(current.getTotalTime()).thenReturn(95.0);

    List<GapParticipant> participants = Arrays.asList(leader, current);
    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    // F1 Gap Leader
    org.mockito.Mockito.verify(leader).setGapLeaderF1(0.0);
    org.mockito.Mockito.verify(leader).setLapsDownLeader(0);

    // F1 Gap Current
    org.mockito.Mockito.verify(current).setGapLeaderF1(0.0);
    org.mockito.Mockito.verify(current).setLapsDownLeader(1);
  }

  @Test
  public void testGapCalculator_AlwaysLaps_AllParticipants() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.0);
    when(leader.getEffectiveLapCount()).thenReturn(20.4); // 20 laps + 0.4 partial

    GapParticipant current = mock(GapParticipant.class);
    when(current.getAdjustedLapCount()).thenReturn(18.0);
    when(current.getEffectiveLapCount()).thenReturn(18.0);

    List<GapParticipant> participants = Arrays.asList(leader, current);
    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    org.mockito.Mockito.verify(leader).setGapLeaderLaps(0.0);
    org.mockito.Mockito.verify(leader).setGapPositionLaps(0.0);

    org.mockito.Mockito.verify(current)
        .setGapLeaderLaps(org.mockito.AdditionalMatchers.eq(2.4, 0.0001));
    org.mockito.Mockito.verify(current)
        .setGapPositionLaps(org.mockito.AdditionalMatchers.eq(2.4, 0.0001));
  }

  @Test
  public void testGapCalculator_AlwaysLaps_SingleDriverCompletedLap() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(20.0);
    when(leader.getEffectiveLapCount()).thenReturn(20.5);

    GapParticipant p2 = mock(GapParticipant.class);
    when(p2.getAdjustedLapCount()).thenReturn(19.0);
    when(p2.getEffectiveLapCount()).thenReturn(19.2);

    GapParticipant p3 = mock(GapParticipant.class);
    when(p3.getAdjustedLapCount()).thenReturn(18.0); // p3 just completed lap 18
    when(p3.getEffectiveLapCount()).thenReturn(18.0);

    List<GapParticipant> participants = Arrays.asList(leader, p2, p3);
    GapCalculator.calculateLapGapsForDriver(p3, participants);

    org.mockito.Mockito.verify(p3).setGapLeaderLaps(org.mockito.AdditionalMatchers.eq(2.5, 0.0001));
    org.mockito.Mockito.verify(p3)
        .setGapPositionLaps(org.mockito.AdditionalMatchers.eq(1.2, 0.0001));
  }

  @Test
  public void testGapCalculator_AlwaysLaps_PartialSegments() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(1.62);
    when(leader.getEffectiveLapCount()).thenReturn(1.62);
    when(leader.getPhysicalLapCount()).thenReturn(1);
    when(leader.getTotalTime()).thenReturn(4.705);

    GapParticipant p2 = mock(GapParticipant.class);
    when(p2.getAdjustedLapCount()).thenReturn(1.58);
    when(p2.getEffectiveLapCount()).thenReturn(1.58);
    when(p2.getPhysicalLapCount()).thenReturn(1);
    when(p2.getTotalTime()).thenReturn(4.805);

    GapParticipant p3 = mock(GapParticipant.class);
    when(p3.getAdjustedLapCount()).thenReturn(1.49);
    when(p3.getEffectiveLapCount()).thenReturn(1.49);
    when(p3.getPhysicalLapCount()).thenReturn(1);
    when(p3.getTotalTime()).thenReturn(5.103);

    List<GapParticipant> participants = Arrays.asList(leader, p2, p3);
    GapCalculator.calculateGaps(participants, HeatScoring.FinishMethod.Lap);

    org.mockito.Mockito.verify(leader).setGapLeaderLaps(0.0);
    org.mockito.Mockito.verify(leader).setGapPositionLaps(0.0);

    // Bad Cheese: 1.62 - 1.58 = 0.04
    org.mockito.Mockito.verify(p2)
        .setGapLeaderLaps(org.mockito.AdditionalMatchers.eq(0.04, 0.0001));
    org.mockito.Mockito.verify(p2)
        .setGapPositionLaps(org.mockito.AdditionalMatchers.eq(0.04, 0.0001));
    org.mockito.Mockito.verify(p2).setGapLeader(org.mockito.AdditionalMatchers.eq(0.100, 0.0001));
    org.mockito.Mockito.verify(p2).setGapPosition(org.mockito.AdditionalMatchers.eq(0.100, 0.0001));

    // Bank Farter: 1.62 - 1.49 = 0.13 to leader, 1.58 - 1.49 = 0.09 to position ahead
    org.mockito.Mockito.verify(p3)
        .setGapLeaderLaps(org.mockito.AdditionalMatchers.eq(0.13, 0.0001));
    org.mockito.Mockito.verify(p3)
        .setGapPositionLaps(org.mockito.AdditionalMatchers.eq(0.09, 0.0001));
    org.mockito.Mockito.verify(p3).setGapLeader(org.mockito.AdditionalMatchers.eq(0.398, 0.0001));
    org.mockito.Mockito.verify(p3).setGapPosition(org.mockito.AdditionalMatchers.eq(0.298, 0.0001));
  }

  @Test
  public void testGapCalculator_AlwaysLaps_LeaderCompletedLap() {
    GapParticipant leader = mock(GapParticipant.class);
    when(leader.getAdjustedLapCount()).thenReturn(21.0);

    GapParticipant p2 = mock(GapParticipant.class);
    when(p2.getAdjustedLapCount()).thenReturn(19.0);

    List<GapParticipant> participants = Arrays.asList(leader, p2);
    GapCalculator.calculateLapGapsForDriver(leader, participants);

    org.mockito.Mockito.verify(leader).setGapLeaderLaps(0.0);
    org.mockito.Mockito.verify(leader).setGapPositionLaps(0.0);
  }

  @Test
  public void testGapCalculator_AlwaysLaps_EmptyParticipant() {
    GapParticipant leader = mock(GapParticipant.class);
    GapParticipant empty = mock(GapParticipant.class);
    when(empty.isEmptyParticipant()).thenReturn(true);

    List<GapParticipant> participants = Arrays.asList(leader, empty);
    GapCalculator.calculateLapGapsForDriver(empty, participants);

    org.mockito.Mockito.verify(empty).setGapLeaderLaps(0.0);
    org.mockito.Mockito.verify(empty).setGapPositionLaps(0.0);
  }
}
