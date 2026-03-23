package com.antigravity.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.bson.codecs.pojo.annotations.BsonCreator;
import org.bson.codecs.pojo.annotations.BsonProperty;

public class TeamOptions {

    @BsonProperty("heat_lap_limit")
    @JsonProperty("heat_lap_limit")
    private final int heatLapLimit;

    @BsonProperty("heat_time_limit")
    @JsonProperty("heat_time_limit")
    private final double heatTimeLimit;

    @BsonProperty("overall_lap_limit")
    @JsonProperty("overall_lap_limit")
    private final int overallLapLimit;

    @BsonProperty("overall_time_limit")
    @JsonProperty("overall_time_limit")
    private final double overallTimeLimit;

    @BsonProperty("require_pit_stop_change_driver")
    @JsonProperty("require_pit_stop_change_driver")
    private final boolean requirePitStopChangeDriver;

    public TeamOptions() {
        this.heatLapLimit = 0;
        this.heatTimeLimit = 0;
        this.overallLapLimit = 0;
        this.overallTimeLimit = 0;
        this.requirePitStopChangeDriver = false;
    }

    @BsonCreator
    @JsonCreator
    public TeamOptions(
            @BsonProperty("heat_lap_limit") @JsonProperty("heat_lap_limit") Integer heatLapLimit,
            @BsonProperty("heat_time_limit") @JsonProperty("heat_time_limit") Double heatTimeLimit,
            @BsonProperty("overall_lap_limit") @JsonProperty("overall_lap_limit") Integer overallLapLimit,
            @BsonProperty("overall_time_limit") @JsonProperty("overall_time_limit") Double overallTimeLimit,
            @BsonProperty("require_pit_stop_change_driver") @JsonProperty("require_pit_stop_change_driver") Boolean requirePitStopChangeDriver) {
        this.heatLapLimit = heatLapLimit != null ? heatLapLimit : 0;
        this.heatTimeLimit = heatTimeLimit != null ? heatTimeLimit : 0;
        this.overallLapLimit = overallLapLimit != null ? overallLapLimit : 0;
        this.overallTimeLimit = overallTimeLimit != null ? overallTimeLimit : 0;
        this.requirePitStopChangeDriver = requirePitStopChangeDriver != null ? requirePitStopChangeDriver : false;
    }

    public int getHeatLapLimit() {
        return heatLapLimit;
    }

    public double getHeatTimeLimit() {
        return heatTimeLimit;
    }

    public int getOverallLapLimit() {
        return overallLapLimit;
    }

    public double getOverallTimeLimit() {
        return overallTimeLimit;
    }

    public boolean isRequirePitStopChangeDriver() {
        return requirePitStopChangeDriver;
    }
}
