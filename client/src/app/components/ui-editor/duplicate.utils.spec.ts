import { canDuplicate, duplicateWidgets } from "./duplicate.utils";

const w = (id: string, extra: any = {}) => ({
  id,
  widgetType: "timer",
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  zIndex: 100,
  customSettings: { textColor: "#ff0000" },
  ...extra,
});

describe("duplicate widgets (phase 5c)", () => {
  it("copies a widget 20 px down-right with a new id, on top, same settings", () => {
    const ws: any[] = [w("a"), w("b", { zIndex: 105 })];
    const ids = duplicateWidgets(ws, ["a"], 1920, 1080, 1000);
    expect(ids).toEqual(["widget-1000"]);
    const copy = ws[2];
    expect([copy.x, copy.y, copy.width, copy.height]).toEqual([
      120, 120, 200, 100,
    ]);
    expect(copy.zIndex).toBe(106);
    expect(copy.customSettings).toEqual({ textColor: "#ff0000" });
    // a real copy, not the same object
    copy.customSettings.textColor = "#00ff00";
    expect(ws[0].customSettings.textColor).toBe("#ff0000");
  });

  it("keeps copies on the canvas and ids unique when several are made at once", () => {
    const ws: any[] = [
      w("widget-1000"),
      w("edge", { x: 1720, y: 980 }),
      w("c", { zIndex: 101 }),
    ];
    const ids = duplicateWidgets(ws, ["edge", "c"], 1920, 1080, 1000);
    expect(ids).toEqual(["widget-1001", "widget-1002"]);
    expect([ws[3].x, ws[3].y]).toEqual([1720, 980]);
    // same order among themselves as the originals (edge 100 < c 101)
    expect(ws[3].zIndex).toBeLessThan(ws[4].zIndex);
  });

  it("unlocks the copy so it can be moved away", () => {
    const ws: any[] = [w("a", { customSettings: { locked: true } })];
    duplicateWidgets(ws, ["a"]);
    expect(ws[0].customSettings.locked).toBeTrue();
    expect(ws[1].customSettings.locked).toBeFalse();
  });

  it("skips grid columns, the menu bar and the countdown; keeps the countdown on top", () => {
    const ws: any[] = [
      w("g", { customSettings: { gridId: "x" } }),
      w("m", { widgetType: "menu-bar" }),
      w("cd", { widgetType: "countdown", zIndex: 150 }),
      w("a", { zIndex: 160 }),
    ];
    expect(canDuplicate(ws[0])).toBeFalse();
    expect(canDuplicate(ws[1])).toBeFalse();
    expect(canDuplicate(ws[2])).toBeFalse();
    expect(duplicateWidgets(ws, ["g", "m", "cd"])).toEqual([]);
    duplicateWidgets(ws, ["a"]);
    expect(ws[2].zIndex).toBeGreaterThan(ws[4].zIndex);
  });
});
