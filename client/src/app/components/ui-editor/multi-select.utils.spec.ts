import {
  boxFromPoints,
  clampGroupDelta,
  movableIds,
  canMultiSelect,
  makeMain,
  selectedIds,
  selectionFromBox,
  toggleSelection,
  widgetsInBox,
} from "./multi-select.utils";

const w = (id: string, x: number, y: number, extra: any = {}) => ({
  id,
  x,
  y,
  width: 100,
  height: 50,
  ...extra,
});

describe("multi-select", () => {
  it("lists main first, without doubles or widgets that are gone", () => {
    expect(
      selectedIds(
        { main: "a", extras: ["b", "a", "gone", "c"] },
        new Set(["a", "b", "c"]),
      ),
    ).toEqual(["a", "b", "c"]);
    expect(selectedIds({ main: null, extras: [] })).toEqual([]);
  });

  it("Shift-click adds a widget as the new main and keeps the old one", () => {
    expect(toggleSelection({ main: "a", extras: [] }, "b")).toEqual({
      main: "b",
      extras: ["a"],
    });
    expect(toggleSelection({ main: "b", extras: ["a"] }, "c")).toEqual({
      main: "c",
      extras: ["a", "b"],
    });
  });

  it("Shift-click on a selected widget takes it out", () => {
    // an extra
    expect(toggleSelection({ main: "c", extras: ["a", "b"] }, "a")).toEqual({
      main: "c",
      extras: ["b"],
    });
    // the main: the most recent extra takes over
    expect(toggleSelection({ main: "c", extras: ["a", "b"] }, "c")).toEqual({
      main: "b",
      extras: ["a"],
    });
    // the last one
    expect(toggleSelection({ main: "a", extras: [] }, "a")).toEqual({
      main: null,
      extras: [],
    });
  });

  it("makes another selected widget the main one", () => {
    expect(makeMain({ main: "a", extras: ["b", "c"] }, "c")).toEqual({
      main: "c",
      extras: ["a", "b"],
    });
    const sel = { main: "a", extras: ["b"] };
    expect(makeMain(sel, "zzz")).toBe(sel);
  });

  it("selects widgets fully inside a box drawn in any direction, not grid columns", () => {
    const widgets = [
      w("in", 110, 110),
      w("half", 250, 110),
      w("grid", 120, 170, { customSettings: { gridId: "g" } }),
      w("bg", 0, 0, { width: 1920, height: 1080 }),
    ];
    const box = boxFromPoints(300, 300, 100, 100);
    expect(box).toEqual({ x: 100, y: 100, w: 200, h: 200 });
    expect(widgetsInBox(widgets, box)).toEqual(["in"]);
    expect(canMultiSelect(widgets[2])).toBeFalse();
    expect(widgetsInBox(widgets, box, (x) => x.id === "in")).toEqual([]);
  });

  it("a box replaces the selection, or adds to it with Shift", () => {
    const sel = { main: "a", extras: ["b"] };
    expect(selectionFromBox(sel, ["c", "d"], false)).toEqual({
      main: "c",
      extras: ["d"],
    });
    expect(selectionFromBox(sel, ["b", "c"], true)).toEqual({
      main: "a",
      extras: ["b", "c"],
    });
    // the main stays main when the box catches it again
    expect(selectionFromBox(sel, ["x", "a"], false)).toEqual({
      main: "a",
      extras: ["x"],
    });
    // an empty box clears, an empty Shift-box keeps
    expect(selectionFromBox(sel, [], false)).toEqual({
      main: null,
      extras: [],
    });
    expect(selectionFromBox(sel, [], true)).toEqual(sel);
  });

  it("cuts a group move so no member leaves the canvas (phase 4c-2)", () => {
    const starts = [
      { id: "a", x: 10, y: 100, width: 100, height: 50 },
      { id: "b", x: 1700, y: 20, width: 200, height: 50 },
    ];
    // b can go 20 px right, a 10 px left; b 20 px up
    expect(clampGroupDelta(starts, 50, -50, 1920, 1080)).toEqual({
      dx: 20,
      dy: -20,
    });
    expect(clampGroupDelta(starts, -50, 5, 1920, 1080)).toEqual({
      dx: -10,
      dy: 5,
    });
  });

  it("leaves locked widgets and grid columns out of a group move", () => {
    const ws = [
      w("a", 0, 0),
      w("l", 0, 0, { customSettings: { locked: true } }),
      w("g", 0, 0, { customSettings: { gridId: "x" } }),
    ];
    expect(movableIds(ws, ["a", "l", "g", "gone"])).toEqual(["a"]);
  });
});
