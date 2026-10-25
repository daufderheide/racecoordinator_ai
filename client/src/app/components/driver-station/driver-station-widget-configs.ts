import { AbsoluteWidgetNode } from "@app/models/settings";

export const DRIVER_STATION_PROGRESS_WIDGET: AbsoluteWidgetNode = {
  id: "ds_progress",
  widgetType: "progress-gauge",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    gaugeType: "heat-progress",
    gaugeStyle: "thermometer",
    orientation: "vertical",
    bindingMode: "hostLane",
  },
};

export const DRIVER_STATION_NICKNAME_WIDGET: AbsoluteWidgetNode = {
  id: "ds_nickname",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "driver.nickname",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_LANE_NUMBER_WIDGET: AbsoluteWidgetNode = {
  id: "ds_lane_number",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "laneNumber",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_HEAT_RANK_WIDGET: AbsoluteWidgetNode = {
  id: "ds_rank_heat",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "rankHeat",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_OVERALL_RANK_WIDGET: AbsoluteWidgetNode = {
  id: "ds_rank_overall",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "rankOverall",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_LAP_COUNT_WIDGET: AbsoluteWidgetNode = {
  id: "ds_lap_count",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "lapCount",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_LAST_LAP_TIME_WIDGET: AbsoluteWidgetNode = {
  id: "ds_last_lap_time",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "lastLapTime",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_GAP_LEADER_WIDGET: AbsoluteWidgetNode = {
  id: "ds_gap_leader",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "gapLeader",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_BEST_LAP_TIME_WIDGET: AbsoluteWidgetNode = {
  id: "ds_best_lap_time",
  widgetType: "lane-column",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    columnKey: "bestLapTime",
    bindingMode: "hostLane",
    showHeader: true,
    showBorder: false,
  },
};

export const DRIVER_STATION_FLAG_WIDGET: AbsoluteWidgetNode = {
  id: "ds_flag",
  widgetType: "flag",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    displayMode: "color-bar",
  },
};

export const DRIVER_STATION_FUEL_PROGRESS_WIDGET: AbsoluteWidgetNode = {
  id: "ds_fuel",
  widgetType: "progress-gauge",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  zIndex: 1,
  customSettings: {
    gaugeType: "fuel",
    gaugeStyle: "thermometer",
    orientation: "vertical",
    bindingMode: "hostLane",
  },
};
