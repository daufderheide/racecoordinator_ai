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

    it("should preserve column x and width when transitioning multi-column grid from top to none", () => {
      const multiColWidgets: AbsoluteWidgetNode[] = [
        // Top header widgets
        {
          id: "col1_grid_header",
          widgetType: "lane-column",
          x: 100,
          y: 100,
          width: 120,
          height: 40,
          zIndex: 11,
          customSettings: {
            gridId: "multi-col-grid",
            gridMasterId: "lane0-col1",
            isHeaderWidget: true,
            headerPlacement: "top",
            headerHeight: 40,
            gridTotalLanes: 2,
            gridDirection: "vertical",
          },
        },
        {
          id: "col2_grid_header",
          widgetType: "lane-column",
          x: 220,
          y: 100,
          width: 80,
          height: 40,
          zIndex: 11,
          customSettings: {
            gridId: "multi-col-grid",
            gridMasterId: "lane0-col2",
            isHeaderWidget: true,
            headerPlacement: "top",
            headerHeight: 40,
            gridTotalLanes: 2,
            gridDirection: "vertical",
          },
        },
        {
          id: "col3_grid_header",
          widgetType: "lane-column",
          x: 300,
          y: 100,
          width: 100,
          height: 40,
          zIndex: 11,
          customSettings: {
            gridId: "multi-col-grid",
            gridMasterId: "lane0-col3",
            isHeaderWidget: true,
            headerPlacement: "top",
            headerHeight: 40,
            gridTotalLanes: 2,
            gridDirection: "vertical",
          },
        },
        // Lane 0 data widgets
        {
          id: "lane0-col1",
          widgetType: "lane-column",
          x: 100,
          y: 140,
          width: 120,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 0,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
        {
          id: "lane0-col2",
          widgetType: "lane-column",
          x: 220,
          y: 140,
          width: 80,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 0,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
        {
          id: "lane0-col3",
          widgetType: "lane-column",
          x: 300,
          y: 140,
          width: 100,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 0,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
        // Lane 1 data widgets
        {
          id: "lane1-col1",
          widgetType: "lane-column",
          x: 100,
          y: 220,
          width: 120,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 1,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
        {
          id: "lane1-col2",
          widgetType: "lane-column",
          x: 220,
          y: 220,
          width: 80,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 1,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
        {
          id: "lane1-col3",
          widgetType: "lane-column",
          x: 300,
          y: 220,
          width: 100,
          height: 80,
          zIndex: 10,
          customSettings: {
            gridId: "multi-col-grid",
            gridLane: 1,
            gridTotalLanes: 2,
            gridDirection: "vertical",
            headerPlacement: "top",
            headerHeight: 40,
            showHeader: false,
          },
        },
      ];

      const resultNone = LaneGridHeaderHelper.updateGridHeaderPlacement(
        multiColWidgets,
        "multi-col-grid",
        "none",
      );

      // Header widgets removed
      expect(
        resultNone.filter((w) => w.customSettings?.["isHeaderWidget"]).length,
      ).toBe(0);
      expect(resultNone.length).toBe(6);

      // Verify lane 0 columns retained their distinct X and width
      const l0c1 = resultNone.find((w) => w.id === "lane0-col1")!;
      const l0c2 = resultNone.find((w) => w.id === "lane0-col2")!;
      const l0c3 = resultNone.find((w) => w.id === "lane0-col3")!;
      expect(l0c1.x).toBe(100);
      expect(l0c1.width).toBe(120);
      expect(l0c1.y).toBe(100);
      expect(l0c1.height).toBe(100);

      expect(l0c2.x).toBe(220);
      expect(l0c2.width).toBe(80);
      expect(l0c2.y).toBe(100);
      expect(l0c2.height).toBe(100);

      expect(l0c3.x).toBe(300);
      expect(l0c3.width).toBe(100);
      expect(l0c3.y).toBe(100);
      expect(l0c3.height).toBe(100);

      // Verify lane 1 columns retained their distinct X and width
      const l1c1 = resultNone.find((w) => w.id === "lane1-col1")!;
      const l1c2 = resultNone.find((w) => w.id === "lane1-col2")!;
      const l1c3 = resultNone.find((w) => w.id === "lane1-col3")!;
      expect(l1c1.x).toBe(100);
      expect(l1c1.width).toBe(120);
      expect(l1c1.y).toBe(200);
      expect(l1c1.height).toBe(100);

      expect(l1c2.x).toBe(220);
      expect(l1c2.width).toBe(80);
      expect(l1c2.y).toBe(200);
      expect(l1c2.height).toBe(100);

      expect(l1c3.x).toBe(300);
      expect(l1c3.width).toBe(100);
      expect(l1c3.y).toBe(200);
      expect(l1c3.height).toBe(100);

      // Now transition back to "top"
      const resultTop = LaneGridHeaderHelper.updateGridHeaderPlacement(
        resultNone,
        "multi-col-grid",
        "top",
        40,
      );

      // Headers recreated for all 3 columns with matching x and width
      const headers = resultTop.filter(
        (w) => w.customSettings?.["isHeaderWidget"],
      );
      expect(headers.length).toBe(3);

      const h1 = headers.find((h) => h.id === "lane0-col1_grid_header")!;
      expect(h1.x).toBe(100);
      expect(h1.width).toBe(120);
      expect(h1.y).toBe(100);
      expect(h1.height).toBe(40);

      const h2 = headers.find((h) => h.id === "lane0-col2_grid_header")!;
      expect(h2.x).toBe(220);
      expect(h2.width).toBe(80);
      expect(h2.y).toBe(100);
      expect(h2.height).toBe(40);

      const h3 = headers.find((h) => h.id === "lane0-col3_grid_header")!;
      expect(h3.x).toBe(300);
      expect(h3.width).toBe(100);
      expect(h3.y).toBe(100);
      expect(h3.height).toBe(40);

      // Data widgets shifted down and height adjusted, while x and width remain intact
      const topL0c1 = resultTop.find((w) => w.id === "lane0-col1")!;
      expect(topL0c1.x).toBe(100);
      expect(topL0c1.width).toBe(120);
      expect(topL0c1.y).toBe(140);
      expect(topL0c1.height).toBe(80);
    });
  });

  describe("syncPlacementHeaderWidget", () => {
    it("should update existing header widget styling and dimensions from updatedMaster", () => {
      const master: AbsoluteWidgetNode = {
        id: "master-c1",
        widgetType: "lane-column",
        x: 100,
        y: 140,
        width: 150,
        height: 60,
        zIndex: 10,
        customSettings: {
          gridId: "g-header-sync",
          gridLane: 0,
          headerPlacement: "top",
          headerFontSize: 24,
          headerTextColor: "#ff0000",
          headerBackgroundColor: "#000000",
          headerFontFamily: "Roboto",
        },
      };

      const existingHeader: AbsoluteWidgetNode = {
        id: "master-c1_grid_header",
        widgetType: "lane-column",
        x: 100,
        y: 100,
        width: 120,
        height: 40,
        zIndex: 11,
        customSettings: {
          gridId: "g-header-sync",
          gridMasterId: "master-c1",
          isHeaderWidget: true,
          headerPlacement: "top",
          headerHeight: 40,
          headerFontSize: 14,
          headerTextColor: "#ffffff",
          headerBackgroundColor: "#333333",
        },
      };

      const session: any = {
        gridId: "g-header-sync",
        headerPlacement: "top",
        headerHeight: 40,
        bounds: { x: 100, y: 100, width: 500, height: 300 },
      };

      const result = [master, existingHeader];

      LaneGridHeaderHelper.syncPlacementHeaderWidget(
        master,
        master,
        session,
        40,
        result,
      );

      const updatedHeader = result.find(
        (w) => w.id === "master-c1_grid_header",
      );
      expect(updatedHeader).toBeDefined();
      expect(updatedHeader?.width).toBe(150);
      expect(updatedHeader?.customSettings?.["headerFontSize"]).toBe(24);
      expect(updatedHeader?.customSettings?.["headerTextColor"]).toBe(
        "#ff0000",
      );
      expect(updatedHeader?.customSettings?.["headerBackgroundColor"]).toBe(
        "#000000",
      );
      expect(updatedHeader?.customSettings?.["headerFontFamily"]).toBe(
        "Roboto",
      );
    });
  });
});
