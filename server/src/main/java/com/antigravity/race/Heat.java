package com.antigravity.race;

import java.util.List;

public class Heat extends ServerToClientObject {
    private int heatNumber;
    private List<DriverHeatData> drivers;

    public Heat(int heatNumber, List<DriverHeatData> drivers) {
        super();
        this.heatNumber = heatNumber;
        this.drivers = drivers;
    }

    public int getHeatNumber() {
        return heatNumber;
    }

    public List<DriverHeatData> getDrivers() {
        return drivers;
    }
}
