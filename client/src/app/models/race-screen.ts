import { AnchorPoint } from '../components/raceday/column_definition';
import { ColumnVisibility } from './settings';

export interface RaceScreenConfig {
  id: string; // Keep for backward compatibility
  entity_id: string; // Add entity_id field
  name: string;
  isDefault?: boolean;
  isEnabled?: boolean; // New: for Windows menu visibility
  createdAt: number;
  updatedAt: number;
  
  // UI Configuration
  columns: string[];
  columnAnchors: { [key: string]: AnchorPoint };
  columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } };
  columnVisibility: { [columnKey: string]: ColumnVisibility };
  sortByStandings: boolean;
  highlightRowOnLap: boolean;
}

export interface RaceScreenManager {
  screens: RaceScreenConfig[];
  activeScreenId: string; // Currently editing in UI Editor (legacy support)
  activeScreenIds: string[]; // Multiple screens can be active
  enabledScreenIds: string[]; // Screens visible in Windows menu
  defaultScreenId: string;
}

export class RaceScreenConfigFactory {
  static create(name: string): RaceScreenConfig {
    const timestamp = Date.now();
    const id = `screen_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      entity_id: id, // Set entity_id to same value as id
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEnabled: true, // New: enabled by default for Windows menu
      
      // Default UI configuration (same as current defaults)
      columns: ['driver.nickname', 'imageset_fuel-gauge-builtin', 'lapCount', 'lastLapTime', 'gapLeader'],
      columnAnchors: {},
      columnLayouts: {
        'driver.nickname': {
          [AnchorPoint.CenterCenter]: 'driver.nickname',
          [AnchorPoint.BottomRight]: 'participant.team.name'
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
      },
      columnVisibility: {
        'imageset_fuel-gauge-builtin': ColumnVisibility.FuelRaceOnly
      },
      sortByStandings: true,
      highlightRowOnLap: true
    };
  }

  static clone(config: RaceScreenConfig): RaceScreenConfig {
    const newId = `screen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      ...config,
      id: newId,
      entity_id: newId, // Set entity_id to new ID
      name: `${config.name} (Copy)`,
      isDefault: false, // Cloned screen is never default
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}
