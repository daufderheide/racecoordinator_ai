import { layerState, LayerWidget, moveLayer } from "./layer-order.utils";

const w = (
  id: string,
  zIndex?: number,
  extra: Partial<LayerWidget> = {},
): LayerWidget => ({ id, zIndex, ...extra });

/** Ids from back to front, the way they are drawn. */
const order = (ws: LayerWidget[]) =>
  ws
    .filter((x) => x.widgetType !== "menu-bar" && x.widgetType !== "countdown")
    .map((x, i) => ({ x, i }))
    .sort((a, b) => (a.x.zIndex ?? 100) - (b.x.zIndex ?? 100) || a.i - b.i)
    .map((e) => e.x.id);

describe("layer order", () => {
  it("brings to front and sends to back, numbering from 100", () => {
    const ws = [w("a", 100), w("b", 101), w("c", 102)];
    expect(moveLayer(ws, "a", "front")).toBeTrue();
    expect(order(ws)).toEqual(["b", "c", "a"]);
    expect(ws.map((x) => x.zIndex)).toEqual([102, 100, 101]);
    moveLayer(ws, "c", "back");
    expect(order(ws)).toEqual(["c", "b", "a"]);
  });

  it("moves one step forward or backward", () => {
    const ws = [w("a", 100), w("b", 101), w("c", 102)];
    moveLayer(ws, "a", "forward");
    expect(order(ws)).toEqual(["b", "a", "c"]);
    moveLayer(ws, "c", "backward");
    expect(order(ws)).toEqual(["b", "c", "a"]);
  });

  it("keeps the drawing order for widgets without a zIndex or with the same one", () => {
    const ws = [w("a"), w("b"), w("c", 100)];
    moveLayer(ws, "b", "backward");
    expect(order(ws)).toEqual(["b", "a", "c"]);
  });

  it("moves a grid as one block and keeps its inner order", () => {
    const g = (id: string, z: number) =>
      w(id, z, { customSettings: { gridId: "g1" } });
    const ws = [g("g-2", 103), w("a", 100), g("g-1", 101), w("b", 102)];
    // the grid sits at its lowest member (101): a, grid, b
    expect(order(ws)).toEqual(["a", "g-1", "b", "g-2"]);
    moveLayer(ws, "g-2", "front");
    expect(order(ws)).toEqual(["a", "b", "g-1", "g-2"]);
    moveLayer(ws, "g-1", "back");
    expect(order(ws)).toEqual(["g-1", "g-2", "a", "b"]);
  });

  it("leaves the menu bar alone and keeps the countdown above everything", () => {
    const ws = [
      w("menu", 5000, { widgetType: "menu-bar" }),
      w("cd", 50, { widgetType: "countdown" }),
      w("a", 100),
      w("b", 101),
    ];
    moveLayer(ws, "a", "front");
    expect(ws[0].zIndex).toBe(5000);
    expect(ws[1].zIndex).toBeGreaterThan(ws[2].zIndex!);
    expect(moveLayer(ws, "menu", "back")).toBeFalse();
  });

  it("says whether a widget is already at the front or back", () => {
    const ws = [w("a", 100), w("b", 101), w("c", 102)];
    expect(layerState(ws, "a")).toEqual({ top: false, bottom: true });
    expect(layerState(ws, "c")).toEqual({ top: true, bottom: false });
    expect(layerState(ws, "missing")).toBeNull();
  });
});
