import type { TemplateRef } from "@angular/core";
import type {
  AbsoluteWidgetNode,
  DriverResultsWidgetType,
} from "@app/models/settings";

export type DriverResultsSections = Record<
  DriverResultsWidgetType,
  TemplateRef<unknown>
>;

export const DRIVER_RESULTS_WIDGETS = [
  {
    type: "driver-results-stats",
    labelKey: "UE_WIDGET_TYPE_DRIVER_RESULTS_STATS",
    icon: "query_stats",
  },
  {
    type: "driver-results-standing",
    labelKey: "UE_WIDGET_TYPE_DRIVER_RESULTS_STANDING",
    icon: "leaderboard",
  },
  {
    type: "driver-results-heats",
    labelKey: "UE_WIDGET_TYPE_DRIVER_RESULTS_HEATS",
    icon: "list_alt",
  },
  {
    type: "driver-results-prediction",
    labelKey: "UE_WIDGET_TYPE_DRIVER_RESULTS_PREDICTION",
    icon: "analytics",
  },
] as const satisfies {
  type: DriverResultsWidgetType;
  labelKey: string;
  icon: string;
}[];

export function isDriverResultsWidget(
  type: unknown,
): type is DriverResultsWidgetType {
  return DRIVER_RESULTS_WIDGETS.some((widget) => widget.type === type);
}

export const DRIVER_RESULTS_WIDGET_SIZES = {
  "driver-results-stats": { width: 1140, height: 310 },
  "driver-results-standing": { width: 1140, height: 215 },
  "driver-results-heats": { width: 1140, height: 395 },
  "driver-results-prediction": { width: 850, height: 185 },
} as const satisfies Record<
  DriverResultsWidgetType,
  Pick<AbsoluteWidgetNode, "width" | "height">
>;

export const DRIVER_RESULTS_TEMPLATE_WIDGETS: AbsoluteWidgetNode[] = [
  {
    id: "driver-stats",
    widgetType: "driver-results-stats",
    x: 30,
    y: 20,
    ...DRIVER_RESULTS_WIDGET_SIZES["driver-results-stats"],
    zIndex: 1,
  },
  {
    id: "driver-standing",
    widgetType: "driver-results-standing",
    x: 30,
    y: 350,
    ...DRIVER_RESULTS_WIDGET_SIZES["driver-results-standing"],
    zIndex: 2,
  },
  {
    id: "driver-heats",
    widgetType: "driver-results-heats",
    x: 30,
    y: 585,
    ...DRIVER_RESULTS_WIDGET_SIZES["driver-results-heats"],
    zIndex: 3,
  },
];
