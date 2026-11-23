import { InspectorSchema } from "@app/components/ui-editor/inspector-kit/inspector-schema";

import { frameFolder, layoutFolder, textPart } from "./common";

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
      ],
    },
    {
      id: "text",
      groups: [
        {
          fields: [
            textPart("header", "UE_KIT_PART_HEADER", "header", {
              sampleKey: "RD_RECORD_RACE_LAP",
            }),
            textPart("value", "UE_KIT_PART_VALUE", "value", {
              sample: "1.842",
            }),
          ],
        },
      ],
    },
    frameFolder(),
    layoutFolder(),
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
            // digit glow and inner shadow (#1212)
            {
              id: "timerGlow",
              type: "switch",
              key: "timerGlow",
              labelKey: "UE_INSPECTOR_TIMER_GLOW",
              default: true,
              searchTerms: "glow digits shine neon",
            },
            {
              id: "timerInnerShadow",
              type: "switch",
              key: "timerInnerShadow",
              labelKey: "UE_INSPECTOR_TIMER_INNER_SHADOW",
              helpKey: "UE_INSPECTOR_TIMER_INNER_SHADOW_HINT",
              default: true,
              searchTerms: "inner shadow edge flat",
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
              sample: "2:03",
              defaultColor: "#32cd32",
              sizeMax: 200,
            }),
            textPart("status", "UE_KIT_PART_STATUS", "status", {
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
                sample: "TRACK",
              }),
              textPart("value", "UE_KIT_PART_VALUE", "value", {
                sample: "Test Track",
              }),
            ],
          },
        ],
      },
      frameFolder(),
      layoutFolder(),
    ],
  };
}

export const WIDGET_SCHEMAS: Record<string, InspectorSchema> = {
  records: recordsSchema,
  timer: timerSchema,
  "heat-info": textInfoSchema("heat-info", "flag"),
  "race-name": textInfoSchema("race-name", "sports_score"),
  "event-name": textInfoSchema("event-name", "event"),
  "season-name": textInfoSchema("season-name", "emoji_events"),
  "track-name": textInfoSchema("track-name", "route"),
};

/** The redesigned schema for a widget, or null to keep its existing inspector. */
export function getInspectorSchema(
  widgetType: string | undefined,
): InspectorSchema | null {
  return (widgetType && WIDGET_SCHEMAS[widgetType]) || null;
}
