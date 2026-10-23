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
import { EditorSectionComponent } from "@app/components/shared/editor-section/editor-section.component";
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
import { FuelUsageType, OutOfFuelAction } from "@app/models/fuel_options";
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
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { mapToSelectItems } from "@app/utils/editor-utils";

import { FuelGraphHoverPoint, FuelGraphPlot } from "./fuel-graph.helper";
import {
  RaceCatalogHost,
  RaceEditorCatalogHelper,
} from "./race-editor-catalog.helper";
import {
  FuelGraphCacheEntry,
  FuelGraphHost,
  RaceEditorFuelGraphHelper,
} from "./race-editor-fuel-graph.helper";
import { RaceEditorHeatHelper, RaceHeatHost } from "./race-editor-heat.helper";
import { RaceEditorHelpHelper } from "./race-editor-help.helper";
import { RaceEditorNormalizationHelper } from "./race-editor-normalization.helper";
import {
  RaceEditorPersistenceHelper,
  RacePersistenceHost,
} from "./race-editor-persistence.helper";
import { RaceEditorScoringHelper } from "./race-editor-scoring.helper";
import {
  RaceEditorSections,
  RaceEditorUiHelper,
} from "./race-editor-ui.helper";
import {
  RaceConnectionHost,
  RaceEditorValidationHelper,
  RaceValidationHost,
} from "./race-editor-validation.helper";

