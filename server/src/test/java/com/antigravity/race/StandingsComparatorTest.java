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
    private final boolean disqualified;
    private final int seed;
    private final List<Double> sortedLaps;
    private final double bestLapRecordedTime;

    public MockParticipant(
        String id,
        double laps,
        double totalTime,
        double bestLap,
        double avgLap,
        double medianLap,
        boolean empty,
        int seed) {
      this(
          id,
          laps,
          totalTime,
          bestLap,
          avgLap,
          medianLap,
          empty,
          false,
          seed,
          java.util.Collections.emptyList(),
          Double.MAX_VALUE);
    }

    public MockParticipant(
        String id,
        double laps,
        double totalTime,
        double bestLap,
        double avgLap,
        double medianLap,
        boolean empty,
        boolean disqualified,
        int seed) {
      this(
          id,
          laps,
          totalTime,
          bestLap,
          avgLap,
          medianLap,
          empty,
          disqualified,
          seed,
          java.util.Collections.emptyList(),
          Double.MAX_VALUE);
    }

    public MockParticipant(
        String id,
        double laps,
        double totalTime,
        double bestLap,
        double avgLap,
        double medianLap,
        boolean empty,
        int seed,
        List<Double> sortedLaps,
        double bestLapRecordedTime) {
      this(
          id,
          laps,
          totalTime,
          bestLap,
          avgLap,
          medianLap,
          empty,
          false,
          seed,
          sortedLaps,
          bestLapRecordedTime);
    }

    public MockParticipant(
        String id,
        double laps,
        double totalTime,
        double bestLap,
        double avgLap,
        double medianLap,
        boolean empty,
        boolean disqualified,
        int seed,
        List<Double> sortedLaps,
        double bestLapRecordedTime) {
      this.id = id;
      this.laps = laps;
      this.totalTime = totalTime;
      this.bestLap = bestLap;
      this.avgLap = avgLap;
      this.medianLap = medianLap;
      this.empty = empty;
      this.disqualified = disqualified;
      this.seed = seed;
      this.sortedLaps = sortedLaps != null ? sortedLaps : java.util.Collections.emptyList();
      this.bestLapRecordedTime = bestLapRecordedTime;
    }

    @Override
    public boolean isDisqualified() {
      return disqualified;
    }

    @Override
    public List<Double> getSortedValidLapTimes() {
      return sortedLaps;
    }

    @Override
    public double getBestLapRecordedTime() {
      return bestLapRecordedTime;
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

  @Test
  public void testFallbackTiebreakerFastestLap() {
    // Both 10 laps, both avg 5.0, both seed 0, but p1 has faster best lap
    MockParticipant p1 = new MockParticipant("p1", 10, 50.0, 4.0, 5.0, 5.0, false, 0);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.5, 5.0, 5.0, false, 0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertTrue("p1 with faster best lap should rank higher", comparator.compare(p1, p2) < 0);
    Assert.assertTrue("p2 should rank lower", comparator.compare(p2, p1) > 0);
  }

  @Test
  public void testFallbackTiebreakerTotalTime() {
    // Both 10 laps, both avg 5.0, both best lap 4.0, both seed 0, but p1 has lower total time
    MockParticipant p1 = new MockParticipant("p1", 10, 48.0, 4.0, 5.0, 5.0, false, 0);
    MockParticipant p2 = new MockParticipant("p2", 10, 50.0, 4.0, 5.0, 5.0, false, 0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertTrue(
        "p1 with lower total time should rank higher", comparator.compare(p1, p2) < 0);
    Assert.assertTrue("p2 should rank lower", comparator.compare(p2, p1) > 0);
  }

  @Test
  public void testDriverHeatDataAutoCalculatedLapsIgnoredUntilFinished() {
    com.antigravity.models.Driver dModel1 = new com.antigravity.models.Driver("D1", "Driver 1");
    com.antigravity.models.Driver dModel2 = new com.antigravity.models.Driver("D2", "Driver 2");
    DriverHeatData dhd1 = new DriverHeatData(new RaceParticipant(dModel1));
    DriverHeatData dhd2 = new DriverHeatData(new RaceParticipant(dModel2));

    // Both drivers have completed 10 laps.
    // dhd1 has a faster best lap (4.0s vs 5.0s).
    // dhd2 has coasted further during pause (autoCalculatedLaps = 0.8 vs 0.2).
    for (int i = 0; i < 9; i++) {
      dhd1.addLap(5.0, false, true);
      dhd2.addLap(5.0, false, true);
    }
    dhd1.addLap(4.0, false, true);
    dhd2.addLap(5.0, false, true);

    dhd1.setAutoCalculatedLaps(0.2);
    dhd2.setAutoCalculatedLaps(0.8);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.FASTEST_LAP_TIME);

    // While unfinished (active heat or pause):
    // Scored laps for both are 10.0 (pause auto-segments are ignored).
    // Tiebreaker on fastest lap breaks the tie: dhd1 (4.0s) beats dhd2 (5.0s).
    Assert.assertFalse(dhd1.isFinished());
    Assert.assertFalse(dhd2.isFinished());
    Assert.assertTrue(
        "dhd1 should rank ahead of dhd2 based on tiebreaker while unfinished",
        comparator.compare(dhd1, dhd2) < 0);

    // Once finished:
    // Auto-calculated laps count into the final score: dhd2 has 10.8 laps vs dhd1's 10.2 laps.
    // dhd2 now ranks ahead on lap count.
    dhd1.setFinished(true);
    dhd2.setFinished(true);
    Assert.assertTrue(
        "dhd2 should rank ahead of dhd1 on lap count once finished",
        comparator.compare(dhd2, dhd1) < 0);
  }

  @Test
  public void testLapCountRankingSameLapsDifferentTotalTime() {
    // p1 has faster best lap, but p2 completed the 10 laps in less elapsed time
    MockParticipant p1 = new MockParticipant("p1", 10, 52.0, 3.5, 5.2, 5.2, false, 1);
    MockParticipant p2 = new MockParticipant("p2", 10, 48.0, 4.2, 4.8, 4.8, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.FASTEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals(
        "p2 should lead because it reached 10 laps first", "p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapTiebreaker_FirstToSetTime() {
    MockParticipant p1 =
        new MockParticipant(
            "p1", 5, 30.0, 5.0, 6.0, 6.0, false, 1, Arrays.asList(5.0, 6.0, 6.0, 6.0, 7.0), 20.0);
    MockParticipant p2 =
        new MockParticipant(
            "p2", 5, 35.0, 5.0, 7.0, 7.0, false, 2, Arrays.asList(5.0, 7.0, 7.0, 8.0, 8.0), 32.0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.FIRST_TO_SET_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p2, p1));
    list.sort(comparator);

    Assert.assertEquals(
        "p1 set the fast lap earlier (20s vs 32s)", "p1", list.get(0).getParticipantId());
    Assert.assertEquals("p2", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapTiebreaker_SecondBestLap() {
    MockParticipant p1 =
        new MockParticipant(
            "p1", 3, 20.0, 5.0, 6.0, 6.0, false, 1, Arrays.asList(5.0, 5.3, 5.5), 10.0);
    MockParticipant p2 =
        new MockParticipant(
            "p2", 3, 20.0, 5.0, 6.0, 6.0, false, 2, Arrays.asList(5.0, 5.1, 5.6), 15.0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.SECOND_BEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2 has better 2nd lap (5.1 vs 5.3)", "p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapTiebreaker_NthBestLapDeepComparison() {
    MockParticipant p1 =
        new MockParticipant(
            "p1", 3, 20.0, 5.0, 6.0, 6.0, false, 1, Arrays.asList(5.0, 5.1, 5.5), 10.0);
    MockParticipant p2 =
        new MockParticipant(
            "p2", 3, 20.0, 5.0, 6.0, 6.0, false, 2, Arrays.asList(5.0, 5.1, 5.3), 15.0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.SECOND_BEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);

    Assert.assertEquals("p2 has better 3rd lap (5.3 vs 5.5)", "p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testFastestLapTiebreaker_MoreLapsWinsWhenTied() {
    MockParticipant p1 =
        new MockParticipant("p1", 2, 15.0, 5.0, 6.0, 6.0, false, 1, Arrays.asList(5.0, 5.2), 10.0);
    MockParticipant p2 =
        new MockParticipant("p2", 1, 10.0, 5.0, 5.0, 5.0, false, 2, Arrays.asList(5.0), 10.0);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.FASTEST_LAP, TiebreakerMethod.SECOND_BEST_LAP_TIME);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p2, p1));
    list.sort(comparator);

    Assert.assertEquals("p1 has a 2nd lap while p2 does not", "p1", list.get(0).getParticipantId());
    Assert.assertEquals("p2", list.get(1).getParticipantId());
  }

  @Test
  public void testDisqualifiedParticipantSortsBelowNonDisqualified() {
    // p1 has 20 laps but is DQ'd; p2 has 5 laps and is NOT DQ'd
    MockParticipant p1 = new MockParticipant("p1", 20.0, 100.0, 5.0, 5.0, 5.0, false, true, 1);
    MockParticipant p2 = new MockParticipant("p2", 5.0, 30.0, 6.0, 6.0, 6.0, false, false, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertTrue("DQ participant must rank lower than non-DQ", comparator.compare(p1, p2) > 0);
    Assert.assertTrue(
        "Non-DQ participant must rank higher than DQ", comparator.compare(p2, p1) < 0);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p1, p2));
    list.sort(comparator);
    Assert.assertEquals("p2", list.get(0).getParticipantId());
    Assert.assertEquals("p1", list.get(1).getParticipantId());
  }

  @Test
  public void testMultipleDisqualifiedParticipantsComparedByScore() {
    // Both p1 and p2 are DQ'd; p1 has 15 laps, p2 has 10 laps
    MockParticipant p1 = new MockParticipant("p1", 15.0, 75.0, 5.0, 5.0, 5.0, false, true, 1);
    MockParticipant p2 = new MockParticipant("p2", 10.0, 50.0, 5.0, 5.0, 5.0, false, true, 2);

    StandingsComparator<StandingsParticipant> comparator =
        new StandingsComparator<>(RankingMethod.LAP_COUNT, TiebreakerMethod.AVERAGE_LAP_TIME);

    Assert.assertTrue("Higher scoring DQ participant ranks higher", comparator.compare(p1, p2) < 0);
    Assert.assertTrue("Lower scoring DQ participant ranks lower", comparator.compare(p2, p1) > 0);

    List<StandingsParticipant> list = new ArrayList<>(Arrays.asList(p2, p1));
    list.sort(comparator);
    Assert.assertEquals("p1", list.get(0).getParticipantId());
    Assert.assertEquals("p2", list.get(1).getParticipantId());
  }
}
