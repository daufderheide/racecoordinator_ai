import { LaneGridFactoryHelper } from "./lane-grid-factory.helper";
import { LaneGridReplicationHelper } from "./lane-grid-replication.helper";

describe("LaneGridFactoryHelper", () => {
  describe("createNewGrid", () => {
    it("should create session and replicated widgets for given lanes and bounds", () => {
      const bounds = { x: 50, y: 100, width: 500, height: 200 };
      const { session, widgets } = LaneGridFactoryHelper.createNewGrid(
        bounds,
        4,
        100,
      );

      expect(session).toBeDefined();
      expect(session.gridId).toMatch(/^grid-/);
      expect(session.totalLanes).toBe(4);
      expect(session.bounds).toEqual(bounds);
      expect(session.direction).toBe("vertical");
      expect(session.bindingMode).toBe("lane");

      // 3 columns * 4 lanes = 12 widgets
      expect(widgets.length).toBe(12);

      const masters = widgets.filter((w) =>
        LaneGridReplicationHelper.isMasterWidget(w, session),
      );
      expect(masters.length).toBe(3);
      expect(masters.map((m) => m.customSettings?.["columnKey"])).toEqual([
        "driver.name",
        "lapCount",
        "lastLapTime",
      ]);

      // All master widgets should be in lane 0
      for (const m of masters) {
        expect(m.customSettings?.["gridLane"]).toBe(0);
        expect(m.customSettings?.["targetIndex"]).toBe(0);
        expect(m.customSettings?.["gridId"]).toBe(session.gridId);
        expect(m.y).toBe(100);
      }

      // Check mirrored widgets for lane 1
      const lane1Widgets = widgets.filter(
        (w) => w.customSettings?.["gridLane"] === 1,
      );
      expect(lane1Widgets.length).toBe(3);
      for (const w of lane1Widgets) {
        expect(w.customSettings?.["targetIndex"]).toBe(1);
        expect(w.customSettings?.["gridId"]).toBe(session.gridId);
        expect(w.y).toBe(150); // 100 + 200/4
      }
    });

    it("should create overall grid with overall columns and bindingMode", () => {
      const bounds = { x: 50, y: 100, width: 500, height: 200 };
      const { session, widgets } = LaneGridFactoryHelper.createNewGrid(
        bounds,
        4,
        100,
        "overall",
      );

      expect(session.gridType).toBe("overall");
      expect(session.bindingMode).toBe("overallPosition");

      const masters = widgets.filter((w) =>
        LaneGridReplicationHelper.isMasterWidget(w, session),
      );
      expect(masters.length).toBe(3);
      expect(masters.map((m) => m.customSettings?.["columnKey"])).toEqual([
        "driver.name",
        "overallLapCount",
        "overallBestLapTime",
      ]);
      expect(masters[0].customSettings?.["gridType"]).toBe("overall");
      expect(masters[0].customSettings?.["bindingMode"]).toBe(
        "overallPosition",
      );
    });
  });
});
