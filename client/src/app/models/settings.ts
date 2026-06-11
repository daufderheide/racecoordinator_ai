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
  | "next-heat";

export interface AbsoluteWidgetNode {
  id: string; // Unique ID so we can uniquely identify widgets on the page
  widgetType: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface LayoutConfig {
  widgets: AbsoluteWidgetNode[];
}

export class Settings {
  static readonly DEFAULT_COLUMNS = [
    "driver.nickname",
    "imageset_fuel-gauge-builtin",
    "lapCount",
    "lastLapTime",
    "gapLeader",
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
      },
      {
        id: "widget-race-name",
        widgetType: "race-name",
        x: 0,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
      },
      {
        id: "widget-heat-info",
        widgetType: "heat-info",
        x: 640,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
      },
      {
        id: "widget-track-name",
        widgetType: "track-name",
        x: 1280,
        y: 54,
        width: 200,
        height: 18,
        zIndex: 100,
      },
      {
        id: "widget-branding",
        widgetType: "branding",
        x: 0,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
      },
      {
        id: "widget-qr",
        widgetType: "qr",
        x: 328,
        y: 273,
        width: 48,
        height: 48,
        zIndex: 110,
      },
      {
        id: "widget-flag",
        widgetType: "flag",
        x: 384,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
      },
      {
        id: "widget-timer",
        widgetType: "timer",
        x: 768,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
      },
      {
        id: "widget-records",
        widgetType: "records",
        x: 1152,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
      },
      {
        id: "widget-leaderboard",
        widgetType: "leaderboard",
        x: 1536,
        y: 90,
        width: 384,
        height: 239,
        zIndex: 100,
      },
      {
        id: "widget-lane-view",
        widgetType: "lane-view",
        x: 0,
        y: 329,
        width: 1920,
        height: 751,
        zIndex: 100,
      },
    ],
  };
}
