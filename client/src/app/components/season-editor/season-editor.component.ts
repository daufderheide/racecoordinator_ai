import { DatePipe, DecimalPipe } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, of, Subscription } from "rxjs";
import { catchError } from "rxjs/operators";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import {
  Season,
  SeasonRaceRecord,
  SeasonStandingDetail,
  SeasonStandingItem,
} from "@app/models/season";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import {
  areSeasonsEqual,
  cloneSeason,
  getSeasonEditorHelpSteps,
} from "./season-editor.utils";

@Component({
  standalone: true,
  selector: "app-season-editor",
  templateUrl: "./season-editor.component.html",
  styleUrls: ["./season-editor.component.css"],
  imports: [
    EditorTitleComponent,
    TranslatePipe,
    FormsModule,
    ConfirmationModalComponent,
    DatePipe,
    DecimalPipe,
  ],
})
export class SeasonEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((confirm: boolean) => void) | null = null;
  private isReverting = false;

  editingSeason: Season = {
    name: "",
    drops: 0,
    races: [],
  };

  existingSeasons: Season[] = [];
  standings: SeasonStandingItem[] = [];
  expandedRaceIds: Set<string> = new Set<string>();

  showAddRaceModal = false;
  availableFinishedRaces: SeasonRaceRecord[] = [];
  selectedRaceToAddId = "";

  isLoading = true;
  isSaving = false;
  scale = 1;

  undoManager: UndoManager<Season>;
  private subscriptions: Subscription[] = [];

  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);
  private navigationService = inject(NavigationService);
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);

  constructor() {
    this.undoManager = new UndoManager<Season>(
      {
        clonner: (s) => this.cloneSeason(s),
        equalizer: (a, b) => this.areSeasonsEqual(a, b),
        applier: (s) => {
          const currentId = this.editingSeason?.entity_id;
          this.editingSeason = s;
          if (currentId && this.editingSeason) {
            this.editingSeason.entity_id = currentId;
          }
          this.calculateStandings();
        },
      },
      () => this.editingSeason,
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveSeason();
        }
        this.cdr.markForCheck();
      }),
    );
  }

  get isDirty(): boolean {
    return this.undoManager ? this.undoManager.hasChanges() : false;
  }

  hasChanges(): boolean {
    return this.isDirty;
  }

  confirmDiscard(): Promise<boolean> {
    this.showDiscardConfirm = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    return new Promise((resolve) => {
      this.pendingDeactivate = resolve;
    });
  }

  onConfirmDiscard(): void {
    this.showDiscardConfirm = false;
    this.isNavigationApproved = true;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
  }

  onCancelDiscard(): void {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
    }
  }

  ngOnInit(): void {
    this.updateScale();

    if (this.route.queryParamMap) {
      this.subscriptions.push(
        this.route.queryParamMap.subscribe((paramMap) => {
          if (this.isReverting) {
            this.isReverting = false;
            return;
          }
          const seasonId = paramMap.get("id");
          this.loadData(seasonId);
        }),
      );
    } else {
      const seasonId = this.route.snapshot.queryParams["id"];
      this.loadData(seasonId);
    }
  }

  loadData(seasonId?: string | null): void {
    this.isLoading = true;
    this.isNavigationApproved = false;

    forkJoin([
      this.dataService.getSeasons().pipe(catchError(() => of([]))),
      this.dataService
        .getAllFinishedRaceHistory()
        .pipe(catchError(() => of([]))),
    ]).subscribe({
      next: ([seasons, history]) => {
        this.existingSeasons = seasons || [];
        const demoHistorySet = new Set<string>();

        if (Array.isArray(history)) {
          for (const item of history) {
            const isDemo = Boolean(
              item.is_demo ||
              item.isDemo ||
              item.demo ||
              item.isDemoMode ||
              (item.model && (item.model.demoMode || item.model.isDemoMode)),
            );
            if (isDemo) {
              const raceId =
                item.original_entity_id || item.model?.entity_id || item._id;
              const timestamp =
                item.statistics?.startMillis ||
                item.timestamp ||
                (item.id?.timestamp ? item.id.timestamp * 1000 : 0);
              if (raceId) demoHistorySet.add(String(raceId));
              if (timestamp) demoHistorySet.add(String(timestamp));
              if (raceId && timestamp)
                demoHistorySet.add(`${raceId}_${timestamp}`);
            }
          }
        }

        if (seasonId && seasonId !== "new") {
          const target = seasons.find((s) => s.entity_id === seasonId);
          if (target) {
            this.editingSeason = this.cloneSeason(target);
            if (target.entity_id) {
              this.navigationService.setLastEditedId(
                "season",
                target.entity_id,
              );
            }
          } else {
            this.editingSeason = {
              name: this.generateUniqueName("New Season"),
              drops: 0,
              races: [],
            };
          }
        } else {
          this.editingSeason = {
            name: this.generateUniqueName("New Season"),
            drops: 0,
            races: [],
          };
        }

        const tagSeasonRaces = (s: Season) => {
          if (!s || !s.races) return;
          for (const r of s.races) {
            const raceId = r.race_id;
            const timestamp = r.timestamp;
            const isDemo = Boolean(
              r.is_demo ||
              demoHistorySet.has(String(raceId)) ||
              demoHistorySet.has(String(timestamp)) ||
              demoHistorySet.has(`${raceId}_${timestamp}`) ||
              String(raceId).startsWith("demo_"),
            );
            r.is_demo = isDemo;
          }
        };

        tagSeasonRaces(this.editingSeason);
        this.existingSeasons.forEach((s) => tagSeasonRaces(s));

        this.calculateStandings();
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons in editor", err);
        this.editingSeason = {
          name: this.generateUniqueName("New Season"),
          drops: 0,
          races: [],
        };
        this.calculateStandings();
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get hasDemoRaces(): boolean {
    if (!this.editingSeason || !this.editingSeason.races) return false;
    return this.editingSeason.races.some((r) => Boolean(r.is_demo));
  }

  get selectedRaceToAddIsDemo(): boolean {
    if (!this.selectedRaceToAddId) return false;
    const found = this.availableFinishedRaces.find(
      (r) =>
        `${r.race_id}_${r.timestamp}` === this.selectedRaceToAddId ||
        r.race_id === this.selectedRaceToAddId,
    );
    return Boolean(found?.is_demo);
  }

  calculateStandings(): void {
    const season = this.editingSeason;
    if (!season || !season.races || season.races.length === 0) {
      this.standings = [];
      return;
    }

    // Sort races by date run (oldest to most recent)
    season.races.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const driverMap = new Map<
      string,
      { driver_name: string; scores: SeasonStandingDetail[] }
    >();

    for (const race of season.races) {
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
          heat_points: res.heat_points || 0,
          heat_bonus_points: res.heat_bonus_points || 0,
          total_points: res.total_points,
          is_dropped: false,
        });
      }
    }

    const result: SeasonStandingItem[] = [];

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

      result.push({
        driver_id: driverId,
        driver_name: entry.driver_name,
        net_points: net,
        gross_points: gross,
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

  removeRaceFromSeason(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.editingSeason.races) return;
    this.editingSeason.races.splice(index, 1);
    this.calculateStandings();
    this.captureState();
  }

  openAddRaceModal(): void {
    this.selectedRaceToAddId = "";
    const availableMap = new Map<string, SeasonRaceRecord>();
    const existingRaces = this.editingSeason?.races || [];

    const isAlreadyInSeason = (candidate: SeasonRaceRecord): boolean => {
      if (!existingRaces || existingRaces.length === 0) return false;
      const candTs = Number(candidate.timestamp) || 0;
      const candId = String(candidate.race_id || "").trim();
      const candName = (candidate.race_name || "").trim().toLowerCase();

      return existingRaces.some((r) => {
        const rTs = Number(r.timestamp) || 0;
        const rId = String(r.race_id || "").trim();
        const rName = (r.race_name || "").trim().toLowerCase();

        if (candTs > 0 && rTs > 0) {
          return candTs === rTs;
        }
        if (rId && candId && rId === candId) {
          return true;
        }
        if (rName && candName && rName === candName) {
          return true;
        }
        return false;
      });
    };

    const getRaceKey = (r: SeasonRaceRecord): string => {
      const ts = Number(r.timestamp) || 0;
      if (ts > 0) {
        return `ts_${ts}`;
      }
      return `id_${r.race_id || ""}`;
    };

    for (const season of this.existingSeasons) {
      if (!season.races) continue;
      for (const raceRec of season.races) {
        if (raceRec && (raceRec.race_id || raceRec.timestamp)) {
          if (!isAlreadyInSeason(raceRec)) {
            const key = getRaceKey(raceRec);
            if (!availableMap.has(key)) {
              availableMap.set(key, { ...raceRec });
            }
          }
        }
      }
    }

    this.dataService.getAllFinishedRaceHistory().subscribe({
      next: (history) => {
        if (Array.isArray(history)) {
          for (const item of history) {
            const rec = this.buildRaceRecordFromHistory(item);
            // Races that are part of an event should not be shown in the list
            if ((rec as any).is_event_race) {
              continue;
            }
            if (!isAlreadyInSeason(rec)) {
              const key = getRaceKey(rec);
              if (availableMap.has(key)) {
                if (!rec.is_demo) {
                  availableMap.get(key)!.is_demo = false;
                }
              } else {
                availableMap.set(key, rec);
              }
            }
          }
        }
        this.finalizeAvailableRaces(availableMap);
      },
      error: () => {
        this.finalizeAvailableRaces(availableMap);
      },
    });
  }

  private buildRaceRecordFromHistory(
    item: any,
  ): SeasonRaceRecord & { is_event_race?: boolean } {
    const raceId =
      item.original_entity_id ||
      item.model?.entity_id ||
      item.event_id ||
      item.eventId ||
      item._id ||
      "hist_race";
    const timestamp =
      item.statistics?.startMillis ||
      (item.statistics?.startTime
        ? new Date(item.statistics.startTime).getTime()
        : 0) ||
      item.timestamp ||
      (item.id?.timestamp ? item.id.timestamp * 1000 : Date.now());
    const isDemo = Boolean(
      item.is_demo ||
      item.isDemo ||
      item.demo ||
      item.isDemoMode ||
      (item.model && (item.model.demoMode || item.model.isDemoMode)) ||
      String(raceId).startsWith("demo_"),
    );

    const isEventSummary = Boolean(
      item.is_event_summary ||
      item.isEventSummary ||
      item.is_event ||
      item.isEvent ||
      String(raceId).startsWith("event_") ||
      (item.original_entity_id &&
        String(item.original_entity_id).startsWith("event_")),
    );

    const isEventRace = Boolean(
      (item.is_event_race ||
        item.isEventRace ||
        item.event_id ||
        item.eventId) &&
      !isEventSummary,
    );

    return {
      race_id: raceId,
      race_name:
        item.model?.name ||
        item.event_name ||
        item.eventName ||
        (isEventSummary ? "Completed Event" : "Completed Race"),
      timestamp: timestamp,
      is_demo: isDemo,
      is_event: isEventSummary,
      is_event_race: isEventRace,
      driver_results: this.extractDriverResultsFromHistory(item),
    };
  }

  private calculateDriverHeatPointsMap(
    heats: any[],
    heatPosPointsList: number[],
  ): Map<string, number> {
    const driverHeatPointsMap = new Map<string, number>();
    if (!heats || !Array.isArray(heats) || heatPosPointsList.length === 0) {
      return driverHeatPointsMap;
    }
    heats.forEach((heat: any) => {
      if (heat && heat.drivers && Array.isArray(heat.drivers)) {
        const heatDrivers = [...heat.drivers].sort((a: any, b: any) => {
          const aLaps = a.laps ? a.laps.length : 0;
          const bLaps = b.laps ? b.laps.length : 0;
          if (aLaps !== bLaps) return bLaps - aLaps;
          return (a.totalTime || 0) - (b.totalTime || 0);
        });
        heatDrivers.forEach((hd: any, laneIdx: number) => {
          const dId =
            hd.driverId ||
            hd.driver_id ||
            (hd.driver ? hd.driver.entity_id || hd.driver.entityId : "");
          if (dId && laneIdx < heatPosPointsList.length) {
            const pts = Number(heatPosPointsList[laneIdx]) || 0;
            driverHeatPointsMap.set(
              dId,
              (driverHeatPointsMap.get(dId) || 0) + pts,
            );
          }
        });
      }
    });
    return driverHeatPointsMap;
  }

  private extractDriverResultsFromHistory(item: any): any[] {
    const driverResults: any[] = [];
    const existingResults = item.driver_results || item.driverResults;
    if (
      existingResults &&
      Array.isArray(existingResults) &&
      existingResults.length > 0
    ) {
      existingResults.forEach((r: any) => {
        driverResults.push({
          driver_id: r.driver_id || r.driverId || "",
          driver_name: r.driver_name || r.driverName || "",
          overall_rank:
            r.overall_rank !== undefined ? r.overall_rank : r.overallRank || 1,
          overall_points:
            r.overall_points !== undefined
              ? r.overall_points
              : r.overallPoints || 0,
          overall_bonus_points:
            r.overall_bonus_points !== undefined
              ? r.overall_bonus_points
              : r.overallBonusPoints || 0,
          heat_points:
            r.heat_points !== undefined ? r.heat_points : r.heatPoints || 0,
          heat_bonus_points:
            r.heat_bonus_points !== undefined
              ? r.heat_bonus_points
              : r.heatBonusPoints || 0,
          total_points:
            r.total_points !== undefined ? r.total_points : r.totalPoints || 0,
        });
      });
      return driverResults;
    }

    if (item.drivers && Array.isArray(item.drivers)) {
      const seasonScoring =
        item.model?.season_scoring || item.model?.seasonScoring || {};
      const posPointsList: number[] = seasonScoring.position_points ||
        seasonScoring.positionPoints || [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
      const heatPosPointsList: number[] =
        seasonScoring.heat_position_points ||
        seasonScoring.heatPositionPoints ||
        [];

      const driverHeatPointsMap = this.calculateDriverHeatPointsMap(
        item.heats,
        heatPosPointsList,
      );

      item.drivers.forEach((d: any, idx: number) => {
        const driverName =
          d.actualDriver?.name ||
          d.driver?.name ||
          d.driver_name ||
          d.name ||
          `Driver ${idx + 1}`;
        const driverId =
          d.actualDriver?.entity_id ||
          d.driver?.entity_id ||
          d.driver_id ||
          `d_${idx}`;
        const overallRank = d.driver?.rank || d.rank || idx + 1;
        const rankIdx = overallRank - 1;
        const overallPts =
          rankIdx >= 0 && rankIdx < posPointsList.length
            ? Number(posPointsList[rankIdx]) || 0
            : 0;
        const heatPts = driverHeatPointsMap.get(driverId) || 0;
        const totalPts = overallPts + heatPts;

        driverResults.push({
          driver_id: driverId,
          driver_name: driverName,
          overall_rank: overallRank,
          overall_points: overallPts,
          heat_points: heatPts,
          total_points: totalPts,
        });
      });
    }

    return driverResults;
  }

  private finalizeAvailableRaces(
    availableMap: Map<string, SeasonRaceRecord>,
  ): void {
    this.availableFinishedRaces = Array.from(availableMap.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );
    this.showAddRaceModal = true;
    this.cdr.detectChanges();
  }

  closeAddRaceModal(): void {
    this.showAddRaceModal = false;
    this.selectedRaceToAddId = "";
  }

  addRaceToSeason(targetRace?: SeasonRaceRecord): void {
    const target =
      targetRace ||
      this.availableFinishedRaces.find(
        (r) =>
          `${r.race_id}_${r.timestamp}` === this.selectedRaceToAddId ||
          r.race_id === this.selectedRaceToAddId,
      );
    if (target) {
      if (!this.editingSeason.races) {
        this.editingSeason.races = [];
      }
      const newRec = JSON.parse(JSON.stringify(target));
      if (newRec.is_demo === undefined || newRec.is_demo === null) {
        newRec.is_demo = target.is_demo !== undefined ? target.is_demo : true;
      }
      this.editingSeason.races.push(newRec);
      this.calculateStandings();
      this.captureState();
    }
    this.closeAddRaceModal();
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    let counter = forceSuffix ? 1 : 0;
    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
      const exists = this.existingSeasons.some(
        (s) =>
          (s.name || "").trim().toLowerCase() ===
          candidate.trim().toLowerCase(),
      );
      if (!exists && candidate.trim() !== "") {
        return candidate;
      }
      counter++;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateScale();
  }

  private updateScale(): void {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  onInputChange(): void {
    this.calculateStandings();
    this.captureState();
  }

  captureState(): void {
    this.undoManager.captureState();
    this.cdr.markForCheck();
  }

  get isNameDuplicate(): boolean {
    if (!this.editingSeason || !this.editingSeason.name) return false;
    const currentName = this.editingSeason.name.trim().toLowerCase();
    return this.existingSeasons.some(
      (s) =>
        s.name.trim().toLowerCase() === currentName &&
        s.entity_id !== this.editingSeason.entity_id,
    );
  }

  get isFormValid(): boolean {
    if (
      !this.editingSeason ||
      !this.editingSeason.name ||
      this.editingSeason.name.trim() === ""
    ) {
      return false;
    }
    if (this.isNameDuplicate) {
      return false;
    }
    if (
      this.editingSeason.drops === undefined ||
      this.editingSeason.drops < 0
    ) {
      return false;
    }
    return true;
  }

  autoSaveSeason(): void {
    if (!this.isFormValid || this.isSaving) return;
    this.isSaving = true;

    const payload: Season = {
      ...this.editingSeason,
      name: this.editingSeason.name.trim(),
      drops: Number(this.editingSeason.drops) || 0,
    };

    const request = payload.entity_id
      ? this.dataService.updateSeason(payload.entity_id, payload)
      : this.dataService.createSeason(payload);

    request.subscribe({
      next: (savedSeason) => {
        if (savedSeason) {
          const isNew = !payload.entity_id;
          this.editingSeason = this.cloneSeason(savedSeason);
          this.undoManager.resetTracking(this.editingSeason);
          if (savedSeason.entity_id) {
            this.navigationService.setLastEditedId(
              "season",
              savedSeason.entity_id,
            );
          }
          const idx = this.existingSeasons.findIndex(
            (s) => s.entity_id === savedSeason.entity_id,
          );
          if (idx !== -1) {
            this.existingSeasons[idx] = savedSeason;
          } else {
            this.existingSeasons.push(savedSeason);
          }

          if (isNew && savedSeason.entity_id) {
            this.isReverting = true;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: savedSeason.entity_id },
              queryParamsHandling: "merge",
              replaceUrl: true,
            });
          }
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to auto-save season", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSave(): void {
    if (!this.isFormValid || this.isSaving) return;

    this.isSaving = true;
    const payload: Season = {
      ...this.editingSeason,
      name: this.editingSeason.name.trim(),
      drops: Number(this.editingSeason.drops) || 0,
    };

    const request = payload.entity_id
      ? this.dataService.updateSeason(payload.entity_id, payload)
      : this.dataService.createSeason(payload);

    request.subscribe({
      next: (savedSeason) => {
        this.isSaving = false;
        const targetId = savedSeason.entity_id || payload.entity_id;
        if (targetId) {
          this.navigationService.setLastEditedId("season", targetId);
        }
        this.undoManager.initialize(this.cloneSeason(this.editingSeason));
        this.isNavigationApproved = true;
        this.router.navigate(["/season-manager"], {
          queryParams: targetId ? { id: targetId } : {},
        });
      },
      error: (err) => {
        this.logger.error("Failed to save season", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveAsNew(): void {
    if (!this.isFormValid || this.isSaving) return;

    this.isSaving = true;
    const uniqueName = this.generateUniqueName(this.editingSeason.name, true);
    const newCopy: Season = {
      ...this.cloneSeason(this.editingSeason),
      entity_id: undefined,
      name: uniqueName,
    };

    this.dataService.createSeason(newCopy).subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.editingSeason = this.cloneSeason(saved);
        if (saved) {
          const tagSeasonRaces = (s: Season) => {
            if (!s || !s.races) return;
            for (const r of s.races) {
              r.is_demo = true;
            }
          };
          tagSeasonRaces(saved);
          this.existingSeasons.push(saved);
        }
        this.calculateStandings();
        this.undoManager.resetTracking(this.editingSeason);
        if (saved?.entity_id) {
          this.navigationService.setLastEditedId("season", saved.entity_id);
        }
        this.isReverting = true;
        this.router.navigate([], {
          queryParams: { id: saved?.entity_id },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to duplicate season", err);
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    if (this.editingSeason && this.editingSeason.entity_id) {
      this.navigationService.setLastEditedId(
        "season",
        this.editingSeason.entity_id,
      );
    }
    this.isNavigationApproved = true;
    this.router.navigate(["/season-manager"], {
      queryParams: this.editingSeason?.entity_id
        ? { id: this.editingSeason.entity_id }
        : {},
    });
  }

  onUndo(): void {
    this.undoManager.undo();
  }

  onRedo(): void {
    this.undoManager.redo();
  }

  private cloneSeason(season: Season): Season {
    return cloneSeason(season);
  }

  private areSeasonsEqual(a: Season, b: Season): boolean {
    return areSeasonsEqual(a, b);
  }

  getHelpSteps(): GuideStep[] {
    return getSeasonEditorHelpSteps(this.hasDemoRaces, this.translationService);
  }
}
