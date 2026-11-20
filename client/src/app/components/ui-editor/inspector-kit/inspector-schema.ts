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
  | "text"
  | "frame"
  | "layout"
  | "behaviour";

export const FOLDER_ORDER: InspectorFolderId[] = [
  "content",
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

interface FieldBase {
  /** Unique within the schema; used for search highlight and test ids. */
  id: string;
  labelKey: string;
  helpKey?: string;
  /** Extra words that find this field (English, lower case). */
  searchTerms?: string;
  /** Shown only when this returns true for the current settings. */
  visibleWhen?: (settings: Record<string, any>) => boolean;
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
  keys: { font?: string; size?: string; color?: string; align?: string };
  sizeMin?: number;
  sizeMax?: number;
  /** Colour shown in the sample while the colour setting is empty. */
  defaultColor?: string;
  /** Defaults for keys the widget registry doesn't define. */
  keyDefaults?: {
    font?: string;
    size?: number;
    color?: string;
    align?: string;
  };
}

/** An image from the asset library (the existing image selector). */
export interface ImageField extends FieldBase {
  type: "image";
  key: string;
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
}

/** Keys in customSettings that a field reads and writes. */
export function fieldKeys(field: InspectorField): string[] {
  switch (field.type) {
    case "textPart":
      return Object.values(field.keys).filter((k): k is string => !!k);
    case "geometry":
      return [];
    default:
      return [field.key];
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
): boolean {
  return !field.visibleWhen || field.visibleWhen(settings || {});
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
    translate(field.labelKey),
    field.helpKey ? translate(field.helpKey) : "",
    field.searchTerms || "",
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(q);
}

export function allFields(schema: InspectorSchema): InspectorField[] {
  return schema.folders.flatMap((f) => f.groups.flatMap((g) => g.fields));
}
