import { AnchorPoint } from "@app/components/raceday/column_definition";
import { IDemoConfig } from "@app/proto/antigravity";
import {
  TimerDisplayFormat,
  TimerSubsecondMode,
} from "@app/utils/timer-format.utils";

import {
  DEFAULT_LAYOUT,
  DEFAULT_PRACTICE_LAYOUT,
  LEGACY_DEFAULT_LAYOUT,
  LEGACY_DEFAULT_PRACTICE_LAYOUT,
} from "./default-layouts";

export enum ColumnVisibility {
  Always = "Always",
  FuelRaceOnly = "FuelRaceOnly",
  NonFuelRaceOnly = "NonFuelRaceOnly",
}

export type WidgetType =
  | "menu-bar"
  | "race-name"
  | "event-name"
  | "season-name"
  | "heat-info"
  | "track-name"
  | "branding"
  | "qr"
  | "flag"
  | "timer"
  | "countdown"
  | "records"
  | "leaderboard"
  | "group-leaderboard"
  | "season-leaderboard"
  | "season-race-leaderboard"
  | "lane-view"
  | "lane-column"
  | "average-score"
  | "on-deck"
  | "next-heat"
  | "heat-list"
  | "image"
  | "label"
  | "grid"
  | "action-start-resume"
  | "action-pause"
  | "action-next-heat"
  | "action-restart-heat"
  | "action-defer-heat"
  | "action-skip-heat"
  | "action-skip-race"
  | "action-add-lap"
  | "action-modify-heats"
  | "action-export-pdf"
  | "action-export-csv"
  | "action-export-xls"
  | "action-open-heat-results"
  | "action-open-race-results"
  | "action-open-season-results"
  | "action-open-prediction-results"
  | "action-master-power-on"
  | "action-master-power-off"
  | "action-back"
  | "action-forward"
  | "action-close"
  | "progress-gauge"
  | `custom:${string}`
  | (string & {});

export type HighlightLapStyle =
  | "none"
  | "classic"
  | "full-glow"
  | "glow-border"
  | "tint-wash"
  | "shimmer"
  | "scale-pulse"
  | "adaptive-dip";

export interface AbsoluteWidgetNode {
  id: string; // Unique ID so we can uniquely identify widgets on the page
  widgetType: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  fontFamily?: string;
  scaleMode?: "auto" | "fixed" | "";
  fontSize?: number;
  textScaleFactor?: number;
  textColor?: string;
  backgroundColor?: string;
  customSettings?: Record<string, any>;
}

export interface InsetConfig {
  columnKey?: string;
  gapTarget?: "leader" | "position";
  gapMode?: "always_time" | "laps_and_time" | "always_laps";
  showPartialHeats?: boolean;
  timeDecimalPlaces?: number;
  lapDecimalPlaces?: number;
  decimalPlaces?: number;
  timeDisplayFormat?: TimerDisplayFormat;
  timeSubsecondMode?: TimerSubsecondMode;
  timeSubsecondThreshold?: number;
  timeSubsecondDecimals?: number;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  heatsDisplayMode?: "raced" | "remaining";
  horizontalAlignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "center" | "bottom";
  valueAlignment?: "left" | "center" | "right" | "start" | "end";
}

