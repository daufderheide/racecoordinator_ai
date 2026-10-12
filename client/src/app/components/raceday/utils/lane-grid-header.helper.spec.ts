import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridHeaderHelper } from "./lane-grid-header.helper";

describe("LaneGridHeaderHelper", () => {
  const baseGridId = "test-grid-header";

  const createTestWidgets = (
    headerPlacement: "top" | "individual" | "none" = "individual",
    headerHeight = 36,
  ): AbsoluteWidgetNode[] => [
    {
      id: "master-col",
      widgetType: "lane-column",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      zIndex: 10,
      customSettings: {
        gridId: baseGridId,
        gridLane: 0,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        headerPlacement,
        headerHeight,
        showHeader: headerPlacement === "individual",
      },
    },
    {
      id: "mirrored-col",
      widgetType: "lane-column",
      x: 100,
      y: 200,
      width: 200,
      height: 100,
      zIndex: 10,
      customSettings: {
        gridId: baseGridId,
        gridLane: 1,
        gridTotalLanes: 2,
        gridDirection: "vertical",
        headerPlacement,
        headerHeight,
        showHeader: headerPlacement === "individual",
      },
    },
  ];

  it("should return correct header widget id", () => {
    expect(LaneGridHeaderHelper.getHeaderWidgetId("widget-123")).toBe(
      "widget-123_grid_header",
    );
  });

  describe("updateGridHeaderHeight", () => {
    it("should handle null or empty inputs safely", () => {
      expect(
        LaneGridHeaderHelper.updateGridHeaderHeight([], "grid-1", 40),
      ).toEqual([]);
      expect(
        LaneGridHeaderHelper.updateGridHeaderHeight(null as any, "grid-1", 40),
      ).toEqual([]);
      const widgets = createTestWidgets();
      expect(LaneGridHeaderHelper.updateGridHeaderHeight(widgets, "", 40)).toBe(
        widgets,
      );
    });

    it("should update headerHeight for non-top placement", () => {
      const widgets = createTestWidgets("individual", 36);
      const updated = LaneGridHeaderHelper.updateGridHeaderHeight(
        widgets,
        baseGridId,
        50,
      );
      expect(updated[0].customSettings?.["headerHeight"]).toBe(50);
      expect(updated[1].customSettings?.["headerHeight"]).toBe(50);
    });

    it("should update header height and recalculate rows for top placement", () => {
      let widgets = createTestWidgets("individual", 36);
      widgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
        widgets,
        baseGridId,
        "top",
        40,
      );

      const header = widgets.find((w) => w.customSettings?.["isHeaderWidget"]);
      expect(header).toBeDefined();
      expect(header?.height).toBe(40);

      const updated = LaneGridHeaderHelper.updateGridHeaderHeight(
        widgets,
        baseGridId,
        60,
      );
      const updatedHeader = updated.find(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(updatedHeader?.height).toBe(60);
      expect(updatedHeader?.customSettings?.["headerHeight"]).toBe(60);
    });
  });

  describe("updateGridHeaderPlacement", () => {
    it("should handle empty or missing gridId safely", () => {
      const widgets = createTestWidgets();
      expect(
        LaneGridHeaderHelper.updateGridHeaderPlacement(widgets, "", "top"),
      ).toBe(widgets);
      expect(
        LaneGridHeaderHelper.updateGridHeaderPlacement(
          null as any,
          "g1",
          "top",
        ),
      ).toEqual([]);
    });

    it("should transition from individual to top placement by creating header widgets", () => {
      const widgets = createTestWidgets("individual", 36);
      const updated = LaneGridHeaderHelper.updateGridHeaderPlacement(
        widgets,
        baseGridId,
        "top",
        40,
      );

      const headers = updated.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headers.length).toBe(1);
      expect(headers[0].id).toBe("master-col_grid_header");
      expect(headers[0].height).toBe(40);
      expect(headers[0].customSettings?.["headerPlacement"]).toBe("top");
      expect(headers[0].customSettings?.["useLaneColors"]).toBeFalse();

      const dataWidgets = updated.filter(
        (w) => !w.customSettings?.["isHeaderWidget"],
      );
      expect(dataWidgets.length).toBe(2);
      expect(dataWidgets[0].customSettings?.["showHeader"]).toBeFalse();
    });

    it("should transition from top to individual placement and remove top header widgets", () => {
      let widgets = createTestWidgets("individual", 36);
      widgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
        widgets,
        baseGridId,
        "top",
        40,
      );
      expect(
        widgets.some((w) => w.customSettings?.["isHeaderWidget"]),
      ).toBeTrue();

      const individual = LaneGridHeaderHelper.updateGridHeaderPlacement(
        widgets,
        baseGridId,
        "individual",
      );
      expect(
        individual.some((w) => w.customSettings?.["isHeaderWidget"]),
      ).toBeFalse();
      expect(individual.length).toBe(2);
      expect(individual[0].customSettings?.["showHeader"]).toBeTrue();
      expect(individual[0].customSettings?.["headerPlacement"]).toBe(
        "individual",
      );
    });

    it("should transition to none placement and disable showHeader", () => {
      const widgets = createTestWidgets("individual", 36);
      const noneWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
        widgets,
        baseGridId,
        "none",
      );
      expect(noneWidgets.length).toBe(2);
      expect(noneWidgets[0].customSettings?.["showHeader"]).toBeFalse();
      expect(noneWidgets[0].customSettings?.["headerPlacement"]).toBe("none");
    });
  });
});
