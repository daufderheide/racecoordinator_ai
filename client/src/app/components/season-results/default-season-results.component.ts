import { CommonModule, DatePipe, DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import {
  PdfExportDialogComponent,
  PdfExportOptions,
} from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { SeasonSummaryComponent } from "@app/components/shared/season-summary/season-summary.component";
import { DataService } from "@app/data.service";
import {
  Season,
  SeasonDriverResult,
  SeasonRaceRecord,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  standalone: true,
  selector: "app-default-season-results",
  templateUrl: "./default-season-results.component.html",
  styleUrls: ["./default-season-results.component.css"],
  imports: [
    CommonModule,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    PdfExportDialogComponent,
    BrowserNavigationComponent,
    SeasonSummaryComponent,
  ],
})
export class DefaultSeasonResultsComponent implements OnInit, OnDestroy {
  season: Season | null = null;
  standings: SeasonStandingItem[] = [];
  expandedRaceIds: Set<string> = new Set<string>();
  expandedDriverKeys: Set<string> = new Set<string>();

  isLoading = true;
  scale = 1;

  showPdfExportDialog = false;
  defaultIncludeBackground = true;

  private subscriptions: Subscription = new Subscription();
  private targetSeasonId: string | null = null;

  constructor(
    @Inject(DataService) private dataService: DataService,
    @Inject(RaceConnectionService)
    private raceConnectionService: RaceConnectionService,
    @Inject(RaceService) private raceService: RaceService,
    @Inject(SettingsService) private settingsService: SettingsService,
    @Inject(TranslationService)
    private translationService: TranslationService,
    @Inject(PrintService) private printService: PrintService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef,
    @Inject(ActivatedRoute) private route: ActivatedRoute,
    @Inject(LoggerService) private logger: LoggerService,
  ) {}

  ngOnInit(): void {
    this.updateScale();

    if (typeof this.raceConnectionService?.connect === "function") {
      this.raceConnectionService.connect();
    }

    this.subscriptions.add(
      this.route.queryParamMap.subscribe((paramMap) => {
        const queryId = paramMap.get("id");
        if (queryId) {
          this.targetSeasonId = queryId;
        }
        this.loadSeasonData();
      }),
    );

    this.subscriptions.add(
      this.raceService.selectedRace$.subscribe((race) => {
        if (!this.targetSeasonId && race) {
          const raceSeasonId =
            (race as any).season_id || (race as any).seasonId;
          if (raceSeasonId) {
            this.targetSeasonId = raceSeasonId;
          }
        }
        this.loadSeasonData();
      }),
    );

    this.subscriptions.add(
      this.raceService.heats$.subscribe(() => {
        this.loadSeasonData();
      }),
    );
  }

  ngOnDestroy(): void {
    if (typeof this.raceConnectionService?.disconnect === "function") {
      this.raceConnectionService.disconnect();
    }
    this.subscriptions.unsubscribe();
  }