export interface ProgressGaugeWidgetSettings {
  gaugeType?: "heat-progress" | "fuel";
  gaugeStyle?: "thermometer" | "bar";
  orientation?: "vertical" | "horizontal";
  bindingMode?: "hostLane" | "lane" | "hostDriver";
  targetIndex?: number;
  showLabel?: boolean;
  fillColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface LaneColumnWidgetSettings {
  columnKey: string;
  gapTarget?: "leader" | "position";
  gapMode?: "always_time" | "laps_and_time" | "always_laps";
  showPartialHeats?: boolean;
  bindingMode:
    | "lane"
    | "position"
    | "overallPosition"
    | "seed"
    | "hostLane"
    | "hostDriver";
  targetIndex: number;
  layoutOrientation: "vertical" | "horizontal";
  showHeader: boolean;
  gridType?: "heat" | "overall";
  emptyRowsMode?: "remove" | "empty" | "blank";
  gridId?: string;
  gridDirection?: "vertical" | "horizontal";
  gridLane?: number;
  gridTotalLanes?: number;
  startRowOffset?: number;
  gridMasterId?: string;
  headerPlacement?: "top" | "left" | "individual" | "none";
  headerHeight?: number;
  headerWidth?: number;
  isHeaderWidget?: boolean;
  linkColumns?: boolean;
  sortByBindingMode?: boolean;
  highlightRowOnLap?: boolean;
  highlightLapStyle?: HighlightLapStyle;
  customLabel: string;
  headerFontFamily: string;
  headerFontSize: number;
  headerTextColor: string;
  headerAlignment: "start" | "center" | "end";
  headerBackgroundColor?: string;
  valueFontFamily: string;
  valueFontSize: number;
  valueTextColor: string;
  valueAlignment: "start" | "center" | "end";
  timeDecimalPlaces: number;
  lapDecimalPlaces: number;
  lastLapsCount?: number;
  columnDecimals?: Record<string, number>;
  timeDisplayFormat?: TimerDisplayFormat;
  timeSubsecondMode?: TimerSubsecondMode;
  timeSubsecondThreshold?: number;
  timeSubsecondDecimals?: number;
  heatsDisplayMode?: "raced" | "remaining";
  useLaneColors: boolean;
  insets?: Record<string, string>;
  insetsConfig?: Record<string, InsetConfig>;
  insetFontFamily?: string;
  insetFontSize?: number;
  insetTextColor?: string;
  insetTimeDecimalPlaces?: number;
  insetLapDecimalPlaces?: number;
  backgroundColor: string;
  textColor: string;
  showBorder: boolean;
  borderColor: string;
  borderStyle?: "solid" | "dashed" | "dotted" | "double";
  borderWidth: number;
  borderRadius: number;
  lastLapsShowBorder?: boolean;
  lastLapsBorderMode?: "separator" | "box";
  lastLapsBorderStyle?: "solid" | "dashed" | "dotted" | "double";
  lastLapsBorderColor?: string;
  lastLapsBorderWidth?: number;
  lastLapsBorderRadius?: number;
  lastLapsBorderMargin?: number;
  lastLapsBestLapHighlight?: boolean;
  lastLapsBestLapTextColor?: string;
  lastLapsBestLapBackgroundColor?: string;
  lastLapsBestLapFontWeight?: "normal" | "bold" | "bolder";
  lastLapsBestLapUnderline?: boolean;
  lastLapsBestLapItalic?: boolean;
  lastLapsBestLapShowBorder?: boolean;
  lastLapsBestLapBorderColor?: string;
  lastLapsBestLapBorderStyle?: "solid" | "dashed" | "dotted" | "double";
  lastLapsBestLapBorderWidth?: number;
  lastLapsBestLapBorderRadius?: number;
  gridLabelShowBorder?: boolean;
  gridLabelBorderColor?: string;
  gridLabelBorderWidth?: number;
  gridLabelBorderRadius?: number;
}

export type LayoutScaleMode = "letterbox" | "stretch" | "fit-width";

export interface LayoutConfig {
  widgets: AbsoluteWidgetNode[];
  baseWidth?: number;
  baseHeight?: number;
  scaleMode?: LayoutScaleMode;
  aspectRatio?: string;
  collapsedToolboxGroups?: Record<string, boolean> | string[];
  collapsedToolboxSubgroups?: Record<string, boolean> | string[];
  toolboxGroupExpandedStates?: Record<string, boolean>;
  toolboxSubgroupExpandedStates?: Record<string, boolean>;
  preserveLegacyHeatView?: boolean;
}

export class Settings {
  static readonly DEFAULT_COLUMNS = [
    "driver.nickname",
    "lapCount",
    "lastLapTime",
    "averageLapTime",
    "gap",
    "ghostPacingLeaderAvg",
  ];

  static readonly DEFAULT_PRACTICE_COLUMNS = [
    "laneNumber",
    "lastLapTime",
    "bestLapTime",
    "lastLaps",
    "lapCount",
  ];

  recentRaceIds: string[] = [];
  selectedRaceId: string = "";
  isEventMode: boolean = false;
  selectedSeasonId: string = "";
  selectedDriverIds: string[] = [];
  demoConfig?: IDemoConfig;

