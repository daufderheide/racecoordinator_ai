import {
  InspectorField,
  InspectorOption,
  InspectorSchema,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";

import {
  emptyStateFolder,
  frameFolder,
  laneColourField,
  layoutFolder,
  textPart,
} from "./common";

/**
 * Phase 2, batch 2: Next Heat / On Deck, the leaderboards, Heat List and
 * Progress Gauge. Keys, ranges and options are the ones the old inspectors
 * used, so nothing changes in what a layout stores.
 */

const n = (values: (number | string)[]): InspectorOption[] =>
  values.map((v) => ({ value: v, label: String(v) }));

// ---------------------------------------------------------------- upcoming

function upcomingSchema(widgetType: "next-heat" | "on-deck"): InspectorSchema {
  const contrast: InspectorField[] =
    widgetType === "next-heat"
      ? [
          {
            id: "alternatingRowContrast",
            type: "stepper",
            key: "alternatingRowContrast",
            labelKey: "UE_INSPECTOR_ALTERNATING_ROW_CONTRAST",
            min: 0,
            max: 100,
            unit: "%",
            searchTerms: "alternating rows stripes zebra contrast",
          },
        ]
      : [];
  return {
    widgetType,
    icon: widgetType === "next-heat" ? "skip_next" : "upcoming",
    folders: [
      {
        id: "text",
        groups: [
          {
            fields: [
              textPart("title", "UE_KIT_PART_TITLE", "title", {
                aligned: true,
                styled: true,
                sizeMin: 10,
                sizeMax: 120,
                sample: widgetType === "next-heat" ? "NEXT HEAT" : "ON DECK",
              }),
              textPart("lanes", "UE_KIT_PART_LANES", "lane", {
                styled: true,
                sizeMin: 10,
                sizeMax: 120,
                sample: "Lane 1  Mario",
              }),
            ],
          },
        ],
      },
      withExtraFill(frameFolder(), contrast),
      layoutFolder(),
    ],
  };
}

/** Adds fields to the Fill group of the shared frame folder. */
function withExtraFill(
  folder: ReturnType<typeof frameFolder>,
  extra: InspectorField[],
) {
  if (!extra.length) return folder;
  folder.groups[0].fields.push(...extra);
  return folder;
}

// ------------------------------------------------------------- leaderboards

function leaderboardSchema(
  widgetType: string,
  withSubtitle: boolean,
): InspectorSchema {
  const parts = [
    textPart("title", "UE_KIT_PART_TITLE", "title", {
      aligned: true,
      styled: true,
      sizeMin: 10,
      sizeMax: 120,
      sample: "LEADER BOARD",
    }),
    ...(withSubtitle
      ? [
          textPart("subtitle", "UE_KIT_PART_SUBTITLE", "subtitle", {
            aligned: true,
            styled: true,
            sizeMin: 10,
            sizeMax: 120,
            sample: "Group A",
          }),
        ]
      : []),
    textPart("leader", "UE_KIT_PART_LEADER", "overallLeader", {
      styled: true,
      sizeMin: 10,
      sizeMax: 120,
      sample: "1 Mario  1.842",
    }),
    textPart("rest", "UE_KIT_PART_REST", "rest", {
      styled: true,
      sizeMin: 10,
      sizeMax: 120,
      sample: "2 Luigi  1.955",
    }),
  ];
  return {
    widgetType,
    icon: "leaderboard",
    folders: [
      {
        id: "content",
        groups: [
          {
            titleKey: "UE_KIT_NUMBERS",
            fields: [
              {
                id: "decimalPlaces",
                type: "segment",
                key: "decimalPlaces",
                labelKey: "UE_KIT_DECIMALS",
                options: n([0, 1, 2, 3]),
                searchTerms: "decimals precision number format",
              },
            ],
          },
        ],
      },
      { id: "text", groups: [{ fields: parts }] },
      frameFolder(),
      layoutFolder(),
    ],
  };
}

// ---------------------------------------------------------------- heat list

const DISPLAY_OPTIONS: InspectorOption[] = [
  { value: "off", labelKey: "UE_INSPECTOR_HEAT_LIST_OPTION_OFF" },
  {
    value: "lane_colors",
    labelKey: "UE_INSPECTOR_HEAT_LIST_OPTION_LANE_COLORS",
  },
  { value: "summary", labelKey: "UE_INSPECTOR_HEAT_LIST_OPTION_SUMMARY" },
  {
    value: "summary_lane_colors",
    labelKey: "UE_INSPECTOR_HEAT_LIST_OPTION_SUMMARY_LANE_COLORS",
  },
];

const isSummary = (v: string) => v === "summary" || v === "summary_lane_colors";
const isHeatTable = (s: Record<string, unknown>) =>
  s["heatListLayout"] === "table";
const isHeatCards = (s: Record<string, unknown>) => !isHeatTable(s);

/**
 * How a group of heats is shown. Older layouts only have the show*Summary
 * flags, so this reads them the way the old inspector did, and a choice also
 * sets the flag.
 */
function displayField(
  id: string,
  labelKey: string,
  displayKey: string,
  summaryKey: string,
  summaryOnByDefault: boolean,
): InspectorField {
  return {
    id,
    type: "select",
    key: displayKey,
    labelKey,
    options: DISPLAY_OPTIONS,
    touches: [summaryKey],
    visibleWhen: isHeatCards,
    searchTerms: "summary lane colours colors heats display",
    read: (s) => heatDisplay(s, displayKey, summaryKey, summaryOnByDefault),
    write: (s, v) => {
      s[displayKey] = v;
      s[summaryKey] = isSummary(v);
    },
  };
}

function heatDisplay(
  s: Record<string, any>,
  displayKey: string,
  summaryKey: string,
  summaryOnByDefault: boolean,
): string {
  if (s?.[displayKey]) return s[displayKey];
  const summaryOn = summaryOnByDefault
    ? s?.[summaryKey] !== false
    : s?.[summaryKey] === true;
  if (summaryOn) {
    return s?.["summaryUseLaneColors"] !== false
      ? "summary_lane_colors"
      : "summary";
  }
  return "lane_colors";
}

/** Some heats show a summary without lane colours: only then is the row colour used. */
function plainSummary(s: Record<string, any>): boolean {
  return (
    heatDisplay(s, "activeHeatDisplay", "showActiveSummary", true) ===
      "summary" ||
    heatDisplay(s, "completedHeatsDisplay", "showCompletedSummary", true) ===
      "summary" ||
    heatDisplay(s, "futureHeatsDisplay", "showFutureSummary", false) ===
      "summary"
  );
}

/** Some heats show a summary: the summary settings only matter then. */
function anySummary(s: Record<string, any>): boolean {
  if (isHeatTable(s)) return false;
  return (
    isSummary(heatDisplay(s, "activeHeatDisplay", "showActiveSummary", true)) ||
    isSummary(
      heatDisplay(s, "completedHeatsDisplay", "showCompletedSummary", true),
    ) ||
    isSummary(heatDisplay(s, "futureHeatsDisplay", "showFutureSummary", false))
  );
}

const sw = (
  id: string,
  labelKey: string,
  searchTerms = "",
): InspectorField => ({
  id,
  type: "switch",
  key: id,
  labelKey,
  searchTerms,
});

const summaryColumn = (id: string, labelKey: string): InspectorField => ({
  ...sw(id, labelKey, "summary column"),
  visibleWhen: anySummary,
});

const tableColumn = (id: string, labelKey: string): InspectorField => ({
  ...sw(id, labelKey, "schedule table column"),
  visibleWhen: isHeatTable,
});

const heatListSchema: InspectorSchema = {
  widgetType: "heat-list",
  icon: "format_list_numbered",
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_KIT_GROUP_DISPLAY",
          fields: [
            {
              id: "heatListLayout",
              type: "segment",
              key: "heatListLayout",
              labelKey: "UE_KIT_FOLDER_LAYOUT",
              options: [
                { value: "cards", labelKey: "UE_INSPECTOR_HEAT_LIST_CARDS" },
                { value: "table", labelKey: "UE_INSPECTOR_HEAT_LIST_TABLE" },
              ],
              searchTerms: "layout schedule grid table cards",
            },
            sw(
              "showHeader",
              "UE_INSPECTOR_HEAT_LIST_SHOW_HEADER",
              "title header",
            ),
            sw(
              "autoScrollToCurrent",
              "UE_INSPECTOR_HEAT_LIST_AUTO_SCROLL",
              "scroll current",
            ),
            sw(
              "highlightCurrentHeat",
              "UE_INSPECTOR_HEAT_LIST_HIGHLIGHT_CURRENT",
              "highlight current",
            ),
            {
              ...sw(
                "showCurrentHeatFlag",
                "UE_INSPECTOR_HEAT_LIST_SHOW_CURRENT_FLAG",
                "flag race state",
              ),
              visibleWhen: isHeatCards,
            },
            {
              ...sw(
                "showCurrentHeatTime",
                "UE_INSPECTOR_HEAT_LIST_SHOW_CURRENT_TIME",
                "time clock",
              ),
              visibleWhen: isHeatCards,
            },
            {
              ...sw(
                "scaleToWindow",
                "UE_INSPECTOR_HEAT_LIST_SCALE_TO_WINDOW",
                "scale fit window",
              ),
              visibleWhen: isHeatCards,
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_HEAT_LIST_TABLE_COLUMNS",
          fields: [
            tableColumn(
              "heatTableShowStatus",
              "UE_INSPECTOR_HEAT_LIST_TABLE_STATUS",
            ),
            tableColumn(
              "heatTableShowGroup",
              "UE_INSPECTOR_HEAT_LIST_TABLE_GROUP",
            ),
            tableColumn(
              "heatTableShowLanes",
              "UE_INSPECTOR_HEAT_LIST_TABLE_LANES",
            ),
            {
              ...tableColumn(
                "heatTableShowLaneColors",
                "UE_INSPECTOR_HEAT_LIST_OPTION_LANE_COLORS",
              ),
              visibleWhen: (settings) =>
                isHeatTable(settings) &&
                settings["heatTableShowLanes"] !== false,
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_HEAT_LIST_COLUMNS",
          fields: [
            {
              id: "heatColumns",
              type: "segment",
              key: "heatColumns",
              labelKey: "UE_INSPECTOR_HEAT_LIST_COLUMNS",
              options: [
                { value: "auto", labelKey: "UE_KIT_AUTO" },
                ...n(["1", "2", "3", "4"]),
              ],
              helpKey: "UE_INSPECTOR_HEAT_LIST_COLUMNS_AUTO",
              visibleWhen: isHeatCards,
              searchTerms: "columns heats grid",
            },
            {
              id: "laneColumns",
              type: "segment",
              key: "laneColumns",
              labelKey: "UE_INSPECTOR_HEAT_LIST_LANE_COLUMNS",
              options: [
                { value: "auto", labelKey: "UE_KIT_AUTO" },
                ...n(["1", "2", "3", "4"]),
              ],
              helpKey: "UE_INSPECTOR_HEAT_LIST_LANE_COLUMNS_AUTO",
              visibleWhen: isHeatCards,
              searchTerms: "columns lanes",
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY",
          fields: [
            displayField(
              "activeHeatDisplay",
              "UE_INSPECTOR_HEAT_LIST_ACTIVE_HEAT",
              "activeHeatDisplay",
              "showActiveSummary",
              true,
            ),
            displayField(
              "completedHeatsDisplay",
              "UE_INSPECTOR_HEAT_LIST_COMPLETED_HEATS",
              "completedHeatsDisplay",
              "showCompletedSummary",
              true,
            ),
            displayField(
              "futureHeatsDisplay",
              "UE_INSPECTOR_HEAT_LIST_FUTURE_HEATS",
              "futureHeatsDisplay",
              "showFutureSummary",
              false,
            ),
          ],
        },
        {
          titleKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY_COLUMNS",
          fields: [
            summaryColumn(
              "summaryShowPosition",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_POS",
            ),
            summaryColumn(
              "summaryShowDriver",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_DRIVER",
            ),
            summaryColumn(
              "summaryShowLaps",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_LAPS",
            ),
            summaryColumn(
              "summaryShowBestLap",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_BEST_LAP",
            ),
            summaryColumn(
              "summaryShowGap",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_GAP",
            ),
            summaryColumn(
              "summaryShowAverageLap",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_AVG_LAP",
            ),
            summaryColumn(
              "summaryShowMedianLap",
              "UE_INSPECTOR_HEAT_LIST_SUMMARY_COL_MEDIAN_LAP",
            ),
          ],
        },
        {
          titleKey: "UE_KIT_NUMBERS",
          fields: [
            {
              id: "summaryLapDecimalPlaces",
              type: "segment",
              key: "summaryLapDecimalPlaces",
              labelKey: "UE_KIT_LAP_DECIMALS",
              options: [
                { value: "auto", labelKey: "UE_KIT_AUTO" },
                ...n(["0", "1", "2", "3"]),
              ],
              helpKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY_LAP_DECIMALS_AUTO",
              visibleWhen: anySummary,
              searchTerms: "laps decimals precision number format",
            },
            {
              id: "summaryTimeDecimalPlaces",
              type: "segment",
              key: "summaryTimeDecimalPlaces",
              labelKey: "UE_KIT_TIME_DECIMALS",
              options: n([1, 2, 3, 4]),
              visibleWhen: anySummary,
              searchTerms: "time decimals precision number format",
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
            textPart("title", "UE_KIT_PART_TITLE", "title", {
              aligned: true,
              styled: true,
              sizeMin: 10,
              sizeMax: 120,
              sample: "HEATS",
              visibleWhen: (s) => s["showHeader"] !== false,
            }),
            textPart("heatNumber", "UE_KIT_PART_HEAT_NUMBER", "heatNumber", {
              styled: true,
              sizeMin: 10,
              sizeMax: 60,
              sample: "Heat 3",
            }),
            textPart("lanes", "UE_KIT_PART_LANES", "lane", {
              styled: true,
              sizeMin: 8,
              sizeMax: 48,
              sample: "Mario",
              visibleWhen: (settings) =>
                isHeatCards(settings) ||
                settings["heatTableShowLanes"] !== false,
            }),
            textPart(
              "summaryHeader",
              "UE_KIT_PART_SUMMARY_HEADER",
              "summaryHeader",
              {
                styled: true,
                sizeMin: 8,
                sizeMax: 48,
                sample: "POS  DRIVER  LAPS",
                visibleWhen: anySummary,
              },
            ),
            textPart("summaryRows", "UE_KIT_PART_SUMMARY_ROWS", "summaryRow", {
              styled: true,
              sizeMin: 8,
              sizeMax: 48,
              sample: "1  Mario  12",
              visibleWhen: anySummary,
              // lane colours override the row colour, as in the old inspector
              colorVisibleWhen: plainSummary,
            }),
          ],
        },
      ],
    },
    {
      ...frameFolder(),
      groups: [
        ...frameFolder().groups,
        {
          titleKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY",
          fields: [
            {
              id: "summaryBorderColor",
              type: "color",
              key: "summaryBorderColor",
              labelKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY_BORDER_COLOR",
              visibleWhen: anySummary,
              searchTerms: "summary table border",
            },
            {
              id: "summaryHeaderBackgroundColor",
              type: "color",
              key: "summaryHeaderBackgroundColor",
              labelKey: "UE_INSPECTOR_HEAT_LIST_SUMMARY_HEADER_BG_COLOR",
              visibleWhen: anySummary,
              searchTerms: "summary header background",
            },
          ],
        },
      ],
    },
    layoutFolder(),
    emptyStateFolder({ lane: true }),
  ],
};

// ----------------------------------------------------------- progress gauge

const lanesMax = (c: { totalLanes: number }) => Math.max(1, c.totalLanes || 4);

const progressGaugeSchema: InspectorSchema = {
  widgetType: "progress-gauge",
  icon: "thermostat",
  folders: [
    {
      id: "content",
      groups: [
        {
          titleKey: "UE_INSPECTOR_GAUGE_SETTINGS",
          fields: [
            {
              id: "gaugeType",
              type: "segment",
              key: "gaugeType",
              labelKey: "UE_INSPECTOR_GAUGE_TYPE",
              options: [
                {
                  value: "heat-progress",
                  labelKey: "UE_INSPECTOR_GAUGE_TYPE_HEAT_PROGRESS",
                },
                { value: "fuel", labelKey: "UE_INSPECTOR_GAUGE_TYPE_FUEL" },
              ],
              searchTerms: "gauge type fuel progress",
            },
            {
              id: "gaugeStyle",
              type: "segment",
              key: "gaugeStyle",
              labelKey: "UE_INSPECTOR_GAUGE_STYLE",
              options: [
                {
                  value: "thermometer",
                  labelKey: "UE_INSPECTOR_GAUGE_STYLE_THERMOMETER",
                },
                { value: "bar", labelKey: "UE_INSPECTOR_GAUGE_STYLE_BAR" },
              ],
              searchTerms: "gauge style bar thermometer",
            },
            {
              id: "orientation",
              type: "segment",
              key: "orientation",
              labelKey: "UE_INSPECTOR_GAUGE_ORIENTATION",
              options: [
                {
                  value: "vertical",
                  labelKey: "UE_INSPECTOR_GAUGE_ORIENTATION_VERTICAL",
                },
                {
                  value: "horizontal",
                  labelKey: "UE_INSPECTOR_GAUGE_ORIENTATION_HORIZONTAL",
                },
              ],
              searchTerms: "orientation vertical horizontal direction",
            },
            sw("showLabel", "UE_INSPECTOR_GAUGE_SHOW_LABEL", "label text"),
          ],
        },
        {
          titleKey: "UE_KIT_GROUP_FOLLOWS",
          fields: [
            {
              id: "bindingMode",
              type: "select",
              key: "bindingMode",
              labelKey: "UE_INSPECTOR_BINDING_MODE",
              options: [
                { value: "hostLane", labelKey: "UE_GRID_SORT_ORDER_HOST_LANE" },
                {
                  value: "hostDriver",
                  labelKey: "UE_GRID_SORT_ORDER_HOST_DRIVER",
                },
                { value: "lane", labelKey: "UE_GRID_SORT_ORDER_LANE" },
              ],
              helpKey: "UE_INSPECTOR_HOST_LANE_HINT",
              touches: ["targetIndex"],
              searchTerms: "binding lane driver station follows target",
              // switching to a fixed lane keeps the target on the track
              write: (s, v, c) => {
                s["bindingMode"] = v;
                if (v === "lane") {
                  const max = lanesMax(c);
                  if (Number(s["targetIndex"] ?? 0) + 1 > max) {
                    s["targetIndex"] = max - 1;
                  }
                }
              },
            },
            {
              id: "targetIndex",
              type: "stepper",
              key: "targetIndex",
              labelKey: "UE_INSPECTOR_TARGET_LANE",
              min: 1,
              max: 8,
              maxFrom: lanesMax,
              searchTerms: "target lane number",
              visibleWhen: (s) => s["bindingMode"] === "lane",
              // stored 0-based, shown as lane 1, 2, 3...
              read: (s) => {
                const idx = Number(s?.["targetIndex"] ?? 0);
                return Math.max(1, isNaN(idx) ? 1 : idx + 1);
              },
              write: (s, v, c) => {
                let lane = Math.round(Number(v));
                if (isNaN(lane) || lane < 1) lane = 1;
                lane = Math.min(lane, lanesMax(c));
                s["targetIndex"] = lane - 1;
              },
            },
          ],
        },
        {
          titleKey: "UE_INSPECTOR_TIMER_TIME",
          fields: [
            {
              id: "timeDisplayFormat",
              type: "select",
              key: "timeDisplayFormat",
              labelKey: "UE_INSPECTOR_TIMER_DISPLAY_FORMAT",
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
              visibleWhen: isHeatProgress,
              searchTerms: "time format clock",
            },
            {
              id: "timeSubsecondMode",
              type: "select",
              key: "timeSubsecondMode",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_MODE",
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
              visibleWhen: isHeatProgress,
              searchTerms: "tenths sub-second decimals",
            },
            {
              id: "timeSubsecondThreshold",
              type: "stepper",
              key: "timeSubsecondThreshold",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_THRESHOLD",
              min: 0,
              max: 600,
              unit: "s",
              visibleWhen: (s) =>
                isHeatProgress(s) &&
                (s["timeSubsecondMode"] || "threshold") === "threshold",
              searchTerms: "threshold seconds tenths",
            },
            {
              id: "timeSubsecondDecimals",
              type: "segment",
              key: "timeSubsecondDecimals",
              labelKey: "UE_INSPECTOR_TIMER_SUBSECOND_DECIMALS",
              options: n([0, 1, 2, 3]),
              visibleWhen: (s) =>
                isHeatProgress(s) &&
                (s["timeSubsecondMode"] || "threshold") !== "never",
              searchTerms: "decimals tenths",
            },
            {
              id: "lapDecimalPlaces",
              type: "segment",
              key: "lapDecimalPlaces",
              labelKey: "UE_KIT_LAP_DECIMALS",
              options: n([0, 1, 2, 3]),
              visibleWhen: isHeatProgress,
              searchTerms: "laps decimals precision number format",
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
            {
              id: "gaugeText",
              type: "textPart",
              labelKey: "UE_KIT_PART_GAUGE_TEXT",
              keys: {
                font: "fontFamily",
                size: "fontSize",
                color: "textColor",
              },
              sizeMin: 10,
              sizeMax: 100,
              keyDefaults: { font: "", size: 18 },
              sample: "2:03",
              visibleWhen: (s) => s["showLabel"] !== false,
              searchTerms: "font size colour color label text",
            },
          ],
        },
      ],
    },
    {
      ...frameFolder(),
      groups: [
        {
          ...frameFolder().groups[0],
          fields: [
            ...frameFolder().groups[0].fields,
            {
              id: "fillColor",
              type: "color",
              key: "fillColor",
              labelKey: "UE_INSPECTOR_GAUGE_FILL_COLOR",
              searchTerms: "fill gauge level colour color",
            },
            laneColourField(),
          ],
        },
        ...frameFolder().groups.slice(1),
      ],
    },
    layoutFolder(),
    emptyStateFolder(),
  ],
};

function isHeatProgress(s: Record<string, any>): boolean {
  return (s["gaugeType"] || "heat-progress") === "heat-progress";
}

export const BATCH2_SCHEMAS: Record<string, InspectorSchema> = {
  "next-heat": upcomingSchema("next-heat"),
  "on-deck": upcomingSchema("on-deck"),
  leaderboard: leaderboardSchema("leaderboard", false),
  "group-leaderboard": leaderboardSchema("group-leaderboard", true),
  "season-leaderboard": leaderboardSchema("season-leaderboard", false),
  "season-race-leaderboard": leaderboardSchema(
    "season-race-leaderboard",
    false,
  ),
  "heat-list": heatListSchema,
  "progress-gauge": progressGaugeSchema,
};
