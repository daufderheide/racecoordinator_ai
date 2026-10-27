import {
  getContrastColor,
  getRandomLabelColor,
  isColorLight,
  PRESET_LABEL_COLORS,
} from "./color.utils";

describe("ColorUtils", () => {
  it("should return white text for dark colors", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
    expect(getContrastColor("#1e293b")).toBe("#ffffff");
    expect(getContrastColor("#1e3a8a")).toBe("#ffffff");
    expect(getContrastColor("#000")).toBe("#ffffff");
  });

  it("should return dark text for bright colors", () => {
    expect(getContrastColor("#ffffff")).toBe("#0f172a");
    expect(getContrastColor("#facc15")).toBe("#0f172a");
    expect(getContrastColor("#a3e635")).toBe("#0f172a");
    expect(getContrastColor("#fff")).toBe("#0f172a");
  });

  it("should handle undefined, empty, or invalid hex gracefully", () => {
    expect(getContrastColor(undefined)).toBe("#ffffff");
    expect(getContrastColor("")).toBe("#ffffff");
    expect(getContrastColor("invalid")).toBe("#ffffff");
    expect(getContrastColor("#12")).toBe("#ffffff");
    expect(getContrastColor("#zzzzzz")).toBe("#ffffff");
  });

  it("should return a color from PRESET_LABEL_COLORS with getRandomLabelColor", () => {
    const randomColor = getRandomLabelColor();
    expect(PRESET_LABEL_COLORS).toContain(randomColor);
  });

  describe("isColorLight", () => {
    it("should return true for white and bright colors", () => {
      expect(isColorLight("#ffffff")).toBeTrue();
      expect(isColorLight("#fff")).toBeTrue();
      expect(isColorLight("#ffff00")).toBeTrue(); // Yellow
      expect(isColorLight("white")).toBeTrue();
      expect(isColorLight("yellow")).toBeTrue();
      expect(isColorLight("rgb(255, 255, 255)")).toBeTrue();
      expect(isColorLight("rgba(255, 255, 255, 1)")).toBeTrue();
      expect(isColorLight("#facc15")).toBeTrue();
    });

    it("should return false for dark colors, red, black, and transparent", () => {
      expect(isColorLight("#000000")).toBeFalse();
      expect(isColorLight("#000")).toBeFalse();
      expect(isColorLight("black")).toBeFalse();
      expect(isColorLight("red")).toBeFalse();
      expect(isColorLight("#ff0000")).toBeFalse(); // Pure red is < 0.55 luminance
      expect(isColorLight("#1e293b")).toBeFalse();
      expect(isColorLight("transparent")).toBeFalse();
      expect(isColorLight("")).toBeFalse();
      expect(isColorLight(undefined)).toBeFalse();
      expect(isColorLight("invalid")).toBeFalse();
    });
  });
});