  serverIp: string = "";
  serverPort: number = 7070;
  language: string = "";
  shareAnalytics: boolean = true;
  pageTransition: string = "slide";
  clientLogLevel: string = "INFO";
  serverLogLevel: string = "INFO";
  exportPdfBackgrounds: boolean = true;
  masterVolume: number = 100;
  urgentQueueTtl: number = 5000;
  calloutSpacing: number = 500;
  ttsVoice: string = "";
  ttsRate: number = 1.0;
  ttsPitch: number = 1.0;
  ttsVolume: number = 100;

  racedaySetupWalkthroughSeen: boolean = false;
  trackManagerHelpShown: boolean = false;
  trackEditorHelpShown: boolean = false;
  driverEditorHelpShown: boolean = false;
  driverManagerHelpShown: boolean = false;
  teamManagerHelpShown: boolean = false;
  teamEditorHelpShown: boolean = false;
  assetManagerHelpShown: boolean = false;
  raceManagerHelpShown: boolean = false;
  raceEditorHelpShown: boolean = false;
  databaseManagerHelpShown: boolean = false;
  uiEditorHelpShown: boolean = false;
  layoutEditorHelpShown: boolean = false;
  themeEditorHelpShown: boolean = false;
  layoutEditorMinimized: boolean = false;
  layoutEditorPositionX: number = 0;
  layoutEditorPositionY: number = 0;
  columnEditorMinimized: boolean = false;
  columnEditorPositionX: number = 0;
  columnEditorPositionY: number = 0;

  flagRacing?: string;
  flagHeatPaused?: string;
  flagHeatOver?: string;
  flagRaceOver?: string;
  flagNotStarted?: string;
  flagStarting?: string;
  flagRestarting?: string;
  flagOneLapToGo?: string;
  flagHeatFinishing?: string;
  flagWarmup?: string;
  flagDriverFinished?: string;
  flagPenalty?: string;

  customExportTemplateBase64?: string;
  customExportTemplateName?: string;
  customExportTemplatePath?: string;

  // Theme system
  activeThemeId?: string; // entity_id of the active theme (server-side)
  raceThemeOverrides: { [raceId: string]: string } = {}; // race entity_id → theme entity_id

  // Individual overrides for start lamps (used when no theme is active)
  lampRedOn?: string;
  lampRedDim?: string;
  lampGreen?: string;

  // Individual override for fuel gauge image set (used when no theme is active)
  fuelGaugeImageSet: string = "default_fuel-gauge-builtin";

  sortByStandings: boolean = true;
  highlightRowOnLap: boolean = true;
  highlightPracticeRowOnLap: boolean = true;
  highlightLapStyle: HighlightLapStyle = "shimmer";
  highlightPracticeLapStyle: HighlightLapStyle = "shimmer";
  driverStateBackfilled: boolean = false;
  racedayColumns: string[] = Settings.DEFAULT_COLUMNS;
  columnAnchors: { [key: string]: AnchorPoint } = {};
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {
    laneNumber: {
      [AnchorPoint.CenterCenter]: "laneNumber",
    },
    "driver.nickname": {
      [AnchorPoint.CenterCenter]: "driver.nickname",
      [AnchorPoint.BottomRight]: "participant.team.name",
      [AnchorPoint.BottomLeft]: "driverViewQrCode",
    },

    "imageset_fuel-gauge-builtin": {
      [AnchorPoint.CenterCenter]: "imageset_fuel-gauge-builtin",
    },
    lapCount: {
      [AnchorPoint.CenterCenter]: "lapCount",
      [AnchorPoint.BottomLeft]: "flag",
    },
    lastLapTime: {
      [AnchorPoint.CenterCenter]: "lastLapTime",
      [AnchorPoint.BottomRight]: "bestLapTime",
    },
    gap: {
      [AnchorPoint.CenterCenter]: "gap",
    },
  };
  columnVisibility: { [columnKey: string]: ColumnVisibility } = {
    "imageset_fuel-gauge-builtin": ColumnVisibility.FuelRaceOnly,
  };
  columnWidths: { [columnKey: string]: number } = {
    ghostPacingLeaderAvg: 200,
    averageLapTime: 310,
  };

  racedayLayout?: LayoutConfig;

