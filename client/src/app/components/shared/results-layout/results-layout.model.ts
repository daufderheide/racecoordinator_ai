import {
  DRIVER_RESULTS_TEMPLATE_WIDGETS,
  DRIVER_RESULTS_WIDGETS,
} from "@app/components/driver-results/driver-results-layout.model";
import { CustomUI } from "@app/models/custom-ui";
import {
  AbsoluteWidgetNode,
  LayoutConfig,
  ResultsLayoutPurpose,
} from "@app/models/settings";

const COMMON_WIDGETS = [
  { type: "label", labelKey: "UE_WIDGET_TYPE_LABEL", icon: "title" },
  { type: "image", labelKey: "UE_WIDGET_TYPE_IMAGE", icon: "image" },
] as const;

export const RESULTS_LAYOUTS = {
  "heat-results": {
    templateId: "heat-results-template",
    name: "Heat Results",
    labelKey: "RD_WIN_HEAT_RESULTS",
    preference: "heatResultsLayoutId",
    widgets: [
      {
        type: "heat-results-selector",
        labelKey: "UE_WIDGET_TYPE_HEAT_RESULTS_SELECTOR",
        icon: "list_alt",
      },
      {
        type: "heat-results-standings",
        labelKey: "UE_WIDGET_TYPE_HEAT_RESULTS_STANDINGS",
        icon: "leaderboard",
      },
      ...COMMON_WIDGETS,
    ],
  },
  "race-results": {
    templateId: "race-results-template",
    name: "Race Results",
    labelKey: "RD_WIN_RACE_RESULTS",
    preference: "raceResultsLayoutId",
    widgets: [
      {
        type: "race-results-standings",
        labelKey: "UE_WIDGET_TYPE_RACE_RESULTS_STANDINGS",
        icon: "leaderboard",
      },
      ...COMMON_WIDGETS,
    ],
  },
  "driver-results": {
    templateId: "driver-results-template",
    name: "Driver Results",
    labelKey: "LE_TEMPLATE_DRIVER_RESULTS",
    preference: "driverResultsLayoutId",
    widgets: [...DRIVER_RESULTS_WIDGETS, ...COMMON_WIDGETS],
  },
} as const satisfies Record<ResultsLayoutPurpose, object>;

export type ResultsLayout = LayoutConfig & { purpose: ResultsLayoutPurpose };

export function isResultsLayoutPurpose(
  value: unknown,
): value is ResultsLayoutPurpose {
  return typeof value === "string" && Object.hasOwn(RESULTS_LAYOUTS, value);
}

export function readResultsLayout(ui: CustomUI): ResultsLayout | null {
  try {
    const layout = JSON.parse(ui.layoutJson || "null") as LayoutConfig | null;
    if (
      layout &&
      isResultsLayoutPurpose(layout.purpose) &&
      Array.isArray(layout.widgets)
    ) {
      return layout as ResultsLayout;
    }
  } catch {
    return null;
  }
  return null;
}

export function resultsLayoutTemplate(purpose: ResultsLayoutPurpose): CustomUI {
  const definition = RESULTS_LAYOUTS[purpose];
  const standings: AbsoluteWidgetNode = {
    id: "race-standings",
    widgetType: "race-results-standings",
    x: 30,
    y: 22,
    width: 1140,
    height: 492,
    zIndex: 1,
    fontSize: 18,
    scaleMode: "fixed",
  };
  const heatWidgets: AbsoluteWidgetNode[] = [
    {
      id: "heat-selector",
      widgetType: "heat-results-selector",
      x: 30,
      y: 20,
      width: 460,
      height: 66,
      zIndex: 2,
      fontSize: 16,
      scaleMode: "fixed",
    },
    {
      ...standings,
      id: "heat-standings",
      widgetType: "heat-results-standings",
      y: 102,
      height: 412,
    },
  ];
  const widgetsByPurpose = {
    "heat-results": heatWidgets,
    "race-results": [standings],
    "driver-results": DRIVER_RESULTS_TEMPLATE_WIDGETS,
  };
  const baseHeight = purpose === "driver-results" ? 1000 : 540;
  const layout: ResultsLayout = {
    purpose,
    baseWidth: 1200,
    baseHeight,
    aspectRatio: `1200:${baseHeight}`,
    scaleMode: "fit-width",
    widgets: widgetsByPurpose[purpose],
  };
  return {
    entity_id: definition.templateId,
    is_default: true,
    name: definition.name,
    layoutJson: JSON.stringify(layout),
  };
}
