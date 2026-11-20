import { getInspectorSchema } from "./inspector-schemas/widget-schemas";
import { copyStyle, pasteStyle, styleEntries } from "./style-copy.utils";

const records = () => getInspectorSchema("records")!;
const timer = () => getInspectorSchema("timer")!;
const menu = () => getInspectorSchema("menu-bar")!;

describe("copy / paste style (phase 5a)", () => {
  it("counts text and frame keys as style, never content or layout", () => {
    const keys = styleEntries(records()).map((e) => e.key);
    expect(keys).toContain("headerFontFamily");
    expect(keys).toContain("valueTextColor");
    expect(keys).toContain("backgroundColor");
    expect(keys).toContain("borderRadius");
    expect(keys).toContain("shadow");
    expect(keys).not.toContain("locked");
    expect(keys).not.toContain("showHeatBest");
  });

  it("copies what the widget shows, defaults included", () => {
    const w = {
      widgetType: "records",
      customSettings: { headerFontFamily: "Orbitron", borderRadius: 12 },
    };
    const copy = copyStyle(records(), w)!;
    expect(copy.widgetType).toBe("records");
    expect(copy.values["headerFontFamily"]).toBe("Orbitron");
    expect(copy.values["borderRadius"]).toBe(12);
    // not stored: the default it shows
    expect("shadow" in copy.values).toBeTrue();
    expect(copy.values["shadow"]).toBe("none");
    expect(copy.main.font).toBe("Orbitron");
  });

  it("same type: an exact copy, which can also put a target back to defaults", () => {
    const src = {
      widgetType: "records",
      customSettings: { headerFontFamily: "Orbitron", headerFontSize: 30 },
    };
    const dst: any = {
      widgetType: "records",
      customSettings: {
        headerFontSize: 12,
        shadow: "raised",
        showHeatBest: false,
      },
    };
    const n = pasteStyle(copyStyle(records(), src), records(), dst);
    expect(n).toBeGreaterThan(5);
    expect(dst.customSettings.headerFontFamily).toBe("Orbitron");
    expect(dst.customSettings.headerFontSize).toBe(30);
    expect(dst.customSettings.shadow).toBe("none");
    // content is left alone
    expect(dst.customSettings.showHeatBest).toBeFalse();
  });

  it("another type: frame keys exactly, the main text style on every text part", () => {
    const src = {
      widgetType: "records",
      customSettings: {
        headerFontFamily: "Orbitron",
        headerFontSize: 18,
        headerTextColor: "#ff0000",
        borderRadius: 14,
      },
    };
    const dst: any = { widgetType: "timer", customSettings: {} };
    pasteStyle(copyStyle(records(), src), timer(), dst);
    expect(dst.customSettings.borderRadius).toBe(14);
    const parts = timer()
      .folders.find((f) => f.id === "text")!
      .groups.flatMap((g) => g.fields)
      .filter((f: any) => f.type === "textPart") as any[];
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts) {
      if (p.keys.font) expect(dst.customSettings[p.keys.font]).toBe("Orbitron");
      if (p.keys.size) expect(dst.customSettings[p.keys.size]).toBe(18);
      if (p.keys.color)
        expect(dst.customSettings[p.keys.color]).toBe("#ff0000");
    }
  });

  it("writes keys that live on the widget itself (menu bar font) there", () => {
    const src = {
      widgetType: "records",
      customSettings: { headerFontFamily: "Rajdhani", headerFontSize: 20 },
    };
    const bar: any = {
      widgetType: "menu-bar",
      fontSize: 24,
      customSettings: {},
    };
    pasteStyle(copyStyle(records(), src), menu(), bar);
    expect(bar.fontFamily).toBe("Rajdhani");
    expect(bar.fontSize).toBe(20);
    // and copies from there
    const back = copyStyle(menu(), bar)!;
    expect(back.main.font).toBe("Rajdhani");
    expect(back.main.size).toBe(20);
  });

  it("does nothing without a copy, a schema or a widget", () => {
    expect(copyStyle(null, {})).toBeNull();
    expect(pasteStyle(null, records(), {})).toBe(0);
  });
});
