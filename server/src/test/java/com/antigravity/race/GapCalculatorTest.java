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
}
