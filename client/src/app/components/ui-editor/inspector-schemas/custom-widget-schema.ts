import {
  InspectorField,
  InspectorSchema,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";
import {
  CustomWidgetDefinition,
  CustomWidgetSettingField,
} from "@app/models/custom-widget.model";

import { frameFolder, layoutFolder } from "./common";
import { laneColumnSchema } from "./lane-column-schema";

/**
 * Custom widgets (`custom:*`) describe their own settings in their manifest
 * (`settingsSchema`). The panel builds its fields from that list, with the
 * same keys, defaults and ranges the old custom widget inspector used.
 * A custom widget bound to a grid or a lane uses the Lane Column inspector,
 * as before.
 */

/** Same rule as the old inspector switch (widget-inspector-fields). */
export function isGridBoundCustomWidget(widget: any): boolean {
  const s = widget?.customSettings;
  return Boolean(
    s?.["gridId"] ||
    s?.["bindingMode"] !== undefined ||
    s?.["gridLane"] !== undefined ||
    s?.["targetIndex"] !== undefined ||
    (s?.["insets"] && Object.values(s["insets"]).some((v) => Boolean(v))),
  );
}

function fieldsFor(f: CustomWidgetSettingField): InspectorField[] {
  const base = {
    id: f.key,
    key: f.key,
    labelKey: f.key,
    label: f.label || f.key,
    help: f.description,
    searchTerms: [f.label, f.key, f.description].filter(Boolean).join(" "),
  };
  switch (f.type) {
    case "boolean":
      return [{ ...base, type: "switch", default: f.default }];
    case "number":
      return [
        {
          ...base,
          type: "stepper",
          // the old inspector had no limits when the manifest gave none
          min: f.min ?? -99999,
          max: f.max ?? 99999,
          step: f.step ?? 1,
          default: f.default,
        },
      ];
    case "color":
      return [{ ...base, type: "color", default: f.default }];
    case "select": {
      const select: InspectorField = {
        ...base,
        type: "select",
        default: f.default,
        options: (f.options || []).map((o) => ({
          value: o.value,
          label: o.label,
        })),
      };
      // a select can carry its own colour (colorKey), shown next to it before
      if (!f.colorKey) return [select];
      return [
        select,
        {
          id: f.colorKey,
          key: f.colorKey,
          type: "color",
          labelKey: "UE_KIT_COLOR",
          default: f.colorDefault,
          searchTerms: `${f.label} colour color`,
        },
      ];
    }
    case "string":
    default:
      return [{ ...base, type: "text", default: f.default, maxLength: 500 }];
  }
}

export function buildCustomWidgetSchema(
  widgetType: string,
  definition: CustomWidgetDefinition | undefined,
): InspectorSchema {
  const manifest = definition?.manifest;
  const fields = (manifest?.settingsSchema || []).flatMap(fieldsFor);
  const intro: InspectorField[] = manifest?.description
    ? [
        {
          id: "_description",
          type: "note",
          labelKey: "UE_INSPECTOR_CUSTOM_PROPERTIES",
          text: manifest.description,
        },
      ]
    : [];
  const empty: InspectorField[] = fields.length
    ? []
    : [
        {
          id: "_noProperties",
          type: "note",
          labelKey: "UE_INSPECTOR_NO_CUSTOM_PROPERTIES",
        },
      ];
  return {
    widgetType,
    icon: "extension",
    folders: [
      { id: "content", groups: [{ fields: [...intro, ...fields, ...empty] }] },
      frameFolder(),
      layoutFolder(),
    ],
  };
}

const cache = new Map<
  string,
  { definition: CustomWidgetDefinition | undefined; schema: InspectorSchema }
>();

/**
 * The panel schema for a custom widget. Cached per widget type (and per
 * manifest), so the panel gets the same object on every check; a new object
 * each time would rebuild the form.
 */
export function customWidgetSchemaFor(
  widget: any,
  definition: CustomWidgetDefinition | undefined,
): InspectorSchema {
  const type = widget.widgetType as string;
  const grid = isGridBoundCustomWidget(widget);
  const key = `${type}|${grid ? "grid" : "own"}`;
  const hit = cache.get(key);
  if (hit && (grid || hit.definition === definition)) return hit.schema;
  const schema = grid
    ? laneColumnSchema(type, "extension")
    : buildCustomWidgetSchema(type, definition);
  cache.set(key, { definition, schema });
  return schema;
}
