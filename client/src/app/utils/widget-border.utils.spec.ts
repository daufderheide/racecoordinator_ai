import {
  getDefaultBorderConfigForWidget,
  resolveWidgetBorderStyles,
  toValidHexColor,
} from "./widget-border.utils";

describe("widget-border.utils", () => {
  describe("toValidHexColor", () => {
    it("should return valid 6-char hex as-is", () => {
      expect(toValidHexColor("#123456")).toBe("#123456");
      expect(toValidHexColor("#abcdef", "#000000")).toBe("#abcdef");
    });

    it("should expand 3-char hex to 6-char hex", () => {
      expect(toValidHexColor("#abc")).toBe("#aabbcc");
      expect(toValidHexColor("#f00", "#000000")).toBe("#ff0000");
    });

    it("should return fallback for invalid or empty colors", () => {
      expect(toValidHexColor("")).toBe("#ffffff");
      expect(toValidHexColor(undefined)).toBe("#ffffff");
      expect(toValidHexColor(null, "#112233")).toBe("#112233");
      expect(toValidHexColor("rgba(0,0,0,0.5)", "#ffffff")).toBe("#ffffff");
      expect(toValidHexColor("not-a-color", "#38bdf8")).toBe("#38bdf8");
    });
  });

  describe("getDefaultBorderConfigForWidget", () => {
    it("should return 2px solid #dddddd radius 8 for timer", () => {
      const config = getDefaultBorderConfigForWidget("timer");
      expect(config).toEqual({
        showBorder: true,
        borderStyle: "solid",
        borderColor: "#dddddd",
        borderWidth: 2,
        borderRadius: 8,
      });
    });

    it("should return panel-card defaults for records and leaderboard", () => {
      const recordsConfig = getDefaultBorderConfigForWidget("records");
      expect(recordsConfig).toEqual({
        showBorder: true,
        borderStyle: "solid",
        borderColor: "#ffffff",
        borderWidth: 1,
        borderRadius: 6,
      });

      const lbConfig = getDefaultBorderConfigForWidget("leaderboard");
      expect(lbConfig.borderRadius).toBe(6);
      expect(lbConfig.showBorder).toBeTrue();
    });

    it("should return showBorder: false for info widgets", () => {
      const heatInfo = getDefaultBorderConfigForWidget("heat-info");
      expect(heatInfo.showBorder).toBeFalse();

      const raceName = getDefaultBorderConfigForWidget("race-name");
      expect(raceName.showBorder).toBeFalse();

      const countdown = getDefaultBorderConfigForWidget("countdown");
      expect(countdown.showBorder).toBeFalse();

      const gauge = getDefaultBorderConfigForWidget("progress-gauge");
      expect(gauge.showBorder).toBeFalse();
      expect(gauge.borderRadius).toBe(12);
    });

    it("should return appropriate defaults for action buttons", () => {
      const startBtn = getDefaultBorderConfigForWidget("action-start-resume");
      expect(startBtn.showBorder).toBeTrue();
      expect(startBtn.borderRadius).toBe(4);

      const backBtn = getDefaultBorderConfigForWidget("action-back");
      expect(backBtn.showBorder).toBeTrue();
      expect(backBtn.borderRadius).toBe(8);
    });
  });

  describe("resolveWidgetBorderStyles", () => {
    it("should resolve default styles when customSettings are empty", () => {
      const res = resolveWidgetBorderStyles("timer", {});
      expect(res.borderStyle).toBe("solid");
      expect(res.borderColor).toBe("#dddddd");
      expect(res.borderWidth).toBe("2px");
      expect(res.borderRadius).toBe("8px");
      expect(res.hasBorder).toBeTrue();
    });

    it("should return borderStyle: none and hasBorder: false when showBorder is false", () => {
      const res = resolveWidgetBorderStyles("timer", { showBorder: false });
      expect(res.borderStyle).toBe("none");
      expect(res.hasBorder).toBeFalse();
    });

    it("should override border properties when provided in customSettings", () => {
      const res = resolveWidgetBorderStyles("heat-info", {
        showBorder: true,
        borderStyle: "dashed",
        borderColor: "#ff0000",
        borderWidth: 3,
        borderRadius: 10,
      });
      expect(res.borderStyle).toBe("dashed");
      expect(res.borderColor).toBe("#ff0000");
      expect(res.borderWidth).toBe("3px");
      expect(res.borderRadius).toBe("10px");
      expect(res.hasBorder).toBeTrue();
    });
  });
});
