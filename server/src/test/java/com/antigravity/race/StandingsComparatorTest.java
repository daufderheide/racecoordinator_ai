package com.antigravity.race;

import com.antigravity.models.RankingMethod;
import com.antigravity.models.TiebreakerMethod;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Assert;
import org.junit.Test;

public class StandingsComparatorTest {

  private static class MockParticipant implements StandingsParticipant {
    private final String id;
    private final double laps;
    private final double totalTime;
    private final double bestLap;
    private final double avgLap;
    private final double medianLap;
    private final boolean empty;
    private final int seed;

    public MockParticipant(
        String id,
        double laps,
        double totalTime,
        double bestLap,
        double avgLap,
        double medianLap,
        boolean empty,
        int seed) {
      this.id = id;
      this.laps = laps;
      this.totalTime = totalTime;
      this.bestLap = bestLap;
      this.avgLap = avgLap;
      this.medianLap = medianLap;
      this.empty = empty;
      this.seed = seed;
    }

    @Override
    public double getAdjustedLapCount() {
      return laps;
    }

    @Override
    public double getTotalTime() {
      return totalTime;
    }

    @Override
    public double getBestLapTime() {
      return bestLap;
    }

    @Override
    public double getAverageLapTime() {
      return avgLap;
    }

    @Override
    public double getMedianLapTime() {
      return medianLap;
    }

    @Override
    public boolean isEmptyParticipant() {
      return empty;
    }

    @Override
    public int getSeed() {
      return seed;
    }

    @Override
    public String getParticipantId() {
      return id;
    }
  }

  @Test
  public void testNullParticipantHandling() {
    MockParticipant p = new MockParticipant("p1", 5, 20.0, 4.0, 4.0, 4.0, false, 1);
    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertEquals(0, comparator.compare(null, null));
    Assert.assertEquals(1, comparator.compare(null, p));
    Assert.assertEquals(-1, comparator.compare(p, null));
  }

  @Test
  public void testConstructorDefaults() {
    StandingsComparator<StandingsParticipant> comparator = new StandingsComparator<>(null, null);
    Assert.assertEquals(RankingMethod.LAP_COUNT, comparator.getRankingMethod());
    Assert.assertEquals(TiebreakerMethod.AVERAGE_LAP_TIME, comparator.getTiebreakerMethod());
  }

  @Test
  public void testBothEmptyParticipants() {
    MockParticipant e1 = new MockParticipant("e1", 0, 0, 0, 0, 0, true, 1);
    MockParticipant e2 = new MockParticipant("e2", 0, 0, 0, 0, 0, true, 2);
    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertEquals(0, comparator.compare(e1, e2));
  }

  @Test
  public void testEmptyParticipantsSortToBottom() {
    MockParticipant active = new MockParticipant("p1", 5, 20.0, 4.0, 4.0, 4.0, false, 1);
    MockParticipant empty = new MockParticipant("p2", 10, 10.0, 1.0, 1.0, 1.0, true, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(empty, active));
    list.sort(comparator);

    Assert.assertEquals("p1", list.get(0).getParticipantId());
    Assert.assertEquals("p2", list.get(1).getParticipantId());
  }

  @Test
  public void testLapCountRanking() {
    MockParticipant p1 = new MockParticipant("p1", 10.5, 50.0, 4.5, 4.8, 4.7, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 12.0, 60.0, 5.0, 5.0, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapRanking() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.2, 5.0, 5.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 3.8, 5.0, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapRankingZeroLapTimeTreatedAsMax() {
    MockParticipant p1 = new MockParticipant("p1", 0, 0.0, 0.0, 0.0, 0.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 1, 10.0, 10.0, 10.0, 10.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testTotalTimeRanking() {
    MockParticipant p1 = new MockParticipant("p1", 10, 48.5, 4.5, 4.85, 4.8, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 47.0, 4.6, 4.70, 4.7, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.TOTAL_TIME, TiebreakerMethod.FASTEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testTotalTimeRankingDifferentLapsPrioritizesLaps() {
    MockParticipant p1 = new MockParticipant("p1", 10, 30.0, 3.0, 3.0, 3.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 12, 40.0, 3.3, 3.3, 3.3, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.TOTAL_TIME, TiebreakerMethod.FASTEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testAverageLapRanking() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 4.9, 4.9, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.5, 4.6, 4.6, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.AVERAGE_LAP, TiebreakerMethod.FASTEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapTiebreaker() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.2, 5.0, 5.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 3.9, 5.0, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.FASTEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testMedianLapTiebreaker() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 5.0, 4.8, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.0, 5.0, 4.5, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.MEDIAN_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testAverageLapTiebreaker() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 4.9, 5.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.0, 4.7, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testTotalTimeTiebreaker() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 5.0, 5.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 48.0, 4.0, 5.0, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.TOTAL_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testSeedFallbackTiebreaker() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 5.0, 5.0, false, 5);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.0, 5.0, 5.0, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testIdenticalParticipantsReturnZero() {
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 5.0, 5.0, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.0, 5.0, 5.0, false, 1);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertEquals(0, comparator.compare(p1, p2));
  }
}
