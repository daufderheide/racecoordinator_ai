/* eslint-disable max-lines */
import { Location } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { HeatListComponent } from "@app/components/shared/heat-list/heat-list.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { FuelUsageType } from "@app/models/fuel_options";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
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

@Component({
  standalone: true,
  selector: "app-race-editor",
  templateUrl: "./race-editor.component.html",
  styleUrls: ["./race-editor.component.css"],
  imports: [
    AcknowledgementModalComponent,
    EditorTitleComponent,
    FormsModule,
    HeatListComponent,
    TranslatePipe,
    ConfirmationModalComponent,
  ],
})
export class RaceEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  editingRace: any;
  originalRace: any;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;
  undoManager: UndoManager<any>;
  tracks: Track[] = [];
  races: any[] = [];
  driverCount: number = 4;
  generatedHeats: any[] = [];
  customRotationAssets: any[] = [];
  selectedCustomRotationAssetId: string = "";
  customSequenceText: string = "";

  heatRotationTypes = [
    "RoundRobin",
    "Bracket",
    "Swiss",
    "CustomRoundRobin",
    "Custom",
  ];
  raceScoringTypes = ["Points", "Time"];

  private static readonly EMPTY_LABELS: string[] = [];
  private subscriptions: Subscription[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  // Acknowledgement modal properties
  showAckModal: boolean = false;
  ackModalTitle: string = "";
  ackModalMessage: string = "";

  sectionsExpanded = {
    general: true,
    start_method: true,
    scoring: true,
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
    this.isNavigationApproved = true;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(true);
      this.pendingDeactivate = null;
    }
  }

  onCancelDiscard() {
    this.showDiscardConfirm = false;
    if (this.pendingDeactivate) {
      this.pendingDeactivate(false);
      this.pendingDeactivate = null;
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
    this.router.navigate(["/race-manager"], {
      queryParams: {
        id: this.editingRace?.entity_id,
        driverCount: this.driverCount,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
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

    // Get driver count from query param, then localStorage, then default to 4
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
                if (id && id !== "new") {
                  this.loadRace(id);
                } else {
                  this.createNewRace();
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
            if (id && id !== "new") {
              this.loadRace(id);
            } else {
              this.createNewRace();
            }
          }
        }),
      );
    } else {
      const id = this.route.snapshot.queryParamMap.get("id");
      if (id && id !== "new") {
        this.loadRace(id);
      } else {
        this.createNewRace();
      }
    }
    this.loadTracks();
    this.loadRaces();
    this.loadCustomRotationAssets();

    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe(() => {
        this.autoSaveRace();
      }),
    );
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

  /* eslint-disable max-lines-per-function */
  loadRace(id: string) {
    this.isNavigationApproved = false;
    this.isLoading = true;
    this.dataService.getRaces().subscribe({
      next: (races) => {
        const race = races.find((r) => r.entity_id === id);
        if (race) {
          this.editingRace = {
            ...deepCopy(race),
            auto_advance_time: race.auto_advance_time || 0,
            auto_start_time: race.auto_start_time || 0,
            auto_advance_warmup_time: race.auto_advance_warmup_time || 0,
            auto_start_warmup_time: race.auto_start_warmup_time || 0,
            drift_time: race.drift_time ?? 0.5,
            min_lap_time: race.min_lap_time ?? 1.5,
            start_time: race.start_time ?? 5.0,
            restart_time: race.restart_time ?? 5.0,
            start_randomizer: race.start_randomizer ?? race.start_delay ?? 0.0,
            restart_randomizer:
              race.restart_randomizer ?? race.restart_delay ?? 0.0,
            solo_lane_index: race.solo_lane_index ?? 0,
            custom_rotation_sequence:
              race.custom_rotation_sequence ||
              race.customRotationSequence ||
              [],
            custom_rotation_asset_id:
              race.custom_rotation_asset_id || race.customRotationAssetId,
            custom_rotations:
              race.custom_rotations || race.customRotations || [],
            heat_times_through: race.heat_times_through || 1,
            reverse_heats: race.reverse_heats || false,
            hot_start: race.hot_start || false,
            restart_on_false_start: race.restart_on_false_start || false,
            start_behind_sensor: race.start_behind_sensor ?? true,
            false_start_lap_penalty: race.false_start_lap_penalty || 0,
            false_start_time_penalty: race.false_start_time_penalty || 0,
            group_options: {
              enabled: race.group_options?.enabled ?? false,
              max_groups: race.group_options?.max_groups ?? 2,
              balance: race.group_options?.balance ?? true,
              allow_empty_lanes: race.group_options?.allow_empty_lanes ?? false,
              force_multiple_of_max:
                race.group_options?.force_multiple_of_max ?? false,
              rotate_group_heats:
                race.group_options?.rotate_group_heats ?? false,
              min_advancing: race.group_options?.min_advancing ?? 0,
            },
          };
          if (!this.editingRace.heat_scoring) {
            this.editingRace.heat_scoring = {
              finish_method: "Lap",
              finish_value: 10,
              heat_ranking: "LAP_COUNT",
              heat_ranking_tiebreaker: "FASTEST_LAP_TIME",
              allow_finish: "None",
            };
          }
          if (!this.editingRace.overall_scoring) {
            this.editingRace.overall_scoring = {
              dropped_heats: 0,
              ranking_method: "LAP_COUNT",
              tiebreaker: "FASTEST_LAP_TIME",
            };
          }
          if (!this.editingRace.fuel_options) {
            this.editingRace.fuel_options = {
              enabled: false,
              reset_fuel_at_heat_start: false,
              end_heat_on_out_of_fuel: false,
              capacity: 100,
              usage_type: FuelUsageType.LINEAR,
              usage_rate: 4.0,
              start_level: 100,
              refuel_rate: 10,
              pit_stop_delay: 2.0,
              reference_time: 6.0,
            };
          }
          if (!this.editingRace.team_options) {
            this.editingRace.team_options = {
              heat_lap_limit: 0,
              heat_time_limit: 0,
              overall_lap_limit: 0,
              overall_time_limit: 0,
              require_pit_stop_change_driver: false,
            };
          }
          if (!this.editingRace.custom_rotation_sequence) {
            this.editingRace.custom_rotation_sequence = [];
          }
          if (!this.editingRace.custom_rotations) {
            this.editingRace.custom_rotations = [];
          }
        } else {
          this.createNewRace();
        }
        if (!this.editingRace.digital_fuel_options) {
          this.editingRace.digital_fuel_options = {
            enabled: false,
            reset_fuel_at_heat_start: false,
            end_heat_on_out_of_fuel: false,
            capacity: 100,
            usage_type: FuelUsageType.LINEAR,
            usage_rate: 4.0,
            start_level: 100,
            refuel_rate: 10,
            pit_stop_delay: 2.0,
          };
        }
        this.enforceFuelRules();
        this.originalRace = deepCopy(this.editingRace);
        this.undoManager.initialize(this.editingRace);
        this.syncSelectedCustomRotationAsset();
        // Load heats if we have a valid race
        if (this.driverCount > 0) {
          this.loadHeats();
        }
        this.syncSequenceTextFromModel();
        this.isLoading = false;
        // Safe to call here - triggered by async data load, not user input
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error: any) => {
        this.logger.error("Failed to load race", error);
        this.isLoading = false;
      },
    });
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
          this.originalRace = deepCopy(this.editingRace);
          this.undoManager.initialize(this.editingRace);
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

  createNewRace() {
    this.isNavigationApproved = false;
    this.editingRace = {
      entity_id: "new",
      name: "",
      track_entity_id: this.tracks.length > 0 ? this.tracks[0].entity_id : "",
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
        end_heat_on_out_of_fuel: false,
        capacity: 100,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        reference_time: 6.0,
      },
      digital_fuel_options: {
        enabled: false,
        reset_fuel_at_heat_start: false,
        end_heat_on_out_of_fuel: false,
        usage_type: FuelUsageType.LINEAR,
        usage_rate: 4.0,
        start_level: 100,
        refuel_rate: 10,
        pit_stop_delay: 2.0,
        capacity: 100,
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
      false_start_lap_penalty: 0,
      false_start_time_penalty: 0,
      group_options: {
        enabled: false,
        max_groups: 2,
        balance: true,
        allow_empty_lanes: false,
        force_multiple_of_max: false,
        rotate_group_heats: false,
        min_advancing: 0,
      },
    };
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

  captureState() {
    this.validateWarmupTimes();
    this.validateHeatConfigurations();
    this.enforceFuelRules();
    this.syncSelectedCustomRotationAsset();
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
    if (!this.editingRace || !this.isDirtyState()) {
      return;
    }

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    const payload = this.buildRacePayload(this.editingRace);
    this.logger.debug("Updating race with payload:", payload);

    if (this.editingRace.entity_id === "new") {
      this.dataService.createRace(payload).subscribe({
        next: (created) => {
          this.isSaving = false;
          this.isAutoSaving = false;
          this.navigationService.setLastEditedId("race", created.entity_id);
          // Update the current race to the newly created one
          this.editingRace.entity_id = created.entity_id;
          this.originalRace = deepCopy(this.editingRace);
          this.undoManager.resetTracking(this.editingRace);
          this.loadRaces(); // Reload races to update duplicate detection
          this.cdr.detectChanges(); // Ensure spinner clears

          if (this.navigateBackOnSave) {
            this.onBack();
          } else if (isAutoSave) {
            const url = this.router.serializeUrl(
              this.router.createUrlTree([], {
                queryParams: {
                  id: created.entity_id,
                  driverCount: this.driverCount,
                  from: this.route.snapshot.queryParamMap.get("from"),
                  returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
                },
              }),
            );
            this.location.replaceState(url);
          } else {
            this.onBack();
          }
        },
        error: (error: any) => {
          this.logger.error("Failed to create race", error);
          if (!isAutoSave)
            this.showError(
              "Error Creating Race",
              error.error || error.message || "Unknown error",
            );
          this.isSaving = false;
          this.isAutoSaving = false;
          this.loadRaces(); // Reload races after error
          this.cdr.detectChanges(); // Ensure spinner clears
        },
      });
    } else {
      this.dataService
        .updateRace(this.editingRace.entity_id, payload)
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.isAutoSaving = false;
            this.navigationService.setLastEditedId(
              "race",
              this.editingRace.entity_id,
            );
            // Sync originalRace with editingRace so isDirtyState() returns false
            this.originalRace = deepCopy(this.editingRace);
            // Reset tracking point but keep history
            this.undoManager.resetTracking(this.editingRace);
            this.loadRaces(); // Reload races to update duplicate detection
            this.cdr.detectChanges(); // Force change detection to hide spinner

            if (this.navigateBackOnSave) {
              this.onBack();
            }
          },
          error: (error: any) => {
            this.logger.error("Failed to update race", error);
            if (!isAutoSave)
              this.showError(
                "Error Updating Race",
                error.error || error.message || "Unknown error",
              );
            this.isSaving = false;
            this.isAutoSaving = false;
            this.loadRaces(); // Reload races after error
            this.cdr.detectChanges(); // Force change detection to hide spinner
          },
        });
    }
  }

  saveAsNew() {
    if (!this.editingRace || !this.canSaveAsNew()) return;

    this.isSaving = true;
    this.editingRace.name = this.generateUniqueName(this.editingRace.name);
    const payload = this.buildRacePayload(this.editingRace);

    this.dataService.createRace(payload).subscribe({
      next: (created) => {
        this.isSaving = false;
        this.navigationService.setLastEditedId("race", created.entity_id);
        // Update the current race to the newly created one
        this.editingRace = created;
        this.originalRace = deepCopy(created);
        // Reset tracking point but keep history
        this.undoManager.resetTracking(this.editingRace);
        // Reload heats for the new race
        this.loadHeats();
        // Reload races to update duplicate detection
        this.loadRaces();
        // Force change detection
        this.cdr.detectChanges();
        // Update URL without navigation
        this.router.navigate([], {
          queryParams: { id: created.entity_id, driverCount: this.driverCount },
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
        // Reload races to update duplicate detection
        this.loadRaces();
        // Force change detection for modal visibility
        this.cdr.detectChanges();
      },
    });
  }

  private transformCustomRotationsToSnakeCase(rotations: any[]): any[] {
    return (rotations || []).map((rot) => ({
      num_drivers: rot.numDrivers ?? rot.num_drivers,
      heats: (rot.heats || []).map((h: any) => ({
        driver_indices: h.driverIndices ?? h.driver_indices,
      })),
    }));
  }

  loadRaces() {
    this.dataService.getRaces().subscribe({
      next: (races) => {
        this.races = races;
      },
      error: (error: any) => {
        this.logger.error("Failed to load races", error);
        this.races = [];
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

  private generateUniqueName(baseName: string): string {
    let counter = 1;
    const pattern = /(_\d+)$/;
    const base = baseName.replace(pattern, "");

    while (true) {
      const candidate = `${base}_${counter}`;
      if (
        !this.races.some(
          (r) => r.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  canSaveAsNew(): boolean {
    if (!this.editingRace?.name) {
      return false;
    }
    return true;
  }

  canUpdate(): boolean {
    // Must have changes
    if (!this.isDirtyState()) {
      return false;
    }

    // And the name must not be a duplicate and rotation must be valid
    return !this.isNameDuplicate() && !this.isRotationInvalid;
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
  hoveredPoint: {
    svgX: number;
    svgY: number;
    screenX: number;
    screenY: number;
    time: number;
    value: number;
    type: "usage" | "pit" | "digital_usage" | "digital_pit";
  } | null = null;

  // Cache for graph performance
  private usageGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private pitGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private digitalUsageGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private digitalPitGraphCache: {
    path: string;
    labels: string[];
    maxVal: number;
    argsKey: string;
  } | null = null;

  private getMaxFuelUsage(): number {
    if (!this.editingRace?.fuel_options) return 1;
    const usageRate = this.editingRace.fuel_options.usage_rate || 0;
    const usageType = this.editingRace.fuel_options.usage_type;
    const minTime = 2;
    const referenceTime =
      Number(this.editingRace.fuel_options.reference_time) || 6;

    let maxFuel = getAnalogFuelUsage(
      usageType,
      usageRate,
      minTime,
      referenceTime,
    );

    if (isNaN(maxFuel) || !isFinite(maxFuel)) maxFuel = 0;
    return maxFuel <= 0 ? 1 : maxFuel;
  }

  private updateUsageGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}_${options.reference_time}`;

    if (this.usageGraphCache && this.usageGraphCache.argsKey === key) return;

    const maxFuelValue = this.getMaxFuelUsage();
    const width = 400;
    const height = 150;
    const minTime = 2;
    const maxTime = 15;
    const usageRate = options.usage_rate || 0;
    const usageType = options.usage_type;
    const referenceTime = Number(options.reference_time) || 6;

    const points: string[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const time = minTime + (i / steps) * (maxTime - minTime);
      const fuel = getAnalogFuelUsage(
        usageType,
        usageRate,
        time,
        referenceTime,
      );
      const x = (i / steps) * width;
      const yRatio =
        maxFuelValue > 0 ? Math.max(0, Math.min(1.5, fuel / maxFuelValue)) : 0;
      const y = height - yRatio * height;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const labels = [];
    for (let i = 4; i >= 0; i--) {
      labels.push(((maxFuelValue * i) / 4).toFixed(2));
    }

    this.usageGraphCache = {
      path: `M ${points.join(" L ")}`,
      labels: labels,
      maxVal: maxFuelValue,
      argsKey: key,
    };
  }

  private getMaxPitTime(): number {
    if (!this.editingRace?.fuel_options) return 3600;
    const usageRate = Number(this.editingRace.fuel_options.usage_rate) || 0;
    const capacity = Number(this.editingRace.fuel_options.capacity) || 100;
    const usageType = this.editingRace.fuel_options.usage_type;
    const referenceTime =
      Number(this.editingRace.fuel_options.reference_time) || 6;
    const maxTime = 15;

    if (usageRate <= 0) return 3600;

    const minFuel = getAnalogFuelUsage(
      usageType,
      usageRate,
      maxTime,
      referenceTime,
    );
    if (minFuel <= 0) return 3600;

    const pitTimeSeconds = (capacity / minFuel) * maxTime;
    const safePitTime =
      isNaN(pitTimeSeconds) || !isFinite(pitTimeSeconds)
        ? 3600
        : Math.min(3600, pitTimeSeconds);
    return Math.max(1, safePitTime);
  }

  private updatePitGraphCache() {
    if (!this.editingRace?.fuel_options) return;

    const options = this.editingRace.fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}_${options.reference_time}_${options.capacity}`;

    if (this.pitGraphCache && this.pitGraphCache.argsKey === key) return;

    const maxPitTime = this.getMaxPitTime();
    const width = 400;
    const height = 150;
    const minLapTime = 2;
    const maxLapTime = 15;
    const capacity = Number(options.capacity) || 100;
    const usageRate = Number(options.usage_rate) || 0;
    const usageType = options.usage_type;
    const referenceTime = Number(options.reference_time) || 6;

    const points: string[] = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const lapTime = minLapTime + (i / steps) * (maxLapTime - minLapTime);
      const fuelPerLap = getAnalogFuelUsage(
        usageType,
        usageRate,
        lapTime,
        referenceTime,
      );

      let pitTimeSeconds = 0;
      if (fuelPerLap > 0) {
        pitTimeSeconds = (capacity / fuelPerLap) * lapTime;
      } else {
        pitTimeSeconds = maxPitTime;
      }

      const y = height - (i / steps) * height; // 2s at bottom, 15s at top
      const xPercent =
        maxPitTime > 0
          ? Math.max(0, Math.min(1, pitTimeSeconds / maxPitTime))
          : 1;
      const x = xPercent * width;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      labels.push(Math.round((maxPitTime * i) / 4).toString());
    }

    this.pitGraphCache = {
      path: `M ${points.join(" L ")}`,
      labels: labels,
      maxVal: maxPitTime,
      argsKey: key,
    };
  }

  private getMaxDigitalFuelUsage(): number {
    if (!this.editingRace?.digital_fuel_options) return 1;
    const usageRate =
      Number(this.editingRace.digital_fuel_options.usage_rate) || 0;
    const _usageType = this.editingRace.digital_fuel_options.usage_type;
    return usageRate <= 0 ? 1 : usageRate;
  }

  private updateDigitalUsageGraphCache() {
    if (!this.editingRace?.digital_fuel_options) return;
    const options = this.editingRace.digital_fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}`;

    if (
      this.digitalUsageGraphCache &&
      this.digitalUsageGraphCache.argsKey === key
    )
      return;

    const maxFuelValue = this.getMaxDigitalFuelUsage();
    const width = 400;
    const height = 150;
    const points: string[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const throttle = (i / steps) * 100;
      const fuel = getDigitalFuelUsage(
        options.usage_type,
        options.usage_rate,
        throttle,
      );
      const x = (i / steps) * width;
      const yRatio =
        maxFuelValue > 0
          ? Math.max(0, Math.min(1.5, fuel / Math.max(0.001, maxFuelValue)))
          : 0;
      const y = height - yRatio * height;
      points.push(`${(x || 0).toFixed(1)},${(y || 0).toFixed(1)}`);
    }

    const labels = [];
    for (let i = 4; i >= 0; i--) {
      labels.push(((maxFuelValue * i) / 4).toFixed(2));
    }

    this.digitalUsageGraphCache = {
      path: `M ${points.join(" L ")}`,
      labels: labels,
      maxVal: maxFuelValue,
      argsKey: key,
    };
  }

  private getMaxDigitalPitTime(): number {
    if (!this.editingRace?.digital_fuel_options) return 3600;
    const usageRate =
      Number(this.editingRace.digital_fuel_options.usage_rate) || 0;
    const capacity =
      Number(this.editingRace.digital_fuel_options.capacity) || 100;
    if (usageRate <= 0) return 3600;
    return Math.max(1, (capacity / usageRate) * 10); // arbitrary max based on full throttle
  }

  private updateDigitalPitGraphCache() {
    if (!this.editingRace?.digital_fuel_options) return;
    const options = this.editingRace.digital_fuel_options;
    const key = `${options.usage_type}_${options.usage_rate}_${options.capacity}`;

    if (this.digitalPitGraphCache && this.digitalPitGraphCache.argsKey === key)
      return;

    const capacity = Number(options.capacity) || 100;
    const usageRate = Number(options.usage_rate) || 0;
    const usageType = options.usage_type;

    // We want to show 0-100% throttle on Y axis [bottom 0, top 100]
    // And Time to Empty on X axis.
    // Let's find a reasonable max X (Time to Empty).
    // Usage at 100% throttle is usageRate. So min time is Capacity/UsageRate.
    // Usage at 10% throttle is much less.
    const _minTime = capacity / (usageRate || 1);
    const maxTime =
      capacity / (getDigitalFuelUsage(usageType, usageRate, 10) || 0.001);
    const safeMaxTime =
      isNaN(maxTime) || !isFinite(maxTime) ? 3600 : Math.min(3600, maxTime);

    const width = 400;
    const height = 150;
    const points: string[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const throttle = (i / steps) * 100;
      const fuelPerSec = getDigitalFuelUsage(usageType, usageRate, throttle);
      let timeToEmpty = fuelPerSec > 0 ? capacity / fuelPerSec : safeMaxTime;

      const y = height - (i / steps) * height;
      const divisor = Math.max(0.001, safeMaxTime);
      const xPercent =
        divisor > 0 ? Math.max(0, Math.min(1.5, timeToEmpty / divisor)) : 1;
      const x = xPercent * width;
      points.push(`${(x || 0).toFixed(1)},${(y || 0).toFixed(1)}`);
    }

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      labels.push(Math.round((safeMaxTime * i) / 4).toString());
    }

    this.digitalPitGraphCache = {
      path: `M ${points.join(" L ")}`,
      labels: labels,
      maxVal: safeMaxTime,
      argsKey: key,
    };
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

  onDigitalGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    if (!this.editingRace?.digital_fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    if (type === "usage") {
      const xPercent = Math.max(0, Math.min(1, mouseX / (width || 1)));
      const throttle = xPercent * 100;
      const usageRate =
        Number(this.editingRace.digital_fuel_options.usage_rate) || 0;
      const usageType = this.editingRace.digital_fuel_options.usage_type;
      const fuel = getDigitalFuelUsage(usageType, usageRate, throttle);

      this.updateDigitalUsageGraphCache();
      const maxVal = this.digitalUsageGraphCache?.maxVal || 1;
      const yPercent = Math.max(0, Math.min(1.5, fuel / maxVal));

      this.hoveredPoint = {
        svgX: Number(((xPercent || 0) * 400).toFixed(2)) || 0,
        svgY: Number((150 - (yPercent || 0) * 150).toFixed(2)) || 0,
        screenX: mouseX || 0,
        screenY: mouseY || 0,
        time: throttle || 0, // we use 'time' field for 'throttle' here
        value: fuel || 0,
        type: "digital_usage",
      };
    } else {
      const yPercent = 1 - Math.max(0, Math.min(1, mouseY / (height || 1)));
      const throttle = yPercent * 100;
      const usageRate =
        Number(this.editingRace.digital_fuel_options.usage_rate) || 0;
      const usageType = this.editingRace.digital_fuel_options.usage_type;
      const capacity =
        Number(this.editingRace.digital_fuel_options.capacity) || 100;
      const fuelPerSec = getDigitalFuelUsage(usageType, usageRate, throttle);

      this.updateDigitalPitGraphCache();
      const maxVal = this.digitalPitGraphCache?.maxVal || 1;
      let timeToEmpty = fuelPerSec > 0 ? capacity / fuelPerSec : maxVal;
      const xPercent =
        maxVal > 0
          ? Math.max(0, Math.min(1.5, timeToEmpty / Math.max(0.001, maxVal)))
          : 1;

      this.hoveredPoint = {
        svgX: Number(((xPercent || 0) * 400).toFixed(2)) || 0,
        svgY: Number(((1 - (yPercent || 0)) * 150).toFixed(2)) || 0,
        screenX: mouseX || 0,
        screenY: mouseY || 0,
        time: throttle || 0,
        value: timeToEmpty || 0,
        type: "digital_pit",
      };
    }
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

  onGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    if (!this.editingRace?.fuel_options) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const minTime = 2;
    const maxTime = 15;

    if (type === "usage") {
      const xPercent = Math.max(0, Math.min(1, mouseX / width));
      const time = minTime + xPercent * (maxTime - minTime);
      const usageRate = this.editingRace.fuel_options.usage_rate || 0;
      const usageType = this.editingRace.fuel_options.usage_type;
      const referenceTime =
        Number(this.editingRace.fuel_options.reference_time) || 6;
      const fuel = getAnalogFuelUsage(
        usageType,
        usageRate,
        time,
        referenceTime,
      );

      this.updateUsageGraphCache();
      const maxVal = this.usageGraphCache?.maxVal || 1;
      const yPercent = Math.max(0, Math.min(1.5, fuel / maxVal));

      this.hoveredPoint = {
        svgX: Number((xPercent * 400).toFixed(2)),
        svgY: Number((150 - yPercent * 150).toFixed(2)),
        screenX: mouseX,
        screenY: mouseY,
        time: time,
        value: fuel,
        type: "usage",
      };
    } else {
      // Pit Graph: Y is Lap Time (bottom 2, top 15)
      const yPercent = 1 - Math.max(0, Math.min(1, mouseY / height));
      const lapTime = minTime + yPercent * (maxTime - minTime);

      const usageRate = this.editingRace.fuel_options.usage_rate || 0;
      const usageType = this.editingRace.fuel_options.usage_type;
      const referenceTime =
        Number(this.editingRace.fuel_options.reference_time) || 6;
      const capacity = this.editingRace.fuel_options.capacity || 100;

      const fuelPerLap = getAnalogFuelUsage(
        usageType,
        usageRate,
        lapTime,
        referenceTime,
      );
      let pitTime = 0;
      if (fuelPerLap > 0) pitTime = (capacity / fuelPerLap) * lapTime;

      this.updatePitGraphCache();
      const maxVal = this.pitGraphCache?.maxVal || 1;
      const xPercent = Math.max(0, Math.min(1.5, pitTime / maxVal));

      this.hoveredPoint = {
        svgX: Number((xPercent * 400).toFixed(2)),
        svgY: Number(((1 - yPercent) * 150).toFixed(2)),
        screenX: mouseX,
        screenY: mouseY,
        time: lapTime,
        value: pitTime,
        type: "pit",
      };
    }
  }

  onGraphMouseLeave() {
    this.hoveredPoint = null;
  }

  private buildRacePayload(race: any): any {
    return {
      "@id": 1,
      name: race.name,
      track_entity_id: race.track_entity_id,
      heat_rotation_type: race.heat_rotation_type,
      heat_scoring: {
        finish_method: race.heat_scoring.finish_method,
        finish_value: race.heat_scoring.finish_value,
        heat_ranking: race.heat_scoring.heat_ranking,
        heat_ranking_tiebreaker: race.heat_scoring.heat_ranking_tiebreaker,
        allow_finish: race.heat_scoring.allow_finish,
      },
      overall_scoring: {
        dropped_heats: race.overall_scoring.dropped_heats,
        ranking_method: race.overall_scoring.ranking_method,
        tiebreaker: race.overall_scoring.tiebreaker,
      },
      fuel_options: race.fuel_options
        ? {
            enabled: race.fuel_options.enabled,
            reset_fuel_at_heat_start:
              race.fuel_options.reset_fuel_at_heat_start,
            end_heat_on_out_of_fuel: race.fuel_options.end_heat_on_out_of_fuel,
            capacity: race.fuel_options.capacity,
            usage_type: race.fuel_options.usage_type,
            usage_rate: race.fuel_options.usage_rate,
            start_level: race.fuel_options.start_level,
            refuel_rate: race.fuel_options.refuel_rate,
            pit_stop_delay: race.fuel_options.pit_stop_delay,
            reference_time: race.fuel_options.reference_time,
          }
        : undefined,
      digital_fuel_options: race.digital_fuel_options
        ? {
            enabled: race.digital_fuel_options.enabled,
            reset_fuel_at_heat_start:
              race.digital_fuel_options.reset_fuel_at_heat_start,
            end_heat_on_out_of_fuel:
              race.digital_fuel_options.end_heat_on_out_of_fuel,
            capacity: race.digital_fuel_options.capacity,
            usage_type: race.digital_fuel_options.usage_type,
            usage_rate: race.digital_fuel_options.usage_rate,
            start_level: race.digital_fuel_options.start_level,
            refuel_rate: race.digital_fuel_options.refuel_rate,
            pit_stop_delay: race.digital_fuel_options.pit_stop_delay,
          }
        : undefined,
      auto_advance_time: race.auto_advance_time,
      auto_start_time: race.auto_start_time,
      auto_advance_warmup_time: race.auto_advance_warmup_time,
      auto_start_warmup_time: race.auto_start_warmup_time,
      min_lap_time: race.min_lap_time,
      drift_time: race.drift_time,
      start_time: race.start_time,
      restart_time: race.restart_time,
      start_randomizer: race.start_randomizer,
      restart_randomizer: race.restart_randomizer,
      solo_lane_index: race.solo_lane_index,
      custom_rotation_sequence: race.custom_rotation_sequence,
      customRotationSequence: race.custom_rotation_sequence,
      custom_rotation_asset_id: race.custom_rotation_asset_id,
      customRotationAssetId: race.custom_rotation_asset_id,
      custom_rotations: race.custom_rotations,
      customRotations: race.custom_rotations,
      team_options: race.team_options
        ? {
            heat_lap_limit: race.team_options.heat_lap_limit,
            heat_time_limit: race.team_options.heat_time_limit,
            overall_lap_limit: race.team_options.overall_lap_limit,
            overall_time_limit: race.team_options.overall_time_limit,
            require_pit_stop_change_driver:
              race.team_options.require_pit_stop_change_driver,
          }
        : undefined,
      heat_times_through: race.heat_times_through,
      reverse_heats: race.reverse_heats,
      hot_start: race.hot_start,
      restart_on_false_start: race.restart_on_false_start,
      start_behind_sensor: race.start_behind_sensor,
      practice: race.practice,
      false_start_lap_penalty: race.false_start_lap_penalty,
      false_start_time_penalty: race.false_start_time_penalty,
      group_options: race.group_options
        ? {
            enabled: race.group_options.enabled,
            max_groups: race.group_options.max_groups,
            balance: race.group_options.balance,
            allow_empty_lanes: race.group_options.allow_empty_lanes,
            force_multiple_of_max: race.group_options.force_multiple_of_max,
            rotate_group_heats: race.group_options.rotate_group_heats,
            min_advancing: race.group_options.min_advancing,
          }
        : undefined,
    };
  }

  getHelpSteps(): GuideStep[] {
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
      },
      {
        selector: "#track-select",
        title: this.translationService.translate("RM_LABEL_TRACK"),
        content: this.translationService.translate("RE_HELP_TRACK_CONTENT"),
        position: "bottom",
      },
    ];
  }

  startHelp() {
    this.helpService.startGuide(this.getHelpSteps());
  }
}

function getAnalogFuelUsage(
  usageType: FuelUsageType | string,
  usageRate: number,
  time: number,
  referenceTime: number,
): number {
  if (usageType === FuelUsageType.LINEAR) {
    const safeRefTime = Math.max(0.1, referenceTime);
    const x1 = safeRefTime * 2;
    const y1 = usageRate / 2;
    const x2 = safeRefTime;
    const y2 = usageRate;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;

    const val = m * time + b;
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }

  const safeTime = Math.max(0.1, time);
  const safeRefTime = Math.max(0.1, referenceTime);
  let val = 0;
  if (usageType === FuelUsageType.QUADRATIC) {
    val = (usageRate * (safeRefTime * safeRefTime)) / (safeTime * safeTime);
  } else if (usageType === FuelUsageType.CUBIC) {
    val =
      (usageRate * (safeRefTime * safeRefTime * safeRefTime)) /
      (safeTime * safeTime * safeTime);
  }

  return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
}

function getDigitalFuelUsage(
  usageType: FuelUsageType | string,
  usageRate: number,
  throttle: number,
): number {
  const tRatio = throttle / 100;
  let val = usageRate * tRatio;
  if (usageType === FuelUsageType.QUADRATIC) {
    val *= 1 + (1 - tRatio);
  } else if (usageType === FuelUsageType.CUBIC) {
    val *= 1 + (1 - tRatio) * (1 + (1 - tRatio));
  }
  return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, Math.min(val, 100));
}
