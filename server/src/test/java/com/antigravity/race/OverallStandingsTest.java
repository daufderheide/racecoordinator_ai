package com.antigravity.race;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.List;
import com.antigravity.models.Driver;
import com.antigravity.models.HeatScoring;
import com.antigravity.models.HeatScoring.HeatRanking;
import com.antigravity.models.HeatScoring.HeatRankingTiebreaker;
import com.antigravity.models.HeatScoring.FinishMethod;
import com.antigravity.models.OverallScoring;
import com.antigravity.models.OverallScoring.OverallRanking;
import com.antigravity.models.OverallScoring.OverallRankingTiebreaker;

public class OverallStandingsTest {

        private RaceParticipant createDriver(String name, String id) {
                // Driver(name, nickname, entityId, objectId)
                Driver d = new Driver(name, "nick", id, null);
                // RaceParticipant(driver, objectId)
                RaceParticipant rp = new RaceParticipant(d, id);
                return rp;
        }

        private Heat createHeat(int number, RaceParticipant p1, double laps1, double time1, RaceParticipant p2,
                        double laps2, double time2) {
                List<DriverHeatData> dhdList = new ArrayList<>();

                DriverHeatData d1 = new DriverHeatData(p1);
                // Add laps to simulate average time
                for (int i = 0; i < laps1; i++)
                        d1.addLap(time1 / laps1);

                DriverHeatData d2 = new DriverHeatData(p2);
                for (int i = 0; i < laps2; i++)
                        d2.addLap(time2 / laps2);

                dhdList.add(d1);
                dhdList.add(d2);

                HeatScoring scoring = new HeatScoring(FinishMethod.Lap, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.FASTEST_LAP_TIME);

                return new Heat(number, dhdList, scoring);
        }

        @Test
        public void testSimpleRanking() {
                // Use FASTEST_LAP_TIME as tiebreaker
                HeatScoring heatScoring = new HeatScoring(FinishMethod.Timed, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.FASTEST_LAP_TIME);
                OverallScoring overallScoring = new OverallScoring(0, OverallRanking.LAP_COUNT,
                                OverallRankingTiebreaker.FASTEST_LAP_TIME);
                OverallStandings os = new OverallStandings(heatScoring, overallScoring);

                RaceParticipant p1 = createDriver("D1", "id1");
                RaceParticipant p2 = createDriver("D2", "id2");
                List<RaceParticipant> drivers = new ArrayList<>();
                drivers.add(p1);
                drivers.add(p2);

                List<Heat> heats = new ArrayList<>();
                // Heat 1: P1 wins (10 laps, 100s), P2 (9 laps, 100s)
                heats.add(createHeat(1, p1, 10, 100.0f, p2, 9, 100.0f));

                os.recalculate(drivers, heats);

                assertEquals(1, p1.getRank());
                assertEquals(2, p2.getRank());
                assertEquals(10, p1.getTotalLaps());
                assertEquals(9, p2.getTotalLaps());
        }

        @Test
        public void testDroppedHeats() {
                HeatScoring heatScoring = new HeatScoring(FinishMethod.Timed, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.MEDIAN_LAP_TIME);
                OverallScoring overallScoring = new OverallScoring(1, OverallRanking.LAP_COUNT,
                                OverallRankingTiebreaker.MEDIAN_LAP_TIME);
                OverallStandings os = new OverallStandings(heatScoring, overallScoring);

                RaceParticipant p1 = createDriver("D1", "id1");
                List<RaceParticipant> drivers = new ArrayList<>();
                drivers.add(p1);

                List<Heat> heats = new ArrayList<>();
                RaceParticipant dummy = createDriver("Dummy", "dummy");

                // Heat 1: 10 laps (Good)
                heats.add(createHeat(1, p1, 10, 100.0f, dummy, 0, 0));
                // Heat 2: 5 laps (Bad heat - should be dropped)
                heats.add(createHeat(2, p1, 5, 200.0f, dummy, 0, 0));
                // Heat 3: 12 laps (Best heat)
                heats.add(createHeat(3, p1, 12, 120.0f, dummy, 0, 0));

                // Should drop Heat 2 (5 laps). Total = 10 + 12 = 22. Total time = 100 + 120 =
                // 220.
                os.recalculate(drivers, heats);

                assertEquals(22, p1.getTotalLaps());
                assertEquals(220.0f, p1.getTotalTime(), 0.001);
        }

