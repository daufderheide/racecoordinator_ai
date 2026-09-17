/* eslint-disable max-lines */
import { Location } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import {
  EditorTab,
  EditorTabsComponent,
} from "@app/components/shared/editor-tabs/editor-tabs.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { HeatListComponent } from "@app/components/shared/heat-list/heat-list.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { getThemeDisplayNameKey } from "@app/components/ui-editor/ui-editor-crud.helper";
import { sortThemesForDisplay } from "@app/components/ui-editor/ui-editor-theme.helper";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import {
  FuelCurvePoint,
  FuelUsageType,
  OutOfFuelAction,
} from "@app/models/fuel_options";
import { Role } from "@app/models/role";
import { Theme } from "@app/models/theme";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";
import { formatUnsavedChangesMessage } from "@app/utils/unsaved-changes.helper";

import {
  calculateAnalogPitHover,
  calculateAnalogUsageHover,
  calculateDigitalPitHover,
  calculateDigitalUsageHover,
  computeAnalogPitPlots,
  computeAnalogUsagePlots,
  computeDigitalPitPlots,
  computeDigitalUsagePlots,
  FuelGraphHoverPoint,
  FuelGraphPlot,
  getAnalogFuelUsage,
  getDigitalFuelUsage,
  interpolateFuelCurveClient,
  isCustomCurveType,
} from "./fuel-graph.helper";

