import { arrange, ArrangeWidget } from "./arrange.utils";

const w = (
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 50,
  locked = false,
): ArrangeWidget => ({
  id,
  x,
  y,
  width,
  height,
  customSettings: locked ? { locked: true } : {},
});
const xs = (ws: ArrangeWidget[]) => ws.map((v) => v.x);
const ys = (ws: ArrangeWidget[]) => ws.map((v) => v.y);

describe("arrange (phase 4c-3)", () => {
  it("aligns left, centre and right to the box around the selection", () => {
    let ws = [w("a", 100, 0, 100), w("b", 300, 100, 200), w("c", 50, 200, 50)];
    expect(arrange(ws, "left")).toEqual({ changed: 2, skipped: 0 });
    expect(xs(ws)).toEqual([50, 50, 50]);

    ws = [w("a", 100, 0, 100), w("b", 300, 100, 200), w("c", 50, 200, 50)];
    arrange(ws, "right"); // box right edge 500
    expect(xs(ws)).toEqual([400, 300, 450]);

    ws = [w("a", 100, 0, 100), w("b", 300, 100, 200), w("c", 50, 200, 50)];
    arrange(ws, "centre"); // box 50..500, centre 275
    expect(xs(ws)).toEqual([225, 175, 250]);
  });

  it("aligns top, middle and bottom", () => {
    let ws = [w("a", 0, 100, 100, 50), w("b", 0, 300, 100, 100)];
    arrange(ws, "top");
    expect(ys(ws)).toEqual([100, 100]);
    ws = [w("a", 0, 100, 100, 50), w("b", 0, 300, 100, 100)];
    arrange(ws, "bottom"); // bottom 400
    expect(ys(ws)).toEqual([350, 300]);
    ws = [w("a", 0, 100, 100, 50), w("b", 0, 300, 100, 100)];
    arrange(ws, "middle"); // 100..400, middle 250
    expect(ys(ws)).toEqual([225, 200]);
  });

  it("distributes with equal gaps; the outer two stay put", () => {
    // spans 0..600, widths 100 + 50 + 100 = 250, so 2 gaps of 175
    const ws = [w("c", 500, 0, 100), w("a", 0, 0, 100), w("b", 120, 0, 50)];
    arrange(ws, "distributeX");
    expect(xs(ws)).toEqual([500, 0, 275]);
    // needs 3 or more
    const two = [w("a", 0, 0), w("b", 500, 0)];
    expect(arrange(two, "distributeX").changed).toBe(0);
  });

  it("distributes vertically", () => {
    const ws = [
      w("a", 0, 0, 100, 100),
      w("b", 0, 150, 100, 100),
      w("c", 0, 600, 100, 100),
    ];
    arrange(ws, "distributeY"); // 0..700, used 300, gaps 200
    expect(ys(ws)).toEqual([0, 300, 600]);
  });

  it("makes the others as wide / tall as the main (first) widget, on the canvas", () => {
    const ws = [
      w("main", 0, 0, 300, 120),
      w("b", 1700, 0, 100, 50),
      w("c", 0, 1000, 50, 30),
    ];
    arrange(ws, "sameWidth");
    expect(ws.map((v) => v.width)).toEqual([300, 220, 300]);
    arrange(ws, "sameHeight");
    expect(ws.map((v) => v.height)).toEqual([120, 120, 80]);
  });

  it("leaves locked widgets as they are, but they still count for the box", () => {
    const ws = [w("a", 300, 0), w("locked", 0, 100, 100, 50, true)];
    expect(arrange(ws, "left")).toEqual({ changed: 1, skipped: 1 });
    expect(xs(ws)).toEqual([0, 0]);
    const ws2 = [w("main", 0, 0, 300), w("locked", 0, 100, 100, 50, true)];
    arrange(ws2, "sameWidth");
    expect(ws2[1].width).toBe(100);
  });

  it("does nothing with fewer than two widgets", () => {
    const ws = [w("a", 10, 10)];
    expect(arrange(ws, "left")).toEqual({ changed: 0, skipped: 0 });
  });
});
