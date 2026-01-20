package com.antigravity.race;

import java.util.List;

public class Heat extends ServerToClientObject {
    private int heatNumber;
    private List<DriverHeatData> drivers;
    private List<String> standings;

    public Heat(int heatNumber, List<DriverHeatData> drivers) {
        super();
        this.heatNumber = heatNumber;
        this.drivers = drivers;
        this.standings = new java.util.ArrayList<>();
    }

    public int getHeatNumber() {
        return heatNumber;
    }

    public List<DriverHeatData> getDrivers() {
        return drivers;
    }

    public List<String> getStandings() {
        return standings;
    }

    public void setStandings(List<String> standings) {
        this.standings = standings;
    }
}
