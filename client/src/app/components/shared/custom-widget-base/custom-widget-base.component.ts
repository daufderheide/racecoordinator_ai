import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
} from "@angular/core";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { RaceParticipant } from "@app/models/race_participant";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { AuthService } from "@app/services/auth.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceFlagService } from "@app/services/race-flag.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { SettingsService } from "@app/services/settings.service";
import { ThemeService } from "@app/services/theme.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  template: "",
  standalone: true,
})
export class CustomWidgetBaseComponent {
  widget = input<AbsoluteWidgetNode>();
  parent = input<any>();
  isCustomizing = input<boolean>(false);

  // Injected services
  public raceService = inject(RaceService);
  public dataService = inject(DataService);
  public translationService = inject(TranslationService);
  public themeService = inject(ThemeService);
  public raceFlagService = inject(RaceFlagService);
  public logger = inject(LoggerService);
  public settingsService = inject(SettingsService);
  public printService = inject(PrintService);
  public authService = inject(AuthService);
  public helpService = inject(HelpService);
  public predictionService = inject(RacePredictionService);
  public elementRef = inject(ElementRef);
  public cdr = inject(ChangeDetectorRef);

  // Live state helpers delegating to parent Raceday instance
  get race() {
    return this.parent()?.race;
  }

  get raceName(): string {
    return this.race?.name || "";
  }

  get heat() {
    return this.parent()?.heat;
  }

  get track() {
    return this.parent()?.track;
  }

  get trackName(): string {
    return this.track?.name || "";
  }

  get participants(): RaceParticipant[] {
    return this.parent()?.participants || [];
  }

  get driverStandings(): any[] {
    const parentObj = this.parent();
    const parts: RaceParticipant[] = this.participants;
    const heatDataList: DriverHeatData[] =
      parentObj?.sortedHeatDrivers || parentObj?.heat?.heatDrivers || [];

    if (parts && parts.length > 0) {
      return parts
        .filter((p: any) => p && p.driver && !Driver.isEmpty(p.driver))
        .map((p: any) => {
          const matchingHd = heatDataList.find(
            (hd: any) =>
              hd?.driver?.entity_id === p.driver?.entity_id ||
              hd?.driver?.name === p.driver?.name ||
              hd?.participant?.objectId === p.objectId,
          );
          const bestLap =
            p.bestLapTime && p.bestLapTime > 0
              ? p.bestLapTime
              : matchingHd?.bestLapTime || 0;
          const lastLap = matchingHd?.lastLapTime || 0;
          const laps =
            p.totalLaps !== undefined && p.totalLaps !== null
              ? p.totalLaps
              : matchingHd?.lapCount || 0;
          const totalTime = p.totalTime || matchingHd?.totalTime || 0;
          const avgLap =
            p.averageLapTime && p.averageLapTime > 0
              ? p.averageLapTime
              : matchingHd?.averageLapTime ||
                (laps > 0 && totalTime > 0 ? totalTime / laps : 0);
          const gapLeader =
            p.gapLeader !== undefined && p.gapLeader !== 0
              ? p.gapLeader
              : matchingHd?.gapLeader || 0;
          const gapPosition =
            p.gapPosition !== undefined && p.gapPosition !== 0
              ? p.gapPosition
              : matchingHd?.gapPosition || 0;

          return {
            name:
              p.team?.name || p.driver?.nickname || p.driver?.name || "Driver",
            driver: p.driver,
            rank: p.rank || 0,
            rankValue: p.rankValue || 0,
            lapCount: laps,
            total_laps: laps,
            total_time: totalTime,
            best_lap_time: bestLap,
            last_lap_time: lastLap,
            avg_lap_time: avgLap,
            average_lap_time: avgLap,
            gap_leader: gapLeader,
            gap_position: gapPosition,
            participant: p,
            heatData: matchingHd,
          };
        });
    }

    if (heatDataList && heatDataList.length > 0) {
      return heatDataList
        .filter((hd: any) => hd && hd.driver && !Driver.isEmpty(hd.driver))
        .map((hd: any) => {
          const laps = hd.lapCount || 0;
          const totalTime = hd.totalTime || 0;
          const avgLap =
            hd.averageLapTime ||
            (laps > 0 && totalTime > 0 ? totalTime / laps : 0);
          return {
            name:
              hd.participant?.team?.name ||
              hd.driver?.nickname ||
              hd.driver?.name ||
              "Driver",
            driver: hd.driver,
            rank: hd.rank || 0,
            rankValue: hd.lapCount || 0,
            lapCount: laps,
            total_laps: laps,
            total_time: totalTime,
            best_lap_time: hd.bestLapTime || 0,
            last_lap_time: hd.lastLapTime || 0,
            avg_lap_time: avgLap,
            average_lap_time: avgLap,
            gap_leader: hd.gapLeader || 0,
            gap_position: hd.gapPosition || 0,
            gapLeader: hd.gapLeader || 0,
            laneIndex: hd.laneIndex,
            heatData: hd,
          };
        });
    }

    return [];
  }

  get heatDrivers(): any[] {
    const parentObj = this.parent();
    const hds: DriverHeatData[] =
      parentObj?.sortedHeatDrivers ||
      parentObj?.heat?.heatDrivers ||
      parentObj?.heatDrivers ||
      [];
    return hds
      .filter((hd: any) => hd && hd.driver && !Driver.isEmpty(hd.driver))
      .map((hd: any) => {
        const laps = hd.lapCount || 0;
        const totalTime = hd.totalTime || 0;
        const avgLap =
          hd.averageLapTime ||
          (laps > 0 && totalTime > 0 ? totalTime / laps : 0);
        return {
          name:
            hd.participant?.team?.name ||
            hd.driver?.nickname ||
            hd.driver?.name ||
            "Driver",
          driver: hd.driver,
          laneIndex: hd.laneIndex,
          rank: hd.rank || 0,
          lapCount: laps,
          total_laps: laps,
          total_time: totalTime,
          best_lap_time: hd.bestLapTime || 0,
          last_lap_time: hd.lastLapTime || 0,
          avg_lap_time: avgLap,
          average_lap_time: avgLap,
          gap_leader: hd.gapLeader || 0,
          gap_position: hd.gapPosition || 0,
          gapLeader: hd.gapLeader || 0,
          reactionTime: hd.reactionTime || 0,
          heatData: hd,
        };
      });
  }

  get heats() {
    return this.parent()?.heats || [];
  }

  get totalHeats() {
    return this.parent()?.totalHeats || 0;
  }

  get leaderboardEntries() {
    return this.parent()?.leaderboardEntries || [];
  }

  get groupLeaderboardEntries() {
    return this.parent()?.groupLeaderboardEntries || [];
  }

  get seasonStandings() {
    return this.parent()?.seasonStandings;
  }

  get formattedTime() {
    return this.parent()?.formattedTime || "00:00.000";
  }

  get autoStatusLabel() {
    return this.parent()?.autoStatusLabel || "";
  }

  get isWarmup() {
    return this.parent()?.isWarmup || false;
  }

  get currentFlagUrl() {
    return this.parent()?.getCurrentFlagUrl
      ? this.parent().getCurrentFlagUrl()
      : "";
  }

  get customSettings(): Record<string, any> {
    return this.widget()?.customSettings || {};
  }

  getSetting<T = any>(key: string, defaultValue?: T): T {
    const settings = this.customSettings;
    if (settings && settings[key] !== undefined) {
      return settings[key] as T;
    }
    return defaultValue as T;
  }
}
