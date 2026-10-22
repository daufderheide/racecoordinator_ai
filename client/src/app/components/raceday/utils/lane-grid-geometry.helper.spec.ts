import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import {
  LaneGridBounds,
  LaneGridSession,
} from "./lane-grid-replication.helper";

describe("LaneGridGeometryHelper", () => {
  const baseWidth = 1920;
  const baseHeight = 1080;

  describe("calculateAvailableGridBounds", () => {
    it("should expand to full canvas when no obstacles exist", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 100,
          y: 200,
          width: 200,
          height: 100,
          zIndex: 10,
        },
      ];

      const bounds = LaneGridGeometryHelper.calculateAvailableGridBounds(
        source,
        source,
        baseWidth,
        baseHeight,
        "horizontal",
      );

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(baseWidth);
      expect(bounds.height).toBe(baseHeight);
    });

    it("should use canvas center fallback seed when sourceWidgets is empty", () => {
      const bounds = LaneGridGeometryHelper.calculateAvailableGridBounds(
        [],
        [],
        baseWidth,
        baseHeight,
        "vertical",
      );
      expect(bounds.width).toBe(baseWidth);
      expect(bounds.height).toBe(baseHeight);
    });

    it("should respect obstacle widgets when expanding", () => {
      const source: AbsoluteWidgetNode[] = [
        {
          id: "src-1",
          widgetType: "lane-column",
          x: 400,
          y: 300,
          width: 200,
          height: 200,
          zIndex: 10,
        },
      ];
      const obstacle: AbsoluteWidgetNode = {
        id: "obs-top",
        widgetType: "text-widget",
        x: 350,
        y: 0,
        width: 300,
        height: 100,
        zIndex: 10,
      };

      const bounds = LaneGridGeometryHelper.calculateAvailableGridBounds(
        source,
        [...source, obstacle],
        baseWidth,
        baseHeight,
        "horizontal",
        true,
      );

      expect(bounds.y).toBeGreaterThanOrEqual(100);
    });
  });

  describe("resizeGridBounds", () => {
    const current: LaneGridBounds = {
      x: 100,
      y: 100,
      width: 400,
      height: 300,
    };

    it("should resize with eastern handle", () => {
      const resized = LaneGridGeometryHelper.resizeGridBounds(
        current,
        "e",
        50,
        0,
        baseWidth,
        baseHeight,
      );
      expect(resized.width).toBe(450);
      expect(resized.x).toBe(100);
    });

    it("should resize with western handle", () => {
      const resized = LaneGridGeometryHelper.resizeGridBounds(
        current,
        "w",
        -20,
        0,
        baseWidth,
        baseHeight,
      );
      expect(resized.x).toBe(80);
      expect(resized.width).toBe(420);
    });

    it("should resize with southern handle", () => {
      const resized = LaneGridGeometryHelper.resizeGridBounds(
        current,
        "s",
        0,
        40,
        baseWidth,
        baseHeight,
      );
      expect(resized.height).toBe(340);
      expect(resized.y).toBe(100);
    });

    it("should resize with northern handle", () => {
      const resized = LaneGridGeometryHelper.resizeGridBounds(
        current,
        "n",
        0,
        -30,
        baseWidth,
        baseHeight,
      );
      expect(resized.y).toBe(70);
      expect(resized.height).toBe(330);
    });

    it("should snap to edges when within snapThreshold", () => {
      const resized = LaneGridGeometryHelper.resizeGridBounds(
        current,
        "e",
        95,
        0,
        baseWidth,
        baseHeight,
        100,
        60,
        [600],
        [],
        10,
      );
      expect(resized.x + resized.width).toBe(600);
    });
  });

  describe("moveGridBounds", () => {
    const current: LaneGridBounds = {
      x: 200,
      y: 150,
      width: 400,
      height: 300,
    };

    it("should translate grid bounds by deltaX and deltaY", () => {
      const moved = LaneGridGeometryHelper.moveGridBounds(
        current,
        50,
        30,
        baseWidth,
        baseHeight,
      );
      expect(moved).toEqual({
        x: 250,
        y: 180,
        width: 400,
        height: 300,
      });
    });

    it("should clamp grid within canvas bounds when grid fits on canvas", () => {
      // Trying to move beyond left/top
      const movedTopLeft = LaneGridGeometryHelper.moveGridBounds(
        current,
        -300,
        -250,
        baseWidth,
        baseHeight,
      );
      expect(movedTopLeft.x).toBe(0);
      expect(movedTopLeft.y).toBe(0);

      // Trying to move beyond right/bottom
      const movedBottomRight = LaneGridGeometryHelper.moveGridBounds(
        current,
        2000,
        1200,
        baseWidth,
        baseHeight,
      );
      expect(movedBottomRight.x).toBe(baseWidth - current.width);
      expect(movedBottomRight.y).toBe(baseHeight - current.height);
    });

    it("should allow negative Y translation when grid height exceeds canvas height", () => {
      const largeGrid: LaneGridBounds = {
        x: 100,
        y: 0,
        width: 400,
        height: 1400, // taller than 1080
      };

      // Moving grid up to bring off-screen bottom rows into view
      const movedUp = LaneGridGeometryHelper.moveGridBounds(
        largeGrid,
        0,
        -300,
        baseWidth,
        baseHeight,
      );
      expect(movedUp.y).toBe(-300);

      // Should clamp at baseHeight - height so bottom is aligned with canvas bottom
      const movedMaxUp = LaneGridGeometryHelper.moveGridBounds(
        largeGrid,
        0,
        -800,
        baseWidth,
        baseHeight,
      );
      expect(movedMaxUp.y).toBe(baseHeight - 1400); // 1080 - 1400 = -320
      expect(movedMaxUp.y + movedMaxUp.height).toBe(baseHeight);

      // Should not allow moving down beyond y = 0
      const movedDown = LaneGridGeometryHelper.moveGridBounds(
        largeGrid,
        0,
        200,
        baseWidth,
        baseHeight,
      );
      expect(movedDown.y).toBe(0);
    });

    it("should allow negative X translation when grid width exceeds canvas width", () => {
      const wideGrid: LaneGridBounds = {
        x: 0,
        y: 100,
        width: 2400, // wider than 1920
        height: 300,
      };

      const movedLeft = LaneGridGeometryHelper.moveGridBounds(
        wideGrid,
        -400,
        0,
        baseWidth,
        baseHeight,
      );
      expect(movedLeft.x).toBe(-400);

      const movedMaxLeft = LaneGridGeometryHelper.moveGridBounds(
        wideGrid,
        -1000,
        0,
        baseWidth,
        baseHeight,
      );
      expect(movedMaxLeft.x).toBe(baseWidth - 2400); // 1920 - 2400 = -480
      expect(movedMaxLeft.x + movedMaxLeft.width).toBe(baseWidth);
    });

    it("should snap left and top edges to canvas boundaries and obstacle edges", () => {
      const movedSnap = LaneGridGeometryHelper.moveGridBounds(
        current,
        -195, // rawX = 5, close to 0
        -146, // rawY = 4, close to 0
        baseWidth,
        baseHeight,
        [500],
        [400],
        8,
      );
      expect(movedSnap.x).toBe(0);
      expect(movedSnap.y).toBe(0);
    });

    it("should snap right and bottom edges to target edges", () => {
      // current.x = 200, width = 400. rawX = 200 - 3 = 197. rawX + width = 597. Snap to 600.
      const movedSnapRight = LaneGridGeometryHelper.moveGridBounds(
        current,
        -3,
        0,
        baseWidth,
        baseHeight,
        [600],
        [],
        8,
      );
      expect(movedSnapRight.x + movedSnapRight.width).toBe(600);
      expect(movedSnapRight.x).toBe(200);
    });
  });

  describe("calculateGridBounds", () => {
    it("should return null if widgets or gridId is invalid", () => {
      expect(
        LaneGridGeometryHelper.calculateGridBounds([], "grid-1"),
      ).toBeNull();
      expect(
        LaneGridGeometryHelper.calculateGridBounds(null as any, "grid-1"),
      ).toBeNull();
      expect(
        LaneGridGeometryHelper.calculateGridBounds(
          [
            {
              id: "w1",
              widgetType: "text",
              x: 0,
              y: 0,
              width: 10,
              height: 10,
              zIndex: 1,
            },
          ],
          "",
        ),
      ).toBeNull();
    });

    it("should return saved gridBounds from customSettings if present", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 10,
          y: 20,
          width: 50,
          height: 50,
          zIndex: 1,
          customSettings: {
            gridId: "g1",
            gridBounds: { x: 100, y: 200, width: 500, height: 400 },
          },
        },
      ];
      const bounds = LaneGridGeometryHelper.calculateGridBounds(widgets, "g1");
      expect(bounds).toEqual({ x: 100, y: 200, width: 500, height: 400 });
    });

    it("should fallback to bounding box of widgets if no saved gridBounds", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 50,
          y: 60,
          width: 200,
          height: 100,
          zIndex: 1,
          customSettings: { gridId: "g1" },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 50,
          y: 160,
          width: 200,
          height: 100,
          zIndex: 1,
          customSettings: { gridId: "g1" },
        },
      ];
      const bounds = LaneGridGeometryHelper.calculateGridBounds(widgets, "g1");
      expect(bounds).toEqual({ x: 50, y: 60, width: 200, height: 200 });
    });
  });

  describe("updateWidgetCellRatios", () => {
    it("should auto-calculate height and y for vertical stack grids", () => {
      const widget: AbsoluteWidgetNode = {
        id: "w1",
        widgetType: "lane-column",
        x: 120,
        y: 130,
        width: 160,
        height: 80,
        zIndex: 1,
      };
      const session = {
        gridId: "g1",
        direction: "vertical",
      } as LaneGridSession;
      const cell = { x: 100, y: 100, width: 200, height: 100 };

      LaneGridGeometryHelper.updateWidgetCellRatios(widget, session, cell);

      expect(widget.height).toBe(100);
      expect(widget.y).toBe(100);
      expect(widget.customSettings?.["cellWidthRatio"]).toBe(0.8);
      expect(widget.customSettings?.["cellHeightRatio"]).toBe(1.0);
      expect(widget.customSettings?.["cellOffsetXRatio"]).toBe(0.1);
      expect(widget.customSettings?.["cellOffsetYRatio"]).toBe(0);
    });

    it("should auto-calculate width and x for horizontal grids", () => {
      const widget: AbsoluteWidgetNode = {
        id: "w2",
        widgetType: "lane-column",
        x: 120,
        y: 130,
        width: 160,
        height: 80,
        zIndex: 1,
      };
      const session = {
        gridId: "g2",
        direction: "horizontal",
      } as LaneGridSession;
      const cell = { x: 100, y: 100, width: 200, height: 100 };

      LaneGridGeometryHelper.updateWidgetCellRatios(widget, session, cell);

      expect(widget.width).toBe(200);
      expect(widget.x).toBe(100);
      expect(widget.customSettings?.["cellWidthRatio"]).toBe(1.0);
      expect(widget.customSettings?.["cellHeightRatio"]).toBe(0.8);
      expect(widget.customSettings?.["cellOffsetXRatio"]).toBe(0);
      expect(widget.customSettings?.["cellOffsetYRatio"]).toBe(0.3);
    });
  });

  describe("isGridResized", () => {
    const sessionBounds = { x: 100, y: 100, width: 400, height: 400 };

    it("should return false when dimensions, lanes, and labels are unchanged", () => {
      expect(
        LaneGridGeometryHelper.isGridResized(
          { ...sessionBounds },
          sessionBounds,
          4,
          4,
          "none",
          "none",
          40,
          40,
        ),
      ).toBeFalse();
    });

    it("should return true when bounds change", () => {
      expect(
        LaneGridGeometryHelper.isGridResized(
          { x: 100, y: 100, width: 300, height: 400 },
          sessionBounds,
          4,
          4,
          "none",
          "none",
          40,
          40,
        ),
      ).toBeTrue();
    });

    it("should return true when total lanes change", () => {
      expect(
        LaneGridGeometryHelper.isGridResized(
          { ...sessionBounds },
          sessionBounds,
          2,
          4,
          "none",
          "none",
          40,
          40,
        ),
      ).toBeTrue();
    });

    it("should return true when label position or size changes", () => {
      expect(
        LaneGridGeometryHelper.isGridResized(
          { ...sessionBounds },
          sessionBounds,
          4,
          4,
          "none",
          "top",
          40,
          40,
        ),
      ).toBeTrue();

      expect(
        LaneGridGeometryHelper.isGridResized(
          { ...sessionBounds },
          sessionBounds,
          4,
          4,
          "top",
          "top",
          40,
          60,
        ),
      ).toBeTrue();
    });
  });

  describe("computePitch & computeLaneCellBounds", () => {
    it("should calculate pitch and cell bounds for vertical grid without label", () => {
      const session: LaneGridSession = {
        gridId: "g1",
        bounds: { x: 100, y: 100, width: 300, height: 400 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
      };

      expect(LaneGridGeometryHelper.computePitch(session)).toBe(100);

      const cell0 = LaneGridGeometryHelper.computeLaneCellBounds(session, 0);
      expect(cell0).toEqual({ x: 100, y: 100, width: 300, height: 100 });

      const cell3 = LaneGridGeometryHelper.computeLaneCellBounds(session, 3);
      expect(cell3).toEqual({ x: 100, y: 400, width: 300, height: 100 });
    });

    it("should offset row 0 and reduce pitch when gridLabelPosition is top", () => {
      const session: LaneGridSession = {
        gridId: "g1",
        bounds: { x: 100, y: 100, width: 300, height: 440 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "top",
        gridLabelSize: 40,
      };

      // Remaining data height = 440 - 40 = 400, pitch = 400 / 4 = 100
      expect(LaneGridGeometryHelper.computePitch(session)).toBe(100);

      // Cell 0 MUST start at 100 + 40 = 140, not under the label!
      const cell0 = LaneGridGeometryHelper.computeLaneCellBounds(session, 0);
      expect(cell0).toEqual({ x: 100, y: 140, width: 300, height: 100 });

      const cell3 = LaneGridGeometryHelper.computeLaneCellBounds(session, 3);
      expect(cell3).toEqual({ x: 100, y: 440, width: 300, height: 100 });
      expect(cell3.y + cell3.height).toBe(540); // bounds.y + bounds.height
    });

    it("should offset column 0 and reduce pitch when gridLabelPosition is left", () => {
      const session: LaneGridSession = {
        gridId: "g1",
        bounds: { x: 100, y: 100, width: 450, height: 400 },
        totalLanes: 4,
        direction: "horizontal",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "left",
        gridLabelSize: 50,
      };

      // Remaining data width = 450 - 50 = 400, pitch = 400 / 4 = 100
      expect(LaneGridGeometryHelper.computePitch(session)).toBe(100);

      const cell0 = LaneGridGeometryHelper.computeLaneCellBounds(session, 0);
      expect(cell0).toEqual({ x: 150, y: 100, width: 100, height: 400 });
    });
  });

  describe("computeGridDividers", () => {
    it("should generate dividers within data bounds excluding top label", () => {
      const session: LaneGridSession = {
        gridId: "g1",
        bounds: { x: 100, y: 100, width: 300, height: 440 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "top",
        gridLabelSize: 40,
      };

      const dividers = LaneGridGeometryHelper.computeGridDividers(session);
      // Dividers at 140 + 100 = 240, 140 + 200 = 340, 140 + 300 = 440
      expect(dividers).toEqual([240, 340, 440]);
    });
  });

  describe("isUnderLabel", () => {
    const masterCell = { x: 100, y: 140, width: 300, height: 100 };

    it("should return true when widget y is above cell y under top label", () => {
      const widget: AbsoluteWidgetNode = {
        id: "w1",
        widgetType: "lane-column",
        x: 100,
        y: 100, // y is 100, but cell starts at 140 (under top label)
        width: 300,
        height: 100,
        zIndex: 1,
      };
      expect(
        LaneGridGeometryHelper.isUnderLabel("top", widget, masterCell),
      ).toBeTrue();
    });

    it("should return true when cellOffsetYRatio is negative", () => {
      const widget: AbsoluteWidgetNode = {
        id: "w1",
        widgetType: "lane-column",
        x: 100,
        y: 140,
        width: 300,
        height: 100,
        zIndex: 1,
      };
      expect(
        LaneGridGeometryHelper.isUnderLabel("top", widget, masterCell, 0, -0.2),
      ).toBeTrue();
    });

    it("should return false when widget is at or below cell y", () => {
      const widget: AbsoluteWidgetNode = {
        id: "w1",
        widgetType: "lane-column",
        x: 100,
        y: 140,
        width: 300,
        height: 100,
        zIndex: 1,
      };
      expect(
        LaneGridGeometryHelper.isUnderLabel("top", widget, masterCell),
      ).toBeFalse();
    });
  });

  describe("resolveCellRatios", () => {
    it("should auto-heal corrupt widget that has masterWidget.y under top label", () => {
      const masterWidget: AbsoluteWidgetNode = {
        id: "w1",
        widgetType: "lane-column",
        x: 100,
        y: 100, // Under the label!
        width: 300,
        height: 100,
        zIndex: 1,
        customSettings: {
          gridId: "g1",
          gridLane: 0,
          gridTotalLanes: 4,
          gridLabelPosition: "top",
          gridLabelSize: 40,
          cellWidthRatio: 1,
          cellHeightRatio: 1,
          cellOffsetXRatio: 0,
          cellOffsetYRatio: -0.4, // Corrupt negative offset
        },
      };

      const session: LaneGridSession = {
        gridId: "g1",
        bounds: { x: 100, y: 100, width: 300, height: 440 },
        totalLanes: 4,
        direction: "vertical",
        sourceLaneIndex: 0,
        bindingMode: "lane",
        gridLabelPosition: "top",
        gridLabelSize: 40,
      };

      const masterCell = LaneGridGeometryHelper.computeMasterBounds(session);
      expect(masterCell.y).toBe(140);

      const ratios = LaneGridGeometryHelper.resolveCellRatios(
        masterWidget,
        session,
        masterCell,
        0,
      );

      // Must be auto-healed with non-negative offset
      expect(ratios.cellOffsetYRatio).toBeGreaterThanOrEqual(0);
      expect(ratios.cellOffsetXRatio).toBeGreaterThanOrEqual(0);
      expect(ratios.cellHeightRatio).toBeGreaterThan(0);
      expect(ratios.cellWidthRatio).toBeGreaterThan(0);
    });
  });
});