@Component({
  standalone: true,
  selector: "app-race-editor",
  templateUrl: "./race-editor.component.html",
  styleUrls: ["./race-editor.component.css"],
  imports: [
    AcknowledgementModalComponent,
    AutoSelectDefaultDirective,
    EditorTabsComponent,
    EditorTitleComponent,
    FormsModule,
    HeatListComponent,
    TranslatePipe,
    ConfirmationModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class RaceEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  editingRace: any;
  originalRace: any;
  selectedRace: any;
  selectedRaceId?: string;
  raceSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  private isPreservingEditModeOnNavigation: boolean = false;
  transitionToReadOnlyOnSave: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;
  undoManager: UndoManager<any>;
  tracks: Track[] = [];
  themes: Theme[] = [];
  allRaces: any[] = [];
  get races(): any[] {
    return this.allRaces;
  }
  set races(val: any[]) {
    this.allRaces = val;
  }
  defaultRaceName: string = "";

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById("race-name-input") as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }
  driverCount: number = 4;
  generatedHeats: any[] = [];
  customRotationAssets: any[] = [];
  selectedCustomRotationAssetId: string = "";
  customSequenceText: string = "";
  @ViewChild("seasonPositionPointsList")
  seasonPositionPointsList?: ElementRef<HTMLDivElement>;

  heatRotationTypes = [
    "RoundRobin",
    "Bracket",
    "Swiss",
    "CustomRoundRobin",
    "Custom",
  ];
  raceScoringTypes = ["Points", "Time"];
  outOfFuelActions = [
    OutOfFuelAction.DO_NOT_COUNT_LAPS,
    OutOfFuelAction.END_HEAT,
    OutOfFuelAction.POWER_STUTTER,
  ];
  digitalOutOfFuelActions = [
    OutOfFuelAction.DO_NOT_COUNT_LAPS,
    OutOfFuelAction.END_HEAT,
  ];

  private static readonly EMPTY_LABELS: string[] = [];
  private subscriptions: Subscription[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  // Acknowledgement modal properties
  showAckModal: boolean = false;
  ackModalTitle: string = "";
  ackModalMessage: string = "";

  private authService = inject(AuthService);
  currentRole = toSignal(this.authService.currentRole$, {
    initialValue: this.authService.currentRole,
  });
  isAdmin = computed(() => this.currentRole() === Role.ADMIN);

  showResetConfirmation: boolean = false;
  showResetSuccess: boolean = false;
  resetRaceName: string = "";

  getResetTooltip(): string {
    if (!this.isAdmin()) {
      return this.translationService.translate("RM_RESET_ADMIN_ONLY_TOOLTIP");
    }
    return this.translationService.translate("RM_BTN_RESET_RECORDS");
  }

  onResetRecords(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.isAdmin() || !this.editingRace?.entity_id) {
      return;
    }
    this.showResetConfirmation = true;
  }

  onConfirmReset() {
    this.showResetConfirmation = false;
    if (!this.editingRace?.entity_id) {
      return;
    }
    const raceId = this.editingRace.entity_id;
    this.resetRaceName = this.editingRace.name || "";
    this.dataService.resetRaceRecords(raceId).subscribe({
      next: () => {
        this.showResetSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to reset race records:", err);
        this.cdr.detectChanges();
      },
    });
  }

  onCancelReset() {
    this.showResetConfirmation = false;
  }

  onCloseResetSuccess() {
    this.showResetSuccess = false;
  }

  sectionsExpanded = {
    general: true,
    start_method: true,
    scoring: true,
    season_points: true,
    heats: true,
    fuel_analog: true,
    fuel_digital: true,
    team: true,
    groups: true,
  };

  isConfigValid(): boolean {
    return (
      !this.isNameInvalid &&
      !this.isRotationInvalid &&
      !!this.editingRace?.track_entity_id &&
      !!this.editingRace?.heat_rotation_type
    );
  }

  isDirtyState(): boolean {
    const umChanges = this.undoManager.hasChanges();
    const manualChanges =
      JSON.stringify(this.editingRace) !== JSON.stringify(this.originalRace);
    return umChanges || manualChanges;
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    const reasons: string[] = [];
    if (!this.editingRace) return reasons;

    const nameTrimmed = this.editingRace.name?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_RACE_NAME_EMPTY");
    } else if (this.isNameDuplicate()) {
      reasons.push("DISCARD_REASON_RACE_NAME_DUPLICATE");
    }

    if (!this.editingRace.track_entity_id) {
      reasons.push("DISCARD_REASON_RACE_NO_TRACK");
    }
    if (!this.editingRace.heat_rotation_type) {
      reasons.push("DISCARD_REASON_RACE_NO_ROTATION");
    } else if (this.isRotationInvalid) {
      reasons.push("DISCARD_REASON_RACE_ROTATION_INVALID");
    }

    if (this.isSaving) {
      reasons.push("DISCARD_REASON_SAVING");
    } else if (reasons.length === 0 && this.isDirtyState()) {
      reasons.push("DISCARD_REASON_EXIT_TOO_QUICKLY");
    }

    return reasons;
  }

  get discardMessage(): string {
    return formatUnsavedChangesMessage(
      this.translationService,
      this.getUnsavedReasons(),
    );
  }

  confirmDiscard(): Promise<boolean> {
    this.showDiscardConfirm = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    return new Promise((resolve) => {
      this.pendingDeactivate = resolve;
    });
  }

  onConfirmDiscard() {
    this.showDiscardConfirm = false;
    if (this.originalRace) {
      this.selectRace(this.originalRace);
    } else if (this.allRaces.length > 0) {
      this.selectRace(this.allRaces[0]);
    }
    this.isEditMode = false;
    this.isNavigationApproved = true;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
    this.cdr.detectChanges();
  }

  onCancelDiscard() {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
    }
  }

  onSelectRaceById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedRaceId === id) return;
    const found = this.allRaces.find((r) => r.entity_id === id);
    if (found) {
      this.selectRace(found);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: found.entity_id },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
  }

  onToggleEditMode() {
    if (!this.isEditMode) {
      this.isEditMode = true;
      this.focusNameInput();
      return;
    }

    if (this.isSaving) {
      this.transitionToReadOnlyOnSave = true;
      return;
    }

    if (this.isDirtyState()) {
      if (!this.isConfigValid()) {
        if (this.isNameDuplicate()) {
          alert(this.translationService.translate("RE_ERROR_NAME_EXISTS"));
        } else {
          alert(this.translationService.translate("RE_ERROR_NAME_REQUIRED"));
        }
        return;
      }
      this.updateRace(false);
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewRace() {
    if (this.isEditMode && this.isDirtyState()) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewRace();
        }
      });
    } else {
      this.startNewRace();
    }
  }

  startNewRace() {
    this.isSaving = true;
    const trackId = this.tracks.length > 0 ? this.tracks[0].entity_id : "";
    const themeId = this.getDefaultThemeId();
    const payload = this.createDefaultRaceTemplate(trackId, themeId);
    const defaultName =
      this.translationService.translate("RM_DEFAULT_RACE_NAME") || "New Race";
    payload.name = this.generateUniqueName(defaultName, false);
    delete payload.entity_id;
    delete payload.id;
    delete payload._id;

    this.subscriptions.push(
      this.dataService.createRace(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          const savedRace = {
            ...payload,
            ...created,
            entity_id: created?.entity_id || payload?.entity_id,
          };
          this.navigationService.setLastEditedId("race", savedRace.entity_id);
          this.editingRace = savedRace;
          this.originalRace = deepCopy(savedRace);
          this.selectedRace = savedRace;
          this.selectedRaceId = savedRace.entity_id;
          this.defaultRaceName = savedRace.name;
          this.undoManager.resetTracking(this.editingRace);
          this.syncSelectedCustomRotationAsset();
          this.syncSequenceTextFromModel();
          this.loadHeats();

          const idx = this.allRaces.findIndex(
            (r) => r.entity_id === created.entity_id,
          );
          if (idx >= 0) {
            this.allRaces[idx] = deepCopy(created);
          } else {
            this.allRaces.push(deepCopy(created));
          }
          this.updateRaceSelectItems();
          this.cdr.detectChanges();
          this.focusNameInput();

          this.router.navigate([], {
            queryParams: {
              id: created.entity_id,
              driverCount: this.driverCount,
            },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (error: any) => {
          this.logger.error("Failed to create new race", error);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  onDeleteRace() {
    this.deleteRace();
  }

  deleteRace() {
    if (!this.editingRace || this.editingRace.entity_id === "new") return;
    if (confirm(this.translationService.translate("RE_CONFIRM_DELETE"))) {
      this.isSaving = true;
      const idToDelete = this.editingRace.entity_id;
      this.dataService.deleteRace(idToDelete).subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditMode = false;
          this.allRaces = this.allRaces.filter(
            (r) => r.entity_id !== idToDelete,
          );
          this.updateRaceSelectItems();
          if (this.allRaces.length > 0) {
            this.selectRace(this.allRaces[0]);
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: this.allRaces[0].entity_id },
              queryParamsHandling: "merge",
              replaceUrl: true,
            });
          } else {
            this.startNewRace();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to delete race", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  onBackClicked() {
    if (this.isConfigValid()) {
      if (this.isDirtyState()) {
        this.navigateBackOnSave = true;
        this.updateRace();
      } else {
        this.onBack();
      }
    } else {
      this.onBack();
    }
  }

  onBack() {
    this.isNavigationApproved = true;
    sessionStorage.setItem("skipIntro", "true");
    const from = this.route.snapshot.queryParamMap.get("from");
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    if (from === "raceday-setup" || from === "raceday") {
      this.router.navigate(["/raceday-setup"], {
        queryParams: { skipIntro: "true" },
      });
      return;
    }
    this.router.navigate(["/raceday-setup"]);
  }

  get raceTabs(): EditorTab[] {
    return [
      {
        id: "general-section",
        label: this.translationService.translate("RE_GENERAL_HEADER"),
      },
      {
        id: "heats-section",
        label: this.translationService.translate("RE_HEATS_HEADER"),
      },
      {
        id: "scoring-section",
        label: this.translationService.translate("RE_SCORING_HEADER"),
      },
      {
        id: "group-section",
        label: this.translationService.translate("RE_GROUPS_HEADER"),
      },
      {
        id: "start-method-section",
        label: this.translationService.translate("RE_START_METHOD_HEADER"),
      },
      {
        id: "team-options-section",
        label: this.translationService.translate("RE_TEAM_OPTIONS_HEADER"),
      },
      {
        id: "analog-fuel-section",
        label: this.translationService.translate("RE_ANALOG_FUEL_HEADER"),
      },
      {
        id: "digital-fuel-outer-section",
        label: this.translationService.translate("RE_DIGITAL_FUEL_HEADER"),
      },
      {
        id: "season-points-section",
        label: this.translationService.translate("SS_TITLE"),
      },
    ];
  }

  scrollToAndExpandSection(tabId: string) {
    const sectionMap: Record<string, keyof typeof this.sectionsExpanded> = {
      "general-section": "general",
      "start-method-section": "start_method",
      "scoring-section": "scoring",
      "season-points-section": "season_points",
      "heats-section": "heats",
      "group-section": "groups",
      "analog-fuel-section": "fuel_analog",
      "digital-fuel-outer-section": "fuel_digital",
      "team-options-section": "team",
    };

    const sectionKey = sectionMap[tabId];
    if (sectionKey) {
      this.sectionsExpanded[sectionKey] = true;
      try {
        localStorage.setItem(
          "race_editor_expanders",
          JSON.stringify(this.sectionsExpanded),
        );
      } catch (e) {
        this.logger.error("Error saving expander state", e);
      }
    }

    this.cdr.detectChanges();
    setTimeout(() => {
      const element = document.getElementById(tabId);
      const container = document.querySelector(".sections-wrapper");
      if (element && container) {
        const topPos =
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;

        container.scrollTo({
          top: topPos - 24,
          behavior: "smooth",
        });
      } else if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    try {
      localStorage.setItem(
        "race_editor_expanders",
        JSON.stringify(this.sectionsExpanded),
      );
    } catch (e) {
      this.logger.error("Error saving expander state", e);
    }
  }

  loadExpanderState() {
    try {
      const saved = localStorage.getItem("race_editor_expanders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fuel !== undefined) {
          parsed.fuel_analog = parsed.fuel;
          parsed.fuel_digital = parsed.fuel;
          delete parsed.fuel;
        }
        this.sectionsExpanded = { ...this.sectionsExpanded, ...parsed };
      }
    } catch (e) {
      this.logger.error("Error loading expander state", e);
    }
  }

  private saveDriverCount() {
    try {
      localStorage.setItem(
        "race_editor_driver_count",
        this.driverCount.toString(),
      );
    } catch (e) {
      this.logger.error("Error saving driver count", e);
    }
  }

  private loadDriverCount() {
    try {
      const saved = localStorage.getItem("race_editor_driver_count");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.driverCount = parsed;
          return;
        }
      }
    } catch (e) {
      this.logger.error("Error loading driver count defaulting to 4", e);
    }
    this.driverCount = 4; // Default fallback
  }

  get isNameInvalid(): boolean {
    if (this.isLoading || !this.editingRace) return false;
    return !this.editingRace.name?.trim() || this.isNameDuplicate();
  }

  get isRotationInvalid(): boolean {
    if (!this.editingRace) return false;

    if (this.editingRace.heat_rotation_type === "CustomRoundRobin") {
      const seq = this.editingRace.custom_rotation_sequence;
      if (!seq || seq.length === 0) return true;

      const track = this.tracks.find(
        (t) => t.entity_id === this.editingRace.track_entity_id,
      );
      const numLanes = track?.lanes?.length || 0;

      const uniqueLanes = new Set<number>();
      for (const lane of seq) {
        if (isNaN(lane)) return true;
        if (lane < 0 || (numLanes > 0 && lane > numLanes)) return true;
        if (lane > 0) {
          if (uniqueLanes.has(lane)) return true;
          uniqueLanes.add(lane);
        }
      }
      return false;
    }

    if (this.editingRace.heat_rotation_type === "Custom") {
      return (
        (!this.editingRace.custom_rotations ||
          this.editingRace.custom_rotations.length === 0) &&
        !this.editingRace.custom_rotation_asset_id
      );
    }

    return false;
  }

  get currentTrackHasPerLaneRelays(): boolean {
    if (!this.editingRace || !this.editingRace.track_entity_id) return false;
    const track = this.tracks.find(
      (t) => t.entity_id === this.editingRace.track_entity_id,
    );
    return track ? !!track.has_per_lane_relays : false;
  }

  constructor(
    protected route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private helpService: HelpService,
    private settingsService: SettingsService,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private logger: LoggerService,
    private navigationService: NavigationService,
  ) {
    this.undoManager = new UndoManager<any>(
      {
        clonner: (race) => deepCopy(race),
        equalizer: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        applier: (race) => {
          const currentId = this.editingRace?.entity_id;
          this.editingRace = race;
          if (currentId && this.editingRace) {
            this.editingRace.entity_id = currentId;
          }
          this.syncSequenceTextFromModel();
        },
      },
      () => this.editingRace,
    );
  }

  ngOnInit() {
    this.updateScale();
    this.loadExpanderState();
    this.initDriverCount();
    this.initRouteHandling();

    this.loadTracks();
    this.loadThemes();
    this.loadRaces();
    this.loadCustomRotationAssets();

    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveRace();
        }
      }),
    );

    this.subscriptions.push(
      this.translationService.getTranslationsLoaded().subscribe((loaded) => {
        if (loaded && this.themes.length > 0) {
          this.themes = sortThemesForDisplay(
            this.themes,
            this.translationService,
          );
          this.cdr.markForCheck();
        }
      }),
    );
  }

  private initDriverCount() {
    const driverCountParam =
      this.route.snapshot.queryParamMap.get("driverCount");
    if (driverCountParam) {
      const parsed = parseInt(driverCountParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.driverCount = parsed;
        this.saveDriverCount();
      } else {
        this.loadDriverCount();
      }
    } else {
      this.loadDriverCount();
    }
  }

  private initRouteHandling() {
    if (this.route.queryParamMap) {
      this.subscriptions.push(
        this.route.queryParamMap.subscribe((paramMap) => {
          if (this.isReverting) {
            this.isReverting = false;
            return;
          }
          const isEditorRoute =
            !this.router.url ||
            this.router.url === "/" ||
            this.router.url.startsWith("/race-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
          if (nextId && nextId !== "new") {
            this.navigationService.setLastEditedId("race", nextId);
          }
          const currentId = this.editingRace?.entity_id;
          if (
            currentId &&
            nextId !== currentId &&
            this.hasChanges() &&
            !this.isNavigationApproved
          ) {
            this.confirmDiscard().then((confirmed) => {
              if (confirmed) {
                const id = this.route.snapshot.queryParamMap.get("id");
                if (id === "new") {
                  this.startNewRace();
                } else if (id) {
                  this.loadRace(id);
                } else {
                  this.loadDefaultRace();
                }
              } else {
                this.isReverting = true;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: {
                    id: currentId,
                    from: this.route.snapshot.queryParamMap.get("from"),
                    returnUrl:
                      this.route.snapshot.queryParamMap.get("returnUrl"),
                  },
                  queryParamsHandling: "merge",
                });
              }
            });
          } else {
            const id = paramMap.get("id");
            if (id === "new") {
              this.startNewRace();
            } else if (id) {
              this.loadRace(id);
            } else {
              this.loadDefaultRace();
            }
          }
        }),
      );
    } else {
      const id = this.route.snapshot.queryParamMap.get("id");
      if (id === "new") {
        this.startNewRace();
      } else if (id) {
        this.loadRace(id);
      } else {
        this.loadDefaultRace();
      }
    }
  }

  private loadDefaultRace() {
    const lastEdited = this.navigationService.getLastEditedId("race");
    if (lastEdited) {
      this.loadRace(lastEdited);
    } else {
      this.loadRace("");
    }
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.undoManager.destroy();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      if (event.shiftKey) {
        event.preventDefault();
        this.undoManager.redo();
      } else {
        event.preventDefault();
        this.undoManager.undo();
      }
    }
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    this.scale = Math.min(scaleX, scaleY);

    if (this.scale <= 0 || isNaN(this.scale)) {
      this.scale = 1;
    }
  }

  monitorConnection() {
    this.connectionSubscription =
      this.connectionMonitor.connectionState$.subscribe((state) => {
        this.isConnectionLost = state === ConnectionState.DISCONNECTED;

        if (this.isConnectionLost) {
          this.handleConnectionLoss();
        }
      });
  }

  handleConnectionLoss() {
    let startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!this.isConnectionLost) {
        clearInterval(intervalId);
        return;
      }

      if (Date.now() - startTime > 5000) {
        clearInterval(intervalId);
        this.router.navigate(["/raceday-setup"]);
      }
    }, 1000);
  }

  private normalizeFuelOptions(fuel: any): any {
    if (!fuel) {
      return {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        fastest_time: 3.0,
        max_usage: 5.0,
        slowest_time: 9.0,
        min_usage: 3.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        power_stutter_on_time: 1.0,
        power_stutter_off_time: 1.0,
        custom_curve: [],
      };
    }
    return {
      ...fuel,
      custom_curve: fuel.custom_curve || [],
      fastest_time:
        Number(fuel.fastest_time) ||
        Number((Number(fuel.reference_time || 6.0) * 0.5).toFixed(2)),
      max_usage:
        Number(fuel.max_usage) ||
        (fuel.usage_type === "QUADRATIC"
          ? Number((Number(fuel.usage_rate || 4.0) * 4.0).toFixed(2))
          : fuel.usage_type === "CUBIC"
            ? Number((Number(fuel.usage_rate || 4.0) * 8.0).toFixed(2))
            : Number((Number(fuel.usage_rate || 4.0) * 1.25).toFixed(2))),
      slowest_time:
        Number(fuel.slowest_time) ||
        Number((Number(fuel.reference_time || 6.0) * 1.5).toFixed(2)),
      min_usage:
        Number(fuel.min_usage) ||
        (fuel.usage_type === "QUADRATIC"
          ? Number((Number(fuel.usage_rate || 4.0) * (4.0 / 9.0)).toFixed(2))
          : fuel.usage_type === "CUBIC"
            ? Number((Number(fuel.usage_rate || 4.0) * (8.0 / 27.0)).toFixed(2))
            : Number((Number(fuel.usage_rate || 4.0) * 0.75).toFixed(2))),
    };
  }

  private normalizeDigitalFuelOptions(digitalFuel: any): any {
    if (!digitalFuel) {
      return {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        custom_curve: [],
      };
    }
    return {
      ...digitalFuel,
      custom_curve: digitalFuel.custom_curve || [],
    };
  }

  private normalizeRace(race: any): any {
    const normalized = {
      ...deepCopy(race),
      group_options: race.group_options || {
        enabled: false,
        max_groups: 2,
        balance: true,
        allow_empty_lanes: false,
        force_multiple_of_max: false,
        rotate_group_heats: false,
        min_advancing: 0,
      },
      fuel_options: this.normalizeFuelOptions(race.fuel_options),
      digital_fuel_options: this.normalizeDigitalFuelOptions(
        race.digital_fuel_options,
      ),
      team_options: race.team_options || {
        heat_lap_limit: 0,
        heat_time_limit: 0.0,
        overall_lap_limit: 0,
        overall_time_limit: 0.0,
        require_pit_stop_change_driver: false,
      },
      heat_scoring: race.heat_scoring || {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: race.overall_scoring || {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      season_scoring: race.season_scoring || {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [3, 2, 1, 0],
      },
      custom_rotation_sequence: race.custom_rotation_sequence || [],
      custom_rotations: race.custom_rotations || [],
    };

    if (!normalized.theme_id && this.themes.length > 0) {
      const defaultTheme =
        this.themes.find(
          (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
        ) || this.themes[0];
      normalized.theme_id = defaultTheme.entity_id;
    }

    return normalized;
  }

  selectRace(race: any) {
    this.selectedRace = race;
    this.selectedRaceId = race.entity_id;
    this.editingRace = this.normalizeRace(race);
    this.originalRace = deepCopy(this.editingRace);
    this.undoManager.initialize(this.editingRace);
    this.enforceFuelRules();
    this.syncHeatPositionPoints();
    this.syncSelectedCustomRotationAsset();
    if (this.driverCount > 0) {
      this.loadHeats();
    }
    this.syncSequenceTextFromModel();
    if (this.isPreservingEditModeOnNavigation) {
      this.isPreservingEditModeOnNavigation = false;
      this.isEditMode = true;
      this.defaultRaceName = this.editingRace.name;
      this.focusNameInput();
    } else {
      this.isEditMode = false;
    }
    this.cdr.detectChanges();
  }

  loadRace(id: string) {
    this.isNavigationApproved = false;
    this.isLoading = true;
    this.dataService.getRaces().subscribe({
      next: (races) => {
        this.allRaces = deepCopy(races || []);
        this.updateRaceSelectItems();
        const race = races.find((r) => r.entity_id === id);
        if (race) {
          this.selectRace(race);
        } else if (races.length > 0) {
          this.selectRace(races[0]);
        } else {
          this.startNewRace();
          return;
        }
        const isNew = this.route.snapshot.queryParamMap.get("isNew") === "true";
        if (isNew) {
          this.isEditMode = true;
          this.defaultRaceName = this.editingRace.name;
          this.focusNameInput();
        }
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error: any) => {
        this.logger.error("Failed to load race", error);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadThemes() {
    this.dataService.getThemes().subscribe({
      next: (themes) => {
        this.themes = sortThemesForDisplay(
          themes || [],
          this.translationService,
        );
        if (
          this.editingRace &&
          !this.editingRace.theme_id &&
          this.themes.length > 0
        ) {
          const defaultTheme =
            this.themes.find(
              (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
            ) || this.themes[0];
          this.editingRace.theme_id = defaultTheme.entity_id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load themes", err);
      },
    });
  }

  getThemeDisplayNameKey(theme: Theme): string {
    return getThemeDisplayNameKey(theme, this.translationService);
  }

  loadTracks() {
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.tracks = tracks.map(
          (t) =>
            new Track({
              entity_id: t.entity_id,
              name: t.name,
              num_track_sections: t.num_track_sections || 100,
              lanes: t.lanes || [],
              has_digital_fuel: t.has_digital_fuel ?? false,
              has_per_lane_relays: t.has_per_lane_relays ?? false,
              has_main_relay: t.has_main_relay ?? false,
              arduino_configs: t.arduino_configs,
            }),
        );
        if (
          this.editingRace &&
          this.editingRace.entity_id === "new" &&
          !this.editingRace.track_entity_id &&
          this.tracks.length > 0
        ) {
          this.editingRace.track_entity_id = this.tracks[0].entity_id;
          this.syncHeatPositionPoints();
          this.originalRace = deepCopy(this.editingRace);
          this.undoManager.initialize(this.editingRace);
        } else if (this.editingRace) {
          this.syncHeatPositionPoints();
        }
        this.enforceFuelRules();
        // Safe to call here - triggered by async data load, not user input
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error: any) => {
        this.logger.error("Failed to load tracks", error);
      },
    });
  }

  loadCustomRotationAssets() {
    this.dataService.listAssets().subscribe({
      next: (assets) => {
        this.customRotationAssets = assets.filter(
          (a) => a.type === "custom_rotation",
        );
        // Safe to call here - triggered by async data load, not user input
        setTimeout(() => {
          this.syncSelectedCustomRotationAsset();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => this.logger.error("Failed to load assets", err),
    });
  }

  get filteredCustomRotationAssets() {
    const track = this.tracks.find(
      (t) => t.entity_id === this.editingRace?.track_entity_id,
    );
    const numLanes = track?.lanes?.length || 0;
    return this.customRotationAssets.filter((a) => a.numLanes === numLanes);
  }

  syncSelectedCustomRotationAsset() {
    if (!this.editingRace || this.editingRace.heat_rotation_type !== "Custom") {
      this.selectedCustomRotationAssetId = "";
      return;
    }

    if (this.editingRace.custom_rotation_asset_id) {
      const filtered = this.filteredCustomRotationAssets;
      if (
        this.customRotationAssets.length === 0 ||
        filtered.some(
          (a) =>
            a.model?.entityId === this.editingRace.custom_rotation_asset_id,
        )
      ) {
        this.selectedCustomRotationAssetId =
          this.editingRace.custom_rotation_asset_id;
        return;
      }
    }

    const filtered = this.filteredCustomRotationAssets;

    // Try to find an asset that matches the current custom_rotations
    const currentRotationsJson = JSON.stringify(
      this.editingRace.custom_rotations || [],
    );
    let match = this.customRotationAssets.find(
      (a) => JSON.stringify(a.customRotations || []) === currentRotationsJson,
    );

    // If no match or match doesn't belong to filtered (lane count mismatch), try to auto-select
    if (
      !match ||
      !filtered.some((a) => a.model?.entityId === match.model?.entityId)
    ) {
      if (filtered.length > 0) {
        match = filtered[0];
        this.editingRace.custom_rotation_asset_id = match.model?.entityId;
        this.selectedCustomRotationAssetId = match.model?.entityId || "";
      } else {
        this.editingRace.custom_rotation_asset_id = undefined;
        this.selectedCustomRotationAssetId = "";
      }
    } else {
      this.selectedCustomRotationAssetId = match.model?.entityId || "";
      this.editingRace.custom_rotation_asset_id = match.model?.entityId;
    }
  }

  onCustomRotationAssetChange() {
    if (this.editingRace) {
      this.editingRace.custom_rotation_asset_id =
        this.selectedCustomRotationAssetId || undefined;
      // We can clear the old custom_rotations list to reduce payload size
      delete this.editingRace.custom_rotations;
      this.captureState();
    }
  }

  getDefaultThemeId(): string {
    if (this.themes.length === 0) {
      return "default_classic_rc_ai";
    }
    const defaultTheme = this.themes.find(
      (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
    );
    return (defaultTheme || this.themes[0]).entity_id;
  }

  createDefaultRaceTemplate(trackId: string, themeId: string): any {
    return {
      entity_id: "new",
      name: "",
      track_entity_id: trackId,
      theme_id: themeId,
      heat_rotation_type: "RoundRobin",
      heat_scoring: {
        finish_method: "Lap",
        finish_value: 10,
        heat_ranking: "LAP_COUNT",
        heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
        allow_finish: "None",
      },
      overall_scoring: {
        dropped_heats: 0,
        ranking_method: "LAP_COUNT",
        tiebreaker: "FASTEST_LAP_TIME",
      },
      auto_advance_time: 0,
      auto_start_time: 0,
      auto_advance_warmup_time: 0,
      auto_start_warmup_time: 0,
      fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        fastest_time: 3.0,
        max_usage: 5.0,
        slowest_time: 9.0,
        min_usage: 3.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        custom_curve: [],
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        out_of_fuel_action: OutOfFuelAction.DO_NOT_COUNT_LAPS,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
        custom_curve: [],
      },
      min_lap_time: 1.5,
      drift_time: 0.5,
      start_time: 5.0,
      restart_time: 5.0,
      start_randomizer: 0.0,
      restart_randomizer: 0.0,
      solo_lane_index: 0,
      custom_rotation_sequence: [],
      custom_rotations: [],
      team_options: {
        heat_lap_limit: 0,
        heat_time_limit: 0,
        overall_lap_limit: 0,
        overall_time_limit: 0,
        require_pit_stop_change_driver: false,
      },
      heat_times_through: 1,
      reverse_heats: false,
      hot_start: false,
      restart_on_false_start: false,
      start_behind_sensor: true,
      start_at_current: false,
      false_start_lap_penalty: 0,
      false_start_time_penalty: 0,
      adjust_drift_laps: false,
      group_options: {
        enabled: false,
        max_groups: 2,
        balance: true,
        allow_empty_lanes: false,
        force_multiple_of_max: false,
        rotate_group_heats: false,
        min_advancing: 0,
      },
      season_scoring: {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [3, 2, 1, 0],
      },
    };
  }

  createNewRace() {
    this.isNavigationApproved = false;
    this.defaultRaceName = "";
    this.focusNameInput();
    const trackId = this.tracks.length > 0 ? this.tracks[0].entity_id : "";
    const themeId = this.getDefaultThemeId();
    this.editingRace = this.createDefaultRaceTemplate(trackId, themeId);
    this.syncHeatPositionPoints();
    this.originalRace = deepCopy(this.editingRace);
    this.undoManager.initialize(this.editingRace);
    this.syncSelectedCustomRotationAsset();
    this.syncSequenceTextFromModel();
    this.isLoading = false;
    // Safe to call here - triggered during initialization, not user input
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onInputFocus() {
    this.undoManager.onInputFocus();
  }

  onInputChange() {
    this.undoManager.onInputChange();
  }

  onInputBlur() {
    this.undoManager.onInputBlur();
  }

  get customRotationSequenceString(): string {
    return (this.editingRace?.custom_rotation_sequence || []).join(", ");
  }

  syncSequenceTextFromModel() {
    this.customSequenceText = this.customRotationSequenceString;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onCustomSequenceChange() {
    if (!this.editingRace) return;
    const value = this.customSequenceText;
    const parts = value.split(",").map((s) => s.trim());
    const sequence: number[] = [];

    for (const part of parts) {
      if (part === "") continue;
      // Strict numeric check to catch "12abc" as invalid
      if (!/^\d+$/.test(part)) {
        sequence.push(NaN);
      } else {
        const n = parseInt(part, 10);
        sequence.push(n);
      }
    }

    this.editingRace.custom_rotation_sequence = sequence;
    this.editingRace.customRotationSequence = sequence;
    this.onInputChange();
    this.loadHeats();
  }

  get groupIndices(): number[] {
    const max = Math.max(1, this.editingRace?.group_options?.max_groups || 1);
    return Array.from({ length: max }, (_, i) => i);
  }

  getGroupNameInput(index: number): string {
    return this.editingRace?.group_options?.names?.[index] || "";
  }

  setGroupNameInput(index: number, value: string): void {
    if (!this.editingRace.group_options) {
      return;
    }
    if (!this.editingRace.group_options.names) {
      this.editingRace.group_options.names = [];
    }
    this.editingRace.group_options.names[index] = value;
    this.captureState();
  }

  captureState() {
    this.validateWarmupTimes();
    this.validateHeatConfigurations();
    this.enforceFuelRules();
    this.syncSelectedCustomRotationAsset();
    this.syncHeatPositionPoints();
    this.undoManager.captureState();
    // Regenerate heats when rotation type changes (even for new races)
    if (this.driverCount > 0) {
      this.loadHeats();
    }
  }

  private validateHeatConfigurations() {
    if (!this.editingRace) return;
    if (
      this.editingRace.heat_times_through === null ||
      this.editingRace.heat_times_through < 1
    ) {
      this.editingRace.heat_times_through = 1;
    }
  }

  private validateWarmupTimes() {
    if (!this.editingRace) return;

    if (
      this.editingRace.auto_advance_warmup_time >
      this.editingRace.auto_advance_time
    ) {
      this.editingRace.auto_advance_warmup_time =
        this.editingRace.auto_advance_time;
    }

    if (
      this.editingRace.auto_start_warmup_time > this.editingRace.auto_start_time
    ) {
      this.editingRace.auto_start_warmup_time =
        this.editingRace.auto_start_time;
    }
  }

  enforceFuelRules() {
    if (!this.editingRace) return;

    if (this.hasDigitalFuel) {
      if (this.editingRace.fuel_options?.enabled) {
        this.editingRace.fuel_options.enabled = false;
      }
    } else {
      if (this.editingRace.digital_fuel_options?.enabled) {
        this.editingRace.digital_fuel_options.enabled = false;
      }
    }
  }

  get hasDigitalFuel(): boolean {
    if (!this.editingRace?.track_entity_id || !this.tracks) return false;
    const track = this.tracks.find(
      (t) => t.entity_id === this.editingRace.track_entity_id,
    );
    if (!track) return false;

    // Fallback for raw mock objects in tests
    if (typeof track.hasDigitalFuel === "function") {
      return track.hasDigitalFuel();
    }
    const hasDigital =
      !!(track as any).has_digital_fuel ||
      (track as any).arduino_configs?.some(
        (conf: any) =>
          conf.voltageConfigs && Object.keys(conf.voltageConfigs).length > 0,
      );
    return hasDigital;
  }

  onRotationTypeChange() {
    this.logger.debug(
      "Rotation type changed to:",
      this.editingRace?.heat_rotation_type,
    );
    this.captureState();
    // Immediately update heats when rotation type changes
    this.loadHeats();
  }

  onLaneSelected(laneIndex: number) {
    if (this.editingRace.solo_lane_index !== laneIndex) {
      this.editingRace.solo_lane_index = laneIndex;
      this.captureState();
      this.loadHeats();
    }
  }

  onDriverCountChange() {
    this.logger.debug("Driver count changed to:", this.driverCount);
    this.saveDriverCount();
    // Update heats when driver count changes
    this.loadHeats();
  }

  loadHeats() {
    this.logger.debug(
      "loadHeats called - entity_id:",
      this.editingRace?.entity_id,
      "driverCount:",
      this.driverCount,
      "trackId:",
      this.editingRace?.track_entity_id,
      "rotationType:",
      this.editingRace?.heat_rotation_type,
    );

    // Clear heats if missing required data
    if (
      !this.editingRace ||
      this.driverCount <= 0 ||
      !this.editingRace.track_entity_id ||
      !this.editingRace.heat_rotation_type
    ) {
      this.logger.debug("Clearing heats - missing required data");
      this.generatedHeats = [];
      return;
    }

    // Always use preview endpoint to show heats based on current form values
    // This allows users to see heat changes before saving the race
    this.logger.debug("Calling previewHeats with:", {
      trackId: this.editingRace.track_entity_id,
      rotationType: this.editingRace.heat_rotation_type,
      driverCount: this.driverCount,
      soloLaneIndex: this.editingRace.solo_lane_index,
      customSequence: this.editingRace.custom_rotation_sequence,
      heatTimesThrough: this.editingRace.heat_times_through,
      reverseHeats: this.editingRace.reverse_heats,
      groupOptions: this.editingRace.group_options,
    });
    this.dataService
      .previewHeats(
        this.editingRace.track_entity_id,
        this.editingRace.heat_rotation_type,
        this.driverCount,
        this.editingRace.solo_lane_index,
        this.editingRace.custom_rotation_sequence,
        this.editingRace.custom_rotation_asset_id,
        this.editingRace.custom_rotations,
        this.editingRace.heat_times_through,
        this.editingRace.reverse_heats,
        this.editingRace.group_options,
      )
      .subscribe({
        next: (response) => {
          this.logger.debug("Preview heats response:", response);
          this.generatedHeats = [...(response.heats || [])]; // Force new array reference
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.logger.error("Failed to preview heats", error);
          this.generatedHeats = [];
          this.cdr.detectChanges();
        },
      });
  }

  private autoSaveRace() {
    if (!this.editingRace) return;
    if (!this.editingRace.name?.trim() || this.isNameDuplicate()) return;
    if (this.isRotationInvalid) return;
    if (this.isSaving) return;
    this.updateRace(true);
  }

  updateRace(isAutoSave: boolean = false) {
    if (!this.editingRace || this.isSaving) return;
    const wasNew = this.editingRace.entity_id === "new";
    if (!wasNew && !this.isDirtyState()) return;

    if (!this.editingRace.name?.trim()) {
      if (!isAutoSave) {
        alert(this.translationService.translate("RE_ERROR_NAME_REQUIRED"));
      }
      return;
    }
    if (this.isNameDuplicate()) {
      if (!isAutoSave) {
        alert(this.translationService.translate("RE_ERROR_NAME_EXISTS"));
      }
      return;
    }

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    this.saveRaceData(wasNew, isAutoSave);
  }

  private saveRaceData(wasNew: boolean, isAutoSave: boolean) {
    const payload = this.buildRacePayload(this.editingRace);
    this.logger.debug("Updating race with payload:", payload);

    const obs = wasNew
      ? this.dataService.createRace(payload)
      : this.dataService.updateRace(this.editingRace.entity_id, payload);

    this.subscriptions.push(
      obs.subscribe({
        next: (result) => this.handleSaveSuccess(result, wasNew, isAutoSave),
        error: (err) => this.handleSaveError(err, isAutoSave),
      }),
    );
  }

  private handleSaveSuccess(result: any, wasNew: boolean, isAutoSave: boolean) {
    this.isSaving = false;
    this.isAutoSaving = false;
    const savedEntityId = result?.entity_id || this.editingRace.entity_id;
    this.navigationService.setLastEditedId("race", savedEntityId);

    if (wasNew && result?.entity_id) {
      this.editingRace.entity_id = result.entity_id;
    }

    if (wasNew) {
      this.isEditMode = true;
      this.isPreservingEditModeOnNavigation = true;
      this.defaultRaceName = this.editingRace.name;
    } else if (!isAutoSave || this.transitionToReadOnlyOnSave) {
      this.isEditMode = false;
      this.transitionToReadOnlyOnSave = false;
    }

    this.originalRace = deepCopy(this.editingRace);
    this.undoManager.resetTracking(this.editingRace);
    this.selectedRace = deepCopy(this.editingRace);
    this.selectedRaceId = this.editingRace.entity_id;

    const idx = this.allRaces.findIndex(
      (r) => r.entity_id === this.editingRace.entity_id,
    );
    if (idx >= 0) {
      this.allRaces[idx] = deepCopy(this.editingRace);
    } else {
      this.allRaces.push(deepCopy(this.editingRace));
    }
    this.updateRaceSelectItems();
    this.cdr.detectChanges();
    if (wasNew) {
      this.focusNameInput();
    }

    if (this.navigateBackOnSave) {
      this.onBack();
    } else if (wasNew) {
      this.handleNewRaceNavigation(savedEntityId, isAutoSave);
    }
  }

  private handleNewRaceNavigation(entityId: string, isAutoSave: boolean) {
    if (isAutoSave) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([], {
          queryParams: {
            id: entityId,
            driverCount: this.driverCount,
            from: this.route.snapshot.queryParamMap.get("from"),
            returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
          },
        }),
      );
      this.location.replaceState(url);
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: entityId, driverCount: this.driverCount },
        queryParamsHandling: "merge",
        replaceUrl: true,
      });
    }
  }

  private handleSaveError(error: any, isAutoSave: boolean) {
    this.logger.error("Failed to save race", error);
    if (!isAutoSave) {
      this.showError(
        "Error Saving Race",
        error.error || error.message || "Unknown error",
      );
    }
    this.isSaving = false;
    this.isAutoSaving = false;
    this.loadRaces();
    this.cdr.detectChanges();
  }

  saveAsNew() {
    if (!this.editingRace || !this.canSaveAsNew()) return;

    this.isSaving = true;
    const newName = this.generateUniqueName(this.editingRace.name, true);
    const payload = this.buildRacePayload(this.editingRace);
    payload.name = newName;
    delete payload.entity_id;
    delete payload.id;
    delete payload._id;

    this.defaultRaceName = newName;
    this.focusNameInput();

    this.subscriptions.push(
      this.dataService.createRace(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          this.navigationService.setLastEditedId("race", created.entity_id);
          this.editingRace = created;
          this.originalRace = deepCopy(created);
          this.selectedRace = created;
          this.selectedRaceId = created.entity_id;
          this.defaultRaceName = created.name;
          this.undoManager.resetTracking(this.editingRace);
          this.loadHeats();
          const idx = this.allRaces.findIndex(
            (r) => r.entity_id === created.entity_id,
          );
          if (idx >= 0) {
            this.allRaces[idx] = deepCopy(created);
          } else {
            this.allRaces.push(deepCopy(created));
          }
          this.updateRaceSelectItems();
          this.cdr.detectChanges();
          this.focusNameInput();
          this.router.navigate([], {
            queryParams: {
              id: created.entity_id,
              driverCount: this.driverCount,
            },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (error: any) => {
          this.logger.error("Failed to save as new race", error);
          this.showError(
            "Error Saving Race",
            error.error || error.message || "Unknown error",
          );
          this.isSaving = false;
          this.loadRaces();
          this.cdr.detectChanges();
        },
      }),
    );
  }

  private transformCustomRotationsToSnakeCase(rotations: any[]): any[] {
    return (rotations || []).map((rot) => ({
      num_drivers: rot.numDrivers ?? rot.num_drivers,
      heats: (rot.heats || []).map((h: any) => ({
        driver_indices: h.driverIndices ?? h.driver_indices,
      })),
    }));
  }

  updateRaceSelectItems() {
    this.raceSelectItems = (this.allRaces || [])
      .slice()
      .sort((a, b) => naturalSortCompare(a.name || "", b.name || ""))
      .map((r) => ({
        id: r.entity_id,
        name: r.name,
      }));
  }

  loadRaces() {
    this.dataService.getRaces().subscribe({
      next: (races) => {
        this.allRaces = deepCopy(races || []);
        this.updateRaceSelectItems();
        if (
          this.editingRace?.entity_id &&
          this.editingRace.entity_id !== "new"
        ) {
          const found = this.allRaces.find(
            (r) => r.entity_id === this.editingRace.entity_id,
          );
          if (found) {
            this.selectedRace = found;
            this.selectedRaceId = found.entity_id;
          }
        }
      },
      error: (error: any) => {
        this.logger.error("Failed to load races", error);
        this.allRaces = [];
        this.updateRaceSelectItems();
      },
    });
  }

  isNameDuplicate(): boolean {
    if (!this.editingRace?.name) {
      return false;
    }

    const trimmedName = this.editingRace.name.trim().toLowerCase();
    return this.races.some(
      (race) =>
        race.entity_id !== this.editingRace.entity_id &&
        race.name.trim().toLowerCase() === trimmedName,
    );
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    let counter = forceSuffix ? 1 : 0;
    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
      const exists = this.allRaces.some(
        (r) =>
          (r.name || "").trim().toLowerCase() ===
          candidate.trim().toLowerCase(),
      );
      if (!exists && candidate.trim() !== "") {
        return candidate;
      }
      counter++;
    }
  }

  canSaveAsNew(): boolean {
    if (!this.editingRace?.name || !this.editingRace?.theme_id) {
      return false;
    }
    return true;
  }

  canUpdate(): boolean {
    // Must have changes
    if (!this.isDirtyState()) {
      return false;
    }

    // And the name must not be a duplicate, rotation must be valid, and theme must be selected
    return (
      !this.isNameDuplicate() &&
      !this.isRotationInvalid &&
      !!this.editingRace?.theme_id
    );
  }

  getUpdateTooltip(): string {
    if (!this.isDirtyState()) {
      return "RE_TOOLTIP_NO_CHANGES";
    }
    if (this.isNameDuplicate()) {
      return "RE_TOOLTIP_NAME_EXISTS";
    }
    if (this.isRotationInvalid) {
      return this.editingRace.heat_rotation_type === "Custom"
        ? "RE_TOOLTIP_INVALID_CUSTOM_ROTATION"
        : "RE_TOOLTIP_INVALID_ROTATION";
    }
    return "";
  }

  showError(title: string, message: string) {
    this.ackModalTitle = title;
    this.ackModalMessage = message;
    this.showAckModal = true;
  }

  closeAckModal() {
    this.showAckModal = false;
  }

  // Fuel Graph Hover State
  hoveredPoint: FuelGraphHoverPoint | null = null;

  hiddenPlots: {
    analog_usage: Set<string>;
    analog_pit: Set<string>;
    digital_usage: Set<string>;
    digital_pit: Set<string>;
  } = {
    analog_usage: new Set<string>(),
    analog_pit: new Set<string>(),
    digital_usage: new Set<string>(),
    digital_pit: new Set<string>(),
  };

  // Cache for graph performance
  private usageGraphCache: {
    path: string;
    plots: FuelGraphPlot[];
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private pitGraphCache: {
    path: string;
    plots: FuelGraphPlot[];
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private digitalUsageGraphCache: {
    path: string;
    plots: FuelGraphPlot[];
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private digitalPitGraphCache: {
    path: string;
    plots: FuelGraphPlot[];
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  draggingNode: {
    mode: "analog" | "digital";
    index: number;
  } | null = null;
  private previousAnalogPreset: FuelUsageType | string = FuelUsageType.LINEAR;
  private previousDigitalPreset: FuelUsageType | string = FuelUsageType.LINEAR;

  togglePlotVisibility(
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ) {
    const set = this.hiddenPlots[graphId];
    if (set.has(type)) {
      set.delete(type);
    } else {
      set.add(type);
    }
    if (graphId === "analog_usage") {
      this.usageGraphCache = null;
    } else if (graphId === "analog_pit") {
      this.pitGraphCache = null;
    } else if (graphId === "digital_usage") {
      this.digitalUsageGraphCache = null;
    } else {
      this.digitalPitGraphCache = null;
    }
  }

  isPlotHidden(
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ): boolean {
    return this.hiddenPlots[graphId].has(type);
  }

  getFuelUsageFastestTime(): number {
    const val = Number(this.editingRace?.fuel_options?.fastest_time);
    if (!isNaN(val) && val > 0) return val;
    const ref = Number(this.editingRace?.fuel_options?.reference_time);
    return !isNaN(ref) && ref > 0
      ? Math.max(0.1, Number((ref * 0.5).toFixed(2)))
      : 3.0;
  }

  getFuelUsageMaxUsage(): number {
    const val = Number(this.editingRace?.fuel_options?.max_usage);
    if (!isNaN(val) && val >= 0) return val;
    const rate = Number(this.editingRace?.fuel_options?.usage_rate) || 4.0;
    const type = this.editingRace?.fuel_options?.usage_type;
    if (type === "QUADRATIC") return Number((rate * 4.0).toFixed(2));
    if (type === "CUBIC") return Number((rate * 8.0).toFixed(2));
    return Number((rate * 1.25).toFixed(2));
  }

  getFuelUsageSlowestTime(): number {
    const val = Number(this.editingRace?.fuel_options?.slowest_time);
    if (!isNaN(val) && val > 0) return val;
    const ref = Number(this.editingRace?.fuel_options?.reference_time);
    return !isNaN(ref) && ref > 0
      ? Math.max(0.2, Number((ref * 1.5).toFixed(2)))
      : 9.0;
  }

  getFuelUsageMinUsage(): number {
    const val = Number(this.editingRace?.fuel_options?.min_usage);
    if (!isNaN(val) && val >= 0) return val;
    const rate = Number(this.editingRace?.fuel_options?.usage_rate) || 4.0;
    const type = this.editingRace?.fuel_options?.usage_type;
    if (type === "QUADRATIC") return Number((rate * (4.0 / 9.0)).toFixed(2));
    if (type === "CUBIC") return Number((rate * (8.0 / 27.0)).toFixed(2));
    return Number((rate * 0.75).toFixed(2));
  }

  getFuelUsageReferenceTime(): number {
    const ref = Number(this.editingRace?.fuel_options?.reference_time);
    if (!isNaN(ref) && ref > 0) return ref;
    return Number(
      (
        (this.getFuelUsageFastestTime() + this.getFuelUsageSlowestTime()) /
        2
      ).toFixed(2),
    );
  }

  getFuelUsageMinTime(): number {
    return this.getFuelUsageFastestTime();
  }

  getFuelUsageMaxTime(): number {
    return Math.max(
      this.getFuelUsageMinTime() + 0.1,
      this.getFuelUsageSlowestTime(),
    );
  }

  getFuelUsageTimeRange(): string {
    return `${this.getFuelUsageMinTime()}s - ${this.getFuelUsageMaxTime()}s`;
  }

  getFuelUsageXLabels(): string[] {
    const min = this.getFuelUsageMinTime();
    const max = this.getFuelUsageMaxTime();
    const step = (max - min) / 4;
    const labels: string[] = [];
    for (let i = 0; i <= 4; i++) {
      const val = min + i * step;
      labels.push(`${Number(val.toFixed(2))}s`);
    }
    return labels;
  }

  getPitGraphYLabels(): string[] {
    const min = this.getFuelUsageMinTime();
    const max = this.getFuelUsageMaxTime();
    const step = (max - min) / 4;
    const labels: string[] = [];
    for (let i = 4; i >= 0; i--) {
      const val = min + i * step;
      labels.push(`${Number(val.toFixed(2))}s`);
    }
    return labels;
  }

  private updateUsageGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime();
    const maxUsage = this.getFuelUsageMaxUsage();
    const slowestTime = this.getFuelUsageSlowestTime();
    const minUsage = this.getFuelUsageMinUsage();
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(this.hiddenPlots.analog_usage)
      .sort()
      .join(",");
    const key = `${options.usage_type}_${fastestTime}_${maxUsage}_${slowestTime}_${minUsage}_${curveKey}_${hiddenKey}`;

    if (this.usageGraphCache && this.usageGraphCache.argsKey === key) return;

    const customMaxMult = this.getAnalogCurveMaxMultiplier();

    const result = computeAnalogUsagePlots(
      options.usage_type,
      fastestTime,
      maxUsage,
      slowestTime,
      minUsage,
      options.custom_curve,
      customMaxMult,
      this.hiddenPlots.analog_usage,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    this.usageGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxFuelValue,
      argsKey: key,
    };
  }

  getFuelUsagePlots(): FuelGraphPlot[] {
    this.updateUsageGraphCache();
    return this.usageGraphCache?.plots || [];
  }

  getFuelUsagePath(): string {
    this.updateUsageGraphCache();
    return this.usageGraphCache?.path || "";
  }

  getFuelUsageYLabels(): string[] {
    this.updateUsageGraphCache();
    if (this.usageGraphCache) return this.usageGraphCache.labels;

    if (!this.editingRace?.fuel_options?.enabled) {
      return ["0.00", "0.00", "0.00", "0.00", "0.00"];
    }
    return RaceEditorComponent.EMPTY_LABELS;
  }

  private updatePitGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime();
    const maxUsage = this.getFuelUsageMaxUsage();
    const slowestTime = this.getFuelUsageSlowestTime();
    const minUsage = this.getFuelUsageMinUsage();
    const capacity = Number(options.capacity) || 100;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(this.hiddenPlots.analog_pit).sort().join(",");
    const key = `${options.usage_type}_${fastestTime}_${maxUsage}_${slowestTime}_${minUsage}_${capacity}_${curveKey}_${hiddenKey}`;

    if (this.pitGraphCache && this.pitGraphCache.argsKey === key) return;

    const result = computeAnalogPitPlots(
      options.usage_type,
      fastestTime,
      maxUsage,
      slowestTime,
      minUsage,
      capacity,
      options.custom_curve,
      this.hiddenPlots.analog_pit,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    this.pitGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxPitTime,
      argsKey: key,
    };
  }

  getPitGraphPlots(): FuelGraphPlot[] {
    this.updatePitGraphCache();
    return this.pitGraphCache?.plots || [];
  }

  getPitGraphPath(): string {
    this.updatePitGraphCache();
    return this.pitGraphCache?.path || "";
  }

  getPitGraphXLabels(): string[] {
    this.updatePitGraphCache();
    if (this.pitGraphCache) return this.pitGraphCache.labels;

    if (!this.editingRace?.fuel_options?.enabled) {
      return ["0", "0", "0", "0", "0"];
    }
    return RaceEditorComponent.EMPTY_LABELS;
  }

  private updateDigitalUsageGraphCache() {
    if (!this.editingRace?.digital_fuel_options) return;
    const options = this.editingRace.digital_fuel_options;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(this.hiddenPlots.digital_usage)
      .sort()
      .join(",");
    const key = `${options.usage_type}_${options.usage_rate}_${curveKey}_${hiddenKey}`;

    if (
      this.digitalUsageGraphCache &&
      this.digitalUsageGraphCache.argsKey === key
    )
      return;

    const customMaxMult = this.getDigitalCurveMaxMultiplier();
    const usageRate = Number(options.usage_rate) || 0;

    const result = computeDigitalUsagePlots(
      options.usage_type,
      usageRate,
      options.custom_curve,
      customMaxMult,
      this.hiddenPlots.digital_usage,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    this.digitalUsageGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.maxFuelValue,
      argsKey: key,
    };
  }

  getDigitalUsagePlots(): FuelGraphPlot[] {
    this.updateDigitalUsageGraphCache();
    return this.digitalUsageGraphCache?.plots || [];
  }

  getDigitalUsagePath(): string {
    this.updateDigitalUsageGraphCache();
    return this.digitalUsageGraphCache?.path || "";
  }

  getDigitalUsageYLabels(): string[] {
    this.updateDigitalUsageGraphCache();
    return (
      this.digitalUsageGraphCache?.labels || RaceEditorComponent.EMPTY_LABELS
    );
  }

  private updateDigitalPitGraphCache() {
    if (!this.editingRace?.digital_fuel_options) return;
    const options = this.editingRace.digital_fuel_options;
    const curveKey = JSON.stringify(options.custom_curve || []);
    const hiddenKey = Array.from(this.hiddenPlots.digital_pit).sort().join(",");
    const key = `${options.usage_type}_${options.usage_rate}_${options.capacity}_${curveKey}_${hiddenKey}`;

    if (this.digitalPitGraphCache && this.digitalPitGraphCache.argsKey === key)
      return;

    const capacity = Number(options.capacity) || 100;
    const usageRate = Number(options.usage_rate) || 0;

    const result = computeDigitalPitPlots(
      options.usage_type,
      usageRate,
      capacity,
      options.custom_curve,
      this.hiddenPlots.digital_pit,
    );

    const selectedPlot =
      result.plots.find((p) => p.isSelected) || result.plots[0];

    this.digitalPitGraphCache = {
      path: selectedPlot?.path || "",
      plots: result.plots,
      labels: result.labels,
      maxVal: result.safeMaxTime,
      argsKey: key,
    };
  }

  getDigitalPitPlots(): FuelGraphPlot[] {
    this.updateDigitalPitGraphCache();
    return this.digitalPitGraphCache?.plots || [];
  }

  getDigitalPitPath(): string {
    this.updateDigitalPitGraphCache();
    return this.digitalPitGraphCache?.path || "";
  }

  getDigitalPitXLabels(): string[] {
    this.updateDigitalPitGraphCache();
    return (
      this.digitalPitGraphCache?.labels || RaceEditorComponent.EMPTY_LABELS
    );
  }

  onGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    if (!this.editingRace?.fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width || 400;
    const height = rect.height || 150;

    const options = this.editingRace.fuel_options;
    const fastestTime = this.getFuelUsageFastestTime();
    const maxUsage = this.getFuelUsageMaxUsage();
    const slowestTime = this.getFuelUsageSlowestTime();
    const minUsage = this.getFuelUsageMinUsage();

    if (type === "usage") {
      this.updateUsageGraphCache();
      const maxVal = this.usageGraphCache?.maxVal || 1;
      this.hoveredPoint = calculateAnalogUsageHover(
        mouseX,
        mouseY,
        width,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        options.usage_type,
        options.custom_curve,
        maxVal,
        this.hiddenPlots.analog_usage,
      );
    } else {
      const capacity = Number(options.capacity) || 100;
      this.updatePitGraphCache();
      const maxVal = this.pitGraphCache?.maxVal || 1;
      this.hoveredPoint = calculateAnalogPitHover(
        mouseX,
        mouseY,
        height,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        options.usage_type,
        capacity,
        options.custom_curve,
        maxVal,
        this.hiddenPlots.analog_pit,
      );
    }
  }

  onDigitalGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    if (!this.editingRace?.digital_fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width || 400;
    const height = rect.height || 150;

    const options = this.editingRace.digital_fuel_options;
    const usageRate = Number(options.usage_rate) || 0;

    if (type === "usage") {
      this.updateDigitalUsageGraphCache();
      const maxVal = this.digitalUsageGraphCache?.maxVal || 1;
      this.hoveredPoint = calculateDigitalUsageHover(
        mouseX,
        mouseY,
        width,
        options.usage_type,
        usageRate,
        options.custom_curve,
        maxVal,
        this.hiddenPlots.digital_usage,
      );
    } else {
      const capacity = Number(options.capacity) || 100;
      this.updateDigitalPitGraphCache();
      const maxVal = this.digitalPitGraphCache?.maxVal || 1;
      this.hoveredPoint = calculateDigitalPitHover(
        mouseX,
        mouseY,
        height,
        options.usage_type,
        usageRate,
        capacity,
        options.custom_curve,
        maxVal,
        this.hiddenPlots.digital_pit,
      );
    }
  }

  onGraphMouseLeave() {
    this.hoveredPoint = null;
  }

  isCustomCurve(mode: "analog" | "digital"): boolean {
    if (mode === "analog") {
      const type = this.editingRace?.fuel_options?.usage_type;
      return isCustomCurveType(type);
    } else {
      const type = this.editingRace?.digital_fuel_options?.usage_type;
      return isCustomCurveType(type);
    }
  }

  onUsageTypeChange(mode: "analog" | "digital", newType: any) {
    if (mode === "analog") {
      this.hiddenPlots.analog_usage.delete(newType);
      this.hiddenPlots.analog_pit.delete(newType);
      if (isCustomCurveType(newType)) {
        if (
          !this.editingRace.fuel_options.custom_curve ||
          this.editingRace.fuel_options.custom_curve.length === 0
        ) {
          this.initAnalogCustomCurve(this.previousAnalogPreset);
        }
      } else {
        this.previousAnalogPreset = newType;
      }
      this.usageGraphCache = null;
      this.pitGraphCache = null;
    } else {
      this.hiddenPlots.digital_usage.delete(newType);
      this.hiddenPlots.digital_pit.delete(newType);
      if (isCustomCurveType(newType)) {
        if (
          !this.editingRace.digital_fuel_options.custom_curve ||
          this.editingRace.digital_fuel_options.custom_curve.length === 0
        ) {
          this.initDigitalCustomCurve(this.previousDigitalPreset);
        }
      } else {
        this.previousDigitalPreset = newType;
      }
      this.digitalUsageGraphCache = null;
      this.digitalPitGraphCache = null;
    }
  }

  initAnalogCustomCurve(
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ) {
    if (!this.editingRace?.fuel_options) return;
    const fastestTime = this.getFuelUsageFastestTime();
    const slowestTime = this.getFuelUsageSlowestTime();
    const maxUsage = this.getFuelUsageMaxUsage();
    const minUsage = this.getFuelUsageMinUsage();
    const preset =
      fromPreset === FuelUsageType.CUSTOM_CURVE ||
      fromPreset === "CUSTOM_CURVE" ||
      fromPreset === "CUSTOM"
        ? FuelUsageType.LINEAR
        : fromPreset;
    const points: FuelCurvePoint[] = [];
    const fractions = [0.0, 0.25, 0.5, 0.75, 1.0];
    const range = maxUsage - minUsage;
    for (const frac of fractions) {
      const time = fastestTime + frac * (slowestTime - fastestTime);
      const fuel = getAnalogFuelUsage(
        preset,
        fastestTime,
        maxUsage,
        slowestTime,
        minUsage,
        time,
      );
      const normY = range > 1e-6 ? (fuel - minUsage) / range : 1.0 - frac;
      points.push({ x: Number(frac.toFixed(2)), y: Number(normY.toFixed(3)) });
    }
    this.editingRace.fuel_options.custom_curve = points;
  }

  initDigitalCustomCurve(
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ) {
    if (!this.editingRace?.digital_fuel_options) return;
    const preset =
      fromPreset === FuelUsageType.CUSTOM_CURVE ||
      fromPreset === "CUSTOM_CURVE" ||
      fromPreset === "CUSTOM"
        ? FuelUsageType.LINEAR
        : fromPreset;
    const points: FuelCurvePoint[] = [];
    const fractions = [0.0, 0.25, 0.5, 0.75, 1.0];
    for (const frac of fractions) {
      const throttle = frac * 100;
      const fuel = getDigitalFuelUsage(preset, 1.0, throttle);
      points.push({ x: Number(frac.toFixed(2)), y: Number(fuel.toFixed(3)) });
    }
    this.editingRace.digital_fuel_options.custom_curve = points;
  }

  resetCustomCurveToPreset(
    mode: "analog" | "digital",
    preset: "LINEAR" | "QUADRATIC" | "CUBIC",
  ) {
    if (mode === "analog") {
      this.initAnalogCustomCurve(preset);
      this.usageGraphCache = null;
      this.pitGraphCache = null;
    } else {
      this.initDigitalCustomCurve(preset);
      this.digitalUsageGraphCache = null;
      this.digitalPitGraphCache = null;
    }
    this.captureState();
  }

  getAnalogCurveMaxMultiplier(): number {
    const points = this.editingRace?.fuel_options?.custom_curve;
    let maxP = 1.0;
    if (points && points.length > 0) {
      for (const p of points) {
        if (p.y > maxP) maxP = p.y;
      }
    }
    return Math.max(1.0, maxP);
  }

  getDigitalCurveMaxMultiplier(): number {
    const points = this.editingRace?.digital_fuel_options?.custom_curve;
    let maxP = 1.0;
    if (points && points.length > 0) {
      for (const p of points) {
        if (p.y > maxP) maxP = p.y;
      }
    }
    return Math.max(1.0, maxP);
  }

  getAnalogControlNodes(): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    const points: FuelCurvePoint[] =
      this.editingRace?.fuel_options?.custom_curve || [];
    const maxUsage = this.getFuelUsageMaxUsage();
    const minUsage = this.getFuelUsageMinUsage();
    this.updateUsageGraphCache();
    const maxFuelValue = this.usageGraphCache?.maxVal || Math.max(1, maxUsage);

    return points.map((p: FuelCurvePoint) => {
      const fuel = minUsage + p.y * (maxUsage - minUsage);
      const yRatio =
        maxFuelValue > 0 ? Math.max(0, Math.min(1.5, fuel / maxFuelValue)) : 0;
      return {
        svgX: Number((p.x * 400).toFixed(1)),
        svgY: Number((150 - yRatio * 150).toFixed(1)),
        x: p.x,
        y: p.y,
      };
    });
  }

  getDigitalControlNodes(): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    const points: FuelCurvePoint[] =
      this.editingRace?.digital_fuel_options?.custom_curve || [];
    return points.map((p: FuelCurvePoint) => ({
      svgX: Number((p.x * 400).toFixed(1)),
      svgY: Number((150 - p.y * 150).toFixed(1)),
      x: p.x,
      y: p.y,
    }));
  }

  startDragNode(
    event: MouseEvent | TouchEvent,
    mode: "analog" | "digital",
    index: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    this.draggingNode = { mode, index };
  }

  @HostListener("window:mousemove", ["$event"])
  @HostListener("window:touchmove", ["$event"])
  onWindowMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.draggingNode || !this.editingRace) return;

    const mode = this.draggingNode.mode;
    const index = this.draggingNode.index;
    const svgId =
      mode === "analog" ? "analog-fuel-usage-svg" : "digital-fuel-usage-svg";
    const svg = document.getElementById(
      svgId,
    ) as unknown as SVGSVGElement | null;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    const normX = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / (rect.width || 1)),
    );

    if (mode === "analog") {
      const points = this.editingRace.fuel_options?.custom_curve;
      if (!points || index < 0 || index >= points.length) return;

      const maxUsage = this.getFuelUsageMaxUsage();
      const minUsage = this.getFuelUsageMinUsage();
      this.updateUsageGraphCache();
      const maxFuelValue =
        this.usageGraphCache?.maxVal || Math.max(1, maxUsage);

      const mouseRatioY = 1 - (clientY - rect.top) / (rect.height || 1);
      const targetFuel = mouseRatioY * maxFuelValue;
      const range = maxUsage - minUsage;
      const rawY = range > 1e-6 ? (targetFuel - minUsage) / range : mouseRatioY;

      let newX = normX;
      if (index === 0) {
        newX = 0.0;
      } else if (index === points.length - 1) {
        newX = 1.0;
      } else {
        newX = Math.max(
          points[index - 1].x + 0.02,
          Math.min(points[index + 1].x - 0.02, normX),
        );
      }

      // Analog faster laps use >= fuel (monotonic non-increasing: y0 >= y1 >= y2 ...)
      const maxMult = this.getAnalogCurveMaxMultiplier();
      const upperY = index === 0 ? maxMult : points[index - 1].y;
      const lowerY = index === points.length - 1 ? 0.0 : points[index + 1].y;
      const newY = Math.max(lowerY, Math.min(upperY, rawY));

      points[index].x = Number(newX.toFixed(3));
      points[index].y = Number(newY.toFixed(3));

      this.usageGraphCache = null;
      this.pitGraphCache = null;
    } else {
      const points = this.editingRace.digital_fuel_options?.custom_curve;
      if (!points || index < 0 || index >= points.length) return;

      const rawY = 1 - (clientY - rect.top) / (rect.height || 1);

      let newX = normX;
      if (index === 0) {
        newX = 0.0;
      } else if (index === points.length - 1) {
        newX = 1.0;
      } else {
        newX = Math.max(
          points[index - 1].x + 0.02,
          Math.min(points[index + 1].x - 0.02, normX),
        );
      }

      // Digital higher throttle uses >= fuel (monotonic non-decreasing: y0 <= y1 <= y2 ...)
      const lowerY = index === 0 ? 0.0 : points[index - 1].y;
      const upperY = index === points.length - 1 ? 1.0 : points[index + 1].y;
      const newY = Math.max(lowerY, Math.min(upperY, rawY));

      points[index].x = Number(newX.toFixed(3));
      points[index].y = Number(newY.toFixed(3));

      this.digitalUsageGraphCache = null;
      this.digitalPitGraphCache = null;
    }
  }

  @HostListener("window:mouseup")
  @HostListener("window:touchend")
  onWindowMouseUp() {
    if (this.draggingNode) {
      this.draggingNode = null;
      this.captureState();
    }
  }

  onCurveSvgClick(event: MouseEvent, mode: "analog" | "digital") {
    if (this.draggingNode) return;
    const target = event.target as HTMLElement;
    if (target && target.classList?.contains("curve-handle")) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const clickNormX = (event.clientX - rect.left) / (rect.width || 1);

    if (mode === "analog") {
      if (!this.isCustomCurve("analog")) return;
      const points = this.editingRace?.fuel_options?.custom_curve;
      if (!points || points.length < 2) return;

      for (let i = 0; i < points.length - 1; i++) {
        if (
          clickNormX >= points[i].x + 0.03 &&
          clickNormX <= points[i + 1].x - 0.03
        ) {
          const interpY = interpolateFuelCurveClient(points, clickNormX);
          points.splice(i + 1, 0, {
            x: Number(clickNormX.toFixed(3)),
            y: Number(interpY.toFixed(3)),
          });
          this.usageGraphCache = null;
          this.pitGraphCache = null;
          this.captureState();
          break;
        }
      }
    } else {
      if (!this.isCustomCurve("digital")) return;
      const points = this.editingRace?.digital_fuel_options?.custom_curve;
      if (!points || points.length < 2) return;

      for (let i = 0; i < points.length - 1; i++) {
        if (
          clickNormX >= points[i].x + 0.03 &&
          clickNormX <= points[i + 1].x - 0.03
        ) {
          const interpY = interpolateFuelCurveClient(points, clickNormX);
          points.splice(i + 1, 0, {
            x: Number(clickNormX.toFixed(3)),
            y: Number(interpY.toFixed(3)),
          });
          this.digitalUsageGraphCache = null;
          this.digitalPitGraphCache = null;
          this.captureState();
          break;
        }
      }
    }
  }

  deleteControlNode(
    event: MouseEvent,
    mode: "analog" | "digital",
    index: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (mode === "analog") {
      const points = this.editingRace?.fuel_options?.custom_curve;
      if (
        !points ||
        points.length <= 2 ||
        index <= 0 ||
        index >= points.length - 1
      )
        return;
      points.splice(index, 1);
      this.usageGraphCache = null;
      this.pitGraphCache = null;
      this.captureState();
    } else {
      const points = this.editingRace?.digital_fuel_options?.custom_curve;
      if (
        !points ||
        points.length <= 2 ||
        index <= 0 ||
        index >= points.length - 1
      )
        return;
      points.splice(index, 1);
      this.digitalUsageGraphCache = null;
      this.digitalPitGraphCache = null;
      this.captureState();
    }
  }

  private buildRacePayload(race: any): any {
    const payload = deepCopy(race);
    payload["@id"] = 1;
    delete payload.track;
    return payload;
  }

  getHelpSteps(): GuideStep[] {
    return [
      ...this.getGeneralHelpSteps(),
      ...this.getHeatsHelpSteps(),
      ...this.getScoringHelpSteps(),
      ...this.getGroupsHelpSteps(),
      ...this.getStartMethodHelpSteps(),
      ...this.getTeamOptionsHelpSteps(),
      ...this.getAnalogFuelHelpSteps(),
      ...this.getDigitalFuelHelpSteps(),
      ...this.getSeasonPointsHelpSteps(),
    ];
  }

  private getGeneralBasicHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("RE_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("RE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#race-name-input",
        title: this.translationService.translate("RM_LABEL_NAME"),
        content: this.translationService.translate("RE_HELP_NAME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#heat-rotation-select",
        title: this.translationService.translate("RE_HELP_HEAT_ROTATION_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_HEAT_ROTATION_CONTENT",
        ),
        position: "right",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#heat-list-section",
        title: this.translationService.translate("RE_HELP_HEAT_LIST_TITLE"),
        content: this.translationService.translate("RE_HELP_HEAT_LIST_CONTENT"),
        position: "right",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#driver-count-section",
        title: this.translationService.translate("RE_HELP_DRIVER_COUNT_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_DRIVER_COUNT_CONTENT",
        ),
        position: "right",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#track-select",
        title: this.translationService.translate("RM_LABEL_TRACK"),
        content: this.translationService.translate("RE_HELP_TRACK_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
    ];
  }

  private getGeneralAdvancedHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#theme-select",
        title: this.translationService.translate("RM_LABEL_THEME"),
        content: this.translationService.translate("RE_HELP_THEME_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#min-lap-time-input",
        title: this.translationService.translate("RE_HELP_MIN_LAP_TIME_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_MIN_LAP_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#drift-time-input",
        title: this.translationService.translate("RE_HELP_DRIFT_TIME_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_DRIFT_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#practice-input",
        title: this.translationService.translate("RE_HELP_PRACTICE_TITLE"),
        content: this.translationService.translate("RE_HELP_PRACTICE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
      {
        selector: "#adjust-drift-laps-input",
        title: this.translationService.translate(
          "RE_HELP_ADJUST_DRIFT_LAPS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_ADJUST_DRIFT_LAPS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.general) {
            this.sectionsExpanded.general = true;
          }
        },
      },
    ];
  }

  private getGeneralHelpSteps(): GuideStep[] {
    return [
      ...this.getGeneralBasicHelpSteps(),
      ...this.getGeneralAdvancedHelpSteps(),
    ];
  }

  private getStartMethodTimingHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#start-time-input",
        title: this.translationService.translate("RE_HELP_START_TIME_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_START_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-time-input",
        title: this.translationService.translate("RE_HELP_RESTART_TIME_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_RESTART_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#start-randomizer-input",
        title: this.translationService.translate(
          "RE_HELP_START_RANDOMIZER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_START_RANDOMIZER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-randomizer-input",
        title: this.translationService.translate(
          "RE_HELP_RESTART_RANDOMIZER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_RESTART_RANDOMIZER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#start-behind-sensor-input",
        title: this.translationService.translate(
          "RE_HELP_START_BEHIND_SENSOR_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_START_BEHIND_SENSOR_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
    ];
  }

  private getStartMethodPenaltyHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#start-at-current-input",
        title: this.translationService.translate(
          "RE_HELP_START_AT_CURRENT_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_START_AT_CURRENT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#hot-start-input",
        title: this.translationService.translate("RE_HELP_HOT_START_TITLE"),
        content: this.translationService.translate("RE_HELP_HOT_START_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#restart-on-false-start-input",
        title: this.translationService.translate(
          "RE_HELP_RESTART_ON_FALSE_START_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_RESTART_ON_FALSE_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#false-start-lap-penalty-input",
        title: this.translationService.translate(
          "RE_HELP_FALSE_START_LAP_PENALTY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FALSE_START_LAP_PENALTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
      {
        selector: "#false-start-time-penalty-input",
        title: this.translationService.translate(
          "RE_HELP_FALSE_START_TIME_PENALTY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FALSE_START_TIME_PENALTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.start_method) {
            this.sectionsExpanded.start_method = true;
          }
        },
      },
    ];
  }

  private getStartMethodHelpSteps(): GuideStep[] {
    return [
      ...this.getStartMethodTimingHelpSteps(),
      ...this.getStartMethodPenaltyHelpSteps(),
    ];
  }

  private getHeatScoringHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#heat-ranking-select",
        title: this.translationService.translate("RE_HELP_HEAT_RANKING_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_HEAT_RANKING_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#heat-tiebreaker-select",
        title: this.translationService.translate(
          "RE_HELP_HEAT_TIEBREAKER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_HEAT_TIEBREAKER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#finish-method-select",
        title: this.translationService.translate("RE_HELP_FINISH_METHOD_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_FINISH_METHOD_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#finish-value-input",
        title: this.translationService.translate("RE_HELP_FINISH_VALUE_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_FINISH_VALUE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#allow-finish-select",
        title: this.translationService.translate("RE_HELP_ALLOW_FINISH_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_ALLOW_FINISH_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
    ];
  }

  private getOverallScoringHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#overall-ranking-select",
        title: this.translationService.translate(
          "RE_HELP_OVERALL_RANKING_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_OVERALL_RANKING_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#overall-tiebreaker-select",
        title: this.translationService.translate(
          "RE_HELP_OVERALL_TIEBREAKER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_OVERALL_TIEBREAKER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
      {
        selector: "#dropped-heats-input",
        title: this.translationService.translate("RE_HELP_DROPPED_HEATS_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_DROPPED_HEATS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.scoring) {
            this.sectionsExpanded.scoring = true;
          }
        },
      },
    ];
  }

  private getScoringHelpSteps(): GuideStep[] {
    return [
      ...this.getHeatScoringHelpSteps(),
      ...this.getOverallScoringHelpSteps(),
    ];
  }

  private getSeasonPointsPrimaryHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#season-position-points-section",
        title: this.translationService.translate(
          "RE_HELP_SEASON_POSITION_POINTS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_POSITION_POINTS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-position-points-section",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_POSITION_POINTS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_POSITION_POINTS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-carry-over-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_CARRY_OVER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_CARRY_OVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-fastest-lap-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }

  private getSeasonPointsSecondaryHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#season-overall-fastest-lap-lane-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_LANE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_FASTEST_LAP_LANE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-most-laps-led-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_MOST_LAPS_LED_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_MOST_LAPS_LED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-overall-led-lap-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_LED_LAP_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_LED_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }

  private getSeasonPointsBonusHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#season-overall-one-bonus-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_ONE_BONUS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_OVERALL_ONE_BONUS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-carry-over-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_CARRY_OVER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_CARRY_OVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-fastest-lap-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_FASTEST_LAP_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_FASTEST_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-most-laps-led-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_MOST_LAPS_LED_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_MOST_LAPS_LED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-led-lap-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_LED_LAP_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_LED_LAP_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
      {
        selector: "#season-heat-one-bonus-input",
        title: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_ONE_BONUS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_SEASON_HEAT_ONE_BONUS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.season_points) {
            this.sectionsExpanded.season_points = true;
          }
        },
      },
    ];
  }

  private getSeasonPointsHelpSteps(): GuideStep[] {
    return [
      ...this.getSeasonPointsPrimaryHelpSteps(),
      ...this.getSeasonPointsSecondaryHelpSteps(),
      ...this.getSeasonPointsBonusHelpSteps(),
    ];
  }

  private getHeatsHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#auto-advance-time-input",
        title: this.translationService.translate(
          "RE_HELP_AUTO_ADVANCE_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_AUTO_ADVANCE_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-advance-warmup-time-input",
        title: this.translationService.translate(
          "RE_HELP_AUTO_ADVANCE_WARMUP_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_AUTO_ADVANCE_WARMUP_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-start-time-input",
        title: this.translationService.translate(
          "RE_HELP_AUTO_START_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_AUTO_START_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#auto-start-warmup-time-input",
        title: this.translationService.translate(
          "RE_HELP_AUTO_START_WARMUP_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_AUTO_START_WARMUP_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#heat-times-through-input",
        title: this.translationService.translate(
          "RE_HELP_HEAT_TIMES_THROUGH_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_HEAT_TIMES_THROUGH_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
      {
        selector: "#reverse-heats-input",
        title: this.translationService.translate("RE_HELP_REVERSE_HEATS_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_REVERSE_HEATS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.heats) {
            this.sectionsExpanded.heats = true;
          }
        },
      },
    ];
  }

  private getGroupsBasicHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#groups-enabled-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_ENABLED_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_ENABLED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-max-input",
        title: this.translationService.translate("RE_HELP_GROUPS_MAX_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_MAX_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-balance-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_BALANCE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_BALANCE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-allow-empty-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_ALLOW_EMPTY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_ALLOW_EMPTY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
    ];
  }

  private getGroupsAdvancingHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#groups-force-multiple-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_FORCE_MULTIPLE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_FORCE_MULTIPLE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-rotate-heats-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_ROTATE_HEATS_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_ROTATE_HEATS_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-min-advancing-input",
        title: this.translationService.translate(
          "RE_HELP_GROUPS_MIN_ADVANCING_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_MIN_ADVANCING_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
      {
        selector: "#groups-names-section",
        title: this.translationService.translate("RE_HELP_GROUPS_NAMES_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_GROUPS_NAMES_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.groups) {
            this.sectionsExpanded.groups = true;
          }
        },
      },
    ];
  }

  private getGroupsHelpSteps(): GuideStep[] {
    return [
      ...this.getGroupsBasicHelpSteps(),
      ...this.getGroupsAdvancingHelpSteps(),
    ];
  }

  private getAnalogFuelRateHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#fuel-enabled-input",
        title: this.translationService.translate("RE_HELP_FUEL_ENABLED_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_FUEL_ENABLED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-usage-type-select",
        title: this.translationService.translate(
          "RE_HELP_FUEL_USAGE_TYPE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_USAGE_TYPE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-fastest-time-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_FASTEST_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_FASTEST_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-max-usage-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_MAX_USAGE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_MAX_USAGE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-slowest-time-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_SLOWEST_TIME_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_SLOWEST_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-min-usage-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_MIN_USAGE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_MIN_USAGE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
    ];
  }

  private getAnalogFuelTankHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#fuel-capacity-input",
        title: this.translationService.translate("RE_HELP_FUEL_CAPACITY_TITLE"),
        content: this.translationService.translate(
          "RE_HELP_FUEL_CAPACITY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-start-level-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_START_LEVEL_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_START_LEVEL_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-refuel-rate-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_REFUEL_RATE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_REFUEL_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-pit-delay-input",
        title: this.translationService.translate(
          "RE_HELP_FUEL_PIT_DELAY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_FUEL_PIT_DELAY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-reset-at-start-input",
        title: this.translationService.translate(
          "RE_HELP_RESET_FUEL_AT_START_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_RESET_FUEL_AT_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-out-of-fuel-action-select",
        title: this.translationService.translate(
          "RE_HELP_OUT_OF_FUEL_ACTION_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_OUT_OF_FUEL_ACTION_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_analog) {
            this.sectionsExpanded.fuel_analog = true;
          }
        },
      },
    ];
  }

  private getAnalogFuelHelpSteps(): GuideStep[] {
    return [
      ...this.getAnalogFuelRateHelpSteps(),
      ...this.getAnalogFuelTankHelpSteps(),
    ];
  }

  private getDigitalFuelRateHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#digital-fuel-enabled-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_ENABLED_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_ENABLED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-usage-type-select",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_TYPE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_TYPE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-usage-rate-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_RATE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-capacity-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_CAPACITY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_CAPACITY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
    ];
  }

  private getDigitalFuelTankHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#digital-fuel-start-level-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_START_LEVEL_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_START_LEVEL_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-refuel-rate-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_REFUEL_RATE_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_REFUEL_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-pit-delay-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_PIT_DELAY_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_FUEL_PIT_DELAY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-reset-at-start-input",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_RESET_FUEL_AT_START_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_RESET_FUEL_AT_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-out-of-fuel-action-select",
        title: this.translationService.translate(
          "RE_HELP_DIGITAL_OUT_OF_FUEL_ACTION_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_DIGITAL_OUT_OF_FUEL_ACTION_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.fuel_digital) {
            this.sectionsExpanded.fuel_digital = true;
          }
        },
      },
    ];
  }

  private getDigitalFuelHelpSteps(): GuideStep[] {
    return [
      ...this.getDigitalFuelRateHelpSteps(),
      ...this.getDigitalFuelTankHelpSteps(),
    ];
  }

  private getTeamOptionsHelpSteps(): GuideStep[] {
    return [
      {
        selector: "#team-pit-stop-change-driver-input",
        title: this.translationService.translate(
          "RE_HELP_TEAM_PIT_STOP_CHANGE_DRIVER_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_TEAM_PIT_STOP_CHANGE_DRIVER_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.team) {
            this.sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-heat-lap-limit-input",
        title: this.translationService.translate(
          "RE_HELP_TEAM_HEAT_LAP_LIMIT_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_TEAM_HEAT_LAP_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.team) {
            this.sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-heat-time-limit-input",
        title: this.translationService.translate(
          "RE_HELP_TEAM_HEAT_TIME_LIMIT_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_TEAM_HEAT_TIME_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.team) {
            this.sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-overall-lap-limit-input",
        title: this.translationService.translate(
          "RE_HELP_TEAM_OVERALL_LAP_LIMIT_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_TEAM_OVERALL_LAP_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.team) {
            this.sectionsExpanded.team = true;
          }
        },
      },
      {
        selector: "#team-overall-time-limit-input",
        title: this.translationService.translate(
          "RE_HELP_TEAM_OVERALL_TIME_LIMIT_TITLE",
        ),
        content: this.translationService.translate(
          "RE_HELP_TEAM_OVERALL_TIME_LIMIT_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!this.sectionsExpanded.team) {
            this.sectionsExpanded.team = true;
          }
        },
      },
    ];
  }

  addSeasonPositionPoint(): void {
    if (!this.editingRace) return;
    if (!this.editingRace.season_scoring) {
      this.editingRace.season_scoring = {
        position_points: [],
        heat_position_points: [],
      };
    }
    if (!this.editingRace.season_scoring.position_points) {
      this.editingRace.season_scoring.position_points = [];
    }
    this.editingRace.season_scoring.position_points.push(0);
    this.captureState();
    this.scrollPositionPointsToBottom();
  }

  private scrollPositionPointsToBottom(): void {
    setTimeout(() => {
      if (this.seasonPositionPointsList?.nativeElement) {
        this.seasonPositionPointsList.nativeElement.scrollTop =
          this.seasonPositionPointsList.nativeElement.scrollHeight;
      }
    }, 0);
  }

  removeSeasonPositionPoint(index: number): void {
    if (
      !this.editingRace ||
      !this.editingRace.season_scoring ||
      !this.editingRace.season_scoring.position_points
    )
      return;
    this.editingRace.season_scoring.position_points.splice(index, 1);
    this.captureState();
  }

  syncHeatPositionPoints(): void {
    if (!this.editingRace) return;
    if (!this.editingRace.season_scoring) {
      this.editingRace.season_scoring = {
        position_points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        heat_position_points: [],
      };
    }
    if (!Array.isArray(this.editingRace.season_scoring.heat_position_points)) {
      this.editingRace.season_scoring.heat_position_points = [];
    }

    const track = this.tracks.find(
      (t) => t.entity_id === this.editingRace?.track_entity_id,
    );
    if (!track) return;

    const laneCount = track.lanes ? track.lanes.length : 0;
    const currentPoints = this.editingRace.season_scoring.heat_position_points;

    if (currentPoints.length === 0 && laneCount > 0) {
      const defaultPoints = [3, 2, 1, 0];
      const initialPoints = defaultPoints.slice(0, laneCount);
      while (initialPoints.length < laneCount) {
        initialPoints.push(0);
      }
      this.editingRace.season_scoring.heat_position_points = initialPoints;
    } else if (currentPoints.length < laneCount) {
      while (currentPoints.length < laneCount) {
        currentPoints.push(0);
      }
    } else if (currentPoints.length > laneCount) {
      this.editingRace.season_scoring.heat_position_points =
        currentPoints.slice(0, laneCount);
    }
  }

  startHelp() {
    this.helpService.startGuide(this.getHelpSteps());
  }
}

export {
  getAnalogFuelUsage,
  getDigitalFuelUsage,
  interpolateFuelCurveClient,
} from "./fuel-graph.helper";