        @Test
        public void testTiebreakers() {
                // Main criteria: LAP_COUNT, Tiebreaker: AVERAGE_LAP_TIME
                HeatScoring heatScoring = new HeatScoring(FinishMethod.Timed, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.AVERAGE_LAP_TIME);
                OverallScoring overallScoring = new OverallScoring(0, OverallRanking.LAP_COUNT,
                                OverallRankingTiebreaker.AVERAGE_LAP_TIME);
                OverallStandings os = new OverallStandings(heatScoring, overallScoring);

                RaceParticipant p1 = createDriver("D1", "id1");
                RaceParticipant p2 = createDriver("D2", "id2");
                List<RaceParticipant> drivers = new ArrayList<>();
                drivers.add(p1);
                drivers.add(p2);

                List<Heat> heats = new ArrayList<>();
                // Both P1 and P2 have 10 laps, but P1 is faster (100s vs 110s)
                heats.add(createHeat(1, p1, 10, 100.0, p2, 10, 110.0));

                os.recalculate(drivers, heats);

                assertEquals(1, p1.getRank());
                assertEquals(2, p2.getRank());
                assertEquals(10.0, p1.getAverageLapTime(), 0.001);
                assertEquals(11.0, p2.getAverageLapTime(), 0.001);

                // Switch to MEDIAN_LAP_TIME
                heatScoring = new HeatScoring(FinishMethod.Lap, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.MEDIAN_LAP_TIME);
                overallScoring = new OverallScoring(0, OverallRanking.LAP_COUNT,
                                OverallRankingTiebreaker.MEDIAN_LAP_TIME);
                os = new OverallStandings(heatScoring, overallScoring);

                p1 = createDriver("D1", "id1");
                p2 = createDriver("D2", "id2");
                drivers.clear();
                drivers.add(p1);
                drivers.add(p2);
                heats.clear();

                // P1: 10, 10, 10 (Median 10)
                // P2: 5, 15, 15 (Median 15)
                // Both have 30s total, 3 laps.

                DriverHeatData d1 = new DriverHeatData(p1);
                d1.addLap(10.0);
                d1.addLap(10.0);
                d1.addLap(10.0);

                DriverHeatData d2 = new DriverHeatData(p2);
                d2.addLap(5.0);
                d2.addLap(15.0);
                d2.addLap(15.0);

                List<DriverHeatData> dhdList = new ArrayList<>();
                dhdList.add(d1);
                dhdList.add(d2);
                heats.add(new Heat(1, dhdList, heatScoring));

                os.recalculate(drivers, heats);

                assertEquals(1, p1.getRank());
                assertEquals(2, p2.getRank());
                assertEquals(10.0, p1.getMedianLapTime(), 0.001);
                assertEquals(15.0, p2.getMedianLapTime(), 0.001);
        }

        @Test
        public void testAverageLapRanking() {
                HeatScoring heatScoring = new HeatScoring(FinishMethod.Timed, 10, HeatRanking.LAP_COUNT,
                                HeatRankingTiebreaker.AVERAGE_LAP_TIME);
                OverallScoring overallScoring = new OverallScoring(0, OverallRanking.AVERAGE_LAP,
                                OverallRankingTiebreaker.TOTAL_TIME);
                OverallStandings os = new OverallStandings(heatScoring, overallScoring);

                RaceParticipant p1 = createDriver("D1", "id1");
                RaceParticipant p2 = createDriver("D2", "id2");
                List<RaceParticipant> drivers = new ArrayList<>();
                drivers.add(p1);
                drivers.add(p2);

                List<Heat> heats = new ArrayList<>();
                // P1: 10 laps, 100s (Average 10s)
                // P2: 10 laps, 90s (Average 9s) - P2 should be #1
                heats.add(createHeat(1, p1, 10, 100.0, p2, 10, 90.0));

                os.recalculate(drivers, heats);

                assertEquals(1, p2.getRank());
                assertEquals(2, p1.getRank());
                assertEquals(9.0, p2.getAverageLapTime(), 0.001);
                assertEquals(10.0, p1.getAverageLapTime(), 0.001);
        }
}