package com.antigravity.race;

import org.junit.Test;
import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.List;
import com.antigravity.models.Driver;
import com.antigravity.models.RaceScoring;
import com.antigravity.models.RaceScoring.HeatRanking;
import com.antigravity.models.RaceScoring.HeatRankingTiebreaker;
import com.antigravity.models.RaceScoring.FinishMethod;

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

        RaceScoring scoring = new RaceScoring(FinishMethod.Lap, 10, HeatRanking.LAP_COUNT,
                HeatRankingTiebreaker.FASTEST_LAP_TIME);

        return new Heat(number, dhdList, scoring);
    }

    @Test
    public void testSimpleRanking() {
        // Use FASTEST_LAP_TIME as tiebreaker
        RaceScoring scoring = new RaceScoring(FinishMethod.Lap, 10, HeatRanking.LAP_COUNT,
                HeatRankingTiebreaker.FASTEST_LAP_TIME);
        OverallStandings os = new OverallStandings(scoring);

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
        RaceScoring scoring = new RaceScoring(FinishMethod.Lap, 10, HeatRanking.LAP_COUNT,
                HeatRankingTiebreaker.FASTEST_LAP_TIME);
        OverallStandings os = new OverallStandings(scoring);
        os.setDroppedHeats(1);

        RaceParticipant p1 = createDriver("D1", "id1");
        List<RaceParticipant> drivers = new ArrayList<>();
        drivers.add(p1);

        List<Heat> heats = new ArrayList<>();
        // Note: For createHeat helper, P1 is first arg, P2 is second.
        // We reuse p1 for both slots to simplify helper usage or pass dummy p2.
        RaceParticipant dummy = createDriver("Dummy", "dummy");

        // Heat 1: 10 laps (Good)
        heats.add(createHeat(1, p1, 10, 100.0f, dummy, 0, 0));
        // Heat 2: 5 laps (Bad heat - should be dropped)
        heats.add(createHeat(2, p1, 5, 100.0f, dummy, 0, 0));
        // Heat 3: 12 laps (Best heat)
        heats.add(createHeat(3, p1, 12, 100.0f, dummy, 0, 0));

        // Should drop Heat 2 (5 laps). Total = 10 + 12 = 22.
        os.recalculate(drivers, heats);

        assertEquals(22, p1.getTotalLaps());
    }
}