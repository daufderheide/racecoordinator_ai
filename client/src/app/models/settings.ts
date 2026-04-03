import { AnchorPoint } from '../components/raceday/column_definition';

export enum ColumnVisibility {
  Always = 'Always',
  FuelRaceOnly = 'FuelRaceOnly',
  NonFuelRaceOnly = 'NonFuelRaceOnly'
}

export class Settings {
  static readonly DEFAULT_COLUMNS = ['driver.nickname', 'imageset_fuel-gauge-builtin', 'lapCount', 'lastLapTime', 'gapLeader'];

  recentRaceIds: string[] = [];
  selectedRaceId: string = '';
  selectedDriverIds: string[] = [];

  serverIp: string = 'localhost';
  serverPort: number = 7070;
  language: string = '';
  racedaySetupWalkthroughSeen: boolean = false;
  trackManagerHelpShown: boolean = false;
  trackEditorHelpShown: boolean = false;
  driverEditorHelpShown: boolean = false;
  driverManagerHelpShown: boolean = false;
  teamManagerHelpShown: boolean = false;
  teamEditorHelpShown: boolean = false;

  flagGreen?: string;
  flagYellow?: string;
  flagRed?: string;
  flagWhite?: string;
  flagBlack?: string;
  flagCheckered?: string;
  sortByStandings: boolean = true;
  highlightRowOnLap: boolean = true;
  
  // Race Screen Settings
  racedayColumns: string[] = Settings.DEFAULT_COLUMNS;
  columnAnchors: { [key: string]: AnchorPoint } = {};
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {
    'driver.nickname': {
      [AnchorPoint.CenterCenter]: 'driver.nickname',
      [AnchorPoint.BottomCenter]: 'participant.team.name'
    },
    'imageset_fuel-gauge-builtin': {
      [AnchorPoint.CenterCenter]: 'imageset_fuel-gauge-builtin'
    },
    'lapCount': {
      [AnchorPoint.CenterCenter]: 'lapCount'
    },
    'lastLapTime': {
      [AnchorPoint.CenterCenter]: 'lastLapTime',
      [AnchorPoint.TopRight]: 'bestLapTime',
      [AnchorPoint.BottomRight]: 'averageLapTime'
    },
    'gapLeader': {
      [AnchorPoint.CenterCenter]: 'gapLeader',
      [AnchorPoint.BottomRight]: 'gapPosition'
    }
  };
  columnVisibility: { [columnKey: string]: ColumnVisibility } = {
    'imageset_fuel-gauge-builtin': ColumnVisibility.FuelRaceOnly
  };
  
  // Extra Screen Settings
  extraScreenSortByStandings: boolean = true;
  extraScreenHighlightRowOnLap: boolean = true;
  extraScreenColumns: string[] = Settings.DEFAULT_EXTRA_SCREEN_COLUMNS;
  extraScreenColumnAnchors: { [key: string]: AnchorPoint } = {};
  extraScreenColumnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {
    'driver.nickname': {
      [AnchorPoint.CenterCenter]: 'driver.nickname'
    },
    'imageset_fuel-gauge-builtin': {
      [AnchorPoint.CenterCenter]: 'imageset_fuel-gauge-builtin'
    },
    'lapCount': {
      [AnchorPoint.CenterCenter]: 'lapCount'
    },
    'lastLapTime': {
      [AnchorPoint.CenterCenter]: 'lastLapTime'
    },
    'gapLeader': {
      [AnchorPoint.CenterCenter]: 'gapLeader'
    }
  };
  extraScreenColumnVisibility: { [columnKey: string]: ColumnVisibility } = {
    'imageset_fuel-gauge-builtin': ColumnVisibility.FuelRaceOnly
  };

  static readonly DEFAULT_EXTRA_SCREEN_COLUMNS = ['driver.nickname', 'imageset_fuel-gauge-builtin', 'lapCount', 'lastLapTime', 'gapLeader'];
}


