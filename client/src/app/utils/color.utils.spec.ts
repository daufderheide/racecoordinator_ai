import {
  getContrastColor,
  getRandomLabelColor,
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
});
