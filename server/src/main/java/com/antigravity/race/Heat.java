package com.antigravity.race;

import java.util.List;

public class Heat extends ServerToClientObject {
    private int heatNumber;
    private List<DriverHeatData> drivers;
    private HeatStandings heatStandings;

    public Heat(int heatNumber, List<DriverHeatData> drivers, com.antigravity.models.HeatScoring scoring) {
        super();
        this.heatNumber = heatNumber;
        this.drivers = drivers;
        com.antigravity.models.HeatScoring safeScoring = scoring != null ? scoring
                : new com.antigravity.models.HeatScoring();
        this.heatStandings = new HeatStandings(drivers, safeScoring.getHeatRanking(),
                safeScoring.getHeatRankingTiebreaker());
    }

    public int getHeatNumber() {
        return heatNumber;
    }

    public List<DriverHeatData> getDrivers() {
        return drivers;
    }

    public List<String> getStandings() {
        return heatStandings.getStandings();
    }

    public HeatStandings getHeatStandings() {
        return heatStandings;
    }

    public void setHeatNumber(int heatNumber) {
        this.heatNumber = heatNumber;
    }
}
