import { AnchorPoint } from "@app/components/raceday/column_definition";
import { IDemoConfig } from "@app/proto/antigravity";

export enum ColumnVisibility {
  Always = "Always",
  FuelRaceOnly = "FuelRaceOnly",
  NonFuelRaceOnly = "NonFuelRaceOnly",
}

export type LayoutNode = SplitNode | WidgetNode;

export interface SplitNode {
  type: "split";
  direction: "horizontal" | "vertical";
  size: number;
  children: [LayoutNode, LayoutNode];
}

export interface WidgetNode {
  type: "widget";
  widgetType:
    | "menu-bar"
    | "race-info"
    | "branding"
    | "flag"
    | "timer"
    | "records"
    | "leaderboard"
    | "lane-view";
}

export interface LayoutConfig {
  root: LayoutNode;
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
    root: {
      type: "split",
      direction: "vertical",
      size: 5,
      children: [
        { type: "widget", widgetType: "menu-bar" },
        {
          type: "split",
          direction: "vertical",
          size: 7,
          children: [
            { type: "widget", widgetType: "race-info" },
            {
              type: "split",
              direction: "vertical",
              size: 25,
              children: [
                {
                  type: "split",
                  direction: "horizontal",
                  size: 20,
                  children: [
                    { type: "widget", widgetType: "branding" },
                    {
                      type: "split",
                      direction: "horizontal",
                      size: 19,
                      children: [
                        { type: "widget", widgetType: "flag" },
                        {
                          type: "split",
                          direction: "horizontal",
                          size: 38,
                          children: [
                            { type: "widget", widgetType: "timer" },
                            {
                              type: "split",
                              direction: "horizontal",
                              size: 50,
                              children: [
                                { type: "widget", widgetType: "records" },
                                { type: "widget", widgetType: "leaderboard" },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { type: "widget", widgetType: "lane-view" },
              ],
            },
          ],
        },
      ],
    },
  };
}
