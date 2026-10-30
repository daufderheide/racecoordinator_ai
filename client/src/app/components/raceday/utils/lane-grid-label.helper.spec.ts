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
    let widgets: AbsoluteWidgetNode[];

    beforeEach(() => {
      widgets = [
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
    });

    it("should update all widgets belonging to the specified gridId", () => {
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
        gridLabelShowBorder: true,
        gridLabelBorderColor: "#ff0055",
        gridLabelBorderWidth: 3,
        gridLabelBorderRadius: 10,
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
      expect(updated[0].customSettings?.["gridLabelShowBorder"]).toBeTrue();
      expect(updated[0].customSettings?.["gridLabelBorderColor"]).toBe(
        "#ff0055",
      );
      expect(updated[0].customSettings?.["gridLabelBorderWidth"]).toBe(3);
      expect(updated[0].customSettings?.["gridLabelBorderRadius"]).toBe(10);

      expect(updated[1].customSettings?.["gridLabelText"]).toBe("LEADERBOARD");
      expect(updated[1].customSettings?.["gridLabelShowBorder"]).toBeTrue();
      expect(updated[2].customSettings?.["gridLabelText"]).toBeUndefined();
    });

    it("should default gridLabelShowBorder to true when omitted from config", () => {
      const config: GridLabelConfig = {
        gridLabelPosition: "top",
        gridLabelText: "DEFAULT BORDER TEST",
      };

      const updated = LaneGridLabelHelper.updateGridLabelSettings(
        widgets,
        "test-grid",
        config,
      );
      expect(updated[0].customSettings?.["gridLabelShowBorder"]).toBeTrue();
    });

    it("should respect gridLabelShowBorder when explicitly false in config", () => {
      const config: GridLabelConfig = {
        gridLabelPosition: "top",
        gridLabelText: "NO BORDER TEST",
        gridLabelShowBorder: false,
      };

      const updated = LaneGridLabelHelper.updateGridLabelSettings(
        widgets,
        "test-grid",
        config,
      );
      expect(updated[0].customSettings?.["gridLabelShowBorder"]).toBeFalse();
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

  describe("buildGridLabelSession", () => {
    it("should return null for empty widgets or unknown gridId", () => {
      expect(
        LaneGridLabelHelper.buildGridLabelSession([], "grid-1", {}),
      ).toBeNull();
      const dummy: AbsoluteWidgetNode[] = [
        {
          id: "w-d",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          zIndex: 1,
          customSettings: { gridId: "other-grid" },
        },
      ];
      expect(
        LaneGridLabelHelper.buildGridLabelSession(dummy, "unknown-grid", {}),
      ).toBeNull();
    });

    it("should build session using saved gridBounds and apply config overrides", () => {
      const w: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 100,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "test-build",
            gridBounds: { x: 100, y: 50, width: 800, height: 400 },
            gridTotalLanes: 4,
            gridDirection: "vertical",
            gridLane: 0,
            gridLabelPosition: "none",
          },
        },
      ];
      const session = LaneGridLabelHelper.buildGridLabelSession(
        w,
        "test-build",
        {
          gridLabelPosition: "top",
          gridLabelText: "Header Title",
          gridLabelSize: 50,
        },
      );
      expect(session).not.toBeNull();
      expect(session!.gridId).toBe("test-build");
      expect(session!.bounds).toEqual({
        x: 100,
        y: 50,
        width: 800,
        height: 400,
      });
      expect(session!.gridLabelPosition).toBe("top");
      expect(session!.gridLabelText).toBe("Header Title");
      expect(session!.gridLabelSize).toBe(50);
      expect(session!.totalLanes).toBe(4);
    });

    it("should compute bounds from bounding box if no saved gridBounds", () => {
      const w: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 50,
          y: 60,
          width: 150,
          height: 80,
          zIndex: 1,
          customSettings: {
            gridId: "test-calc",
            gridTotalLanes: 2,
          },
        },
        {
          id: "w2",
          widgetType: "lane-column",
          x: 50,
          y: 140,
          width: 150,
          height: 80,
          zIndex: 1,
          customSettings: {
            gridId: "test-calc",
            gridTotalLanes: 2,
          },
        },
      ];
      const session = LaneGridLabelHelper.buildGridLabelSession(
        w,
        "test-calc",
        {},
      );
      expect(session).not.toBeNull();
      expect(session!.bounds).toEqual({
        x: 50,
        y: 60,
        width: 150,
        height: 160,
      });
    });

    it("should use explicit existingBounds when provided", () => {
      const w: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: {
            gridId: "test-explicit",
          },
        },
      ];
      const customBounds = { x: 200, y: 300, width: 600, height: 400 };
      const session = LaneGridLabelHelper.buildGridLabelSession(
        w,
        "test-explicit",
        { gridLabelPosition: "top" },
        customBounds,
      );
      expect(session).not.toBeNull();
      expect(session!.bounds).toEqual(customBounds);
    });
  });

  describe("updateGridLabelSettings", () => {
    it("should update customSettings on all widgets in target grid", () => {
      const widgets: AbsoluteWidgetNode[] = [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          customSettings: { gridId: "target-grid" },
        },
        {
          id: "w2",
          widgetType: "text",
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          zIndex: 1,
          customSettings: { gridId: "other-grid" },
        },
      ];

      const updated = LaneGridLabelHelper.updateGridLabelSettings(
        widgets,
        "target-grid",
        {
          gridLabelPosition: "top",
          gridLabelText: "New Title",
          gridLabelSize: 48,
          gridLabelTextColor: "#ff0000",
        },
      );

      const w1Updated = updated.find((w) => w.id === "w1")!;
      const w2Updated = updated.find((w) => w.id === "w2")!;

      expect(w1Updated.customSettings?.["gridLabelPosition"]).toBe("top");
      expect(w1Updated.customSettings?.["gridLabelText"]).toBe("New Title");
      expect(w1Updated.customSettings?.["gridLabelSize"]).toBe(48);
      expect(w1Updated.customSettings?.["gridLabelTextColor"]).toBe("#ff0000");

      // Other grid is unchanged
      expect(w2Updated.customSettings?.["gridLabelPosition"]).toBeUndefined();
    });
  });

  describe("getLabelJustifyContent", () => {
    it("should resolve flex alignment correctly for horizontal and vertical text", () => {
      expect(LaneGridLabelHelper.getLabelJustifyContent("top", "left")).toBe(
        "flex-start",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("top", "right")).toBe(
        "flex-end",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("top", "center")).toBe(
        "center",
      );

      expect(LaneGridLabelHelper.getLabelJustifyContent("left", "left")).toBe(
        "flex-end",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("left", "right")).toBe(
        "flex-start",
      );
      expect(LaneGridLabelHelper.getLabelJustifyContent("left", "center")).toBe(
        "center",
      );
    });
  });

  describe("computeEffectiveLabelFont", () => {
    it("should return default font size and shouldWrap=false when text or bounds are missing", () => {
      const res1 = LaneGridLabelHelper.computeEffectiveLabelFont(
        "",
        { x: 0, y: 0, width: 200, height: 40 },
        "top",
        20,
      );
      expect(res1).toEqual({ fontSize: 20, shouldWrap: false });

      const res2 = LaneGridLabelHelper.computeEffectiveLabelFont(
        "Title",
        null,
        "top",
        24,
      );
      expect(res2).toEqual({ fontSize: 24, shouldWrap: false });
    });

    it("should return unscaled font size when isScaleAuto is false", () => {
      const res = LaneGridLabelHelper.computeEffectiveLabelFont(
        "A Very Long Title That Exceeds Width",
        { x: 0, y: 0, width: 100, height: 40 },
        "top",
        32,
        "sans-serif",
        true,
        false,
      );
      expect(res.fontSize).toBe(32);
      expect(res.shouldWrap).toBeFalse();
    });

    it("should preserve base font size if short text fits within bounds", () => {
      const res = LaneGridLabelHelper.computeEffectiveLabelFont(
        "Short",
        { x: 0, y: 0, width: 500, height: 50 },
        "top",
        24,
        "sans-serif",
      );
      expect(res.fontSize).toBe(24);
      expect(res.shouldWrap).toBeFalse();
    });

    it("should scale down font size when text overflows horizontal bounds", () => {
      const res = LaneGridLabelHelper.computeEffectiveLabelFont(
        "ReallyLongSuperTitleWithoutSpaces",
        { x: 0, y: 0, width: 150, height: 40 },
        "top",
        30,
        "sans-serif",
      );
      expect(res.fontSize).toBeLessThan(30);
      expect(res.fontSize).toBeGreaterThanOrEqual(8);
      expect(res.shouldWrap).toBeFalse();
    });

    it("should choose wrapping when multi-line wrapping allows a larger font size than single-line scaling", () => {
      // Container 120px wide by 60px tall with a 4-word title
      const res = LaneGridLabelHelper.computeEffectiveLabelFont(
        "Overall Leader Board Standings",
        { x: 0, y: 0, width: 120, height: 60 },
        "top",
        24,
        "sans-serif",
      );
      // Single line in 120px would be very small (< 10px), but multi-line in 60px tall can fit at larger size
      expect(res.shouldWrap).toBeTrue();
      expect(res.fontSize).toBeGreaterThan(10);
    });

    it("should handle vertical label orientation (left/right) scaling correctly", () => {
      const res = LaneGridLabelHelper.computeEffectiveLabelFont(
        "Very Long Vertical Title Text",
        { x: 0, y: 0, width: 40, height: 120 },
        "left",
        24,
        "sans-serif",
      );
      expect(res.fontSize).toBeLessThanOrEqual(24);
      // Vertical text does not wrap horizontally into columns
      expect(res.shouldWrap).toBeFalse();
    });
  });
});
