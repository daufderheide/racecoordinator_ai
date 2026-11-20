import {
  getInspectorSchema,
  WIDGET_SCHEMAS,
} from "@app/components/ui-editor/inspector-schemas/widget-schemas";

import {
  allFields,
  fieldKeys,
  fieldMatches,
  InspectorField,
  isFieldChanged,
  isFieldVisible,
  registryDefaults,
  resetField,
} from "./inspector-schema";

describe("inspector schema helpers", () => {
  const sw: InspectorField = {
    id: "a",
    type: "switch",
    key: "showA",
    labelKey: "LBL_A",
    searchTerms: "visible thing",
  };
  const part: InspectorField = {
    id: "p",
    type: "textPart",
    labelKey: "LBL_P",
    keys: { font: "pFont", size: "pSize", color: "pColor" },
  };
  const t = (k: string) => ({ LBL_A: "Show the A", LBL_P: "Header" })[k] || k;

  it("lists the settings keys a field writes", () => {
    expect(fieldKeys(sw)).toEqual(["showA"]);
    expect(fieldKeys(part)).toEqual(["pFont", "pSize", "pColor"]);
    expect(
      fieldKeys({ id: "g", type: "geometry", pair: "size", labelKey: "x" }),
    ).toEqual([]);
  });

  it("compares with the default, treating empty, null and undefined the same", () => {
    const defaults = { showA: true, pFont: "", pSize: 17, pColor: "" };
    expect(isFieldChanged(sw, { showA: true }, defaults)).toBeFalse();
    expect(isFieldChanged(sw, {}, defaults)).toBeFalse(); // not stored = default
    expect(isFieldChanged(sw, { showA: false }, defaults)).toBeTrue();
    expect(
      isFieldChanged(
        part,
        { pFont: null, pSize: "17", pColor: undefined },
        defaults,
      ),
    ).toBeFalse();
    expect(
      isFieldChanged(part, { pFont: "", pSize: 24, pColor: "" }, defaults),
    ).toBeTrue();
  });

  it("prefers the field's own default over the registry", () => {
    const field: InspectorField = { ...(sw as any), default: false };
    expect(
      isFieldChanged(field, { showA: false }, { showA: true }),
    ).toBeFalse();
  });

  it("resets every key of a field to its default and removes keys without one", () => {
    const settings: any = { pFont: "Inter", pSize: 30, pColor: "#ff0000" };
    resetField(part, settings, { pFont: "", pSize: 17 });
    expect(settings).toEqual({ pFont: "", pSize: 17 });
  });

  it("hides fields whose condition is not met", () => {
    const f: InspectorField = {
      ...(sw as any),
      visibleWhen: (s: any) => s.mode === "on",
    };
    expect(isFieldVisible(f, { mode: "on" })).toBeTrue();
    expect(isFieldVisible(f, { mode: "off" })).toBeFalse();
    expect(isFieldVisible(sw, {})).toBeTrue();
  });

  it("searches the translated label and the extra search words", () => {
    expect(fieldMatches(sw, "", t)).toBeTrue();
    expect(fieldMatches(sw, "SHOW", t)).toBeTrue();
    expect(fieldMatches(sw, "visible", t)).toBeTrue();
    expect(fieldMatches(sw, "colour", t)).toBeFalse();
  });
});

describe("widget schemas", () => {
  it("returns null for widgets that keep their existing inspector", () => {
    expect(getInspectorSchema("custom:my-widget")).toBeNull();
    expect(getInspectorSchema("lane-column")?.widgetType).toBe("lane-column");
    expect(getInspectorSchema(undefined)).toBeNull();
    expect(getInspectorSchema("records")?.widgetType).toBe("records");
  });

  for (const [type, schema] of Object.entries(WIDGET_SCHEMAS)) {
    it(`${type}: every key the schema uses has a registry default or its own default`, () => {
      const defaults = registryDefaults(type);
      expect(Object.keys(defaults).length)
        .withContext("registry entry")
        .toBeGreaterThan(0);
      const missing: string[] = [];
      for (const field of allFields(schema)) {
        for (const key of fieldKeys(field)) {
          const own =
            ("default" in field && field.default !== undefined) ||
            (field.type === "textPart" &&
              Object.entries(field.keys).some(
                ([part, k]) =>
                  k === key && (field.keyDefaults as any)?.[part] !== undefined,
              ));
          if (!(key in defaults) && !own) missing.push(`${field.id}:${key}`);
        }
      }
      expect(missing).toEqual([]);
    });

    it(`${type}: field ids are unique and the schema type matches`, () => {
      const ids = allFields(schema).map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(schema.widgetType).toBe(type);
    });
  }

  it("shows border options only while the border is on", () => {
    const fields = allFields(WIDGET_SCHEMAS["records"]);
    const style = fields.find((f) => f.id === "borderStyle")!;
    expect(isFieldVisible(style, { showBorder: true })).toBeTrue();
    expect(isFieldVisible(style, { showBorder: false })).toBeFalse();
  });

  it("shows the timer threshold only for the threshold mode and decimals unless 'never'", () => {
    const fields = allFields(WIDGET_SCHEMAS["timer"]);
    const threshold = fields.find((f) => f.id === "timeSubsecondThreshold")!;
    const decimals = fields.find((f) => f.id === "timeSubsecondDecimals")!;
    expect(isFieldVisible(threshold, {})).toBeTrue();
    expect(
      isFieldVisible(threshold, { timeSubsecondMode: "always" }),
    ).toBeFalse();
    expect(
      isFieldVisible(decimals, { timeSubsecondMode: "always" }),
    ).toBeTrue();
    expect(
      isFieldVisible(decimals, { timeSubsecondMode: "never" }),
    ).toBeFalse();
  });
});