@Component({
  standalone: true,
  selector: "app-race-editor",
  templateUrl: "./race-editor.component.html",
  styleUrls: ["./race-editor.component.css"],
  imports: [
    AcknowledgementModalComponent,
    AutoSelectDefaultDirective,
    EditorSectionComponent,
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
export class RaceEditorComponent
  implements
    OnInit,
    OnDestroy,
    DirtyComponent,
    FuelGraphHost,
    RacePersistenceHost,
    RaceHeatHost,
    RaceCatalogHost,
    RaceValidationHost,
    RaceConnectionHost
{
  lifecycle!: EditorLifecycleHelper;

  // Delete Race Confirmation Modal
  showDeleteConfirm = false;

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
  isReverting = false;
  isSwitchingSelection = false;
  editingRace: any;
  originalRace: any;
  selectedRace: any;
  selectedRaceId?: string;
  raceSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  isPreservingEditModeOnNavigation: boolean = false;
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
  subscriptions: Subscription[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  connectionSubscription: Subscription | null = null;

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
    return RaceEditorValidationHelper.getResetTooltip(
      this.isAdmin(),
      this.translationService,
    );
  }

  onResetRecords(event?: Event) {
    RaceEditorValidationHelper.onResetRecords(this, event);
  }

  onConfirmReset() {
    RaceEditorValidationHelper.onConfirmReset(this);
  }

  onCancelReset() {
    this.showResetConfirmation = false;
  }

  onCloseResetSuccess() {
    this.showResetSuccess = false;
  }

  sectionsExpanded: RaceEditorSections = {
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
    return RaceEditorValidationHelper.isConfigValid(this);
  }

  isDirtyState(): boolean {
    return RaceEditorValidationHelper.isDirtyState(
      this.undoManager,
      this.editingRace,
      this.originalRace,
    );
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return RaceEditorValidationHelper.getUnsavedReasons(this);
  }

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard(() => {
      if (this.originalRace) {
        this.selectRace(this.originalRace);
      } else if (this.allRaces.length > 0) {
        this.selectRace(this.allRaces[0]);
      }
      this.isEditMode = false;
    });
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  onSelectRaceById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedRaceId === id) return;
    const found = this.allRaces.find((r) => r.entity_id === id);
    if (found) {
      this.isSwitchingSelection = true;
      this.selectRace(found);
      this.navigationService.setLastEditedId("race", found.entity_id);
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
    RaceEditorPersistenceHelper.startNewRace(this);
  }

  onDeleteRace() {
    this.deleteRace();
  }

  deleteRace() {
    RaceEditorPersistenceHelper.deleteRace(this);
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }

  onConfirmDelete() {
    RaceEditorPersistenceHelper.onConfirmDelete(this);
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
    RaceEditorUiHelper.navigateBack(this.route, this.router, () => {
      this.isNavigationApproved = true;
    });
  }

  get raceTabs(): EditorTab[] {
    return RaceEditorUiHelper.getRaceTabs(this.translationService);
  }

  scrollToAndExpandSection(tabId: string) {
    RaceEditorUiHelper.scrollToAndExpandSection(tabId, this.sectionsExpanded);
    this.cdr.detectChanges();
  }

  toggleSection(
    section: keyof typeof this.sectionsExpanded,
    forcedState?: boolean,
  ) {
    this.sectionsExpanded[section] =
      typeof forcedState === "boolean"
        ? forcedState
        : !this.sectionsExpanded[section];
    RaceEditorUiHelper.saveExpanderState(this.sectionsExpanded);
  }

  areAllSectionsExpanded(): boolean {
    return Object.values(this.sectionsExpanded).every(Boolean);
  }

  toggleAllSections(forcedState?: boolean) {
    const next =
      forcedState !== undefined ? forcedState : !this.areAllSectionsExpanded();
    (
      Object.keys(this.sectionsExpanded) as Array<
        keyof typeof this.sectionsExpanded
      >
    ).forEach((key) => {
      this.sectionsExpanded[key] = next;
    });
    RaceEditorUiHelper.saveExpanderState(this.sectionsExpanded);
  }

  loadExpanderState() {
    this.sectionsExpanded = RaceEditorUiHelper.loadExpanderState(
      this.sectionsExpanded,
    );
  }

  saveDriverCount() {
    RaceEditorUiHelper.saveDriverCount(this.driverCount);
  }

  loadDriverCount() {
    this.driverCount = RaceEditorUiHelper.loadDriverCount();
  }

  get isNameInvalid(): boolean {
    return RaceEditorValidationHelper.isNameInvalid(
      this.isLoading,
      this.editingRace,
      () => this.isNameDuplicate(),
    );
  }

  get isRotationInvalid(): boolean {
    return RaceEditorValidationHelper.isRotationInvalid(
      this.editingRace,
      this.tracks,
    );
  }

  get currentTrackHasPerLaneRelays(): boolean {
    return RaceEditorValidationHelper.currentTrackHasPerLaneRelays(
      this.editingRace,
      this.tracks,
    );
  }

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public dataService: DataService,
    public translationService: TranslationService,
    public cdr: ChangeDetectorRef,
    public location: Location,
    private helpService: HelpService,
    private settingsService: SettingsService,
    public connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    public logger: LoggerService,
    public navigationService: NavigationService,
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

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
      undoManager: this.undoManager,
      hasChanges: () => this.hasChanges(),
      isSaveValid: () =>
        Boolean(
          this.editingRace?.name?.trim() &&
          !this.isNameDuplicate() &&
          !this.isRotationInvalid,
        ),
      isSaving: () => this.isSaving,
      onAutoSave: () => this.updateRace(true),
      logger: this.logger,
    });
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
    RaceEditorCatalogHelper.initDriverCount(this);
  }

  private initRouteHandling() {
    RaceEditorCatalogHelper.initRouteHandling(this);
  }

  private loadDefaultRace() {
    RaceEditorCatalogHelper.loadDefaultRace(this);
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
    RaceEditorUiHelper.handleKeyboardEvent(
      event,
      this.isEditMode,
      () => this.undoManager.undo(),
      () => this.undoManager.redo(),
    );
  }

  private updateScale() {
    this.scale = RaceEditorUiHelper.calculateScale(
      window.innerWidth,
      window.innerHeight,
    );
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

  selectRace(race: any) {
    RaceEditorPersistenceHelper.selectRace(this, race);
  }

  loadRace(id: string) {
    RaceEditorPersistenceHelper.loadRace(this, id);
  }

  loadThemes() {
    RaceEditorCatalogHelper.loadThemes(this);
  }

  getThemeDisplayNameKey(theme: Theme): string {
    return getThemeDisplayNameKey(theme, this.translationService);
  }

  loadTracks() {
    RaceEditorCatalogHelper.loadTracks(this);
  }

  loadCustomRotationAssets() {
    RaceEditorHeatHelper.loadCustomRotationAssets(this);
  }

  get filteredCustomRotationAssets() {
    return RaceEditorHeatHelper.getFilteredCustomRotationAssets(
      this.tracks,
      this.customRotationAssets,
      this.editingRace,
    );
  }

  syncSelectedCustomRotationAsset() {
    RaceEditorHeatHelper.syncSelectedCustomRotationAsset(this);
  }

  onCustomRotationAssetChange() {
    RaceEditorHeatHelper.onCustomRotationAssetChange(this);
  }

  getDefaultThemeId(): string {
    return RaceEditorCatalogHelper.getDefaultThemeId(this.themes);
  }

  createDefaultRaceTemplate(trackId: string, themeId: string): any {
    return RaceEditorNormalizationHelper.createDefaultRaceTemplate(
      trackId,
      themeId,
    );
  }

  createNewRace() {
    RaceEditorCatalogHelper.createNewRace(this);
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
    return RaceEditorHeatHelper.getCustomRotationSequenceString(
      this.editingRace,
    );
  }

  syncSequenceTextFromModel() {
    RaceEditorHeatHelper.syncSequenceTextFromModel(this);
  }

  onCustomSequenceChange() {
    RaceEditorHeatHelper.onCustomSequenceChange(this);
  }

  get groupIndices(): number[] {
    return RaceEditorHeatHelper.getGroupIndices(this.editingRace);
  }

  getGroupNameInput(index: number): string {
    return RaceEditorHeatHelper.getGroupNameInput(this.editingRace, index);
  }

  setGroupNameInput(index: number, value: string): void {
    RaceEditorHeatHelper.setGroupNameInput(this.editingRace, index, value, () =>
      this.captureState(),
    );
  }

  captureState() {
    RaceEditorScoringHelper.validateWarmupTimes(this.editingRace);
    RaceEditorScoringHelper.validateHeatConfigurations(this.editingRace);
    this.enforceFuelRules();
    this.syncSelectedCustomRotationAsset();
    this.syncHeatPositionPoints();
    RaceEditorScoringHelper.syncHeatScoringProperties(this.editingRace);
    this.undoManager.captureState();
    // Regenerate heats when rotation type changes (even for new races)
    if (this.driverCount > 0) {
      this.loadHeats();
    }
  }

  enforceFuelRules() {
    RaceEditorScoringHelper.enforceFuelRules(this.editingRace, this.tracks);
  }

  get hasDigitalFuel(): boolean {
    return RaceEditorScoringHelper.hasDigitalFuel(
      this.editingRace,
      this.tracks,
    );
  }

  getAnalogFuelTooltip(): string {
    return RaceEditorScoringHelper.getAnalogFuelTooltip(
      this.editingRace,
      this.tracks,
      this.translationService,
    );
  }

  getDigitalFuelTooltip(): string {
    return RaceEditorScoringHelper.getDigitalFuelTooltip(
      this.editingRace,
      this.tracks,
      this.translationService,
    );
  }

  onRotationTypeChange() {
    RaceEditorHeatHelper.onRotationTypeChange(this);
  }

  onLaneSelected(laneIndex: number) {
    RaceEditorHeatHelper.onLaneSelected(this, laneIndex);
  }

  onDriverCountChange() {
    RaceEditorHeatHelper.onDriverCountChange(this);
  }

  loadHeats() {
    RaceEditorHeatHelper.loadHeats(this);
  }

  private autoSaveRace(): Promise<any> {
    return RaceEditorPersistenceHelper.autoSaveRace(this);
  }

  updateRace(isAutoSave: boolean = false): Promise<any> {
    return RaceEditorPersistenceHelper.updateRace(this, isAutoSave);
  }

  saveAsNew() {
    RaceEditorPersistenceHelper.saveAsNew(this);
  }

  updateRaceSelectItems() {
    this.raceSelectItems = mapToSelectItems(this.allRaces);
  }

  loadRaces() {
    RaceEditorPersistenceHelper.loadRaces(this);
  }

  isNameDuplicate(): boolean {
    return RaceEditorPersistenceHelper.isNameDuplicate(
      this.editingRace,
      this.races,
    );
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    return RaceEditorPersistenceHelper.generateUniqueName(
      baseName,
      this.allRaces,
      forceSuffix,
    );
  }

  canSaveAsNew(): boolean {
    return RaceEditorPersistenceHelper.canSaveAsNew(this.editingRace);
  }

  buildRacePayload(editingRace: any = this.editingRace): any {
    return RaceEditorNormalizationHelper.buildRacePayload(editingRace);
  }

  canUpdate(): boolean {
    return RaceEditorPersistenceHelper.canUpdate(this);
  }

  getUpdateTooltip(): string {
    return RaceEditorPersistenceHelper.getUpdateTooltip(this);
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
  usageGraphCache: FuelGraphCacheEntry | null = null;
  pitGraphCache: FuelGraphCacheEntry | null = null;
  digitalUsageGraphCache: FuelGraphCacheEntry | null = null;
  digitalPitGraphCache: FuelGraphCacheEntry | null = null;

  draggingNode: {
    mode: "analog" | "digital";
    index: number;
  } | null = null;
  previousAnalogPreset: FuelUsageType | string = FuelUsageType.LINEAR;
  previousDigitalPreset: FuelUsageType | string = FuelUsageType.LINEAR;

  togglePlotVisibility(
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ) {
    RaceEditorFuelGraphHelper.togglePlotVisibility(this, graphId, type);
  }

  isPlotHidden(
    graphId: "analog_usage" | "analog_pit" | "digital_usage" | "digital_pit",
    type: FuelUsageType | string,
  ): boolean {
    return RaceEditorFuelGraphHelper.isPlotHidden(this, graphId, type);
  }

  getFuelUsageFastestTime(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageFastestTime(this.editingRace);
  }

  getFuelUsageMaxUsage(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageMaxUsage(this.editingRace);
  }

  getFuelUsageSlowestTime(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageSlowestTime(this.editingRace);
  }

  getFuelUsageMinUsage(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageMinUsage(this.editingRace);
  }

  getFuelUsageReferenceTime(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageReferenceTime(
      this.editingRace,
    );
  }

  getFuelUsageMinTime(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageMinTime(this.editingRace);
  }

  getFuelUsageMaxTime(): number {
    return RaceEditorFuelGraphHelper.getFuelUsageMaxTime(this.editingRace);
  }

  getFuelUsageTimeRange(): string {
    return RaceEditorFuelGraphHelper.getFuelUsageTimeRange(this.editingRace);
  }

  getFuelUsageXLabels(): string[] {
    return RaceEditorFuelGraphHelper.getFuelUsageXLabels(this.editingRace);
  }

  getPitGraphYLabels(): string[] {
    return RaceEditorFuelGraphHelper.getPitGraphYLabels(this.editingRace);
  }

  getFuelUsagePlots(): FuelGraphPlot[] {
    return RaceEditorFuelGraphHelper.getFuelUsagePlots(this);
  }

  getFuelUsagePath(): string {
    return RaceEditorFuelGraphHelper.getFuelUsagePath(this);
  }

  getFuelUsageYLabels(): string[] {
    return RaceEditorFuelGraphHelper.getFuelUsageYLabels(this);
  }

  getPitGraphPlots(): FuelGraphPlot[] {
    return RaceEditorFuelGraphHelper.getPitGraphPlots(this);
  }

  getPitGraphPath(): string {
    return RaceEditorFuelGraphHelper.getPitGraphPath(this);
  }

  getPitGraphXLabels(): string[] {
    return RaceEditorFuelGraphHelper.getPitGraphXLabels(this);
  }

  getDigitalUsagePlots(): FuelGraphPlot[] {
    return RaceEditorFuelGraphHelper.getDigitalUsagePlots(this);
  }

  getDigitalUsagePath(): string {
    return RaceEditorFuelGraphHelper.getDigitalUsagePath(this);
  }

  getDigitalUsageYLabels(): string[] {
    return RaceEditorFuelGraphHelper.getDigitalUsageYLabels(this);
  }

  getDigitalPitPlots(): FuelGraphPlot[] {
    return RaceEditorFuelGraphHelper.getDigitalPitPlots(this);
  }

  getDigitalPitPath(): string {
    return RaceEditorFuelGraphHelper.getDigitalPitPath(this);
  }

  getDigitalPitXLabels(): string[] {
    return RaceEditorFuelGraphHelper.getDigitalPitXLabels(this);
  }

  onGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    RaceEditorFuelGraphHelper.onGraphMouseMove(this, event, type);
  }

  onDigitalGraphMouseMove(event: MouseEvent, type: "usage" | "pit") {
    RaceEditorFuelGraphHelper.onDigitalGraphMouseMove(this, event, type);
  }

  onGraphMouseLeave() {
    RaceEditorFuelGraphHelper.onGraphMouseLeave(this);
  }

  isCustomCurve(mode: "analog" | "digital"): boolean {
    return RaceEditorFuelGraphHelper.isCustomCurve(this.editingRace, mode);
  }

  onUsageTypeChange(mode: "analog" | "digital", newType: any) {
    RaceEditorFuelGraphHelper.onUsageTypeChange(this, mode, newType);
  }

  initAnalogCustomCurve(
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ) {
    RaceEditorFuelGraphHelper.initAnalogCustomCurve(
      this.editingRace,
      fromPreset,
    );
  }

  initDigitalCustomCurve(
    fromPreset: FuelUsageType | string = FuelUsageType.LINEAR,
  ) {
    RaceEditorFuelGraphHelper.initDigitalCustomCurve(
      this.editingRace,
      fromPreset,
    );
  }

  resetCustomCurveToPreset(
    mode: "analog" | "digital",
    preset: "LINEAR" | "QUADRATIC" | "CUBIC",
  ) {
    RaceEditorFuelGraphHelper.resetCustomCurveToPreset(this, mode, preset);
  }

  getAnalogCurveMaxMultiplier(): number {
    return RaceEditorFuelGraphHelper.getAnalogCurveMaxMultiplier(
      this.editingRace,
    );
  }

  getDigitalCurveMaxMultiplier(): number {
    return RaceEditorFuelGraphHelper.getDigitalCurveMaxMultiplier(
      this.editingRace,
    );
  }

  getAnalogControlNodes(): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    return RaceEditorFuelGraphHelper.getAnalogControlNodes(this);
  }

  getDigitalControlNodes(): Array<{
    svgX: number;
    svgY: number;
    x: number;
    y: number;
  }> {
    return RaceEditorFuelGraphHelper.getDigitalControlNodes(this.editingRace);
  }

  startDragNode(
    event: MouseEvent | TouchEvent,
    mode: "analog" | "digital",
    index: number,
  ) {
    RaceEditorFuelGraphHelper.startDragNode(this, event, mode, index);
  }

  @HostListener("window:mousemove", ["$event"])
  @HostListener("window:touchmove", ["$event"])
  onWindowMouseMove(event: MouseEvent | TouchEvent) {
    RaceEditorFuelGraphHelper.onWindowMouseMove(this, event);
  }

  @HostListener("window:mouseup")
  @HostListener("window:touchend")
  onWindowMouseUp() {
    RaceEditorFuelGraphHelper.onWindowMouseUp(this);
  }

  onCurveSvgClick(event: MouseEvent, mode: "analog" | "digital") {
    RaceEditorFuelGraphHelper.onCurveSvgClick(this, event, mode);
  }

  deleteControlNode(
    event: MouseEvent,
    mode: "analog" | "digital",
    index: number,
  ) {
    RaceEditorFuelGraphHelper.deleteControlNode(this, event, mode, index);
  }

  getHelpSteps(): GuideStep[] {
    return RaceEditorHelpHelper.getHelpSteps(
      this.translationService,
      this.sectionsExpanded,
    );
  }

  addSeasonPositionPoint(): void {
    RaceEditorScoringHelper.addSeasonPositionPoint(
      this.editingRace,
      () => this.captureState(),
      () => this.scrollPositionPointsToBottom(),
    );
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
    RaceEditorScoringHelper.removeSeasonPositionPoint(
      this.editingRace,
      index,
      () => this.captureState(),
    );
  }

  syncHeatPositionPoints(): void {
    RaceEditorScoringHelper.syncHeatPositionPoints(
      this.editingRace,
      this.tracks,
    );
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
