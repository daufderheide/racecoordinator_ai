import {
  InspectorFolder,
  TextPartField,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";

/**
 * Shared folders so every widget gets the same Colours & frame and Layout.
 * They point at the existing keys: backgroundColor, showBorder, borderStyle,
 * borderColor, borderWidth and borderRadius (see widget-border.utils.ts).
 */
export function frameFolder(): InspectorFolder {
  return {
    id: "frame",
    groups: [
      {
        titleKey: "UE_KIT_GROUP_FILL",
        fields: [
          {
            id: "backgroundColor",
            type: "color",
            key: "backgroundColor",
            labelKey: "UE_INSPECTOR_BACKGROUND_COLOR",
            placeholder: "#000022",
            searchTerms: "background fill colour color",
          },
          {
            id: "backgroundOpacity",
            type: "stepper",
            key: "backgroundOpacity",
            labelKey: "UE_KIT_BG_OPACITY",
            min: 0,
            max: 100,
            step: 5,
            unit: "%",
            searchTerms: "opacity transparent see-through background",
            // only an own colour can be made transparent
            visibleWhen: (s) => !!s["backgroundColor"],
          },
        ],
      },
      {
        titleKey: "UE_KIT_GROUP_BORDER",
        fields: [
          {
            id: "showBorder",
            type: "switch",
            key: "showBorder",
            labelKey: "UE_KIT_SHOW_BORDER",
            searchTerms: "border outline card frame",
          },
          {
            id: "borderStyle",
            type: "tiles",
            key: "borderStyle",
            labelKey: "UE_KIT_BORDER_LINE",
            searchTerms: "border style solid dashed dotted double line",
            visibleWhen: (s) => s["showBorder"] !== false,
            tiles: [
              {
                value: "solid",
                labelKey: "UE_INSPECTOR_BORDER_STYLE_SOLID",
                demo: "border",
              },
              {
                value: "dashed",
                labelKey: "UE_INSPECTOR_BORDER_STYLE_DASHED",
                demo: "border",
              },
              {
                value: "dotted",
                labelKey: "UE_INSPECTOR_BORDER_STYLE_DOTTED",
                demo: "border",
              },
              {
                value: "double",
                labelKey: "UE_INSPECTOR_BORDER_STYLE_DOUBLE",
                demo: "border",
              },
            ],
          },
          {
            id: "borderWidth",
            type: "stepper",
            key: "borderWidth",
            labelKey: "UE_KIT_BORDER_WIDTH",
            min: 0,
            max: 10,
            unit: "px",
            searchTerms: "border width thickness",
            visibleWhen: (s) => s["showBorder"] !== false,
          },
          {
            id: "borderColor",
            type: "color",
            key: "borderColor",
            labelKey: "UE_KIT_BORDER_COLOR",
            placeholder: "#ffffff",
            searchTerms: "border colour color outline",
            visibleWhen: (s) => s["showBorder"] !== false,
          },
        ],
      },
      {
        titleKey: "UE_KIT_GROUP_SHADOW",
        fields: [
          {
            id: "shadow",
            type: "tiles",
            key: "shadow",
            labelKey: "UE_KIT_SHADOW",
            searchTerms: "shadow depth glow raised",
            tiles: [
              { value: "none", labelKey: "UE_KIT_SHADOW_NONE", demo: "shadow" },
              { value: "soft", labelKey: "UE_KIT_SHADOW_SOFT", demo: "shadow" },
              {
                value: "raised",
                labelKey: "UE_KIT_SHADOW_RAISED",
                demo: "shadow",
              },
            ],
          },
        ],
      },
      {
        titleKey: "UE_KIT_GROUP_CORNERS",
        fields: [
          {
            id: "borderRadius",
            type: "stepper",
            key: "borderRadius",
            labelKey: "UE_KIT_CORNERS",
            min: 0,
            max: 32,
            unit: "px",
            icon: "rounded_corner",
            searchTerms: "corner radius rounded",
          },
        ],
      },
    ],
  };
}

export function layoutFolder(): InspectorFolder {
  return {
    id: "layout",
    groups: [
      {
        titleKey: "UE_INSPECTOR_GEOMETRY",
        fields: [
          {
            id: "position",
            type: "geometry",
            pair: "position",
            labelKey: "UE_KIT_POSITION",
            searchTerms: "position x y move",
          },
          {
            id: "size",
            type: "geometry",
            pair: "size",
            labelKey: "UE_KIT_SIZE_WH",
            searchTerms: "size width height",
          },
        ],
      },
    ],
  };
}

/** A text part using the usual <prefix>FontFamily / FontSize / TextColor keys. */
export function textPart(
  id: string,
  labelKey: string,
  prefix: string,
  options: Partial<TextPartField> = {},
): TextPartField {
  return {
    id,
    type: "textPart",
    labelKey,
    keys: {
      font: `${prefix}FontFamily`,
      size: `${prefix}FontSize`,
      color: `${prefix}TextColor`,
    },
    searchTerms: "font size colour color text typography",
    ...options,
  };
}
