import { hasFixedLayer } from "@app/components/raceday/utils/layer-order.utils";
import {
  InspectorField,
  InspectorFolder,
  InspectorGroup,
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
      borderGroup(),
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

/** The Border group of Colours & frame: on / off, line, width and colour. */
function borderGroup(): InspectorGroup {
  return {
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
  };
}

/**
 * What the widget shows where it has no value (phase 3c): its own
 * placeholder, nothing, or your own text; optionally the same for the
 * "Empty Lane" label. See utils/empty-value.utils.ts.
 */
export function emptyStateFolder(
  options: { lane?: boolean } = {},
): InspectorFolder {
  const pair = (
    modeKey: string,
    textKey: string,
    labelKey: string,
    ownLabelKey: string,
  ): InspectorField[] => [
    {
      id: modeKey,
      type: "segment",
      key: modeKey,
      labelKey,
      default: "",
      searchTerms: "empty no data dashes placeholder blank missing",
      options: [
        { value: "", labelKey: ownLabelKey },
        { value: "blank", labelKey: "UE_KIT_EMPTY_BLANK" },
        { value: "text", labelKey: "UE_KIT_EMPTY_OWN_TEXT" },
      ],
    },
    {
      id: textKey,
      type: "text",
      key: textKey,
      labelKey: "UE_KIT_EMPTY_TEXT",
      maxLength: 40,
      default: "",
      searchTerms: "empty text placeholder",
      visibleWhen: (s) => s[modeKey] === "text",
    },
  ];
  return {
    id: "behaviour",
    groups: [
      {
        titleKey: "UE_KIT_EMPTY_STATES",
        fields: [
          ...pair(
            "emptyValueMode",
            "emptyValueText",
            "UE_KIT_EMPTY_VALUE",
            "UE_KIT_EMPTY_DASHES",
          ),
          ...(options.lane
            ? pair(
                "emptyLaneMode",
                "emptyLaneText",
                "UE_KIT_EMPTY_LANE",
                "UE_KIT_EMPTY_LANE_OWN",
              )
            : []),
        ],
      },
    ],
  };
}

/**
 * Lane-colour background (phase 3c): for widgets that follow one lane (Flag,
 * Progress Gauge), the lane's colour instead of the widget's own background.
 */
export function laneColourField(): InspectorField {
  return {
    id: "laneColorBackground",
    type: "switch",
    key: "laneColorBackground",
    labelKey: "UE_KIT_LANE_COLOUR_BG",
    helpKey: "UE_KIT_LANE_COLOUR_BG_HELP",
    default: false,
    searchTerms: "lane colour color background",
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
          {
            id: "locked",
            type: "switch",
            key: "locked",
            labelKey: "UE_KIT_LOCK",
            helpKey: "UE_KIT_LOCK_HELP",
            searchTerms: "lock locked pin fixed move resize",
            // grid columns move with their grid
            visibleWhen: (s) => !s["gridId"],
          },
          {
            id: "layer",
            type: "buttons",
            labelKey: "UE_KIT_LAYER",
            helpKey: "UE_KIT_LAYER_HELP",
            searchTerms:
              "layer order front back forward backward z-index above below behind",
            // the menu bar and countdown have fixed layers
            visibleWhen: (_s, c) =>
              !!c?.actions?.layerOrder && !hasFixedLayer(c.widget),
            buttons: [
              {
                id: "front",
                icon: "flip_to_front",
                labelKey: "UE_KIT_LAYER_FRONT",
                run: (c) => c.actions?.layerOrder?.(c.widget.id, "front"),
                disabled: (c) =>
                  c.actions?.layerState?.(c.widget.id)?.top ?? false,
              },
              {
                id: "forward",
                icon: "arrow_upward",
                labelKey: "UE_KIT_LAYER_FORWARD",
                run: (c) => c.actions?.layerOrder?.(c.widget.id, "forward"),
                disabled: (c) =>
                  c.actions?.layerState?.(c.widget.id)?.top ?? false,
              },
              {
                id: "backward",
                icon: "arrow_downward",
                labelKey: "UE_KIT_LAYER_BACKWARD",
                run: (c) => c.actions?.layerOrder?.(c.widget.id, "backward"),
                disabled: (c) =>
                  c.actions?.layerState?.(c.widget.id)?.bottom ?? false,
              },
              {
                id: "back",
                icon: "flip_to_back",
                labelKey: "UE_KIT_LAYER_BACK",
                run: (c) => c.actions?.layerOrder?.(c.widget.id, "back"),
                disabled: (c) =>
                  c.actions?.layerState?.(c.widget.id)?.bottom ?? false,
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * A text part using the usual <prefix>FontFamily / FontSize / TextColor keys.
 * `styled: true` adds weight, letter spacing and case (<prefix>FontWeight,
 * <prefix>LetterSpacing, <prefix>TextTransform) for widgets whose template
 * draws them with PartTextStyleDirective.
 */
export function textPart(
  id: string,
  labelKey: string,
  prefix: string,
  options: Partial<TextPartField> & {
    styled?: boolean;
    aligned?: boolean;
  } = {},
): TextPartField {
  const { styled, aligned, ...rest } = options;
  // alignment per part (phase 3c): <prefix>Alignment, "Auto" = the widget's own
  const alignKeys = aligned ? { align: `${prefix}Alignment` } : {};
  const styleKeys = styled
    ? {
        weight: `${prefix}FontWeight`,
        spacing: `${prefix}LetterSpacing`,
        case: `${prefix}TextTransform`,
      }
    : {};
  return {
    id,
    type: "textPart",
    labelKey,
    keys: {
      font: `${prefix}FontFamily`,
      size: `${prefix}FontSize`,
      color: `${prefix}TextColor`,
      ...styleKeys,
      ...alignKeys,
    },
    searchTerms: styled
      ? "font size colour color text typography weight bold spacing uppercase case"
      : "font size colour color text typography",
    ...rest,
    // nothing stored = the part's own look (see PartTextStyleDirective)
    ...(styled || aligned
      ? {
          keyDefaults: {
            ...(styled ? { weight: "", spacing: 0, case: "" } : {}),
            ...(aligned ? { align: "" } : {}),
            ...(rest.keyDefaults || {}),
          },
        }
      : {}),
  };
}
