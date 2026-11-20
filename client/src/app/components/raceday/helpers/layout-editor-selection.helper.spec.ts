import { signal } from "@angular/core";

import { RacedayKeyboardHelper } from "./raceday-keyboard.helper";
import { RacedayLayoutEditorHelper } from "./raceday-layout-editor.helper";

/** Phase 4b / 4c-1: canvas selection box and the race day page's arrow keys. */
describe("Layout Editor canvas selection", () => {
  let root: HTMLDivElement;
  let host: any;
  let emitted: { ids: string[]; additive: boolean }[];

  beforeEach(() => {
    root = document.createElement("div");
    // 960 x 540 on screen for a 1920 x 1080 layout: 1 screen px = 2 layout px
    root.style.cssText = "position:fixed;left:0;top:0;width:960px;height:540px";
    document.body.appendChild(root);
    emitted = [];
    host = {
      isUIEditorMode: () => true,
      isLayoutCustomizing: true,
      isCountdownPreviewActive: () => false,
      selectionBox: signal<any>(null),
      boxSelected: { emit: (e: any) => emitted.push(e) },
      layout: {
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [
          { id: "a", x: 100, y: 100, width: 100, height: 100 },
          { id: "b", x: 400, y: 400, width: 100, height: 100 },
          {
            id: "cd",
            widgetType: "countdown",
            x: 120,
            y: 120,
            width: 50,
            height: 50,
          },
        ],
      },
    };
  });

  afterEach(() => root.remove());

  const press = (x: number, y: number, init: PointerEventInit = {}) => {
    const e = new PointerEvent("pointerdown", {
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
      ...init,
    });
    Object.defineProperty(e, "currentTarget", { value: root });
    Object.defineProperty(e, "target", { value: root });
    RacedayLayoutEditorHelper.onCanvasPointerDown(host, e);
  };
  const move = (x: number, y: number) =>
    document.dispatchEvent(
      new PointerEvent("pointermove", { clientX: x, clientY: y }),
    );
  const up = () => document.dispatchEvent(new PointerEvent("pointerup"));

  it("draws a box in layout px and selects what is fully inside it", () => {
    press(25, 25);
    move(150, 150);
    expect(host.selectionBox()).toEqual({ x: 50, y: 50, w: 250, h: 250 });
    up();
    expect(host.selectionBox()).toBeNull();
    // the hidden countdown is skipped
    expect(emitted).toEqual([{ ids: ["a"], additive: false }]);
  });

  it("adds with Shift, and a plain click without dragging does nothing", () => {
    press(25, 25, { shiftKey: true });
    move(300, 300);
    up();
    expect(emitted[0]).toEqual({ ids: ["a", "b"], additive: true });

    press(25, 25);
    move(26, 26); // under 4 px: still a click
    up();
    expect(emitted.length).toBe(1);
  });

  it("only starts on the empty canvas, in the Layout Editor", () => {
    const e = new PointerEvent("pointerdown", { clientX: 5, clientY: 5 });
    Object.defineProperty(e, "currentTarget", { value: root });
    Object.defineProperty(e, "target", { value: document.createElement("i") });
    RacedayLayoutEditorHelper.onCanvasPointerDown(host, e);
    move(200, 200);
    up();
    host.isUIEditorMode = () => false;
    press(5, 5);
    move(200, 200);
    up();
    expect(emitted.length).toBe(0);
    expect(host.selectionBox()).toBeNull();
  });

  it("race day customise mode: arrow keys leave a locked widget where it is", () => {
    const widget = {
      id: "w",
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      customSettings: { locked: true },
    };
    const kHost: any = {
      selectedWidgetId: () => "w",
      layout: { widgets: [widget], baseWidth: 1920, baseHeight: 1080 },
      layoutChanged: { emit: jasmine.createSpy("emit") },
    };
    RacedayKeyboardHelper.handleLayoutCustomizationKey(
      kHost,
      new KeyboardEvent("keydown", { key: "ArrowRight" }),
    );
    expect(widget.x).toBe(10);
    widget.customSettings.locked = false;
    RacedayKeyboardHelper.handleLayoutCustomizationKey(
      kHost,
      new KeyboardEvent("keydown", { key: "ArrowRight" }),
    );
    expect(widget.x).toBe(11);
  });
});
