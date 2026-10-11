import { AbsoluteWidgetNode } from "@app/models/settings";

import { LaneGridGeometryHelper } from "./lane-grid-geometry.helper";
import { LaneGridBounds } from "./lane-grid-replication.helper";

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
});
