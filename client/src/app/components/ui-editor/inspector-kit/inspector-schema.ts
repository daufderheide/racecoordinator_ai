import { Type } from "@angular/core";
import { WIDGET_REGISTRY } from "@app/components/ui-editor/widget-registry";
import { getDefaultBorderConfigForWidget } from "@app/utils/widget-border.utils";

/**
 * Describes a widget's settings for the redesigned Widget Configuration panel.
 * The fields point at the existing `customSettings` keys (or the widget's own
 * x/y/width/height), so a schema never changes what is stored in a layout.
 */

/** Fixed folder order. */
export type InspectorFolderId =
  | "content"
  | "columns"
  | "text"
  | "frame"
  | "layout"
  | "behaviour";

export const FOLDER_ORDER: InspectorFolderId[] = [
  "content",
  "columns",
  "text",
  "frame",
  "layout",
  "behaviour",
];

export const FOLDER_META: Record<
  InspectorFolderId,
  { labelKey: string; icon: string }
> = {
  content: { labelKey: "UE_KIT_FOLDER_CONTENT", icon: "list_alt" },
  columns: { labelKey: "UE_KIT_FOLDER_COLUMNS", icon: "view_column" },
  text: { labelKey: "UE_KIT_FOLDER_TEXT", icon: "text_fields" },
  frame: { labelKey: "UE_KIT_FOLDER_FRAME", icon: "palette" },
  layout: { labelKey: "UE_KIT_FOLDER_LAYOUT", icon: "straighten" },
  behaviour: { labelKey: "UE_KIT_FOLDER_BEHAVIOUR", icon: "bolt" },
};

export interface InspectorOption {
  value: any;
  /** Translation key; `label` is used as-is when there is no key (e.g. "0"). */
  labelKey?: string;
  label?: string;
  icon?: string;
}

/** What a field may need beyond the settings: the widget and the track. */
export interface InspectorContext {
  widget: any;
  totalLanes: number;
  /** The editor's settings and layout, for parts that keep data there (Lane View columns). */
  globalSettings?: any;
  customUi?: any;
  availableColumns?: { key: string; label: string }[];
  isPracticeMode?: boolean;
  /** Lane Column: the inset clicked on the canvas and the open tab / scope. */
  selectedAnchor?: string | null;
  selectionToken?: number;
  activeTab?: string | null;
  /** Editor handlers an embedded part can call (tab, anchor, grid actions...). */
  actions?: InspectorActions;
}

/** The Layout Editor's handlers for what an old inspector used to emit. */
export interface InspectorActions {
  tabChange?: (tab: string) => void;
  anchorChange?: (anchor: string | null) => void;
  requestReplicate?: () => void;
  replicate?: (options: any) => void;
  editGrid?: (gridId: string) => void;
  detachGrid?: (gridId: string) => void;
  deleteGrid?: (gridId: string) => void;
  reMirrorGrid?: (gridId: string) => void;
  bringGridToFront?: (gridId: string) => void;
}

interface FieldBase {
  /** Unique within the schema; used for search highlight and test ids. */
  id: string;
  labelKey: string;
  helpKey?: string;
  /** Literal label / help text, used instead of the keys (e.g. a custom widget's manifest). */
  label?: string;
  help?: string;
  /** Extra words that find this field (English, lower case). */
  searchTerms?: string;
  /** Shown only when this returns true for the current settings. */
  visibleWhen?: (
    settings: Record<string, any>,
    context?: InspectorContext,
  ) => boolean;
  /**
   * For a field that isn't one key: what it shows, worked out from the stored
   * settings the way the old inspector did (so older layouts read the same).
   * Without it the field shows `key`.
   */
  read?: (settings: Record<string, any>) => any;
  /** For a field that isn't one key: store a chosen value (may set several keys). */
  write?: (
    settings: Record<string, any>,
    value: any,
    context: InspectorContext,
  ) => void;
  /** Other keys `write` sets, so "changed" and reset cover them too. */
  touches?: string[];
  /**
   * Where the keys live: in customSettings (default), on the widget itself
   * (e.g. the Menu Bar's font), or on both (kept in step, as its old inspector did).
   */
  on?: "settings" | "widget" | "both";
}

export interface SwitchField extends FieldBase {
  type: "switch";
  key: string;
  default?: boolean;
}

