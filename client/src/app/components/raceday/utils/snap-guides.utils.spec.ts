import { snapRect } from "./snap-guides.utils";

const other = { id: "b", x: 500, y: 300, width: 200, height: 100 };

describe("snapRect", () => {
  it("snaps a moved widget's left edge to another widget's right edge, with a guide", () => {
    const r = snapRect([other], { x: 706, y: 50, w: 100, h: 50 }, "a", "all");
    expect(r.x).toBe(700);
    expect(r.guidesX).toEqual([700]);
  });

  it("snaps centres too: another widget's centre and the screen's centre", () => {
    // centre of the moving widget (x + 50) near the other widget's centre (600)
    const r = snapRect([other], { x: 546, y: 0, w: 100, h: 40 }, "a", "all");
    expect(r.x).toBe(550);
    expect(r.guidesX).toEqual([600]);
    // screen centre line (960) for a widget on its own
    const s = snapRect([], { x: 905, y: 0, w: 100, h: 40 }, "a", "all");
    expect(s.x).toBe(910);
    expect(s.guidesX).toEqual([960]);
  });

  it("takes the nearest target, not the first one in range", () => {
    // targets 0 (screen) and 8 (a widget's edge): x = 6 is nearer to 8
    const near = { id: "c", x: -92, y: 900, width: 100, height: 20 };
    const r = snapRect([near], { x: 6, y: 500, w: 50, h: 50 }, "a", "all");
    expect(r.x).toBe(8);
  });

  it("does nothing beyond the threshold and returns no guides", () => {
    const r = snapRect([other], { x: 380, y: 160, w: 50, h: 50 }, "a", "all");
    expect(r).toEqual(
      jasmine.objectContaining({ x: 380, y: 160, guidesX: [], guidesY: [] }),
    );
  });

  it("while resizing only moves the dragged edge", () => {
    // east edge 494 snaps to 500, x stays
    const e = snapRect([other], { x: 300, y: 0, w: 194, h: 50 }, "a", "e");
    expect([e.x, e.w]).toEqual([300, 200]);
    // west edge 705 snaps to 700: x moves, width grows by the same amount
    const w = snapRect([other], { x: 705, y: 0, w: 100, h: 50 }, "a", "w");
    expect([w.x, w.w]).toEqual([700, 105]);
    // south edge 296 snaps to the other widget's top (300)
    const s = snapRect([other], { x: 0, y: 200, w: 50, h: 96 }, "a", "s");
    expect([s.y, s.h, s.guidesY]).toEqual([200, 100, [300]]);
  });

  it("ignores the widget itself and snaps to extra targets (grid bounds)", () => {
    const self = { id: "a", x: 100, y: 100, width: 50, height: 50 };
    const r = snapRect(
      [self],
      { x: 103, y: 400, w: 50, h: 50 },
      "a",
      "all",
      1920,
      1080,
      [1200],
    );
    expect(r.x).toBe(103);
    const g = snapRect(
      [],
      { x: 1196, y: 400, w: 50, h: 50 },
      "a",
      "all",
      1920,
      1080,
      [1200],
    );
    expect(g.x).toBe(1200);
  });
});
