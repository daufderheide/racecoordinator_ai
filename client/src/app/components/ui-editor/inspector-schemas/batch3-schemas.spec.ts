import {
  allFields,
  fieldSource,
  InspectorField,
  isFieldChanged,
  registryDefaults,
  resetFieldWhereStored,
  writeFieldKey,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";

import { BATCH3_SCHEMAS } from "./batch3-schemas";

const field = (type: string, id: string): InspectorField =>
  allFields(BATCH3_SCHEMAS[type]).find((f) => f.id === id)!;

const ctx = (widget: any) => ({ widget, totalLanes: 4 });

describe("batch 3 schemas", () => {
  describe("Countdown", () => {
    const onOpen = BATCH3_SCHEMAS["countdown"].onOpen!;

    it("fills missing defaults and converts an old lampScale when opened", () => {
      const s: Record<string, any> = { lampScale: 1 };
      expect(onOpen(s, ctx({ width: 1000, height: 250 }))).toBeTrue();
      expect(s["scaleVersion"]).toBe(2);
      expect(s["maxLamps"]).toBe(5);
      expect(s["previewLampCount"]).toBe(5);
      expect(s["orientation"]).toBe("horizontal");
      expect(s["lampScale"]).not.toBe(1);
      // a second open changes nothing
      const after = { ...s };
      expect(onOpen(s, ctx({ width: 1000, height: 250 }))).toBeFalse();
      expect(s).toEqual(after);
    });

    it("leaves complete, current settings alone", () => {
      const s = registryDefaults("countdown");
      expect(onOpen(s, ctx({ width: 1000, height: 250 }))).toBeFalse();
    });

    it("shows the lamp size as a percentage and stores the factor", () => {
      const f = field("countdown", "lampScale");
      expect(f.read!({ lampScale: 1.25 })).toBe(125);
      const s: Record<string, any> = {};
      f.write!(s, 80, ctx(null));
      expect(s["lampScale"]).toBe(0.8);
      f.write!(s, 999, ctx(null));
      expect(s["lampScale"]).toBe(3);
    });

    it("stores the lamp count in both keys and reads older layouts", () => {
      const f = field("countdown", "maxLamps");
      expect(f.read!({ previewLampCount: 7 })).toBe(7);
      const s: Record<string, any> = {};
      f.write!(s, 8, ctx(null));
      expect(s).toEqual({ maxLamps: 8, previewLampCount: 8 });
    });

    it("keeps the red glow overlap and the older glowOverlap in step", () => {
      const f = field("countdown", "glowRedOverlap");
      expect(f.read!({ glowOverlap: 40 })).toBe(40);
      const s: Record<string, any> = {};
      f.write!(s, 55, ctx(null));
      expect(s).toEqual({ glowRedOverlap: 55, glowOverlap: 55 });
    });
  });

  describe("Menu Bar", () => {
    const menu = () => field("menu-bar", "menu");
    const background = () => field("menu-bar", "backgroundColor");

    it("reads and writes the font on the widget itself", () => {
      const settings: Record<string, any> = {};
      const widget: Record<string, any> = { fontFamily: "Inter" };
      expect(fieldSource(menu(), settings, widget)).toBe(widget);
      writeFieldKey(menu(), settings, widget, "fontSize", 20);
      expect(widget["fontSize"]).toBe(20);
      expect(settings["fontSize"]).toBeUndefined();
    });

    it("keeps the background on both the widget and customSettings", () => {
      const settings: Record<string, any> = {};
      const widget: Record<string, any> = {};
      writeFieldKey(
        background(),
        settings,
        widget,
        "backgroundColor",
        "#112233",
      );
      expect(widget["backgroundColor"]).toBe("#112233");
      expect(settings["backgroundColor"]).toBe("#112233");
    });

    it("is changed and resets where the value lives", () => {
      const defaults = registryDefaults("menu-bar");
      const settings: Record<string, any> = {};
      const widget: Record<string, any> = { fontSize: 22 };
      // a freshly dropped menu bar (fontSize 24) is not "changed"
      expect(
        isFieldChanged(
          menu(),
          fieldSource(menu(), settings, { fontSize: 24 }),
          defaults,
        ),
      ).toBeFalse();
      expect(
        isFieldChanged(menu(), fieldSource(menu(), settings, widget), defaults),
      ).toBeTrue();
      resetFieldWhereStored(menu(), settings, widget, defaults);
      // back to what a new menu bar gets
      expect(widget["fontSize"]).toBe(24);
    });
  });

  describe("lock (phase 4b)", () => {
    const { layoutFolder } = require("./common");
    const lock = () =>
      layoutFolder()
        .groups.flatMap((g: any) => g.fields)
        .find((f: any) => f.id === "locked");

    it("has layer buttons that call the editor, not for the menu bar or countdown", () => {
      const layer = layoutFolder()
        .groups.flatMap((g: any) => g.fields)
        .find((f: any) => f.id === "layer");
      const calls: string[] = [];
      const ctx: any = {
        widget: { id: "w1", widgetType: "timer" },
        actions: {
          layerOrder: (id: string, move: string) => calls.push(`${id} ${move}`),
          layerState: () => ({ top: true, bottom: false }),
        },
      };
      expect(layer.buttons.map((b: any) => b.id)).toEqual([
        "front",
        "forward",
        "backward",
        "back",
      ]);
      expect(layer.visibleWhen({}, ctx)).toBeTrue();
      expect(
        layer.visibleWhen({}, { ...ctx, widget: { widgetType: "menu-bar" } }),
      ).toBeFalse();
      expect(
        layer.visibleWhen({}, { ...ctx, widget: { widgetType: "countdown" } }),
      ).toBeFalse();
      expect(layer.visibleWhen({}, { widget: ctx.widget })).toBeFalse();
      layer.buttons[3].run(ctx);
      expect(calls).toEqual(["w1 back"]);
      // already in front: front / forward greyed out, the others not
      expect(layer.buttons.map((b: any) => b.disabled(ctx))).toEqual([
        true,
        true,
        false,
        false,
      ]);
    });

    it("has a lock switch, off by default, hidden for grid columns", () => {
      expect(lock().type).toBe("switch");
      expect(registryDefaults("timer")["locked"]).toBeFalse();
      expect(lock().visibleWhen({}, {} as any)).toBeTrue();
      expect(lock().visibleWhen({ gridId: "g1" }, {} as any)).toBeFalse();
    });
  });
});
