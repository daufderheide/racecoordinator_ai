import { AbsoluteWidgetNode } from "@app/models/settings";

import { GridLabelConfig, LaneGridLabelHelper } from "./lane-grid-label.helper";
import { LaneGridSession } from "./lane-grid-replication.helper";

describe("LaneGridLabelHelper", () => {
  const baseSession: LaneGridSession = {
    gridId: "test-grid",
    bounds: { x: 100, y: 50, width: 800, height: 400 },
    totalLanes: 4,
    direction: "vertical",
    sourceLaneIndex: 0,
    bindingMode: "lane",
  };

  describe("getEffectiveLabelSize", () => {
    it("should return default size 40 when gridLabelSize is undefined or <= 0", () => {
      expect(LaneGridLabelHelper.getEffectiveLabelSize(baseSession)).toBe(40);

      const zeroSession = { ...baseSession, gridLabelSize: 0 };
      expect(LaneGridLabelHelper.getEffectiveLabelSize(zeroSession)).toBe(40);
    });

    it("should clamp label size between 20 and dimension - 20", () => {
      const smallSession = {
        ...baseSession,
        gridLabelPosition: "top" as const,
        gridLabelSize: 10,
      };
      expect(LaneGridLabelHelper.getEffectiveLabelSize(smallSession)).toBe(20);

      const hugeSession = {
        ...baseSession,
        gridLabelPosition: "top" as const,
        gridLabelSize: 500,
      };
      // height is 400, max allowed is 400 - 20 = 380
      expect(LaneGridLabelHelper.getEffectiveLabelSize(hugeSession)).toBe(380);

      const widthSession = {
        ...baseSession,
        bounds: { x: 0, y: 0, width: 200, height: 400 },
        gridLabelPosition: "left" as const,
        gridLabelSize: 300,
      };
      // width is 200, max allowed is 200 - 20 = 180
      expect(LaneGridLabelHelper.getEffectiveLabelSize(widthSession)).toBe(180);
    });
  });

  describe("computeGridDataBounds", () => {
    it("should return unchanged bounds when gridLabelPosition is none or empty", () => {
      const dataBounds = LaneGridLabelHelper.computeGridDataBounds(baseSession);
      expect(dataBounds).toEqual({ x: 100, y: 50, width: 800, height: 400 });

      const noneSession = {
        ...baseSession,
        gridLabelPosition: "none" as const,
      };
      expect(LaneGridLabelHelper.computeGridDataBounds(noneSession)).toEqual({
        x: 100,
        y: 50,
        width: 800,
        height: 400,
      });
    });

    it("should carve out top space when gridLabelPosition is top", () => {
      const topSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "top",
        gridLabelSize: 50,
      };
      const dataBounds = LaneGridLabelHelper.computeGridDataBounds(topSession);
      expect(dataBounds).toEqual({
        x: 100,
        y: 100, // 50 + 50
        width: 800,
        height: 350, // 400 - 50
      });
    });

    it("should carve out bottom space when gridLabelPosition is bottom", () => {
      const bottomSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "bottom",
        gridLabelSize: 60,
      };
      const dataBounds =
        LaneGridLabelHelper.computeGridDataBounds(bottomSession);
      expect(dataBounds).toEqual({
        x: 100,
        y: 50,
        width: 800,
        height: 340, // 400 - 60
      });
    });

    it("should carve out left space when gridLabelPosition is left", () => {
      const leftSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "left",
        gridLabelSize: 80,
      };
      const dataBounds = LaneGridLabelHelper.computeGridDataBounds(leftSession);
      expect(dataBounds).toEqual({
        x: 180, // 100 + 80
        y: 50,
        width: 720, // 800 - 80
        height: 400,
      });
    });

    it("should carve out right space when gridLabelPosition is right", () => {
      const rightSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "right",
        gridLabelSize: 75,
      };
      const dataBounds =
        LaneGridLabelHelper.computeGridDataBounds(rightSession);
      expect(dataBounds).toEqual({
        x: 100,
        y: 50,
        width: 725, // 800 - 75
        height: 400,
      });
    });
  });

  describe("computeGridLabelBounds", () => {
    it("should return null when gridLabelPosition is none or empty", () => {
      expect(
        LaneGridLabelHelper.computeGridLabelBounds(baseSession),
      ).toBeNull();

      const noneSession = {
        ...baseSession,
        gridLabelPosition: "none" as const,
      };
      expect(
        LaneGridLabelHelper.computeGridLabelBounds(noneSession),
      ).toBeNull();
    });

    it("should return correct bounds for top label", () => {
      const topSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "top",
        gridLabelSize: 45,
      };
      expect(LaneGridLabelHelper.computeGridLabelBounds(topSession)).toEqual({
        x: 100,
        y: 50,
        width: 800,
        height: 45,
      });
    });

    it("should return correct bounds for bottom label", () => {
      const bottomSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "bottom",
        gridLabelSize: 55,
      };
      expect(LaneGridLabelHelper.computeGridLabelBounds(bottomSession)).toEqual(
        {
          x: 100,
          y: 395, // 50 + 400 - 55
          width: 800,
          height: 55,
        },
      );
    });

    it("should return correct bounds for left label", () => {
      const leftSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "left",
        gridLabelSize: 70,
      };
      expect(LaneGridLabelHelper.computeGridLabelBounds(leftSession)).toEqual({
        x: 100,
        y: 50,
        width: 70,
        height: 400,
      });
    });

    it("should return correct bounds for right label", () => {
      const rightSession: LaneGridSession = {
        ...baseSession,
        gridLabelPosition: "right",
        gridLabelSize: 65,
      };
      expect(LaneGridLabelHelper.computeGridLabelBounds(rightSession)).toEqual({
        x: 835, // 100 + 800 - 65
        y: 50,
        width: 65,
        height: 400,
      });
    });
  });

  describe("updateGridLabelSettings", () => {
    it("should update all widgets belonging to the specified gridId", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: { gridId: "test-grid" },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 0,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: { gridId: "test-grid" },
        },
        {
          id: "other",
          widgetType: "flag",
          x: 200,
          y: 0,
          width: 50,
          height: 50,
          zIndex: 1,
          customSettings: { gridId: "other-grid" },
        },
      ];

      const config: GridLabelConfig = {
        gridLabelPosition: "top",
        gridLabelText: "LEADERBOARD",
        gridLabelSize: 45,
        gridLabelFontFamily: "Arial",
        gridLabelFontSize: 22,
        gridLabelTextColor: "#ffff00",
        gridLabelBackgroundColor: "#333333",
        gridLabelFontBold: true,
        gridLabelFontItalic: false,
        gridLabelAlignment: "center",
      };

      const updated = LaneGridLabelHelper.updateGridLabelSettings(
        widgets,
        "test-grid",
        config,
      );
      expect(updated[0].customSettings?.["gridLabelPosition"]).toBe("top");
      expect(updated[0].customSettings?.["gridLabelText"]).toBe("LEADERBOARD");
      expect(updated[0].customSettings?.["gridLabelSize"]).toBe(45);
      expect(updated[0].customSettings?.["gridLabelFontFamily"]).toBe("Arial");
      expect(updated[0].customSettings?.["gridLabelFontSize"]).toBe(22);
      expect(updated[0].customSettings?.["gridLabelTextColor"]).toBe("#ffff00");
      expect(updated[0].customSettings?.["gridLabelBackgroundColor"]).toBe(
        "#333333",
      );
      expect(updated[0].customSettings?.["gridLabelFontBold"]).toBeTrue();
      expect(updated[0].customSettings?.["gridLabelFontItalic"]).toBeFalse();
      expect(updated[0].customSettings?.["gridLabelAlignment"]).toBe("center");

      expect(updated[1].customSettings?.["gridLabelText"]).toBe("LEADERBOARD");
      expect(updated[2].customSettings?.["gridLabelText"]).toBeUndefined();
    });
  });

  describe("getLabelJustifyContent", () => {
    it("should return correct justify-content for horizontal labels", () => {
      expect(LaneGridLabelHelper.getLabelJustifyContent("top", "left")).toBe(
        "flex-start",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("top", "center")).toBe(
        "center",
      );
      expect(
        LaneGridLabelHelper.getLabelJustifyContent("bottom", "right"),
      ).toBe("flex-end");
    });

    it("should return correct justify-content for vertical labels", () => {
      expect(LaneGridLabelHelper.getLabelJustifyContent("left", "left")).toBe(
        "flex-end",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("left", "center")).toBe(
        "center",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("right", "right")).toBe(
        "flex-start",
      );
    });
  });
});
