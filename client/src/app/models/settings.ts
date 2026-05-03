import { AnchorPoint } from "@app/components/raceday/column_definition";

export enum ColumnVisibility {
  Always = "Always",
  FuelRaceOnly = "FuelRaceOnly",
  NonFuelRaceOnly = "NonFuelRaceOnly",
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
}