  @HostListener("window:pagehide")
  onPageHide(): void {
    if (typeof this.raceConnectionService?.disconnect === "function") {
      this.raceConnectionService.disconnect();
    }
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  loadSeasonData(): void {
    const currentRace = this.raceService.getRace();
    const raceSeasonId = currentRace
      ? (currentRace as any).season_id || (currentRace as any).seasonId
      : null;

    let searchId = this.targetSeasonId || raceSeasonId;
    if (!searchId) {
      const savedSettingId =
        this.settingsService.getSettings()?.selectedSeasonId;
      searchId = savedSettingId || null;
    }

    this.dataService.getSeasons().subscribe({
      next: (seasons) => {
        if (!seasons || seasons.length === 0) {
          this.season = null;
          this.standings = [];
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        let target: Season | undefined;
        if (searchId) {
          target = seasons.find((s) => s.entity_id === searchId);
        }

        if (!target && seasons.length > 0) {
          target = seasons[0];
        }

        if (target) {
          this.season = JSON.parse(JSON.stringify(target));
          this.calculateStandings();
        } else {
          this.season = null;
          this.standings = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons for Season Results", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get hasDemoRaces(): boolean {
    if (!this.season || !this.season.races) return false;
    return this.season.races.some((r) => Boolean(r.is_demo));
  }

  private appendLiveRaceIfPresent(
    season: Season,
    currentRace: any,
    liveStandings: any[],
    races: SeasonRaceRecord[],
  ): void {
    const isCurrentRaceForSeason =
      currentRace &&
      ((currentRace as any).is_season ||
        (currentRace as any).isSeason ||
        (currentRace as any).season_id === season.entity_id ||
        (currentRace as any).seasonId === season.entity_id);

    if (!isCurrentRaceForSeason || liveStandings.length === 0) {
      return;
    }

    const liveRaceId = currentRace.entity_id || "live_race";
    const alreadyHasRace = races.some((r) => r.race_id === liveRaceId);
    if (alreadyHasRace) {
      return;
    }

    const liveDriverResults = liveStandings.map((s: any, idx: number) => {
      const curPts = s.current_race_points ?? s.currentRacePoints ?? 0;
      const overallPts =
        s.current_race_overall_points ?? s.currentRaceOverallPoints ?? 0;
      const overallBonus =
        s.current_race_overall_bonus_points ??
        s.currentRaceOverallBonusPoints ??
        0;
      const overallBreakdown =
        s.current_race_overall_bonus_breakdown ??
        s.currentRaceOverallBonusBreakdown ??
        s.overall_bonus_breakdown ??
        s.overallBonusBreakdown ??
        {};
      const heatPts =
        s.current_race_heat_points ?? s.currentRaceHeatPoints ?? 0;
      const heatBonus =
        s.current_race_heat_bonus_points ?? s.currentRaceHeatBonusPoints ?? 0;
      const heatBreakdown =
        s.current_race_heat_bonus_breakdown ??
        s.currentRaceHeatBonusBreakdown ??
        s.heat_bonus_breakdown ??
        s.heatBonusBreakdown ??
        {};
      const rank =
        s.current_race_overall_rank ?? s.currentRaceOverallRank ?? idx + 1;
      return {
        driver_id: s.driver_id || s.driverId,
        driver_name: s.driver_name || s.driverName,
        overall_rank: rank,
        overall_points: overallPts,
        overall_bonus_points: overallBonus,
        overall_bonus_breakdown: overallBreakdown,
        heat_points: heatPts,
        heat_bonus_points: heatBonus,
        heat_bonus_breakdown: heatBreakdown,
        total_points: curPts,
      };
    });

    races.push({
      race_id: liveRaceId,
      race_name: `${currentRace.name || "Race"} (Live)`,
      timestamp: Date.now(),
      is_demo: false,
      driver_results: liveDriverResults,
    });
    season.races = races;
  }

  private buildDriverScoresMap(
    races: SeasonRaceRecord[],
  ): Map<string, { driver_name: string; scores: SeasonStandingDetail[] }> {
    const driverMap = new Map<
      string,
      { driver_name: string; scores: SeasonStandingDetail[] }
    >();

    for (const race of races) {
      if (!race.driver_results) continue;
      for (const res of race.driver_results) {
        let entry = driverMap.get(res.driver_id);
        if (!entry) {
          entry = { driver_name: res.driver_name, scores: [] };
          driverMap.set(res.driver_id, entry);
        }
        entry.scores.push({
          race_id: race.race_id,
          race_name: race.race_name,
          overall_rank: res.overall_rank,
          overall_points: res.overall_points || 0,
          overall_bonus_points: res.overall_bonus_points || 0,
          overall_bonus_breakdown: res.overall_bonus_breakdown,
          heat_points: res.heat_points || 0,
          heat_bonus_points: res.heat_bonus_points || 0,
          heat_bonus_breakdown: res.heat_bonus_breakdown,
          total_points: res.total_points,
          is_dropped: false,
        });
      }
    }
    return driverMap;
  }

  calculateStandings(): void {
    const season = this.season;
    if (!season) {
      this.standings = [];
      return;
    }

    const currentRace = this.raceService.getRace();
    const liveStandings: any[] =
      (currentRace as any)?.season_standings ||
      (currentRace as any)?.seasonStandings ||
      [];

    const races = [...(season.races || [])];
    this.appendLiveRaceIfPresent(season, currentRace, liveStandings, races);

    if (races.length === 0) {
      this.standings = [];
      return;
    }

    // Sort races by date run (oldest to most recent)
    races.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const driverMap = this.buildDriverScoresMap(races);
    const result: SeasonStandingItem[] = [];

    const isCurrentRaceForSeason =
      currentRace &&
      ((currentRace as any).is_season ||
        (currentRace as any).isSeason ||
        (currentRace as any).season_id === season.entity_id ||
        (currentRace as any).seasonId === season.entity_id);

    driverMap.forEach((entry, driverId) => {
      const scores = entry.scores;
      const drops = Number(season.drops) || 0;
      const racesRun = scores.length;

      if (racesRun > drops && drops > 0) {
        const sortedIndices = scores
          .map((s, idx) => ({ total: s.total_points, idx }))
          .sort((a, b) => a.total - b.total);

        for (let i = 0; i < drops; i++) {
          scores[sortedIndices[i].idx].is_dropped = true;
        }
      }

      let net = 0;
      let gross = 0;
      for (const s of scores) {
        gross += s.total_points;
        if (!s.is_dropped) {
          net += s.total_points;
        }
      }

      if (isCurrentRaceForSeason && liveStandings.length > 0) {
        const serverLive = liveStandings.find(
          (ls: any) => (ls.driver_id || ls.driverId) === driverId,
        );
        if (serverLive) {
          net = serverLive.net_points ?? serverLive.netPoints ?? net;
          gross = serverLive.gross_points ?? serverLive.grossPoints ?? gross;
        }
      }

      const netPoints = Math.round(net * 100) / 100;
      const grossPoints = Math.round(gross * 100) / 100;
      const droppedPoints =
        Math.round(Math.max(0, grossPoints - netPoints) * 100) / 100;

      result.push({
        driver_id: driverId,
        driver_name: entry.driver_name,
        net_points: netPoints,
        gross_points: grossPoints,
        dropped_points: droppedPoints,
        races_run: racesRun,
        race_scores: scores,
      });
    });

    result.sort((a, b) => {
      if (b.net_points !== a.net_points) return b.net_points - a.net_points;
      if (b.gross_points !== a.gross_points)
        return b.gross_points - a.gross_points;
      return b.races_run - a.races_run;
    });

    this.standings = result;
  }

  getRaceExpanderKey(race: SeasonRaceRecord, idx: number): string {
    return `${race.race_id || "race"}_${race.timestamp || ""}_${idx}`;
  }

  toggleRaceExpanded(raceOrId: SeasonRaceRecord | string, idx?: number): void {
    const key =
      typeof raceOrId === "string"
        ? raceOrId
        : this.getRaceExpanderKey(raceOrId, idx ?? 0);
    if (this.expandedRaceIds.has(key)) {
      this.expandedRaceIds.delete(key);
    } else {
      this.expandedRaceIds.add(key);
    }
    this.cdr.detectChanges();
  }

  isRaceExpanded(raceOrId: SeasonRaceRecord | string, idx?: number): boolean {
    if (typeof raceOrId === "string") {
      return this.expandedRaceIds.has(raceOrId);
    }
    const key = this.getRaceExpanderKey(raceOrId, idx ?? 0);
    return (
      this.expandedRaceIds.has(key) ||
      (Boolean(raceOrId.race_id) && this.expandedRaceIds.has(raceOrId.race_id))
    );
  }

  getDriverKey(raceIdOrKey: string, driverId: string): string {
    return `${raceIdOrKey}__${driverId}`;
  }

  toggleDriverExpanded(raceIdOrKey: string, driverId: string): void {
    const key = this.getDriverKey(raceIdOrKey, driverId);
    if (this.expandedDriverKeys.has(key)) {
      this.expandedDriverKeys.delete(key);
    } else {
      const existing = Array.from(this.expandedDriverKeys).find(
        (k) =>
          k.endsWith(`__${driverId}`) &&
          (k.startsWith(`${raceIdOrKey}_`) || k.startsWith(`${raceIdOrKey}__`)),
      );
      if (existing) {
        this.expandedDriverKeys.delete(existing);
      } else {
        this.expandedDriverKeys.add(key);
      }
    }
    this.cdr.detectChanges();
  }

  isDriverExpanded(raceIdOrKey: string, driverId: string): boolean {
    const exactKey = this.getDriverKey(raceIdOrKey, driverId);
    if (this.expandedDriverKeys.has(exactKey)) {
      return true;
    }
    return Array.from(this.expandedDriverKeys).some(
      (k) =>
        k.endsWith(`__${driverId}`) &&
        (k.startsWith(`${raceIdOrKey}_`) || k.startsWith(`${raceIdOrKey}__`)),
    );
  }

  hasAnyBonuses(res: SeasonDriverResult): boolean {
    return (
      (res.overall_bonus_points || 0) > 0 || (res.heat_bonus_points || 0) > 0
    );
  }

  getOverallBonusEntries(res: SeasonDriverResult): {
    key: string;
    labelKey: string;
    params?: { [key: string]: any };
    points: number;
  }[] {
    if (!res.overall_bonus_breakdown) return [];
    const entries: {
      key: string;
      labelKey: string;
      params?: { [key: string]: any };
      points: number;
    }[] = [];
    const labels: Record<string, string> = {
      fastest_lap: "SS_BONUS_FASTEST_LAP",
      fastest_lap_per_lane: "SS_BONUS_FASTEST_LAP_LANE",
      led_lap: "SS_BONUS_LED_LAP",
      most_laps_led: "SS_BONUS_MOST_LAPS_LED",
    };
    for (const [k, v] of Object.entries(res.overall_bonus_breakdown)) {
      if (typeof v === "number" && v > 0) {
        const laneMatch = k.match(/^fastest_lap_lane_(\d+)$/);
        if (laneMatch) {
          entries.push({
            key: k,
            labelKey: "SS_BONUS_FASTEST_LAP_LANE_NUM",
            params: { lane: laneMatch[1] },
            points: v,
          });
        } else {
          entries.push({ key: k, labelKey: labels[k] || k, points: v });
        }
      }
    }
    entries.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      const aLane =
        a.params?.["lane"] !== undefined ? Number(a.params["lane"]) : 0;
      const bLane =
        b.params?.["lane"] !== undefined ? Number(b.params["lane"]) : 0;
      if (aLane !== bLane) {
        return aLane - bLane;
      }
      return a.key.localeCompare(b.key);
    });
    return entries;
  }

  getHeatBonusEntries(res: SeasonDriverResult): {
    key: string;
    labelKey: string;
    params?: { [key: string]: any };
    points: number;
  }[] {
    if (!res.heat_bonus_breakdown) return [];
    const entries: {
      key: string;
      labelKey: string;
      params?: { [key: string]: any };
      points: number;
    }[] = [];
    const labels: Record<string, string> = {
      fastest_lap: "SS_BONUS_FASTEST_LAP",
      led_lap: "SS_BONUS_LED_LAP",
      most_laps_led: "SS_BONUS_MOST_LAPS_LED",
    };
    for (const [k, v] of Object.entries(res.heat_bonus_breakdown)) {
      if (typeof v === "number" && v > 0) {
        const fastestLapMatch = k.match(/^fastest_lap_heat_(\d+)$/);
        const ledLapMatch = k.match(/^led_lap_heat_(\d+)$/);
        const mostLapsLedMatch = k.match(/^most_laps_led_heat_(\d+)$/);

        if (fastestLapMatch) {
          entries.push({
            key: k,
            labelKey: "SS_BONUS_FASTEST_LAP_HEAT_NUM",
            params: { heat: fastestLapMatch[1] },
            points: v,
          });
        } else if (ledLapMatch) {
          entries.push({
            key: k,
            labelKey: "SS_BONUS_LED_LAP_HEAT_NUM",
            params: { heat: ledLapMatch[1] },
            points: v,
          });
        } else if (mostLapsLedMatch) {
          entries.push({
            key: k,
            labelKey: "SS_BONUS_MOST_LAPS_LED_HEAT_NUM",
            params: { heat: mostLapsLedMatch[1] },
            points: v,
          });
        } else {
          entries.push({ key: k, labelKey: labels[k] || k, points: v });
        }
      }
    }
    entries.sort((a, b) => {
      const aHeat =
        a.params?.["heat"] !== undefined ? Number(a.params["heat"]) : 0;
      const bHeat =
        b.params?.["heat"] !== undefined ? Number(b.params["heat"]) : 0;
      if (aHeat !== bHeat) {
        return aHeat - bHeat;
      }
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.key.localeCompare(b.key);
    });
    return entries;
  }

  exportPdf(): void {
    this.defaultIncludeBackground =
      this.settingsService.getSettings()?.exportPdfBackgrounds ?? true;
    this.showPdfExportDialog = true;
    this.cdr.detectChanges();
  }

  onPdfExportConfirm(options: PdfExportOptions): void {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
    if (options.saveAsDefault) {
      const settings = this.settingsService.getSettings();
      settings.exportPdfBackgrounds = options.includeBackground;
      this.settingsService.saveSettings(settings);
    }
    const seasonName = this.season?.name || "Season";
    this.printService.print(
      `${seasonName}-SeasonResults`,
      true,
      undefined,
      options.includeBackground,
    );
  }

  onPdfExportCancel(): void {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
  }
}
