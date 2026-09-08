import {
  LANE_VIEW_COLUMN_GROUPS,
  LaneViewColumnGroupHelper,
} from "./lane-view-column-group.helper";

describe("LaneViewColumnGroupHelper", () => {
  const dummyTranslate = (key: string) => {
    const map: Record<string, string> = {
      RD_COL_NAME: "Driver Name",
      RD_COL_LAP: "Lap Count",
      RD_COL_STD_DEV: "Standard Deviation",
      RD_COL_GHOST_PACING_LANE_RECORD: "Lane Record Delta",
      RD_COL_FUEL_LEVEL: "Fuel Level",
      RD_COL_WIN_PROB: "Win Probability",
      RD_COL_LANE_QR: "Lane QR Code",
    };
    return map[key] || key;
  };

  it("should have 9 defined column groups", () => {
    expect(LANE_VIEW_COLUMN_GROUPS.length).toBe(9);
    const ids = LANE_VIEW_COLUMN_GROUPS.map((g) => g.id);
    expect(ids).toEqual([
      "driver-team",
      "laps-standings",
      "lap-times",
      "analysis",
      "gaps",
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
        LaneViewColumnGroupHelper.getGroupIdForColumn("recordLapTime"),
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
    it("should partition unused columns into their corresponding groups and omit empty groups", () => {
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

      expect(groups.length).toBe(4);
      expect(groups.map((g) => g.id)).toEqual([
        "driver-team",
        "laps-standings",
        "analysis",
        "media-custom",
      ]);
      expect(groups[0].columns.length).toBe(1);
      expect(groups[0].columns[0].key).toBe("driver.name");
      expect(groups[1].columns[0].key).toBe("lapCount");
      expect(groups[2].columns[0].key).toBe("standardDeviation");
      expect(groups[3].columns[0].key).toBe("imageset_custom");
    });

    it("should respect expandedStates when search term is empty", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
      ];
      const expandedStates = new Map<string, boolean>([
        ["driver-team", false],
        ["laps-standings", true],
      ]);
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "",
        expandedStates,
        dummyTranslate,
      );

      expect(groups.find((g) => g.id === "driver-team")?.expanded).toBeFalse();
      expect(
        groups.find((g) => g.id === "laps-standings")?.expanded,
      ).toBeTrue();
    });

    it("should default to expanded true if not in expandedStates", () => {
      const unused = [{ key: "driver.name", label: "RD_COL_NAME" }];
      const expandedStates = new Map<string, boolean>();
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "",
        expandedStates,
        dummyTranslate,
      );
      expect(groups[0].expanded).toBeTrue();
    });

    it("should filter columns and auto-expand matching groups when search term is active", () => {
      const unused = [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
        { key: "standardDeviation", label: "RD_COL_STD_DEV" },
      ];
      const expandedStates = new Map<string, boolean>([["analysis", false]]);

      // Searching by translated name "standard"
      const groups = LaneViewColumnGroupHelper.buildColumnGroups(
        unused,
        "standard",
        expandedStates,
        dummyTranslate,
      );

      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("analysis");
      expect(groups[0].expanded).toBeTrue();
      expect(groups[0].columns.length).toBe(1);
      expect(groups[0].columns[0].key).toBe("standardDeviation");
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
      expect(groups[0].columns.length).toBe(1);
      expect(groups[0].columns[0].key).toBe("top2Consecutive");
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
