package com.antigravity.race;

import java.util.List;

public class Heat extends ServerToClientObject {
    private int heatNumber;
    private List<DriverHeatData> drivers;
    private List<String> standings;

    private HeatStandings heatStandings;

    public Heat(int heatNumber, List<DriverHeatData> drivers, com.antigravity.models.RaceScoring scoring) {
        super();
        this.heatNumber = heatNumber;
        this.drivers = drivers;
        this.heatStandings = new HeatStandings(drivers, scoring.getHeatRanking(), scoring.getHeatRankingTiebreaker());
        this.standings = this.heatStandings.getStandings();
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

    public void setStandings(List<String> standings) {
        this.standings = standings;
    }

    public void setHeatNumber(int heatNumber) {
        this.heatNumber = heatNumber;
    }
}
