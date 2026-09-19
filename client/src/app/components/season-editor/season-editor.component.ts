import { DecimalPipe } from "@angular/common";
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
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import {
  Season,
  SeasonRaceRecord,
  SeasonStandingItem,
} from "@app/models/season";
import { LocalDatePipe } from "@app/pipes/local-date.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { isEntityNameUnique, mapToSelectItems } from "@app/utils/editor-utils";

import {
  areSeasonsEqual,
  buildRaceRecordFromHistory,
  calculateDriverHeatPointsMap,
  calculateSeasonStandings,
  cloneSeason,
  extractDemoHistorySet,
  getDroppedPoints,
  getSeasonEditorHelpSteps,
  tagSeasonRaces,
} from "./season-editor.utils";

@Component({
  standalone: true,
  selector: "app-season-editor",
  templateUrl: "./season-editor.component.html",
  styleUrls: ["./season-editor.component.css"],
  imports: [
    AutoSelectDefaultDirective,
    EditorTitleComponent,
    TranslatePipe,
    LocalDatePipe,
    FormsModule,
    ConfirmationModalComponent,
    DecimalPipe,
  ],
})
export class SeasonEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  lifecycle!: EditorLifecycleHelper;

  get showDiscardConfirm(): boolean {
    return this.lifecycle.showDiscardConfirm;
  }
  set showDiscardConfirm(val: boolean) {
    this.lifecycle.showDiscardConfirm = val;
  }

  get isNavigationApproved(): boolean {
    return this.lifecycle.isNavigationApproved;
  }
  set isNavigationApproved(val: boolean) {
    this.lifecycle.isNavigationApproved = val;
  }

  get pendingDeactivate(): ((value: boolean) => void) | null {
    return this.lifecycle.pendingDeactivate;
  }
  set pendingDeactivate(val: ((value: boolean) => void) | null) {
    this.lifecycle.pendingDeactivate = val;
  }
  private isReverting = false;

  isEditMode = false;
  private isPreservingEditModeOnNavigation = false;
  private transitionToReadOnlyOnSave = false;
  seasonSelectItems: { id: string; name: string }[] = [];
  selectedSeasonId = "";
  originalSeason?: Season;

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
  defaultSeasonName = "";

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById("season-name") as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

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

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
    });
  }

  get isDirty(): boolean {
    return this.undoManager ? this.undoManager.hasChanges() : false;
  }

  isDirtyState(): boolean {
    return this.isDirty;
  }

  hasChanges(): boolean {
    return this.isDirty;
  }

  getUnsavedReasons(): string[] {
    const reasons: string[] = [];
    if (!this.editingSeason) return reasons;

    const nameTrimmed = this.editingSeason.name?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_SEASON_NAME_EMPTY");
    } else if (this.isNameDuplicate) {
      reasons.push("DISCARD_REASON_SEASON_NAME_DUPLICATE");
    }

    if (
      this.editingSeason.drops === undefined ||
      this.editingSeason.drops < 0
    ) {
      reasons.push("DISCARD_REASON_SEASON_DROPS_INVALID");
    }

    if (this.isSaving) {
      reasons.push("DISCARD_REASON_SAVING");
    } else if (reasons.length === 0 && this.isDirty) {
      reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
    }

    return reasons;
  }

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard(): void {
    this.lifecycle.onConfirmDiscard();
  }

  onCancelDiscard(): void {
    this.lifecycle.onCancelDiscard();
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

  updateSeasonSelectItems(): void {
    this.seasonSelectItems = mapToSelectItems(this.existingSeasons);
  }

  selectSeason(season: Season): void {
    this.editingSeason = this.cloneSeason(season);
    this.originalSeason = this.cloneSeason(season);
    this.selectedSeasonId = season.entity_id || "";
    if (season.entity_id) {
      this.navigationService.setLastEditedId("season", season.entity_id);
    }
    this.calculateStandings();
    this.undoManager.initialize(this.editingSeason);
  }

  onSelectSeasonById(id: string): void {
    if (this.isEditMode) return;
    if (this.selectedSeasonId === id) return;
    const found = this.existingSeasons.find((s) => s.entity_id === id);
    if (found) {
      this.selectSeason(found);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: found.entity_id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
  }

  loadData(seasonIdParam?: string | null): void {
    this.isLoading = true;
    this.isNavigationApproved = false;
    const seasonId =
      seasonIdParam !== undefined
        ? seasonIdParam
        : (this.route.snapshot?.queryParamMap?.get("id") ??
          this.route.snapshot?.queryParams?.["id"]);

    forkJoin([
      this.dataService.getSeasons().pipe(catchError(() => of([]))),
      this.dataService
        .getAllFinishedRaceHistory()
        .pipe(catchError(() => of([]))),
    ]).subscribe({
      next: ([seasons, history]) => {
        this.existingSeasons = seasons || [];
        const demoHistorySet = extractDemoHistorySet(history);
        this.existingSeasons.forEach((s) => tagSeasonRaces(s, demoHistorySet));
        this.updateSeasonSelectItems();

        if (seasonId === "new") {
          this.startNewSeason();
        } else if (seasonId) {
          const found = this.existingSeasons.find(
            (s) => s.entity_id === seasonId,
          );
          if (found) {
            this.selectSeason(found);
            this.isEditMode = false;
          } else if (this.existingSeasons.length > 0) {
            this.selectSeason(this.existingSeasons[0]);
            this.isEditMode = false;
          } else {
            this.startNewSeason();
          }
        } else {
          const lastEdited = this.navigationService.getLastEditedId("season");
          const found = lastEdited
            ? this.existingSeasons.find((s) => s.entity_id === lastEdited)
            : undefined;
          if (found) {
            this.selectSeason(found);
            this.isEditMode = false;
          } else if (this.existingSeasons.length > 0) {
            this.selectSeason(this.existingSeasons[0]);
            this.isEditMode = false;
          } else {
            this.startNewSeason();
          }
        }

        const isNew =
          this.route.snapshot?.queryParamMap?.get("isNew") === "true" ||
          this.route.snapshot?.queryParams?.["isNew"] === "true";
        if (
          this.isPreservingEditModeOnNavigation ||
          (isNew && this.editingSeason)
        ) {
          this.isPreservingEditModeOnNavigation = false;
          this.isEditMode = true;
          this.defaultSeasonName = this.editingSeason.name;
          this.focusNameInput();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load seasons in editor", err);
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
    this.standings = calculateSeasonStandings(this.editingSeason);
  }

  getDroppedPoints(item: SeasonStandingItem): number {
    return getDroppedPoints(item);
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

    this.subscriptions.push(
      this.dataService.getAllFinishedRaceHistory().subscribe({
        next: (history) => {
          if (Array.isArray(history)) {
            for (const item of history) {
              const rec = buildRaceRecordFromHistory(item);
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
      }),
    );
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

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isEditMode) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.onRedo();
      } else {
        this.onUndo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      this.onRedo();
    }
  }

  private updateScale(): void {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);
  }

  onInputFocus(): void {
    this.undoManager.onInputFocus();
  }

  onInputBlur(): void {
    this.undoManager.onInputBlur();
    this.cdr.markForCheck();
  }

  onInputChange(): void {
    this.calculateStandings();
    this.undoManager.onInputChange();
  }

  captureState(): void {
    this.undoManager.captureState();
    this.cdr.markForCheck();
  }

  get isNameDuplicate(): boolean {
    if (!this.editingSeason?.name?.trim()) return false;
    return !isEntityNameUnique(
      this.editingSeason.name,
      this.editingSeason.entity_id,
      this.existingSeasons,
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

  onToggleEditMode(): void {
    if (!this.isEditMode) {
      this.isEditMode = true;
      this.focusNameInput();
      return;
    }

    if (this.isSaving) {
      this.transitionToReadOnlyOnSave = true;
      return;
    }

    if (this.isDirty) {
      if (!this.isFormValid) {
        if (this.isNameDuplicate) {
          alert(this.translationService.translate("SE_NAME_EXISTS"));
        } else if (!this.editingSeason.name?.trim()) {
          alert(this.translationService.translate("SE_NAME_REQUIRED"));
        } else {
          alert(this.translationService.translate("SE_DROPS_INVALID"));
        }
        return;
      }
      this.autoSaveSeason();
      this.isEditMode = false;
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewSeason(): void {
    if (this.isEditMode && this.isDirty) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewSeason();
        }
      });
    } else {
      this.startNewSeason();
    }
  }

  startNewSeason(): void {
    this.isSaving = true;
    const defaultName =
      this.translationService.translate("SM_DEFAULT_SEASON_NAME") ||
      "New Season";
    const uniqueName = this.generateUniqueName(defaultName, false);
    const newSeason: Season = {
      name: uniqueName,
      drops: 0,
      races: [],
    };

    this.subscriptions.push(
      this.dataService.createSeason(newSeason).subscribe({
        next: (saved) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          if (saved?.entity_id) {
            this.navigationService.setLastEditedId("season", saved.entity_id);
          }
          this.existingSeasons.push(saved);
          this.updateSeasonSelectItems();
          this.selectSeason(saved);
          this.defaultSeasonName = saved.name;
          this.cdr.detectChanges();
          this.focusNameInput();
          this.router.navigate([], {
            queryParams: { id: saved.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.logger.error("Failed to create season", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  saveAsNew(): void {
    if (!this.editingSeason || !this.isFormValid || this.isSaving) return;
    this.isSaving = true;

    const uniqueName = this.generateUniqueName(this.editingSeason.name, true);
    const newCopy: Season = {
      ...this.cloneSeason(this.editingSeason),
      entity_id: undefined,
      name: uniqueName,
    };

    this.subscriptions.push(
      this.dataService.createSeason(newCopy).subscribe({
        next: (saved) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          if (saved?.entity_id) {
            this.navigationService.setLastEditedId("season", saved.entity_id);
          }
          this.existingSeasons.push(saved);
          this.updateSeasonSelectItems();
          this.selectSeason(saved);
          this.defaultSeasonName = saved.name;
          this.cdr.detectChanges();
          this.focusNameInput();
          this.router.navigate([], {
            queryParams: { id: saved?.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.logger.error("Failed to copy season", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  onDeleteSeason(): void {
    if (!this.editingSeason?.entity_id) return;
    if (confirm(this.translationService.translate("SE_CONFIRM_DELETE"))) {
      this.isSaving = true;
      const idToDelete = this.editingSeason.entity_id;
      this.subscriptions.push(
        this.dataService.deleteSeason(idToDelete).subscribe({
          next: () => {
            this.isSaving = false;
            this.isEditMode = false;
            this.existingSeasons = this.existingSeasons.filter(
              (s) => s.entity_id !== idToDelete,
            );
            this.updateSeasonSelectItems();
            if (this.existingSeasons.length > 0) {
              this.selectSeason(this.existingSeasons[0]);
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { id: this.existingSeasons[0].entity_id },
                queryParamsHandling: "merge",
                replaceUrl: true,
              });
            } else {
              this.startNewSeason();
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.logger.error("Failed to delete season", err);
            this.isSaving = false;
            this.cdr.detectChanges();
          },
        }),
      );
    }
  }

  autoSaveSeason(): void {
    if (!this.isFormValid || this.isSaving) return;
    this.isSaving = true;

    const payload: Season = {
      ...this.editingSeason,
      name: this.editingSeason.name,
      drops: Number(this.editingSeason.drops) || 0,
    };

    const op = payload.entity_id
      ? this.dataService.updateSeason(payload.entity_id, payload)
      : this.dataService.createSeason(payload);

    this.subscriptions.push(
      op.subscribe({
        next: (savedSeason) => {
          if (savedSeason) {
            const isNew = !payload.entity_id;
            if (savedSeason.entity_id) {
              this.editingSeason.entity_id = savedSeason.entity_id;
              this.navigationService.setLastEditedId(
                "season",
                savedSeason.entity_id,
              );
            }
            this.undoManager.resetTracking(this.editingSeason);
            const idx = this.existingSeasons.findIndex(
              (s) => s.entity_id === savedSeason.entity_id,
            );
            if (idx !== -1) {
              this.existingSeasons[idx] = savedSeason;
            } else {
              this.existingSeasons.push(savedSeason);
            }
            this.updateSeasonSelectItems();

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
          if (this.transitionToReadOnlyOnSave) {
            this.isEditMode = false;
            this.transitionToReadOnlyOnSave = false;
          }
          this.isSaving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to auto-save season", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  onSave(): void {
    if (!this.isFormValid || this.isSaving) return;
    this.autoSaveSeason();
    if (this.editingSeason?.entity_id) {
      this.navigationService.setLastEditedId(
        "season",
        this.editingSeason.entity_id,
      );
    }
    this.isNavigationApproved = true;
    const from =
      this.route.snapshot?.queryParamMap?.get("from") ??
      this.route.snapshot?.queryParams?.["from"];
    const returnUrl =
      this.route.snapshot?.queryParamMap?.get("returnUrl") ??
      this.route.snapshot?.queryParams?.["returnUrl"];
    if (from === "raceday-setup" || returnUrl === "/raceday-setup") {
      sessionStorage.setItem("skipIntro", "true");
      this.router.navigate(["/raceday-setup"], {
        queryParams: { skipIntro: "true" },
      });
      return;
    }
  }

  cancel(): void {
    if (this.editingSeason?.entity_id) {
      this.navigationService.setLastEditedId(
        "season",
        this.editingSeason.entity_id,
      );
    }
    this.isNavigationApproved = true;
    sessionStorage.setItem("skipIntro", "true");
    const from =
      this.route.snapshot?.queryParamMap?.get("from") ??
      this.route.snapshot?.queryParams?.["from"];
    const returnUrl =
      this.route.snapshot?.queryParamMap?.get("returnUrl") ??
      this.route.snapshot?.queryParams?.["returnUrl"];
    if (from === "raceday-setup" || returnUrl === "/raceday-setup") {
      this.router.navigate(["/raceday-setup"], {
        queryParams: { skipIntro: "true" },
      });
      return;
    }
    this.router.navigate(["/raceday-setup"], {
      queryParams: { skipIntro: "true" },
    });
  }

  onCancel(): void {
    this.cancel();
  }

  onBack(): void {
    this.onCancel();
  }

  onUndo(): void {
    if (!this.isEditMode) return;
    this.undoManager.undo();
  }

  onRedo(): void {
    if (!this.isEditMode) return;
    this.undoManager.redo();
  }

  private cloneSeason(season: Season): Season {
    return cloneSeason(season);
  }

  private areSeasonsEqual(a: Season, b: Season): boolean {
    return areSeasonsEqual(a, b);
  }

  private buildRaceRecordFromHistory(
    item: any,
  ): SeasonRaceRecord & { is_event_race?: boolean } {
    return buildRaceRecordFromHistory(item);
  }

  private calculateDriverHeatPointsMap(
    heats: any[],
    heatPosPointsList: number[],
  ): Map<string, number> {
    return calculateDriverHeatPointsMap(heats, heatPosPointsList);
  }

  getHelpSteps(): GuideStep[] {
    return getSeasonEditorHelpSteps(this.hasDemoRaces, this.translationService);
  }
}
