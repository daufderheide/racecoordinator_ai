/**
 * Copy and paste a widget's style in the Layout Editor (phase 5a).
 *
 * "Style" is every key of a widget's Text folder (text parts: font, size,
 * colour, alignment, weight, spacing, case, plus any other text field) and
 * its Colours & frame folder (background, opacity, border, corners,
 * shadow), read from the widget's own panel schema. Content, columns,
 * behaviour and layout are never copied.
 *
 * - Copy stores what the widget looks like: a stored value, or the default
 *   when nothing is stored, so pasting can also put a target back.
 * - Paste on the same widget type: an exact copy.
 * - Paste on another type: the frame keys, any text key both widgets have,
 *   and the source's main text style (its first text part) on every other
 *   text part of the target ("map by part").
 */
import {
  allFields,
  defaultFor,
  fieldKeys,
  fieldSource,
  InspectorField,
  InspectorSchema,
  registryDefaults,
  TextPartField,
  writeFieldKey,
} from "./inspector-kit/inspector-schema";

export type PartRole = keyof TextPartField["keys"];

export interface StyleCopy {
  widgetType: string;
  /** Every style key of the source with the value it shows. */
  values: Record<string, any>;
  /** The source's first text part, by role (font, size, colour...). */
  main: Partial<Record<PartRole, any>>;
}

interface StyleEntry {
  field: InspectorField;
  key: string;
  folder: "text" | "frame";
  /** For text parts: which part of the text style this key is. */
  role?: PartRole;
}

const STYLE_FOLDERS = ["text", "frame"] as const;

/** Every style key of a schema, in panel order. */
export function styleEntries(schema: InspectorSchema | null): StyleEntry[] {
  if (!schema) return [];
  const out: StyleEntry[] = [];
  for (const folder of schema.folders) {
    if (!STYLE_FOLDERS.includes(folder.id as any)) continue;
    for (const field of folder.groups.flatMap((g) => g.fields)) {
      if (field.type === "textPart") {
        for (const role of Object.keys(field.keys) as PartRole[]) {
          const key = field.keys[role];
          if (key) out.push({ field, key, folder: folder.id as any, role });
        }
      } else {
        for (const key of fieldKeys(field)) {
          out.push({ field, key, folder: folder.id as any });
        }
      }
    }
  }
  return out;
}

const clone = (v: any) =>
  v !== null && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v;

/** What the widget looks like, as a style to paste elsewhere. */
export function copyStyle(
  schema: InspectorSchema | null,
  widget: any,
): StyleCopy | null {
  const entries = styleEntries(schema);
  if (!schema || !widget || !entries.length) return null;
  const settings = widget.customSettings || {};
  const defaults = registryDefaults(schema.widgetType);
  const values: Record<string, any> = {};
  for (const e of entries) {
    if (e.key in values) continue;
    const stored = fieldSource(e.field, settings, widget)[e.key];
    values[e.key] = clone(
      stored === undefined ? defaultFor(e.field, e.key, defaults) : stored,
    );
  }
  const main: Partial<Record<PartRole, any>> = {};
  const firstPart = allFields(schema).find(
    (f): f is TextPartField =>
      f.type === "textPart" &&
      schema.folders.some(
        (fo) => fo.id === "text" && fo.groups.some((g) => g.fields.includes(f)),
      ),
  );
  if (firstPart) {
    for (const role of Object.keys(firstPart.keys) as PartRole[]) {
      const key = firstPart.keys[role];
      if (key) main[role] = values[key];
    }
  }
  return { widgetType: schema.widgetType, values, main };
}

/**
 * Write a copied style into a widget (changes `widget` and its
 * customSettings in place). Returns how many settings were written.
 */
export function pasteStyle(
  copy: StyleCopy | null,
  schema: InspectorSchema | null,
  widget: any,
): number {
  if (!copy || !schema || !widget) return 0;
  if (!widget.customSettings) widget.customSettings = {};
  const settings = widget.customSettings;
  const sameType = copy.widgetType === schema.widgetType;
  let written = 0;
  const done = new Set<string>();
  for (const e of styleEntries(schema)) {
    if (done.has(e.key)) continue;
    let value: any;
    let has = false;
    if (e.key in copy.values) {
      value = copy.values[e.key];
      has = true;
    } else if (!sameType && e.role && e.role in copy.main) {
      // map by part: the source's main text style on this text part
      value = copy.main[e.role];
      has = true;
    }
    if (!has) continue;
    writeFieldKey(e.field, settings, widget, e.key, clone(value));
    done.add(e.key);
    written++;
  }
  return written;
}
