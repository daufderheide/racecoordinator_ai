import { CommonModule, DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import {
  HeatDriverExpanderComponent,
  HeatStandingsRow,
} from "@app/components/shared/heat-driver-expander/heat-driver-expander.component";
import { DriverConverter } from "@app/converters/driver.converter";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { getOverallScoreFormat } from "@app/models/overall_scoring";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import {
  DriverEvaluation,
  RacePredictionService,
} from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

interface StandingsRow {
  rank: number;
  driver: Driver;
  score: number;
  laps: number;
  averageLapTime: number;
  medianLapTime: number;
  bestLapTime: number;
  totalTime: number;
  gap1st: number | null;
  gapAhead: number | null;
  avatarUrl: string;
}

import { BrowserNavigationComponent } from "@app/components/shared/browser-navigation/browser-navigation.component";
import {
  GhostTrajectoryDialogComponent,
  TrajectoryReferenceOption,
} from "@app/components/shared/ghost-trajectory-dialog/ghost-trajectory-dialog.component";
import {
  PdfExportDialogComponent,
  PdfExportOptions,
} from "@app/components/shared/pdf-export-dialog/pdf-export-dialog.component";
import { SettingsService } from "@app/services/settings.service";

@Component({
  standalone: true,
  selector: "app-default-driver-results",
  templateUrl: "./default-driver-results.component.html",
  styleUrls: ["./default-driver-results.component.css"],
  imports: [
    HeatDriverExpanderComponent,
    GhostTrajectoryDialogComponent,
    CommonModule,
    DecimalPipe,
    TranslatePipe,
    AvatarUrlPipe,
    RouterModule,
    PdfExportDialogComponent,
    BrowserNavigationComponent,
  ],
})
export class DefaultDriverResultsComponent implements OnInit, OnDestroy {
  protected driverId: string = "";
  protected driver?: Driver;
  protected race?: Race;
  protected overallRow?: StandingsRow;
  protected showTrajectoryModal = false;
  protected trajectoryDriverAName = "";
  protected trajectoryDriverALapTimes: number[] = [];
  protected trajectoryReferenceOptions: TrajectoryReferenceOption[] = [];
  protected trajectoryInitialReferenceId = "";
  protected trajectoryBenchmarkLapTime = 0;
  protected driverHeats: {
    heat: Heat;
    heatDriver: DriverHeatData;
    row: HeatStandingsRow;
    laneColor: { foreground: string; background: string; name: string };
    maxLapTime: number;
  }[] = [];

  protected expandedHeats = new Set<string>();
  protected collapsedHeatsByUser = new Set<string>();
  private subscriptions: Subscription[] = [];
  protected participants: RaceParticipant[] = [];
  protected heats: Heat[] = [];

  protected driverStats: any = null;
  protected raceState: RaceState = RaceState.UNKNOWN_STATE;
  public driverPredictionEvaluation?: DriverEvaluation;
  private loadedDriverId: string = "";
  private loadedRaceId: string = "";

  private settingsService = inject(SettingsService);
  protected showPdfExportDialog = false;
  protected defaultIncludeBackground = true;

  constructor(
    private route: ActivatedRoute,
    private raceService: RaceService,
    private raceConnectionService: RaceConnectionService,
    private translationService: TranslationService,
    private printService: PrintService,
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    private predictionService?: RacePredictionService,
  ) {}

  private loadDriverStats(force = false) {
    if (!this.driverId) {
      this.driverStats = null;
      return;
    }
    const currentRaceId = this.race?.entity_id;
    if (!currentRaceId && !force) {
      // Driver results view needs a saved race context to fetch specific stats.
      // Do not accidentally request global stats by passing undefined/empty raceId.
      return;
    }

    if (
      !force &&
      this.driverId === this.loadedDriverId &&
      currentRaceId === this.loadedRaceId &&
      this.driverStats !== null
    ) {
      return;
    }
    this.loadedDriverId = this.driverId;
    this.loadedRaceId = currentRaceId || "";
    const isDemo = this.race?.entity_id?.startsWith("demo_") || false;
    this.dataService
      .getDriverStatistics(this.driverId, currentRaceId || undefined, isDemo)
      .subscribe({
        next: (stats) => {
          this.driverStats = stats;
          if (this.predictionService && currentRaceId) {
            this.predictionService
              .getPredictionEvaluation(currentRaceId, isDemo)
              ?.subscribe((evalRec) => {
                if (evalRec && evalRec.driver_evaluations) {
                  this.driverPredictionEvaluation =
                    evalRec.driver_evaluations.find(
                      (e) => e.driver_id === this.driverId,
                    );
                }
                this.cdr.detectChanges();
              });
          } else {
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.warn("Failed to load driver statistics", err);
          this.driverStats = null;
          // Reset cache tracking on error to allow subsequent retries
          this.loadedDriverId = "";
          this.loadedRaceId = "";
          this.cdr.detectChanges();
        },
      });
  }

  ngOnInit() {
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.raceState = state;
        if (state === RaceState.RACE_OVER) {
          // Immediately try to fetch stats (if server completed persistence rapidly)
          this.loadDriverStats(true);
          // Also delay a fetch by 500ms to robustly handle database write latency
          setTimeout(() => {
            this.loadDriverStats(true);
          }, 500);
          // And one more at 1500ms as a robust fallback for slower database writes
          setTimeout(() => {
            this.loadDriverStats(true);
          }, 1500);
        }
      }),
    );

    this.subscriptions.push(
      this.raceService.currentHeat$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.driverId = params["driverId"] || "";
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.selectedRace$.subscribe((race) => {
        this.race = race;
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.participants$.subscribe((participants) => {
        this.participants = participants || [];
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceService.heats$.subscribe((heats) => {
        this.heats = heats || [];
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.laps$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.overallStandingsUpdate$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.raceConnectionService.standingsUpdate$.subscribe(() => {
        this.recalculateAll();
      }),
    );

    this.subscriptions.push(
      this.translationService.getCurrentLanguage().subscribe(() => {
        this.cdr.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener("window:pagehide")
  onPageHide() {
    this.raceConnectionService.disconnect();
  }

  protected getScoreFormat(): string {
    const rankingMethod = this.race?.overall_scoring?.rankingMethod;
    return getOverallScoreFormat(rankingMethod);
  }

  protected toggleHeat(heatId: string) {
    if (this.expandedHeats.has(heatId)) {
      this.expandedHeats.delete(heatId);
      this.collapsedHeatsByUser.add(heatId);
    } else {
      this.expandedHeats.add(heatId);
      this.collapsedHeatsByUser.delete(heatId);
    }
    this.cdr.detectChanges();
  }

  protected formatGap(gap: number | null): string {
    if (gap === null) return "--.---";
    if (gap === 0) return "0.000";
    const sign = gap > 0 ? "+" : "";
    return `${sign}${gap.toFixed(3)}`;
  }

  private recalculateAll() {
    if (!this.driverId) return;

    this.loadDriverStats();

    // 1. Resolve Driver Object
    const p = this.participants.find(
      (curr) =>
        (curr.driver && curr.driver.entity_id === this.driverId) ||
        (curr.team && curr.team.entity_id === this.driverId),
    );
    if (p) {
      this.driver =
        p.team && p.team.entity_id === this.driverId
          ? (p.team as any)
          : (p.driver as any);
    } else {
      // Look through heats to see if driver model is loaded there
      for (const heat of this.heats) {
        const hd = heat.heatDrivers.find(
          (curr) =>
            (curr.participant?.driver &&
              curr.participant.driver.entity_id === this.driverId) ||
            (curr.participant?.team &&
              curr.participant.team.entity_id === this.driverId),
        );
        if (hd && hd.participant) {
          this.driver =
            hd.participant.team &&
            hd.participant.team.entity_id === this.driverId
              ? (hd.participant.team as any)
              : (hd.participant.driver as any);
          break;
        }
      }
    }

    // 2. Recalculate Overall Row
    this.recalculateOverallStandings();

    // 3. Recalculate Heats and Heat Standings
    this.recalculateHeats();

    this.cdr.detectChanges();
  }

  private recalculateOverallStandings() {
    if (!this.participants || this.participants.length === 0) {
      this.overallRow = undefined;
      return;
    }

    const sorted = [...this.participants]
      .filter((p) => p && ((p.driver && !Driver.isEmpty(p.driver)) || p.team))
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return a.rank - b.rank;
        }
        if (b.rankValue !== a.rankValue) {
          return b.rankValue - a.rankValue;
        }
        if (b.totalLaps !== a.totalLaps) {
          return b.totalLaps - a.totalLaps;
        }
        return a.totalTime - b.totalTime;
      });

    if (sorted.length === 0) {
      this.overallRow = undefined;
      return;
    }

    const standings = sorted.map((curr, i) => {
      let gap1st: number | null = curr.gapLeader ?? 0;
      let gapAhead: number | null = curr.gapPosition ?? 0;

      return {
        rank: curr.rank || i + 1,
        driver: (curr.driver || curr.team) as any,
        score: curr.rankValue || 0,
        laps: curr.totalLaps || 0,
        averageLapTime: curr.averageLapTime || 0,
        medianLapTime: curr.medianLapTime || 0,
        bestLapTime: curr.bestLapTime || 0,
        totalTime: curr.totalTime || 0,
        gap1st,
        gapAhead,
        avatarUrl: curr.driver?.avatarUrl || "",
      };
    });

    this.overallRow = standings.find(
      (row) => row.driver && row.driver.entity_id === this.driverId,
    );
  }

  private recalculateHeats() {
    const currentHeat = this.raceService.getCurrentHeat();

    // Merge completed heats with the current (live) heat, deduplicating by objectId
    const heatMap = new Map<string, Heat>();
    if (this.heats) {
      this.heats.forEach((h) => heatMap.set(h.objectId, h));
    }
    if (currentHeat) {
      heatMap.set(currentHeat.objectId, currentHeat);
    }

    const allHeats = Array.from(heatMap.values());

    if (allHeats.length === 0) {
      this.driverHeats = [];
      return;
    }

    // Auto expand the active running heat if it's started and not explicitly collapsed
    if (
      currentHeat &&
      currentHeat.started &&
      !this.collapsedHeatsByUser.has(currentHeat.objectId)
    ) {
      this.expandedHeats.add(currentHeat.objectId);
    }

    const matchedHeats: typeof this.driverHeats = [];

    allHeats.forEach((heat) => {
      if (!heat.heatDrivers) return;

      const heatDriver = heat.heatDrivers.find(
        (hd) =>
          (hd.participant?.driver &&
            hd.participant.driver.entity_id === this.driverId) ||
          (hd.participant?.team &&
            hd.participant.team.entity_id === this.driverId),
      );

      if (!heatDriver) return;

      let rank = heatDriver.rank || 0;
      if (
        !rank &&
        this.raceConnectionService?.driverRankings?.has(heatDriver.objectId)
      ) {
        rank =
          this.raceConnectionService.driverRankings.get(heatDriver.objectId) ||
          0;
      } else if (!rank && heat.standings && heat.standings.length > 0) {
        const idx = heat.standings.indexOf(heatDriver.objectId);
        if (idx !== -1) {
          rank = idx + 1;
        }
      }

      const row: HeatStandingsRow = {
        rank,
        objectId: heatDriver.objectId,
        laps: heatDriver.adjustedLapCount,
        averageLapTime: heatDriver.averageLapTime,
        medianLapTime: heatDriver.medianLapTime,
        bestLapTime: heatDriver.bestLapTime,
        totalTime: heatDriver.totalTime,
        gap1st: heatDriver.gapLeader ?? 0,
        gapAhead: heatDriver.gapPosition ?? 0,
        reactionTime: heatDriver.reactionTime,
      };

      // Resolve Lane Details from track
      let foreground = "#ffffff";
      let background = "#333333";
      let name = this.translationService.translate("DR_LABEL_LANE", {
        lane: heatDriver.laneIndex + 1,
      });

      if (
        this.race?.track?.lanes &&
        this.race.track.lanes[heatDriver.laneIndex]
      ) {
        const lane = this.race.track.lanes[heatDriver.laneIndex];
        foreground = lane.foreground_color || foreground;
        background = lane.background_color || background;
      }

      // Calculate max lap time in this heat for chart scaling
      const laps = heatDriver.lapsWithDetails;
      const maxLapTime =
        laps.length > 0 ? Math.max(...laps.map((l) => l.time)) : 0;

      matchedHeats.push({
        heat,
        heatDriver,
        row,
        laneColor: { foreground, background, name },
        maxLapTime,
      });
    });

    // Sort matching heats by heatNumber ascending
    this.driverHeats = matchedHeats.sort(
      (a, b) => a.heat.heatNumber - b.heat.heatNumber,
    );
  }

  protected isTeam(): boolean {
    const p = this.participants.find(
      (curr) =>
        (curr.driver && curr.driver.entity_id === this.driverId) ||
        (curr.team && curr.team.entity_id === this.driverId),
    );
    if (p && p.team) return true;
    for (const dh of this.driverHeats) {
      if (dh.heatDriver?.participant?.team) return true;
    }
    return false;
  }

  protected getDriverName(driverId: string): string {
    if (!driverId) return "";
    const cached = DriverConverter.get(driverId);
    if (cached) return cached.nickname || cached.name;
    const p = this.participants.find(
      (curr) => curr.driver && curr.driver.entity_id === driverId,
    );
    if (p && p.driver) return p.driver.nickname || p.driver.name;
    for (const heat of this.heats) {
      if (heat.heatDrivers) {
        const hd = heat.heatDrivers.find(
          (d) =>
            (d.driver && d.driver.entity_id === driverId) ||
            (d.actualDriver && d.actualDriver.entity_id === driverId),
        );
        if (hd) {
          if (hd.actualDriver && hd.actualDriver.entity_id === driverId)
            return hd.actualDriver.nickname || hd.actualDriver.name;
          if (hd.driver && hd.driver.entity_id === driverId)
            return hd.driver.nickname || hd.driver.name;
        }
      }
    }
    return "Unknown";
  }

  protected exportPdf() {
    this.defaultIncludeBackground =
      this.settingsService.getSettings().exportPdfBackgrounds ?? true;
    this.showPdfExportDialog = true;
  }

  protected onPdfExportConfirm(options: PdfExportOptions) {
    this.showPdfExportDialog = false;
    this.cdr.detectChanges();
    if (options.saveAsDefault) {
      const settings = this.settingsService.getSettings();
      settings.exportPdfBackgrounds = options.includeBackground;
      this.settingsService.saveSettings(settings);
    }
    const driverName = this.driver
      ? this.driver.nickname || this.driver.name
      : "Driver Results";
    this.printService.print(
      `${driverName} - Driver Results`,
      true,
      undefined,
      options.includeBackground,
    );
  }

  protected onPdfExportCancel() {
    this.showPdfExportDialog = false;
  }

  protected getLanes(): any[] {
    if (this.race?.track?.lanes) {
      return this.race.track.lanes;
    }
    if (this.driverStats?.lane_best_lap_times) {
      return this.driverStats.lane_best_lap_times;
    }
    return [];
  }

  private getLiveEntityIds(): Set<string> {
    const ids = new Set<string>();
    if (this.driverId) ids.add(this.driverId);
    if ((this.driver as any)?.entity_id)
      ids.add((this.driver as any).entity_id);
    if ((this.driver as any)?.id) ids.add((this.driver as any).id);
    if ((this.driver as any)?.objectId) ids.add((this.driver as any).objectId);

    const liveParticipant = this.participants.find(
      (p) =>
        (p.objectId && ids.has(p.objectId)) ||
        (p.driver?.entity_id && ids.has(p.driver.entity_id)) ||
        ((p.driver as any)?.id && ids.has((p.driver as any).id)) ||
        (p.team?.entity_id && ids.has(p.team.entity_id)) ||
        ((p.team as any)?.id && ids.has((p.team as any).id)),
    );

    if (liveParticipant) {
      if (liveParticipant.objectId) ids.add(liveParticipant.objectId);
      if (liveParticipant.driver?.entity_id)
        ids.add(liveParticipant.driver.entity_id);
      if ((liveParticipant.driver as any)?.id)
        ids.add((liveParticipant.driver as any).id);
      if (liveParticipant.team?.entity_id)
        ids.add(liveParticipant.team.entity_id);
      if ((liveParticipant.team as any)?.id)
        ids.add((liveParticipant.team as any).id);
    }

    for (const heat of this.heats) {
      if (heat?.heatDrivers) {
        for (const hd of heat.heatDrivers) {
          const matchesLive =
            (hd.objectId && ids.has(hd.objectId)) ||
            (hd.participant?.objectId && ids.has(hd.participant.objectId)) ||
            (hd.participant?.driver?.entity_id &&
              ids.has(hd.participant.driver.entity_id)) ||
            ((hd.participant?.driver as any)?.id &&
              ids.has((hd.participant.driver as any).id)) ||
            (hd.participant?.team?.entity_id &&
              ids.has(hd.participant.team.entity_id)) ||
            ((hd.participant?.team as any)?.id &&
              ids.has((hd.participant.team as any).id)) ||
            (hd.driver?.entity_id && ids.has(hd.driver.entity_id)) ||
            ((hd.driver as any)?.id && ids.has((hd.driver as any).id)) ||
            (hd.actualDriver?.entity_id &&
              ids.has(hd.actualDriver.entity_id)) ||
            ((hd.actualDriver as any)?.id &&
              ids.has((hd.actualDriver as any).id));
          if (matchesLive) {
            if (hd.objectId) ids.add(hd.objectId);
            if (hd.participant?.objectId) ids.add(hd.participant.objectId);
            if (hd.participant?.driver?.entity_id)
              ids.add(hd.participant.driver.entity_id);
            if ((hd.participant?.driver as any)?.id)
              ids.add((hd.participant.driver as any).id);
            if (hd.participant?.team?.entity_id)
              ids.add(hd.participant.team.entity_id);
            if ((hd.participant?.team as any)?.id)
              ids.add((hd.participant.team as any).id);
            if (hd.driver?.entity_id) ids.add(hd.driver.entity_id);
            if ((hd.driver as any)?.id) ids.add((hd.driver as any).id);
            if (hd.actualDriver?.entity_id) ids.add(hd.actualDriver.entity_id);
            if ((hd.actualDriver as any)?.id)
              ids.add((hd.actualDriver as any).id);
          }
        }
      }
    }

    return ids;
  }

  private isLiveCompetitor(
    competitor?: any,
    hd?: DriverHeatData,
    p?: RaceParticipant,
    liveIds?: Set<string>,
  ): boolean {
    const ids = liveIds || this.getLiveEntityIds();

    if (p) {
      if (p.objectId && ids.has(p.objectId)) return true;
      if (p.driver?.entity_id && ids.has(p.driver.entity_id)) return true;
      if ((p.driver as any)?.id && ids.has((p.driver as any).id)) return true;
      if (p.team?.entity_id && ids.has(p.team.entity_id)) return true;
      if ((p.team as any)?.id && ids.has((p.team as any).id)) return true;
    }

    if (hd) {
      if (hd.objectId && ids.has(hd.objectId)) return true;
      if (hd.participant?.objectId && ids.has(hd.participant.objectId))
        return true;
      if (
        hd.participant?.driver?.entity_id &&
        ids.has(hd.participant.driver.entity_id)
      )
        return true;
      if (
        (hd.participant?.driver as any)?.id &&
        ids.has((hd.participant.driver as any).id)
      )
        return true;
      if (
        hd.participant?.team?.entity_id &&
        ids.has(hd.participant.team.entity_id)
      )
        return true;
      if (
        (hd.participant?.team as any)?.id &&
        ids.has((hd.participant.team as any).id)
      )
        return true;
      if (hd.driver?.entity_id && ids.has(hd.driver.entity_id)) return true;
      if ((hd.driver as any)?.id && ids.has((hd.driver as any).id)) return true;
      if (hd.actualDriver?.entity_id && ids.has(hd.actualDriver.entity_id))
        return true;
      if ((hd.actualDriver as any)?.id && ids.has((hd.actualDriver as any).id))
        return true;
    }

    if (competitor) {
      const entityId =
        (competitor as any)?.entity_id ||
        (competitor as any)?.id ||
        (competitor as any)?.objectId;
      if (entityId && ids.has(entityId)) return true;
    }

    return false;
  }

  private getOverallLiveDriverLapTimes(liveIds: Set<string>): number[] {
    const allLaps: number[] = [];
    for (const heat of this.heats) {
      if (heat?.heatDrivers) {
        const hd = heat.heatDrivers.find((d) =>
          this.isLiveCompetitor(undefined, d, d.participant, liveIds),
        );
        const laps = hd?.lapTimes || (hd as any)?.laps;
        if (laps && Array.isArray(laps)) {
          allLaps.push(...laps);
        }
      }
    }
    return allLaps;
  }

  private addHeatDriverEntityIds(heatDriver: any, ids: Set<string>): void {
    if (!heatDriver) return;
    if (heatDriver.objectId) ids.add(heatDriver.objectId);
    if (heatDriver.participant?.objectId)
      ids.add(heatDriver.participant.objectId);
    if (heatDriver.participant?.team?.entity_id)
      ids.add(heatDriver.participant.team.entity_id);
    if (heatDriver.participant?.team?.id)
      ids.add(heatDriver.participant.team.id);
    if (heatDriver.participant?.driver?.entity_id)
      ids.add(heatDriver.participant.driver.entity_id);
    if (heatDriver.participant?.driver?.id)
      ids.add(heatDriver.participant.driver.id);
    if (heatDriver.driver?.entity_id) ids.add(heatDriver.driver.entity_id);
    if (heatDriver.driver?.id) ids.add(heatDriver.driver.id);
    if (heatDriver.actualDriver?.entity_id)
      ids.add(heatDriver.actualDriver.entity_id);
    if (heatDriver.actualDriver?.id) ids.add(heatDriver.actualDriver.id);
  }

  private isValidCompetitorName(name: string): boolean {
    const trimmed = (name || "").trim().toLowerCase();
    return (
      !!trimmed &&
      trimmed !== "empty" &&
      trimmed !== "empty lane" &&
      trimmed !== "(empty)"
    );
  }

  private sortHeatDrivers(heat: any): any[] {
    if (!heat?.heatDrivers) return [];
    return [...heat.heatDrivers].sort((a, b) => {
      if (heat.standings && heat.standings.length > 0) {
        let idxA = heat.standings.indexOf(a.objectId);
        let idxB = heat.standings.indexOf(b.objectId);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        if (idxA !== idxB) return idxA - idxB;
      }
      if (a.rank && b.rank && a.rank !== b.rank) {
        if (a.rank === 0) return 1;
        if (b.rank === 0) return -1;
        return a.rank - b.rank;
      }
      const lapsA = a.adjustedLapCount ?? a.lapCount ?? 0;
      const lapsB = b.adjustedLapCount ?? b.lapCount ?? 0;
      if (lapsB !== lapsA) return lapsB - lapsA;
      const timeA = a.totalTime ?? 0;
      const timeB = b.totalTime ?? 0;
      return timeA - timeB;
    });
  }

  private buildHeatReferenceOptions(
    heat: any,
    heatDriver: any,
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const refOptions: TrajectoryReferenceOption[] = [];
    const seenCompetitorIds = new Set<string>();
    const sortedHeatDrivers = this.sortHeatDrivers(heat);

    for (const hd of sortedHeatDrivers) {
      if (hd === heatDriver || hd.objectId === heatDriver?.objectId) continue;
      if (this.isLiveCompetitor(undefined, hd, hd.participant, liveIds)) {
        continue;
      }

      const competitor =
        hd.participant?.team ||
        hd.driver ||
        hd.actualDriver ||
        hd.participant?.driver;
      if (!competitor || Driver.isEmpty(competitor)) continue;
      if (this.isLiveCompetitor(competitor, hd, hd.participant, liveIds)) {
        continue;
      }

      const compName = competitor.nickname || competitor.name || "";
      if (!this.isValidCompetitorName(compName)) continue;

      const compId =
        (competitor as any)?.entity_id ||
        (competitor as any)?.id ||
        hd.objectId;
      if (compId && !seenCompetitorIds.has(compId) && !liveIds.has(compId)) {
        seenCompetitorIds.add(compId);
        refOptions.push({
          id: compId,
          name: competitor.nickname || competitor.name || hd.objectId,
          lapTimes: hd.lapTimes || (hd as any)?.laps || [],
        });
      }
    }
    return refOptions;
  }

  openHeatTrajectory(data: any) {
    const currentDriverName =
      this.driver?.nickname || this.driver?.name || "Driver";
    const heat = data.heat;
    const heatDriver = data.heatDriver;
    this.trajectoryDriverAName = currentDriverName;
    this.trajectoryDriverALapTimes =
      heatDriver?.lapTimes || (heatDriver as any)?.laps || [];

    const liveIds = this.getLiveEntityIds();
    this.addHeatDriverEntityIds(heatDriver, liveIds);

    this.trajectoryReferenceOptions = this.buildHeatReferenceOptions(
      heat,
      heatDriver,
      liveIds,
    );
    this.trajectoryInitialReferenceId =
      this.trajectoryReferenceOptions.length > 0
        ? this.trajectoryReferenceOptions[0].id
        : "";
    this.trajectoryBenchmarkLapTime = 0;
    this.showTrajectoryModal = true;
    this.cdr.detectChanges();
  }

  private buildOverallReferenceOptions(
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const refOptions: TrajectoryReferenceOption[] = [];
    const seenCompetitorIds = new Set<string>();

    const sortedParticipants = [...this.participants]
      .filter((p) => p && ((p.driver && !Driver.isEmpty(p.driver)) || p.team))
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          if (a.rank === 0) return 1;
          if (b.rank === 0) return -1;
          return a.rank - b.rank;
        }
        if (b.rankValue !== a.rankValue) return b.rankValue - a.rankValue;
        if (b.totalLaps !== a.totalLaps) return b.totalLaps - a.totalLaps;
        return a.totalTime - b.totalTime;
      });

    for (const p of sortedParticipants) {
      if (this.isLiveCompetitor(undefined, undefined, p, liveIds)) continue;
      const competitor = p.team || p.driver;
      if (!competitor || Driver.isEmpty(competitor)) continue;
      if (this.isLiveCompetitor(competitor, undefined, p, liveIds)) continue;

      const compName = (competitor as any)?.nickname || competitor.name || "";
      if (!this.isValidCompetitorName(compName)) continue;

      const compId =
        (competitor as any)?.entity_id || (competitor as any)?.id || p.objectId;
      if (compId && !seenCompetitorIds.has(compId) && !liveIds.has(compId)) {
        seenCompetitorIds.add(compId);
        refOptions.push({
          id: compId,
          name: (competitor as any)?.nickname || competitor.name || p.objectId,
          lapTimes: this.getOverallDriverLapTimes(compId),
        });
      }
    }

    if (refOptions.length === 0 && this.heats.length > 0) {
      return this.buildOverallReferenceOptionsFromHeats(liveIds);
    }
    return refOptions;
  }

  private buildOverallReferenceOptionsFromHeats(
    liveIds: Set<string>,
  ): TrajectoryReferenceOption[] {
    const competitorMap = new Map<
      string,
      {
        id: string;
        name: string;
        totalLaps: number;
        totalTime: number;
        lapTimes: number[];
      }
    >();

    for (const heat of this.heats) {
      if (!heat?.heatDrivers) continue;
      for (const hd of heat.heatDrivers) {
        if (this.isLiveCompetitor(undefined, hd, hd.participant, liveIds)) {
          continue;
        }
        const competitor =
          hd.participant?.team ||
          hd.driver ||
          hd.actualDriver ||
          hd.participant?.driver;
        if (!competitor || Driver.isEmpty(competitor)) continue;
        if (this.isLiveCompetitor(competitor, hd, hd.participant, liveIds)) {
          continue;
        }

        const compName = (competitor as any)?.nickname || competitor.name || "";
        if (!this.isValidCompetitorName(compName)) continue;

        const compId =
          (competitor as any)?.entity_id ||
          (competitor as any)?.id ||
          hd.objectId;
        if (compId && !liveIds.has(compId)) {
          const hdLaps = hd.lapTimes || (hd as any)?.laps || [];
          if (!competitorMap.has(compId)) {
            competitorMap.set(compId, {
              id: compId,
              name:
                (competitor as any)?.nickname || competitor.name || hd.objectId,
              totalLaps: 0,
              totalTime: 0,
              lapTimes: [],
            });
          }
          const entry = competitorMap.get(compId)!;
          entry.lapTimes.push(...hdLaps);
          entry.totalLaps +=
            hd.adjustedLapCount || hd.lapCount || hdLaps.length;
          entry.totalTime += hd.totalTime || hdLaps.reduce((a, b) => a + b, 0);
        }
      }
    }

    const sortedFromHeats = Array.from(competitorMap.values()).sort((a, b) => {
      if (b.totalLaps !== a.totalLaps) return b.totalLaps - a.totalLaps;
      return a.totalTime - b.totalTime;
    });

    return sortedFromHeats.map((item) => ({
      id: item.id,
      name: item.name,
      lapTimes: item.lapTimes,
    }));
  }

  openOverallTrajectory() {
    const currentDriverName =
      this.driver?.nickname || this.driver?.name || "Driver";
    this.trajectoryDriverAName = currentDriverName;

    const liveIds = this.getLiveEntityIds();
    this.trajectoryDriverALapTimes = this.getOverallLiveDriverLapTimes(liveIds);

    this.trajectoryReferenceOptions =
      this.buildOverallReferenceOptions(liveIds);
    this.trajectoryInitialReferenceId =
      this.trajectoryReferenceOptions.length > 0
        ? this.trajectoryReferenceOptions[0].id
        : "";
    this.trajectoryBenchmarkLapTime = 0;
    this.showTrajectoryModal = true;
    this.cdr.detectChanges();
  }

  private getOverallDriverLapTimes(competitorId: string): number[] {
    const allLaps: number[] = [];
    for (const heat of this.heats) {
      if (heat?.heatDrivers) {
        const hd = heat.heatDrivers.find((d) => {
          if (d.objectId === competitorId) return true;
          if (d.participant?.objectId === competitorId) return true;
          const teamId =
            (d.participant?.team as any)?.entity_id ||
            (d.participant?.team as any)?.id;
          if (teamId && teamId === competitorId) {
            return true;
          }
          const driverId =
            (d.driver as any)?.entity_id ||
            (d.driver as any)?.id ||
            (d.actualDriver as any)?.entity_id ||
            (d.actualDriver as any)?.id ||
            (d.participant?.driver as any)?.entity_id ||
            (d.participant?.driver as any)?.id;
          return driverId === competitorId;
        });
        const laps = hd?.lapTimes || (hd as any)?.laps;
        if (laps && Array.isArray(laps)) {
          allLaps.push(...laps);
        }
      }
    }
    return allLaps;
  }

  closeTrajectoryDialog() {
    this.showTrajectoryModal = false;
    this.cdr.detectChanges();
  }
}