export interface SegmentField extends FieldBase {
  type: "segment";
  key: string;
  options: InspectorOption[];
  default?: any;
}

export interface SelectField extends FieldBase {
  type: "select";
  key: string;
  options: InspectorOption[];
  default?: any;
}

export interface StepperField extends FieldBase {
  type: "stepper";
  key: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: string;
  default?: number;
  /** A maximum that depends on the track, e.g. the number of lanes. */
  maxFrom?: (context: InspectorContext) => number;
}

export interface ColorField extends FieldBase {
  type: "color";
  key: string;
  /** Colour shown in the picker while the setting is empty (theme default). */
  placeholder?: string;
  default?: string;
}

export interface TextField extends FieldBase {
  type: "text";
  key: string;
  placeholderKey?: string;
  /** Literal placeholder (e.g. a key combination) when there's nothing to translate. */
  placeholder?: string;
  maxLength?: number;
  default?: string;
}

export interface TilesField extends FieldBase {
  type: "tiles";
  key: string;
  tiles: (InspectorOption & { demo: "border" | "shadow" })[];
  default?: any;
}

/** One piece of text (header, value, …): font, size and colour keys. */
export interface TextPartField extends FieldBase {
  type: "textPart";
  sampleKey?: string;
  sample?: string;
  /** Show the text stored in this setting as the sample (e.g. a Label's own text). */
  sampleSetting?: string;
  keys: {
    font?: string;
    size?: string;
    color?: string;
    align?: string;
    /** Text style (phase 3b), drawn by PartTextStyleDirective in the widget. */
    weight?: string;
    spacing?: string;
    case?: string;
  };
  sizeMin?: number;
  sizeMax?: number;
  /** Hide just the colour row when the colour has no effect (e.g. lane colours win). */
  colorVisibleWhen?: (settings: Record<string, any>) => boolean;
  /** Colour shown in the sample while the colour setting is empty. */
  defaultColor?: string;
  /** Defaults for keys the widget registry doesn't define. */
  keyDefaults?: {
    font?: string;
    size?: number;
    color?: string;
    align?: string;
    weight?: string;
    spacing?: number;
    case?: string;
  };
}

/** A short paragraph (e.g. a custom widget's description). No setting. */
export interface NoteField extends FieldBase {
  type: "note";
  /** Literal text; `labelKey` is used when it's absent. */
  text?: string;
}

/** An image from the asset library (the existing image selector). */
export interface ImageField extends FieldBase {
  type: "image";
  key: string;
}

/**
 * An existing editor part shown as-is inside a folder (e.g. the Lane View
 * column manager). The component gets `settings`, `widget`, `context` and a
 * `notify` function to call after it changed something.
 */
export interface EmbedField extends FieldBase {
  type: "embed";
  component: Type<unknown>;
}

/** Position or size on the widget itself (not in customSettings). */
export interface GeometryField extends FieldBase {
  type: "geometry";
  pair: "position" | "size";
}

export type InspectorField =
  | SwitchField
  | SegmentField
  | SelectField
  | StepperField
  | ColorField
  | TextField
  | TilesField
  | TextPartField
  | ImageField
  | EmbedField
  | NoteField
  | GeometryField;

export interface InspectorGroup {
  titleKey?: string;
  fields: InspectorField[];
}

export interface InspectorFolder {
  id: InspectorFolderId;
  groups: InspectorGroup[];
}

export interface InspectorSchema {
  widgetType: string;
  icon: string;
  folders: InspectorFolder[];
  /**
   * Runs once when a widget of this type is selected, before its settings are
   * shown (fill missing defaults, migrate old values). Returns true when it
   * changed something, so the change is saved.
   */
  onOpen?: (
    settings: Record<string, any>,
    context: InspectorContext,
  ) => boolean;
}

/** Keys in customSettings that a field reads and writes. */
export function fieldKeys(field: InspectorField): string[] {
  switch (field.type) {
    case "textPart":
      return Object.values(field.keys).filter((k): k is string => !!k);
    case "geometry":
    case "embed":
    case "note":
      return [];
    default:
      return [...new Set([field.key, ...(field.touches || [])])];
  }
}