  practiceRacedayColumns: string[] = Settings.DEFAULT_PRACTICE_COLUMNS;
  practiceColumnAnchors: { [key: string]: AnchorPoint } = {};
  practiceColumnLayouts: {
    [columnKey: string]: { [A in AnchorPoint]?: string };
  } = {
    laneNumber: {
      [AnchorPoint.CenterCenter]: "laneNumber",
    },
    "driver.nickname": {
      [AnchorPoint.CenterCenter]: "driver.nickname",
    },
    lastLapTime: {
      [AnchorPoint.CenterCenter]: "lastLapTime",
    },
    lastLaps: {
      [AnchorPoint.CenterCenter]: "lastLaps",
    },
    bestLapTime: {
      [AnchorPoint.CenterCenter]: "bestLapTime",
    },
    lapCount: {
      [AnchorPoint.CenterCenter]: "lapCount",
    },
  };
  practiceColumnVisibility: { [columnKey: string]: ColumnVisibility } = {
    "imageset_fuel-gauge-builtin": ColumnVisibility.FuelRaceOnly,
    laneNumber: ColumnVisibility.Always,
    lastLaps: ColumnVisibility.Always,
  };
  practiceColumnWidths: { [columnKey: string]: number } = {};

  practiceRacedayLayout?: LayoutConfig;

  static readonly DEFAULT_LAYOUT: LayoutConfig = DEFAULT_LAYOUT;

  static readonly DEFAULT_PRACTICE_LAYOUT: LayoutConfig =
    DEFAULT_PRACTICE_LAYOUT;

  static readonly LEGACY_DEFAULT_LAYOUT: LayoutConfig = LEGACY_DEFAULT_LAYOUT;

  static readonly LEGACY_DEFAULT_PRACTICE_LAYOUT: LayoutConfig =
    LEGACY_DEFAULT_PRACTICE_LAYOUT;

  static readonly DEFAULT_DRIVER_STATION_LAYOUT: LayoutConfig = {
    widgets: [
      {
        id: "widget-ds-progress",
        widgetType: "progress-gauge",
        scaleMode: "auto",
        x: 20,
        y: 20,
        width: 80,
        height: 1880,
        zIndex: 100,
        customSettings: {
          gaugeType: "heat-progress",
          gaugeStyle: "thermometer",
          orientation: "vertical",
          bindingMode: "hostLane",
          borderColor: "#ffffff",
          textColor: "#ffffff",
          fillColor: "#d3d3d3",
          timeDisplayFormat: "dynamic",
          timeSubsecondMode: "threshold",
          timeSubsecondThreshold: 10,
          timeSubsecondDecimals: 2,
          lapDecimalPlaces: 0,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-nickname",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 120,
        y: 20,
        width: 640,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "driver.nickname",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-lane-number",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 780,
        y: 20,
        width: 180,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "laneNumber",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-rank-heat",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 120,
        y: 330,
        width: 410,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "rankHeat",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-rank-overall",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 550,
        y: 330,
        width: 410,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "rankOverall",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-lap-count",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 120,
        y: 640,
        width: 410,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "lapCount",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          lapDecimalPlaces: 0,
          decimalPlaces: 0,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-last-lap-time",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 550,
        y: 640,
        width: 410,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "lastLapTime",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-gap-leader",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 120,
        y: 950,
        width: 840,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "gapLeader",
          customLabel: "GAP LEADER",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-best-lap-time",
        widgetType: "lane-column",
        scaleMode: "auto",
        x: 120,
        y: 1260,
        width: 840,
        height: 290,
        zIndex: 100,
        customSettings: {
          columnKey: "bestLapTime",
          bindingMode: "hostLane",
          showHeader: true,
          showBorder: true,
          borderWidth: 2,
          borderRadius: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.1)",
          useLaneColors: true,
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-flag",
        widgetType: "flag",
        scaleMode: "auto",
        x: 120,
        y: 1570,
        width: 840,
        height: 330,
        zIndex: 100,
        customSettings: {
          displayMode: "color-bar",
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
      {
        id: "widget-ds-fuel",
        widgetType: "progress-gauge",
        scaleMode: "auto",
        x: 980,
        y: 20,
        width: 80,
        height: 1880,
        zIndex: 100,
        customSettings: {
          gaugeType: "fuel",
          gaugeStyle: "thermometer",
          orientation: "vertical",
          bindingMode: "hostLane",
          borderColor: "#ffffff",
          textColor: "#ffffff",
          fillColor: "#d3d3d3",
          highlightRowOnLap: true,
          highlightLapStyle: "full-glow",
        },
      },
    ],
    baseWidth: 1080,
    baseHeight: 1920,
    aspectRatio: "9:16",
    scaleMode: "stretch",
  };
}
