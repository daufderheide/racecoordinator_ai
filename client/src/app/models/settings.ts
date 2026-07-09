import { AnchorPoint } from "@app/components/raceday/column_definition";
import { IDemoConfig } from "@app/proto/antigravity";

export enum ColumnVisibility {
  Always = "Always",
  FuelRaceOnly = "FuelRaceOnly",
  NonFuelRaceOnly = "NonFuelRaceOnly",
}

export type WidgetType =
  | "menu-bar"
  | "race-name"
  | "heat-info"
  | "track-name"
  | "branding"
  | "qr"
  | "flag"
  | "timer"
  | "records"
  | "leaderboard"
  | "group-leaderboard"
  | "lane-view"
  | "on-deck"
  | "next-heat"
  | "image";

export interface AbsoluteWidgetNode {
  id: string; // Unique ID so we can uniquely identify widgets on the page
  widgetType: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  fontFamily?: string;
  scaleMode?: "auto" | "fixed";
  fontSize?: number;
  textScaleFactor?: number;
  textColor?: string;
  backgroundColor?: string;
  customSettings?: Record<string, any>;
}

export interface LayoutConfig {
  widgets: AbsoluteWidgetNode[];
  baseWidth?: number;
  baseHeight?: number;
}

export class Settings {
  static readonly DEFAULT_COLUMNS = [
    "driver.nickname",
    "imageset_fuel-gauge-builtin",
    "lapCount",
    "lastLapTime",
    "gapLeader",
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
  selectedDriverIds: string[] = [];
  demoConfig?: IDemoConfig;

  serverIp: string = "";
  serverPort: number = 7070;
  language: string = "";
  shareAnalytics: boolean = true;
  pageTransition: string = "slide";
  clientLogLevel: string = "INFO";
  serverLogLevel: string = "INFO";

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
  layoutEditorMinimized: boolean = false;
  layoutEditorPositionX: number = 0;
  layoutEditorPositionY: number = 0;
  columnEditorMinimized: boolean = false;
  columnEditorPositionX: number = 0;
  columnEditorPositionY: number = 0;

  flagGreen?: string;
  flagYellow?: string;
  flagRed?: string;
  flagWhite?: string;
  flagBlack?: string;
  flagYellowGreen?: string;
  flagCheckered?: string;

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
  driverStateBackfilled: boolean = false;
  racedayColumns: string[] = Settings.DEFAULT_COLUMNS;
  columnAnchors: { [key: string]: AnchorPoint } = {};
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {
    "driver.nickname": {
      [AnchorPoint.CenterCenter]: "driver.nickname",
      [AnchorPoint.BottomRight]: "participant.team.name",
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
      [AnchorPoint.TopRight]: "bestLapTime",
      [AnchorPoint.BottomRight]: "averageLapTime",
    },
    gapLeader: {
      [AnchorPoint.CenterCenter]: "gapLeader",
      [AnchorPoint.BottomRight]: "gapPosition",
    },
  };
  columnVisibility: { [columnKey: string]: ColumnVisibility } = {
    "imageset_fuel-gauge-builtin": ColumnVisibility.FuelRaceOnly,
  };

  racedayLayout?: LayoutConfig;

  practiceRacedayColumns: string[] = Settings.DEFAULT_PRACTICE_COLUMNS;
  practiceColumnAnchors: { [key: string]: AnchorPoint } = {};
  practiceColumnLayouts: {
    [columnKey: string]: { [A in AnchorPoint]?: string };
  } = {
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

  practiceRacedayLayout?: LayoutConfig;

  static readonly DEFAULT_LAYOUT: LayoutConfig = {
    widgets: [
      {
        id: "widget-menu-bar",
        widgetType: "menu-bar",
        x: 0,
        y: 0,
        width: 1920,
        height: 54,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-race-name",
        widgetType: "race-name",
        x: 0,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-heat-info",
        widgetType: "heat-info",
        x: 640,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-track-name",
        widgetType: "track-name",
        x: 1280,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-branding",
        widgetType: "branding",
        x: 0,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-qr",
        widgetType: "qr",
        x: 328,
        y: 273,
        width: 48,
        height: 48,
        zIndex: 110,
        scaleMode: "auto",
      },
      {
        id: "widget-flag",
        widgetType: "flag",
        x: 384,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-timer",
        widgetType: "timer",
        x: 768,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
        scaleMode: "auto",
        customSettings: {
          timeFontFamily: "",
          timeFontSize: 100,
          timeTextColor: "",
          timeSubsecondThreshold: 10,
          timeSubsecondDecimals: 2,
        },
      },
      {
        id: "widget-records",
        widgetType: "records",
        x: 1152,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-leaderboard",
        widgetType: "leaderboard",
        x: 1536,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
        scaleMode: "auto",
      },
      {
        id: "widget-lane-view",
        widgetType: "lane-view",
        x: 0,
        y: 329,
        width: 1920,
        height: 751,
        zIndex: 100,
        scaleMode: "auto",
      },
    ],
  };

  static readonly DEFAULT_PRACTICE_LAYOUT: LayoutConfig = {
    widgets: [
      {
        id: "widget-menu-bar",
        widgetType: "menu-bar",
        x: 0,
        y: 0,
        width: 1728,
        height: 46,
        zIndex: 216,
        scaleMode: "auto",
        fontFamily: "",
        textColor: "",
        backgroundColor: "",
        fontSize: 24,
        textScaleFactor: 1,
      },
      {
        id: "widget-timer",
        widgetType: "timer",
        x: 701,
        y: 41,
        width: 397,
        height: 94,
        zIndex: 218,
        scaleMode: "auto",
        fontFamily: "",
        textColor: "",
        backgroundColor: "",
        fontSize: 24,
        textScaleFactor: 1,
        customSettings: {
          timeFontFamily: "",
          timeFontSize: 100,
          timeTextColor: "",
        },
      },
      {
        id: "widget-branding",
        widgetType: "branding",
        x: 0,
        y: 41,
        width: 422,
        height: 94,
        zIndex: 206,
        scaleMode: "auto",
        fontFamily: "",
        fontSize: 24,
        textColor: "",
        textScaleFactor: 1,
        backgroundColor: "",
      },
      {
        backgroundColor: "",
        fontFamily: "",
        fontSize: 24,
        height: 93,
        id: "widget-qr",
        scaleMode: "auto",
        textColor: "",
        textScaleFactor: 1,
        widgetType: "qr",
        width: 119,
        x: 422,
        y: 42,
        zIndex: 217,
      },
      {
        id: "widget-1783269768449",
        widgetType: "flag",
        x: 541,
        y: 41,
        width: 160,
        height: 94,
        zIndex: 212,
        scaleMode: "auto",
        fontFamily: "",
        textColor: "",
        backgroundColor: "",
        fontSize: 24,
        textScaleFactor: 1,
      },
      {
        id: "widget-1783269787601",
        widgetType: "lane-view",
        x: 0,
        y: 125,
        width: 1728,
        height: 781,
        zIndex: 180,
        scaleMode: "auto",
        fontFamily: "",
        textColor: "",
        backgroundColor: "",
        fontSize: 24,
        textScaleFactor: 1,
        customSettings: {
          isVertical: true,
          timeDecimalPlaces: 3,
          lapDecimalPlaces: 0,
          columnFontFamily: "",
          columnFontSize: 24,
          columnTextColor: "",
          dataFontFamily: "",
          dataFontSize: 54,
          dataTextColor: "",
          insetTimeDecimalPlaces: 3,
          insetLapDecimalPlaces: 2,
          insetFontFamily: "",
          insetFontSize: 24,
          insetTextColor: "",
        },
      },
    ],
    baseWidth: 1728,
    baseHeight: 906,
  };
}