/**
 * Defaults as the widget is drawn: no own background (the wrapper then uses the
 * theme), the border defaults the canvas uses for this type
 * (widget-border.utils), and the registry's own defaults on top.
 */
export function registryDefaults(widgetType: string): Record<string, any> {
  return {
    backgroundColor: "",
    // frame options from the shared wrapper (widget-style.utils)
    backgroundOpacity: 100,
    shadow: "none",
    ...getDefaultBorderConfigForWidget(widgetType),
    ...(WIDGET_REGISTRY[widgetType]?.defaultSettings?.() || {}),
  };
}

/** Default for one key: the field's own default wins over the registry. */
export function defaultFor(
  field: InspectorField,
  key: string,
  defaults: Record<string, any>,
): any {
  if ("default" in field && field.default !== undefined && "key" in field) {
    return field.default;
  }
  if (field.type === "textPart" && field.keyDefaults) {
    const part = (
      Object.keys(field.keys) as (keyof TextPartField["keys"])[]
    ).find((p) => field.keys[p] === key);
    const own = part ? field.keyDefaults[part] : undefined;
    if (own !== undefined && !(key in defaults)) return own;
  }
  return defaults[key];
}

/** Empty, null and undefined all mean "not set" (theme / built-in default). */
function same(a: any, b: any): boolean {
  const empty = (v: any) => v === undefined || v === null || v === "";
  if (empty(a) && empty(b)) return true;
  if (typeof a === "number" || typeof b === "number") {
    return Number(a) === Number(b);
  }
  return a === b;
}

/** A setting that isn't stored yet uses its default, so it isn't "changed". */
export function isFieldChanged(
  field: InspectorField,
  settings: Record<string, any>,
  defaults: Record<string, any>,
): boolean {
  if (field.read) {
    // A worked-out field is changed when what it shows differs from the default.
    const stored = fieldKeys(field).some(
      (k) => settings?.[k] !== undefined && settings?.[k] !== null,
    );
    return stored && !same(field.read(settings), field.read(defaults));
  }
  return fieldKeys(field).some((key) => {
    const value = settings?.[key];
    if (value === undefined || value === null) return false;
    return !same(value, defaultFor(field, key, defaults));
  });
}

/** Writes the defaults back for every key of the field. */
export function resetField(
  field: InspectorField,
  settings: Record<string, any>,
  defaults: Record<string, any>,
): void {
  for (const key of fieldKeys(field)) {
    const value = defaultFor(field, key, defaults);
    if (value === undefined) {
      delete settings[key];
    } else {
      settings[key] = value;
    }
  }
}

export function isFieldVisible(
  field: InspectorField,
  settings: Record<string, any>,
  context?: InspectorContext,
): boolean {
  return !field.visibleWhen || field.visibleWhen(settings || {}, context);
}

/** Search on the translated label and help text plus the field's extra words. */
export function fieldMatches(
  field: InspectorField,
  query: string,
  translate: (key: string) => string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = [
    field.label ?? translate(field.labelKey),
    field.help ?? (field.helpKey ? translate(field.helpKey) : ""),
    field.searchTerms || "",
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(q);
}

export function allFields(schema: InspectorSchema): InspectorField[] {
  return schema.folders.flatMap((f) => f.groups.flatMap((g) => g.fields));
}

/** The object a field reads from: customSettings, or the widget itself. */
export function fieldSource(
  field: InspectorField,
  settings: Record<string, any>,
  widget: any,
): Record<string, any> {
  return field.on === "widget" || field.on === "both"
    ? widget || {}
    : settings || {};
}

/** Stores one key of a field where it lives (both places for `on: "both"`). */
export function writeFieldKey(
  field: InspectorField,
  settings: Record<string, any>,
  widget: any,
  key: string,
  value: any,
): void {
  if (field.on === "widget" || field.on === "both") {
    if (widget) widget[key] = value;
  }
  if (field.on !== "widget" && settings) settings[key] = value;
}

/** Puts a field back to its defaults wherever its keys live. */
export function resetFieldWhereStored(
  field: InspectorField,
  settings: Record<string, any>,
  widget: any,
  defaults: Record<string, any>,
): void {
  if ((field.on === "widget" || field.on === "both") && widget) {
    resetField(field, widget, defaults);
  }
  if (field.on !== "widget" && settings) resetField(field, settings, defaults);
}
