import { Injectable } from '@angular/core';
import { RaceService } from './race.service';
import { com } from '../proto/message';
import { FinishMethod, AllowFinish, HeatScoring } from '../models/heat_scoring';
import { Heat } from '../race/heat';
import { DriverHeatData } from '../race/driver_heat_data';

export type FlagType = 'red' | 'green' | 'yellow' | 'white' | 'checkered' | 'green_yellow';

@Injectable({
  providedIn: 'root'
})
export class RaceFlagService {

  constructor(private raceService: RaceService) { }

  /**
   * Get the current flag type based on race state.
   * This is shared logic used by both raceday and driver-station components.
   */
  getFlagType(
    raceState: com.antigravity.RaceState,
    hasRacedInCurrentHeat: boolean,
    isWarmup: boolean,
    heat?: Heat
  ): FlagType {
    const RS = com.antigravity.RaceState;
    const race = this.raceService.getRace();
    const scoring = race?.heat_scoring;

    if (isWarmup) {
      return 'green_yellow';
    }

    switch (raceState) {
      case RS.NOT_STARTED:
      case RS.HEAT_OVER:
      case RS.RACE_OVER:
        return 'red';

      case RS.STARTING:
        // Use yellow if heat is in progress (resuming), red if it hasn't started yet
        return hasRacedInCurrentHeat ? 'yellow' : 'red';

      case RS.RACING:
        let flagType: FlagType = 'green';

        // Check for White Flag (1 lap to go)
        if (scoring?.finishMethod === FinishMethod.Lap && heat?.heatDrivers) {
          const lapsToFinish = scoring.finishValue;
          const anyDriverOneLapToGo = heat.heatDrivers.some(d => d.lapCount === lapsToFinish - 1);
          if (anyDriverOneLapToGo) {
            flagType = 'white';
          }
        }

        // Checkered flag if any driver has finished (and race allows finishing)
        if (scoring?.allowFinish !== AllowFinish.AF_NONE && heat?.heatDrivers) {
          const atLeastOneFinished = heat.heatDrivers.some(d => this.isDriverFinished(d, scoring));
          if (atLeastOneFinished) {
            flagType = 'checkered';
          }
        }

        return flagType;

      case RS.PAUSED:
        return 'yellow';

      default:
        return 'red';
    }
  }

  /**
   * Get the flag color for driver station indicator (simplified version)
   */
  getFlagColor(
    raceState: com.antigravity.RaceState,
    hasRacedInCurrentHeat: boolean,
    heat?: Heat
  ): 'red' | 'green' | 'yellow' | 'white' | 'checkered' {
    // Get full flag type and filter to just colors (no green_yellow)
    const flagType = this.getFlagType(raceState, hasRacedInCurrentHeat, false, heat);
    
    // Map to simplified color set
    if (flagType === 'green_yellow') return 'green';
    return flagType;
  }

  private isDriverFinished(hd: DriverHeatData, scoring: HeatScoring | null | undefined): boolean {
    if (!scoring || !hd) return false;

    if (scoring.finishMethod === FinishMethod.Lap) {
      return hd.lapCount >= scoring.finishValue;
    } else if (scoring.finishMethod === FinishMethod.Timed) {
      return hd.totalTime >= scoring.finishValue;
    }
    return false;
  }
}
