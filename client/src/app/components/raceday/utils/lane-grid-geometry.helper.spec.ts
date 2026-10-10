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
});
