import { AbsoluteWidgetNode, LayoutConfig } from "@app/models/settings";

import { LaneGridRepairHelper } from "./lane-grid-repair.helper";
import { LaneGridSession } from "./lane-grid-replication.helper";

describe("LaneGridRepairHelper", () => {
  const createMockSession = (gridId = "grid-1"): LaneGridSession => ({
    gridId,
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    totalLanes: 2,
    direction: "vertical",
    sourceLaneIndex: 0,
    bindingMode: "lane",
    mirrorRows: true,
  });

  const createWidget = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    customSettings: Record<string, any> = {},
    zIndex = 100,
  ): AbsoluteWidgetNode => ({
    id,
    widgetType: "lane-column",
    x,
    y,
    width,
    height,
    zIndex,
    customSettings,
  });

  describe("detectStackedColumns", () => {
    it("should return no issues for empty layout or empty widgets array", () => {
      expect(
        LaneGridRepairHelper.detectStackedColumns(null).hasIssues,
      ).toBeFalse();
      expect(
        LaneGridRepairHelper.detectStackedColumns({ widgets: [] }).hasIssues,
      ).toBeFalse();
    });

    it("should return no issues for cleanly separated widgets", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("col-1", 10, 50, 200, 100, {
            gridId: "grid-1",
            columnKey: "driver.name",
            gridLane: 0,
          }),
          createWidget("col-2", 220, 50, 200, 100, {
            gridId: "grid-1",
            columnKey: "bestLapTime",
            gridLane: 0,
          }),
        ],
      };

      const result = LaneGridRepairHelper.detectStackedColumns(layout);
      expect(result.hasIssues).toBeFalse();
      expect(result.issues.length).toBe(0);
      expect(result.totalDuplicatesCount).toBe(0);
    });

    it("should detect stacked columns with matching coordinates and columnKey", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("master-name", 20, 100, 300, 80, {
            gridId: "grid-1",
            columnKey: "driver.name",
            gridLane: 0,
            insets: { "bottom-left": "flag" },
          }),
          createWidget("master-name_grid_lane_1", 20, 100, 300, 80, {
            gridId: "grid-1",
            columnKey: "driver.name",
            gridLane: 0,
            insets: { "bottom-right": "photo" },
          }),
        ],
      };

      const result = LaneGridRepairHelper.detectStackedColumns(layout);
      expect(result.hasIssues).toBeTrue();
      expect(result.issues.length).toBe(1);
      expect(result.totalDuplicatesCount).toBe(1);

      const issue = result.issues[0];
      expect(issue.columnKey).toBe("driver.name");
      expect(issue.primaryWidget.id).toBe("master-name");
      expect(issue.duplicateWidgets[0].id).toBe("master-name_grid_lane_1");
      expect(issue.hasInsetsToMerge).toBeTrue();
      expect(issue.insetsToMerge).toEqual({ "bottom-right": "photo" });
    });

    it("should detect duplicate headers", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("header-1", 20, 20, 300, 40, {
            gridId: "grid-1",
            columnKey: "driver.name",
            isHeaderWidget: true,
          }),
          createWidget("header-1_grid_lane_1_grid_header", 20, 20, 300, 40, {
            gridId: "grid-1",
            columnKey: "driver.name",
            isHeaderWidget: true,
          }),
        ],
      };

      const result = LaneGridRepairHelper.detectStackedColumns(layout);
      expect(result.hasIssues).toBeTrue();
      expect(result.issues[0].isHeader).toBeTrue();
      expect(result.issues[0].laneDisplay).toBe("Header");
      expect(result.issues[0].primaryWidget.id).toBe("header-1");
    });

    it("should detect nested lineage duplicates like _grid_lane_1_grid_lane_1", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("clean-widget", 20, 50, 200, 60, {
            gridId: "grid-1",
            columnKey: "lapCount",
            gridLane: 0,
          }),
          createWidget(
            "clean-widget_grid_lane_1_grid_lane_1",
            20,
            150,
            200,
            60,
            {
              gridId: "grid-1",
              columnKey: "lapCount",
              gridLane: 1,
            },
          ),
        ],
      };

      const result = LaneGridRepairHelper.detectStackedColumns(layout);
      expect(result.hasIssues).toBeTrue();
      expect(
        result.issues.some((i) => i.id.includes("issue_nested_")),
      ).toBeTrue();
    });

    it("should resolve column label using availableColumns list if provided", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("col-a", 0, 0, 100, 100, {
            gridId: "grid-1",
            columnKey: "custom.telemetry",
            gridLane: 0,
          }),
          createWidget("col-b", 0, 0, 100, 100, {
            gridId: "grid-1",
            columnKey: "custom.telemetry",
            gridLane: 0,
          }),
        ],
      };

      const result = LaneGridRepairHelper.detectStackedColumns(layout, [
        { key: "custom.telemetry", label: "Custom Telemetry Label" },
      ]);
      expect(result.issues[0].columnLabel).toBe("Custom Telemetry Label");
    });
  });

  describe("repairStackedColumns", () => {
    it("should return unchanged layout if no issues are detected", () => {
      const layout: LayoutConfig = {
        widgets: [
          createWidget("w1", 10, 10, 100, 50, {
            gridId: "g1",
            columnKey: "lapCount",
            gridLane: 0,
          }),
        ],
      };

      const result = LaneGridRepairHelper.repairStackedColumns(layout);
      expect(result.repairedCount).toBe(0);
      expect(result.mergedInsetsCount).toBe(0);
      expect(result.layout.widgets.length).toBe(1);
    });

    it("should merge insets onto primary widget and remove duplicate clones", () => {
      const session = createMockSession("grid-1");
      const primary = createWidget("master-name", 20, 100, 300, 80, {
        gridId: "grid-1",
        columnKey: "driver.name",
        gridLane: 0,
        insets: { "bottom-left": "flag" },
      });

      const duplicate = createWidget(
        "master-name_grid_lane_1",
        20,
        100,
        300,
        80,
        {
          gridId: "grid-1",
          columnKey: "driver.name",
          gridLane: 0,
          insets: { "bottom-right": "photo" },
        },
      );

      const nestedChild = createWidget(
        "master-name_grid_lane_1_grid_lane_1",
        20,
        200,
        300,
        80,
        {
          gridId: "grid-1",
          columnKey: "driver.name",
          gridLane: 1,
          gridMasterId: "master-name_grid_lane_1",
        },
      );

      const layout: LayoutConfig = {
        widgets: [primary, duplicate, nestedChild],
      };

      const repairResult = LaneGridRepairHelper.repairStackedColumns(
        layout,
        session,
      );
      expect(repairResult.repairedCount).toBeGreaterThanOrEqual(1);
      expect(repairResult.mergedInsetsCount).toBe(1);

      // Primary widget should have both insets merged
      const repairedMaster = repairResult.layout.widgets.find(
        (w) => w.id === "master-name",
      );
      expect(repairedMaster).toBeDefined();
      expect(repairedMaster?.customSettings?.["insets"]).toEqual({
        "bottom-left": "flag",
        "bottom-right": "photo",
      });

      // Duplicate and its nested child should be removed
      expect(
        repairResult.layout.widgets.some(
          (w) =>
            w.id === "master-name_grid_lane_1" &&
            w.customSettings?.["gridLane"] === 0,
        ),
      ).toBeFalse();
      expect(
        repairResult.layout.widgets.some(
          (w) => w.id === "master-name_grid_lane_1_grid_lane_1",
        ),
      ).toBeFalse();
    });

    it("should automatically synchronize mirrored grid lanes even when session is null", () => {
      const primary = createWidget("master-name", 20, 100, 300, 80, {
        gridId: "grid-auto-sync",
        columnKey: "driver.name",
        gridLane: 0,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        mirrorRows: true,
      });

      const duplicate = createWidget(
        "master-name_grid_lane_1",
        20,
        100,
        300,
        80,
        {
          gridId: "grid-auto-sync",
          columnKey: "driver.name",
          gridLane: 0,
          gridTotalLanes: 2,
          gridDirection: "vertical",
          mirrorRows: true,
        },
      );

      const nestedChild = createWidget(
        "master-name_grid_lane_1_grid_lane_1",
        20,
        200,
        300,
        80,
        {
          gridId: "grid-auto-sync",
          columnKey: "driver.name",
          gridLane: 1,
          gridTotalLanes: 2,
          gridDirection: "vertical",
          gridMasterId: "master-name_grid_lane_1",
          mirrorRows: true,
        },
      );

      const layout: LayoutConfig = {
        widgets: [primary, duplicate, nestedChild],
      };

      // Call repair with null session (as happens during import)
      const repairResult = LaneGridRepairHelper.repairStackedColumns(
        layout,
        null,
      );
      expect(repairResult.repairedCount).toBeGreaterThanOrEqual(1);

      // Lane 1 should NOT be empty; it should have a cleanly mirrored driver.name widget
      const lane1Widget = repairResult.layout.widgets.find(
        (w) =>
          w.customSettings?.["gridLane"] === 1 &&
          w.customSettings?.["columnKey"] === "driver.name",
      );
      expect(lane1Widget).toBeDefined();
      expect(lane1Widget?.customSettings?.["gridMasterId"]).toBe("master-name");
    });

    it("should retain all columns in lane 1 when repairing multiple stacked columns with null session", () => {
      const gridId = "grid-power-layout";
      const bounds = { x: 20, y: 100, width: 800, height: 600 };

      // Lane 0: driver.name primary + duplicate
      const name0Primary = createWidget("name-0", 20, 100, 200, 80, {
        gridId,
        columnKey: "driver.name",
        gridLane: 0,
        gridTotalLanes: 2,
        gridBounds: bounds,
        mirrorRows: true,
        insets: { "bottom-left": "flag" },
      });
      const name0Dup = createWidget("name-0_grid_lane_1", 20, 100, 200, 80, {
        gridId,
        columnKey: "driver.name",
        gridLane: 0,
        gridTotalLanes: 2,
        gridBounds: bounds,
        mirrorRows: true,
        insets: { "bottom-right": "photo" },
      });

      // Lane 0: bestLapTime primary + duplicate
      const best0Primary = createWidget("best-0", 250, 100, 200, 80, {
        gridId,
        columnKey: "bestLapTime",
        gridLane: 0,
        gridTotalLanes: 2,
        gridBounds: bounds,
        mirrorRows: true,
      });
      const best0Dup = createWidget("best-0_grid_lane_1", 250, 100, 200, 80, {
        gridId,
        columnKey: "bestLapTime",
        gridLane: 0,
        gridTotalLanes: 2,
        gridBounds: bounds,
        mirrorRows: true,
      });

      // Lane 1: driver.name with double-nested clone ID
      const name1Nested = createWidget(
        "name-0_grid_lane_1_grid_lane_1",
        20,
        250,
        200,
        80,
        {
          gridId,
          columnKey: "driver.name",
          gridLane: 1,
          gridTotalLanes: 2,
          gridBounds: bounds,
          mirrorRows: true,
        },
      );

      // Lane 1: bestLapTime with triple-nested clone ID
      const best1Nested = createWidget(
        "best-0_grid_lane_1_grid_lane_1_grid_lane_1",
        250,
        250,
        200,
        80,
        {
          gridId,
          columnKey: "bestLapTime",
          gridLane: 1,
          gridTotalLanes: 2,
          gridBounds: bounds,
          mirrorRows: true,
        },
      );

      const layout: LayoutConfig = {
        widgets: [
          name0Primary,
          name0Dup,
          best0Primary,
          best0Dup,
          name1Nested,
          best1Nested,
        ],
      };

      const repairResult = LaneGridRepairHelper.repairStackedColumns(
        layout,
        null,
      );
      expect(repairResult.repairedCount).toBeGreaterThanOrEqual(2);

      // Verify Lane 1 still has BOTH driver.name and bestLapTime
      const lane1Name = repairResult.layout.widgets.find(
        (w) =>
          w.customSettings?.["gridLane"] === 1 &&
          w.customSettings?.["columnKey"] === "driver.name",
      );
      const lane1Best = repairResult.layout.widgets.find(
        (w) =>
          w.customSettings?.["gridLane"] === 1 &&
          w.customSettings?.["columnKey"] === "bestLapTime",
      );

      expect(lane1Name).toBeDefined();
      expect(lane1Best).toBeDefined();
    });

    it("should handle empty or null layout gracefully during repair", () => {
      const result = LaneGridRepairHelper.repairStackedColumns({ widgets: [] });
      expect(result.repairedCount).toBe(0);
      expect(result.mergedInsetsCount).toBe(0);
    });

    it("should build session for grid correctly via buildSessionForGrid", () => {
      const w1 = createWidget("w1", 10, 10, 200, 100, {
        gridId: "test-build-session",
        gridTotalLanes: 3,
        gridDirection: "vertical",
        bindingMode: "position",
        headerPlacement: "top",
        headerHeight: 40,
        mirrorRows: true,
      });
      const session = LaneGridRepairHelper.buildSessionForGrid(
        "test-build-session",
        [w1],
      );
      expect(session).not.toBeNull();
      expect(session?.gridId).toBe("test-build-session");
      expect(session?.totalLanes).toBe(3);
      expect(session?.bindingMode).toBe("position");
      expect(session?.headerPlacement).toBe("top");
      expect(session?.headerHeight).toBe(40);
      expect(session?.mirrorRows).toBeTrue();

      expect(
        LaneGridRepairHelper.buildSessionForGrid("unknown", [w1]),
      ).toBeNull();
      expect(
        LaneGridRepairHelper.buildSessionForGrid("test-build-session", []),
      ).toBeNull();
    });
  });
});
