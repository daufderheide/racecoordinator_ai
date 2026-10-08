import {
  LANE_VIEW_COLUMN_GROUPS,
  LaneViewColumnGroupHelper,
} from "./lane-view-column-group.helper";

describe("LaneViewColumnGroupHelper", () => {
  const dummyTranslate = (key: string) => {
    const map: Record<string, string> = {
      RD_COL_NAME: "Driver Name",
      RD_COL_LAP: "Lap Count",
      UI_EDITOR_COL_LAP_COUNT: "Lap Count (Raw)",
      RD_COL_STD_DEV: "Standard Deviation",
      RD_COL_GHOST_PACING_LANE_RECORD: "Lane Record Delta",
      RD_COL_FUEL_LEVEL: "Fuel Level",
      RD_COL_WIN_PROB: "Win Probability",
      RD_COL_LANE_QR: "Lane QR Code",
    };
    return map[key] || key;
  };

  it("should have 13 defined column groups", () => {
    expect(LANE_VIEW_COLUMN_GROUPS.length).toBe(13);
    const ids = LANE_VIEW_COLUMN_GROUPS.map((g) => g.id);
    expect(ids).toEqual([
      "driver-team",
      "laps-standings",
      "lap-times",
      "analysis",
      "gaps",
      "overall-standings",
      "overall-lap-times",
      "overall-analysis",
      "overall-gaps",
      "pacing",
      "telemetry",
      "predictions",
      "media-custom",
    ]);
  });

  describe("getGroupIdForColumn", () => {
    it("should return driver-team for driver columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("driver.name")).toBe(
        "driver-team",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("driver.nickname"),
      ).toBe("driver-team");
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("laneNumber")).toBe(
        "driver-team",
      );
    });

    it("should return laps-standings for lap count and ranking columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("lapCount")).toBe(
        "laps-standings",
      );
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("rankHeat")).toBe(
        "laps-standings",
      );
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("lapsLed")).toBe(
        "laps-standings",
      );
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("trackCalls")).toBe(
        "laps-standings",
      );
    });

    it("should return lap-times for timing and record columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("lastLapTime")).toBe(
        "lap-times",
      );
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("bestLapTime")).toBe(
        "lap-times",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("reactionTime"),
      ).toBe("lap-times");
    });

    it("should return analysis for driver statistics and averages", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("standardDeviation"),
      ).toBe("analysis");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("consistencyScore"),
      ).toBe("analysis");
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("averageTop5")).toBe(
        "analysis",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("top2Consecutive"),
      ).toBe("analysis");
    });

    it("should return gaps for gap columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("gapLeader")).toBe(
        "gaps",
      );
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("gapLeaderF1")).toBe(
        "gaps",
      );
    });

    it("should return overall-standings for overall standings columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallLapCount"),
      ).toBe("overall-standings");
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("rankOverall")).toBe(
        "overall-standings",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallPoints"),
      ).toBe("overall-standings");
    });

    it("should return overall-lap-times for overall timing columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallBestLapTime"),
      ).toBe("overall-lap-times");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallTotalTime"),
      ).toBe("overall-lap-times");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("recordLapTime"),
      ).toBe("overall-lap-times");
    });

    it("should return overall-analysis for overall statistics columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallAverageLapTime"),
      ).toBe("overall-analysis");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn(
          "overallConsistencyScore",
        ),
      ).toBe("overall-analysis");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallAverageTop5"),
      ).toBe("overall-analysis");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallTop2Consecutive"),
      ).toBe("overall-analysis");
    });

    it("should return overall-gaps for overall gap columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallGapLeader"),
      ).toBe("overall-gaps");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("overallGapPositionF1"),
      ).toBe("overall-gaps");
    });

    it("should return pacing for ghost pacing columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("ghostPacing")).toBe(
        "pacing",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("ghostPacingPB"),
      ).toBe("pacing");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("ghostPacingLeaderBest"),
      ).toBe("pacing");
    });

    it("should return telemetry for fuel and speed columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("participant.fuelLevel"),
      ).toBe("telemetry");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn(
          "imageset_fuel-gauge-builtin",
        ),
      ).toBe("telemetry");
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("mph")).toBe(
        "telemetry",
      );
    });

    it("should return predictions for prediction columns", () => {
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("winProbability"),
      ).toBe("predictions");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("projectedRank"),
      ).toBe("predictions");
    });

    it("should return media-custom for QR codes and unknown columns", () => {
      expect(LaneViewColumnGroupHelper.getGroupIdForColumn("qrCode")).toBe(
        "media-custom",
      );
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("driverViewQrCode"),
      ).toBe("media-custom");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("imageset_custom_asset"),
      ).toBe("media-custom");
      expect(
        LaneViewColumnGroupHelper.getGroupIdForColumn("unknown_column"),
      ).toBe("media-custom");
    });
  });

  describe("buildColumnGroups", () => {
    it("should partition unused columns into Heat Data and Overall Race Data with corresponding subgroups", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
        { key: "standardDeviation", label: "RD_COL_STD_DEV" },
        { key: "imageset_custom", label: "Custom Asset" },
      ];
      const expandedStates = new Map<string, boolean>();
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "",
        expandedStates,
        dummyTranslate,
      );

      expect(groups.length).toBe(2);
      expect(groups.map((g) => g.id)).toEqual(["heat-data", "overall-data"]);

      const heatGroup = groups.find((g) => g.id === "heat-data");
      expect(heatGroup).toBeDefined();
      expect(heatGroup!.totalCount).toBe(4);
      expect(heatGroup!.subgroups.map((sg) => sg.id)).toEqual([
        "heat-data-sg-driver-team",
        "heat-data-sg-analysis",
        "heat-data-sg-laps-standings",
        "heat-data-sg-media-custom",
      ]);
      expect(heatGroup!.subgroups[0].columns[0].key).toBe("driver.name");
      expect(heatGroup!.subgroups[1].columns[0].key).toBe("standardDeviation");
      expect(heatGroup!.subgroups[2].columns[0].key).toBe("lapCount");
      expect(heatGroup!.subgroups[3].columns[0].key).toBe("imageset_custom");

      const overallGroup = groups.find((g) => g.id === "overall-data");
      expect(overallGroup).toBeDefined();
      expect(overallGroup!.totalCount).toBe(2);
      expect(overallGroup!.subgroups.map((sg) => sg.id)).toEqual([
        "overall-data-sg-driver-team",
        "overall-data-sg-media-custom",
      ]);
      expect(overallGroup!.subgroups[0].columns[0].key).toBe("driver.name");
      expect(overallGroup!.subgroups[1].columns[0].key).toBe("imageset_custom");
    });

    it("should respect expandedStates when search term is empty", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
      ];
      const expandedStates = new Map<string, boolean>([
        ["heat-data", false],
        ["heat-data-sg-laps-standings", true],
      ]);
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "",
        expandedStates,
        dummyTranslate,
      );

      const heatGroup = groups.find((g) => g.id === "heat-data");
      expect(heatGroup?.expanded).toBeFalse();
      expect(
        heatGroup?.subgroups.find(
          (sg) => sg.id === "heat-data-sg-laps-standings",
        )?.expanded,
      ).toBeTrue();
    });

    it("should default top-level groups to expanded true and subgroups to false if not in expandedStates", () => {
      const unused = [{ key: "driver.name", label: "RD_COL_NAME" }];
      const expandedStates = new Map<string, boolean>();
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "",
        expandedStates,
        dummyTranslate,
      );
      expect(groups[0].expanded).toBeTrue();
      expect(groups[0].subgroups[0].expanded).toBeFalse();
    });

    it("should filter columns and auto-expand matching groups and subgroups when search term is active", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
        { key: "standardDeviation", label: "RD_COL_STD_DEV" },
      ];
      const expandedStates = new Map<string, boolean>([
        ["heat-data-sg-analysis", false],
      ]);

      // Searching by translated name "standard"
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "standard",
        expandedStates,
        dummyTranslate,
      );

      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("heat-data");
      expect(groups[0].expanded).toBeTrue();
      expect(groups[0].subgroups.length).toBe(1);
      expect(groups[0].subgroups[0].id).toBe("heat-data-sg-analysis");
      expect(groups[0].subgroups[0].expanded).toBeTrue();
      expect(groups[0].subgroups[0].columns.length).toBe(1);
      expect(groups[0].subgroups[0].columns[0].key).toBe("standardDeviation");
    });

    it("should search by column key when translated label does not match", () => {
      const unused = [
        { key: "averageTop5", label: "RD_COL_AVG_TOP_5" },
        { key: "top2Consecutive", label: "RD_COL_TOP_2_CONSECUTIVE" },
      ];
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "consecutive",
        new Map(),
        dummyTranslate,
      );

      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("heat-data");
      expect(groups[0].subgroups.length).toBe(1);
      expect(groups[0].subgroups[0].columns.length).toBe(1);
      expect(groups[0].subgroups[0].columns[0].key).toBe("top2Consecutive");
    });

    it("should filter columns when searching for raw lap count", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
        { key: "physicalLapCount", label: "UI_EDITOR_COL_LAP_COUNT" },
      ];
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "raw",
        new Map(),
        dummyTranslate,
      );
      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("heat-data");
      expect(groups[0].subgroups.length).toBe(1);
      expect(groups[0].subgroups[0].id).toBe("heat-data-sg-laps-standings");
      expect(groups[0].subgroups[0].columns.length).toBe(1);
      expect(groups[0].subgroups[0].columns[0].key).toBe("physicalLapCount");
    });

    it("should return empty array if search term matches no columns", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
      ];
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "nonexistent_query",
        new Map(),
        dummyTranslate,
      );
      expect(groups.length).toBe(0);
    });
  });
});
