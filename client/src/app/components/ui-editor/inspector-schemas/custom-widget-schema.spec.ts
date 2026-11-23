import { allFields } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { CustomWidgetDefinition } from "@app/models/custom-widget.model";

import {
  buildCustomWidgetSchema,
  customWidgetSchemaFor,
  isGridBoundCustomWidget,
} from "./custom-widget-schema";

const definition = (
  settingsSchema: any[],
  description = "",
): CustomWidgetDefinition =>
  ({
    manifest: {
      id: "gauge",
      name: "Gauge",
      description,
      settingsSchema,
    },
  }) as unknown as CustomWidgetDefinition;

describe("custom widget schema", () => {
  it("makes one panel field per manifest setting, with its key, label and default", () => {
    const schema = buildCustomWidgetSchema(
      "custom:gauge",
      definition([
        { key: "title", label: "Title", type: "string", default: "Speed" },
        { key: "showMax", label: "Show max", type: "boolean", default: true },
        {
          key: "dial",
          label: "Dial colour",
          type: "color",
          default: "#38bdf8",
        },
        {
          key: "warn",
          label: "Warning at",
          type: "number",
          min: 0,
          max: 200,
          step: 5,
          default: 80,
        },
        {
          key: "style",
          label: "Style",
          type: "select",
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
          default: "a",
          colorKey: "styleColor",
          colorDefault: "#ffffff",
        },
      ]),
    );
    const fields = allFields(schema);
    const byId = Object.fromEntries(fields.map((f) => [f.id, f]));
    expect(byId["title"].type).toBe("text");
    expect(byId["title"].label).toBe("Title");
    expect(byId["showMax"].type).toBe("switch");
    expect(byId["dial"].type).toBe("color");
    const warn = byId["warn"];
    expect(
      warn.type === "stepper" && [warn.min, warn.max, warn.step, warn.default],
    ).toEqual([0, 200, 5, 80]);
    expect(byId["style"].type).toBe("select");
    // the select's own colour follows it, as in the old inspector
    expect(byId["styleColor"].type).toBe("color");
    expect((byId["styleColor"] as any).default).toBe("#ffffff");
    // frame and layout come from the panel
    expect(schema.folders.map((f) => f.id)).toEqual([
      "content",
      "frame",
      "layout",
    ]);
  });

  it("shows the manifest description, and a note when there are no settings", () => {
    const schema = buildCustomWidgetSchema(
      "custom:x",
      definition([], "Shows speed."),
    );
    const notes = allFields(schema).filter((f) => f.type === "note");
    expect(notes.map((n: any) => n.text ?? n.labelKey)).toEqual([
      "Shows speed.",
      "UE_INSPECTOR_NO_CUSTOM_PROPERTIES",
    ]);
  });

  it("a custom widget bound to a grid or lane uses the Lane Column panel", () => {
    expect(
      isGridBoundCustomWidget({ customSettings: { gridId: "g1" } }),
    ).toBeTrue();
    expect(
      isGridBoundCustomWidget({ customSettings: { targetIndex: 0 } }),
    ).toBeTrue();
    expect(
      isGridBoundCustomWidget({
        customSettings: { insets: { "top-left": null } },
      }),
    ).toBeFalse();
    expect(isGridBoundCustomWidget({ customSettings: {} })).toBeFalse();

    const grid = customWidgetSchemaFor(
      { widgetType: "custom:g", customSettings: { gridId: "g1" } },
      definition([]),
    );
    expect(allFields(grid).some((f) => f.type === "embed")).toBeTrue();
  });

  it("returns the same schema object for the same widget type and manifest", () => {
    const def = definition([{ key: "a", label: "A", type: "string" }]);
    const w = { widgetType: "custom:same", customSettings: {} };
    expect(customWidgetSchemaFor(w, def)).toBe(
      customWidgetSchemaFor({ ...w }, def),
    );
    // a reloaded manifest gives a fresh schema
    const def2 = definition([{ key: "b", label: "B", type: "string" }]);
    expect(customWidgetSchemaFor(w, def2)).not.toBe(
      customWidgetSchemaFor(w, def),
    );
  });
});
