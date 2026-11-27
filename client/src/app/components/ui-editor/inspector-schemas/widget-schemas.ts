import { InspectorSchema } from "@app/components/ui-editor/inspector-kit/inspector-schema";
import { getLabelSource, getRecordLabelField } from "@app/models/label-source";

import { BATCH2_SCHEMAS } from "./batch2-schemas";
import { BATCH3_SCHEMAS } from "./batch3-schemas";
import {
  emptyStateFolder,
  emptyValueFields,
  frameFolder,
  laneColourField,
  layoutFolder,
  textPart,
} from "./common";
import { LabelSourceComponent } from "./label-source.component";
import { LANE_COLUMN_SCHEMAS } from "./lane-column-schema";
import { laneViewSchema } from "./lane-view-schema";

/**
 * Widgets that use the redesigned panel. Every other widget keeps its
 * existing inspector, shown as one "All settings" folder.
 */

const recordsSchema: InspectorSchema = {
  widgetType: "records",
  icon: "emoji_events",
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_INSPECTOR_RECORDS_DATA_POINTS",
          fields: [
            {
              id: "showRaceRecordLap",
              type: "switch",
              key: "showRaceRecordLap",
              labelKey: "RD_RECORD_RACE_LAP",
              searchTerms: "visible records best lap",
            },
            {
              id: "showRaceRecordScore",
              type: "switch",
              key: "showRaceRecordScore",
              labelKey: "RD_RECORD_RACE_SCORE",
              searchTerms: "visible records best score",
            },
            {
              id: "showCurrentRaceBest",
              type: "switch",
              key: "showCurrentRaceBest",
              labelKey: "RD_RECORD_CURRENT_RACE_BEST",
              searchTerms: "visible records race",
            },
            {
              id: "showHeatBest",
              type: "switch",
              key: "showHeatBest",
              labelKey: "RD_RECORD_HEAT_BEST",
              searchTerms: "visible records heat",
            },
          ],
        },
        {
          titleKey: "UE_KIT_NUMBERS",
          fields: [
            {
              id: "lapDecimalPlaces",
              type: "segment",
              key: "lapDecimalPlaces",
              labelKey: "UE_KIT_LAP_DECIMALS",
              default: 3,
              options: [0, 1, 2, 3].map((v) => ({
                value: v,
                label: String(v),
              })),
              searchTerms: "lap time decimals precision number format",
            },
            {
              id: "scoreDecimalPlaces",
              type: "segment",
              key: "scoreDecimalPlaces",
              labelKey: "UE_KIT_SCORE_DECIMALS",
              default: 3,
              options: [0, 1, 2, 3].map((v) => ({
                value: v,
                label: String(v),
              })),
              searchTerms: "score points decimals precision number format",
            },
          ],
        },
      ],
    },
    {
      id: "text",
      groups: [
        {
          fields: [
            textPart("header", "UE_KIT_PART_HEADER", "header", {
              aligned: true,
              styled: true,
              sampleKey: "RD_RECORD_RACE_LAP",
            }),
            textPart("value", "UE_KIT_PART_VALUE", "value", {
              styled: true,
              sample: "1.842",
            }),
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
    emptyStateFolder(),
  ],
};

const timerSchema: InspectorSchema = {
  widgetType: "timer",
  icon: "timer",
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_INSPECTOR_TIMER_TIME",
          fields: [
            {
              id: "timeDisplayFormat",
              type: "select",
              key: "timeDisplayFormat",
              labelKey: "UE_INSPECTOR_TIMER_DISPLAY_FORMAT",
              default: "dynamic",
              searchTerms: "time format clock",
              options: [
                {
                  value: "dynamic",
                  labelKey: "UE_INSPECTOR_TIMER_FORMAT_DYNAMIC",
                },
                { value: "mm_ss", labelKey: "UE_INSPECTOR_TIMER_FORMAT_MM_SS" },
                { value: "m_ss", labelKey: "UE_INSPECTOR_TIMER_FORMAT_M_SS" },
                {
                  value: "hh_mm_ss",
                  labelKey: "UE_INSPECTOR_TIMER_FORMAT_HH_MM_SS",
                },
                {
                  value: "seconds",
                  labelKey: "UE_INSPECTOR_TIMER_FORMAT_SECONDS",
                },
              ],
            },
            {
              id: "timeSubsecondMode",
              type: "select",
              key: "timeSubsecondMode",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_MODE",
              default: "threshold",
              searchTerms: "decimals tenths sub-second",
              options: [
                {
                  value: "threshold",
                  labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_THRESHOLD_MODE",
                },
                {
                  value: "always",
                  labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_ALWAYS",
                },
                {
                  value: "never",
                  labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_NEVER",
                },
              ],
            },
            {
              id: "timeSubsecondThreshold",
              type: "stepper",
              key: "timeSubsecondThreshold",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_THRESHOLD",
              helpKey: "UE_KIT_TIMER_THRESHOLD_HELP",
              default: 10,
              min: 0,
              max: 600,
              unit: "s",
              searchTerms: "threshold seconds",
              visibleWhen: (s) =>
                (s["timeSubsecondMode"] || "threshold") === "threshold",
            },
            {
              id: "timeSubsecondDecimals",
              type: "segment",
              key: "timeSubsecondDecimals",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_DECIMALS",
              default: 2,
              searchTerms: "decimals number format precision",
              visibleWhen: (s) =>
                (s["timeSubsecondMode"] || "threshold") !== "never",
              options: [
                { value: 0, label: "0" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
              ],
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_TIMER_STATUS",
          fields: [
            {
              id: "showStatusText",
              type: "switch",
              key: "showStatusText",
              labelKey: "UE_KIT_TIMER_SHOW_STATUS",
              helpKey: "UE_KIT_TIMER_SHOW_STATUS_HELP",
              default: true,
              searchTerms: "status auto starting advancing label",
            },
            {
              id: "autoStartingText",
              type: "text",
              key: "autoStartingText",
              labelKey: "UE_INSPECTOR_TIMER_AUTO_STARTING_TEXT",
              helpKey: "UE_INSPECTOR_TIMER_STATUS_HINT",
              placeholderKey: "RD_AUTO_STARTING",
              maxLength: 40,
              default: "",
              searchTerms: "status label custom",
              visibleWhen: (s) => s["showStatusText"] !== false,
            },
            {
              id: "autoAdvancingText",
              type: "text",
              key: "autoAdvancingText",
              labelKey: "UE_INSPECTOR_TIMER_AUTO_ADVANCING_TEXT",
              helpKey: "UE_INSPECTOR_TIMER_STATUS_HINT",
              placeholderKey: "RD_AUTO_ADVANCING",
              maxLength: 40,
              default: "",
              searchTerms: "status label custom",
              visibleWhen: (s) => s["showStatusText"] !== false,
            },
            {
              id: "statusUppercase",
              type: "switch",
              key: "statusUppercase",
              labelKey: "UE_INSPECTOR_TIMER_STATUS_UPPERCASE",
              default: true,
              searchTerms: "case capitals lowercase",
              visibleWhen: (s) => s["showStatusText"] !== false,
            },
          ],
        },
      ],
    },
    {
      id: "text",
      groups: [
        {
          fields: [
            textPart("time", "UE_KIT_PART_TIME", "time", {
              aligned: true,
              styled: true,
              sample: "2:03",
              defaultColor: "#32cd32",
              sizeMax: 200,
            }),
            textPart("status", "UE_KIT_PART_STATUS", "status", {
              aligned: true,
              styled: true,
              sampleKey: "RD_AUTO_ADVANCING",
              defaultColor: "#ffaa00",
              sizeMin: 8,
              sizeMax: 60,
              keyDefaults: { font: "", size: 16, color: "" },
              visibleWhen: (s) => s["showStatusText"] !== false,
            }),
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
  ],
};

/** Heat Info, Race/Event/Season/Track Name share one label + value layout. */
function textInfoSchema(widgetType: string, icon: string): InspectorSchema {
  return {
    widgetType,
    icon,
    folders: [
      {
        id: "text",
        groups: [
          {
            fields: [
              textPart("label", "UE_KIT_PART_LABEL", "label", {
                styled: true,
                sample: "TRACK",
              }),
              textPart("value", "UE_KIT_PART_VALUE", "value", {
                styled: true,
                sample: "Test Track",
              }),
              // label and value are one line: it aligns as a whole (phase 3c)
              {
                id: "lineAlignment",
                type: "segment",
                key: "lineAlignment",
                labelKey: "UE_KIT_ALIGN",
                default: "",
                searchTerms: "align alignment left centre center right",
                options: [
                  { value: "", labelKey: "UE_KIT_AUTO" },
                  { value: "left", labelKey: "UE_KIT_ALIGN_LEFT" },
                  { value: "center", labelKey: "UE_KIT_ALIGN_CENTRE" },
                  { value: "right", labelKey: "UE_KIT_ALIGN_RIGHT" },
                ],
              },
            ],
          },
        ],
      },
      frameFolder(),
      layoutFolder(),
    ],
  };
}

/** Adds the lane-colour background switch to the Colours & frame folder. */
function withLaneColour(schema: InspectorSchema): InspectorSchema {
  return {
    ...schema,
    folders: schema.folders.map((f) =>
      f.id === "frame"
        ? { ...f, groups: [...f.groups, { fields: [laneColourField()] }] }
        : f,
    ),
  };
}

/** Widgets with only colours, frame and layout (Branding Image, QR Code, Flag). */
function frameOnlySchema(widgetType: string, icon: string): InspectorSchema {
  return { widgetType, icon, folders: [frameFolder(), layoutFolder()] };
}

const imageSchema: InspectorSchema = {
  widgetType: "image",
  icon: "image",
  folders: [
    {
      id: "content",
      groups: [
        {
          fields: [
            {
              id: "imageUrl",
              type: "image",
              key: "imageUrl",
              labelKey: "UE_KIT_IMAGE",
              searchTerms: "image picture logo asset file",
            },
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
  ],
};

const labelSchema: InspectorSchema = {
  widgetType: "label",
  icon: "title",
  folders: [
    {
      id: "content",
      groups: [
        {
          fields: [
            {
              id: "labelSource",
              type: "embed",
              component: LabelSourceComponent,
              labelKey: "UE_INSPECTOR_LABEL_SOURCE",
              touches: ["labelSource", "recordField"],
              searchTerms:
                "timer clock record live data source holder value lap score",
            },
            {
              id: "text",
              type: "text",
              key: "text",
              labelKey: "UE_INSPECTOR_LABEL_TEXT",
              maxLength: 120,
              searchTerms: "text caption title words",
              visibleWhen: (settings) => getLabelSource(settings) === "",
            },
            {
              id: "recordDecimals",
              type: "segment",
              key: "recordDecimals",
              labelKey: "UE_KIT_DECIMALS",
              default: 3,
              options: [0, 1, 2, 3].map((value) => ({
                value,
                label: String(value),
              })),
              visibleWhen: (settings) => {
                const source = getRecordLabelField(getLabelSource(settings));
                return !!source && source.kind !== "holder";
              },
            },
            ...emptyValueFields(
              (settings) => !!getRecordLabelField(getLabelSource(settings)),
            ),
          ],
        },
      ],
    },
    {
      id: "text",
      groups: [
        {
          fields: [
            {
              id: "label",
              type: "textPart",
              labelKey: "UE_INSPECTOR_LABEL_TEXT",
              keys: {
                font: "fontFamily",
                size: "fontSize",
                color: "textColor",
                align: "alignment",
              },
              sizeMin: 8,
              sizeMax: 120,
              sampleSetting: "text",
              searchTerms: "font size colour color align typography",
            },
            {
              id: "fontBold",
              type: "switch",
              key: "fontBold",
              labelKey: "UE_INSPECTOR_FONT_BOLD",
              searchTerms: "bold weight heavy",
            },
            {
              id: "fontItalic",
              type: "switch",
              key: "fontItalic",
              labelKey: "UE_INSPECTOR_FONT_ITALIC",
              searchTerms: "italic slanted",
            },
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
  ],
};

/** Every action button (Start/Resume, Pause, Export, Back...) has the same settings. */
function actionButtonSchema(widgetType: string): InspectorSchema {
  return {
    widgetType,
    icon: "smart_button",
    folders: [
      {
        id: "text",
        groups: [
          {
            fields: [
              {
                id: "label",
                type: "textPart",
                labelKey: "UE_KIT_PART_LABEL",
                keys: {
                  font: "fontFamily",
                  size: "fontSize",
                  color: "textColor",
                },
                sizeMin: 10,
                sizeMax: 100,
                keyDefaults: { size: 16 },
                sampleKey: ACTION_BUTTON_LABEL_KEYS[widgetType],
                searchTerms: "font size colour color button text typography",
              },
            ],
          },
        ],
      },
      frameFolder(),
      layoutFolder(),
      {
        id: "behaviour",
        groups: [
          {
            fields: [
              {
                id: "shortcut",
                type: "text",
                key: "shortcut",
                labelKey: "UE_INSPECTOR_SHORTCUT",
                helpKey: "UE_KIT_SHORTCUT_HELP",
                placeholder: "F4, Control+S",
                maxLength: 40,
                searchTerms: "shortcut key keyboard hotkey",
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Every action button and the name it shows (the same keys the canvas button uses). */
export const ACTION_BUTTON_LABEL_KEYS: Record<string, string> = {
  "action-start-resume": "RD_MENU_START_RESUME",
  "action-pause": "RD_MENU_PAUSE",
  "action-next-heat": "RD_MENU_NEXT_HEAT",
  "action-restart-heat": "RD_MENU_RESTART",
  "action-defer-heat": "RD_MENU_DEFER",
  "action-skip-heat": "RD_MENU_SKIP_HEAT",
  "action-skip-race": "RD_MENU_SKIP_RACE",
  "action-add-lap": "RD_MENU_ADD_LAP",
  "action-modify-heats": "RD_MENU_MODIFY",
  "action-export-pdf": "RD_MENU_EXPORT_PDF",
  "action-export-csv": "RD_MENU_EXPORT_CSV",
  "action-export-xls": "RD_MENU_EXPORT_XLS",
  "action-open-heat-results": "RD_WIN_HEAT_RESULTS",
  "action-open-race-results": "RD_WIN_RACE_RESULTS",
  "action-open-season-results": "RD_WIN_SEASON_RESULTS",
  "action-open-prediction-results": "RD_WIN_PREDICTION_RESULTS",
  "action-master-power-on": "RD_MENU_MAIN_POWER_ON",
  "action-master-power-off": "RD_MENU_MAIN_POWER_OFF",
  "action-back": "RD_MENU_BACK",
  "action-forward": "RD_MENU_FORWARD",
  "action-close": "RD_MENU_CLOSE",
};

export const WIDGET_SCHEMAS: Record<string, InspectorSchema> = {
  records: recordsSchema,
  timer: timerSchema,
  "heat-info": textInfoSchema("heat-info", "flag"),
  "race-name": textInfoSchema("race-name", "sports_score"),
  "event-name": textInfoSchema("event-name", "event"),
  "season-name": textInfoSchema("season-name", "emoji_events"),
  "track-name": textInfoSchema("track-name", "route"),
  branding: frameOnlySchema("branding", "branding_watermark"),
  qr: frameOnlySchema("qr", "qr_code_2"),
  flag: withLaneColour(frameOnlySchema("flag", "flag")),
  image: imageSchema,
  label: labelSchema,
  ...Object.fromEntries(
    Object.keys(ACTION_BUTTON_LABEL_KEYS).map((t) => [
      t,
      actionButtonSchema(t),
    ]),
  ),
  ...BATCH2_SCHEMAS,
  ...BATCH3_SCHEMAS,
  "lane-view": laneViewSchema,
  ...LANE_COLUMN_SCHEMAS,
};

/** The redesigned schema for a widget, or null to keep its existing inspector. */
export function getInspectorSchema(
  widgetType: string | undefined,
): InspectorSchema | null {
  return (widgetType && WIDGET_SCHEMAS[widgetType]) || null;
}
