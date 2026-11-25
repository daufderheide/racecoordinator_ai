import {
  CdkDrag,
  CdkDragDrop,
  CdkDragMove,
  CdkDropList,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { HostListener } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { CarPickDialogComponent } from "@app/components/shared/car-pick-dialog/car-pick-dialog.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import {
  getHeatDividerInfo,
  HeatDividerInfo,
  loadShowGroupDividersPreference,
  loadShowStepDividersPreference,
  saveShowGroupDividersPreference,
  saveShowStepDividersPreference,
} from "@app/components/shared/heats-filter-bar/heats-filter.utils";
import { HeatsFilterBarComponent } from "@app/components/shared/heats-filter-bar/heats-filter-bar.component";
import { HeatsGridDividerComponent } from "@app/components/shared/heats-grid-divider/heats-grid-divider.component";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { CarChoice } from "@app/models/car-choice";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { TeammateUtils } from "@app/utils/teammate.utils";

import {
  DropContext,
  DropResult,
  ModifyHeatsService,
} from "./modify-heats.service";
import {
  executeAutoSave,
  executeLaneCheck,
  handleExitConfirm,
  handleGroupChange,
  handleHeatDropHelper,
  handleHeatMouseMove,
  handlePointMouseMove,
  handleStepChange,
  handleTeammateChange,
  handleToggleStepUpBoundary,
  loadModifyHeatsData,
  navigateToEditorHelper,
  removeDriverFromHeatHelper,
  removeHeatHelper,
} from "./modify-heats-actions.helper";
import { ModifyHeatsCars } from "./modify-heats-cars";
import {
  areModifyHeatsStatesEqual,
  assignStepNumbers,
  buildDropListConnections,
  calculateModalScale,
  cloneHeat,
  collectHeatCardBounds,
  filterDatabaseParticipants,
  filterDriverPool,
  getContrastTextColor,
  getDatabaseItemTrackId,
  getLastStartedHeatIndex,
  getModifyHeatsValidationError,
  getOriginalHeatDisplay as getOriginalHeatDisplayHelper,
  getParticipantAvatar,
  getParticipantKey,
  getParticipantMeta,
  getParticipantName,
  HeatCardBounds,
  HeatDropAction,
  inferBoundariesFromDrivers,
  isDriver,
  isHardValidationError,
  isHeatStarted as isHeatStartedHelper,
  isParticipantInStartedHeat,
  isStepUpParticipant,
  isTeam,
  ModifyHeatsState,
  revertSaveFailure,
  validateGroupSequence,
} from "./modify-heats-modal.utils";
import {
  addHeatToState,
  AvailableGroup,
  AvailableStep,
  calculateStepUpPool,
  canEnterDriverDropListPredicate,
  canEnterHeatsGridPredicate,
  cloneInitialHeats,
  DriverHighlightManager,
  filterHeatsByGroupAndStep,
  getAvailableGroups,
  getAvailableSteps,
  getCustomGroupName,
  getDriverHeatDataInLaneHelper,
  getDropdownArrowBg as createDropdownArrowBg,
  getHeatDriverMeta as extractHeatDriverMeta,
  getHeatValidationWarning,
  getParticipantGroupBadge,
  getParticipantStepBadge,
  handleUndoRedoKey,
  HeatDragDropController,
  isHeatIncompatibleWithDraggedParticipant,
  isStepUpEnabledHelper,
  resolveDraggedParticipant,
} from "./modify-heats-ui.helper";
import { executeRegenerateHeats } from "./modify-heats-validation.helper";

@Component({
  standalone: true,
  selector: "app-modify-heats-modal",
  templateUrl: "./modify-heats-modal.component.html",
  styleUrls: ["./modify-heats-modal.component.css"],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TranslatePipe,
    AvatarUrlPipe,
    EditorTitleComponent,
    AcknowledgementModalComponent,
    ConfirmationModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CarPickDialogComponent,
    HeatsFilterBarComponent,
    HeatsGridDividerComponent,
  ],
})
export class ModifyHeatsModalComponent implements OnInit, OnDestroy {
  private raceService = inject(RaceService);
  private raceConnectionService = inject(RaceConnectionService);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);

  raceInput = input<Race | undefined>(undefined);
  trackInput = input<Track | undefined>(undefined);
  participantsInput = input<RaceParticipant[]>([]);
  heatsInput = input<Heat[]>([]);
  currentHeatNumberInput = input<number | undefined>(undefined);
  raceStateInput = input<RaceState | undefined>(undefined);
  close = output<boolean>();

  private localRaceState = signal<RaceState>(RaceState.NOT_STARTED);

  race = computed(() => this.raceInput() || this.raceService.getRace()!);
  track = computed(
    () =>
      this.trackInput() ||
      this.raceInput()?.track ||
      this.raceService.getRace()?.track!,
  );
  participants = computed(() => {
    const list =
      this.participantsInput().length > 0
        ? this.participantsInput()
        : this.raceService.getParticipants();
    return [...list].sort((a, b) => (a.seed || 0) - (b.seed || 0));
  });
  heats = computed(() =>
    this.heatsInput().length > 0
      ? this.heatsInput()
      : this.raceService.getHeats(),
  );
  currentHeatNumber = computed(() =>
    this.currentHeatNumberInput() !== undefined
      ? this.currentHeatNumberInput()!
      : this.raceService.getCurrentHeat()?.heatNumber || 0,
  );
  raceState = computed(() =>
    this.raceStateInput() !== undefined
      ? this.raceStateInput()!
      : this.localRaceState(),
  );

  protected localHeats: Heat[] = [];
  protected localParticipants: RaceParticipant[] = [];
  protected driverPool: RaceParticipant[] = [];
  protected stepUpPool: RaceParticipant[] = [];
  protected databaseDrivers: Driver[] = [];
  protected databaseTeams: Team[] = [];
  protected databaseParticipants: (Driver | Team)[] = [];
  protected allDrivers: Driver[] = [];
  // Slotcars (#1210); none per racer when the cars stay in their lanes.
  protected cars = new ModifyHeatsCars(() => this.allDrivers, this.race);
  private savingCount = 0;
  protected get isSaving(): boolean {
    return this.savingCount > 0;
  }
  protected hasUnsavedChanges = false;
  protected showExitConfirmation = false;
  protected errorMessage = signal<string | undefined>(undefined);
  protected scale = 1;
  zoomLevel = 100;

  isDirtyState(): boolean {
    return this.undoManager?.hasChanges() ?? false;
  }
  private isRecovering = false;
  protected heatDragController = new HeatDragDropController();
  protected get hoveredHeatIdx(): number {
    return this.heatDragController.hoveredHeatIdx;
  }
  protected set hoveredHeatIdx(val: number) {
    this.heatDragController.hoveredHeatIdx = val;
  }
  protected get isDraggingHeat(): boolean {
    return this.heatDragController.isDraggingHeat;
  }
  protected set isDraggingHeat(val: boolean) {
    this.heatDragController.isDraggingHeat = val;
  }
  protected get heatDropAction(): HeatDropAction {
    return this.heatDragController.heatDropAction;
  }
  protected set heatDropAction(val: HeatDropAction) {
    this.heatDragController.heatDropAction = val;
  }
  protected get activeInsertSlot(): number {
    return this.heatDragController.activeInsertSlot;
  }
  protected allTeams: Team[] = [];
  protected isLoading = false;
  protected equalityReport: any[] | null = null;
  protected isHeatsEqual: boolean = false;
  protected isAvailableDriversCollapsed = false;
  selectedGroup = signal<number | null>(null);
  selectedStep = signal<number | null>(null);
  showGroupDividers = signal<boolean>(loadShowGroupDividersPreference());
  showStepDividers = signal<boolean>(loadShowStepDividersPreference());
  draggedParticipant: RaceParticipant | null = null;

  toggleGroupDividers(show: boolean): void {
    this.showGroupDividers.set(show);
    saveShowGroupDividersPreference(show);
  }

  toggleStepDividers(show: boolean): void {
    this.showStepDividers.set(show);
    saveShowStepDividersPreference(show);
  }

  hasGroupFilter = (): boolean => !!this.race()?.group_options?.enabled;
  hasStepFilter = (): boolean => this.isStepUpEnabled;
  isFilterActive = (): boolean =>
    this.selectedGroup() !== null || this.selectedStep() !== null;

  availableGroups(): AvailableGroup[] {
    return getAvailableGroups(
      this.race(),
      this.localHeats,
      this.translationService,
    );
  }

  availableSteps(): AvailableStep[] {
    return getAvailableSteps(this.localHeats, this.translationService);
  }

  filteredHeats(): Heat[] {
    return filterHeatsByGroupAndStep(
      this.localHeats,
      this.selectedGroup(),
      this.selectedStep(),
    );
  }

  getHeatDivider(index: number): HeatDividerInfo | null {
    if (!this.showGroupDividers() && !this.showStepDividers()) return null;
    return getHeatDividerInfo(
      this.filteredHeats(),
      index,
      this.isStepUpEnabled,
      this.hasGroupFilter(),
      this.translationService,
      (grpIdx) => this.getCustomGroupName(grpIdx),
      this.showStepDividers(),
      this.showGroupDividers(),
    );
  }
  private cdr = inject(ChangeDetectorRef);
  private highlightManager = new DriverHighlightManager(this.cdr);
  protected get highlightedDrivers(): Map<string, string> {
    return this.highlightManager.highlightedDrivers;
  }

  private translationService = inject(TranslationService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private sanitizer = inject(DomSanitizer);

  // Acknowledgement modal properties
  protected showAckModal = false;
  protected ackModalTitle = "";
  protected ackModalMessage = "";

  // Undo Manager
  protected undoManager!: UndoManager<ModifyHeatsState>;
  private subscriptions: Subscription[] = [];

  // For drag and drop connection
  protected heatDropListIds: string[] = [
    "driver-pool",
    "database-drivers",
    "step-up-pool",
  ];
  protected connectedTo: string[] = [
    "driver-pool",
    "database-drivers",
    "step-up-pool",
  ];

  // Drag and drop predicates
  protected canEnterHeatsGrid = canEnterHeatsGridPredicate;
  protected canEnterDriverDropList = (
    drag: CdkDrag<any>,
    drop?: CdkDropList<any>,
  ): boolean =>
    canEnterDriverDropListPredicate(
      drag,
      drop,
      this.localHeats,
      this.isStepUpEnabled,
      (h) => this.isHeatStarted(h),
    );

  private modifyHeatsService = inject(ModifyHeatsService);

  constructor(protected dataService: DataService) {
    this.undoManager = new UndoManager<ModifyHeatsState>(
      {
        clonner: (state) => ({
          heats: state.heats.map((h) => cloneHeat(h)),
          participants: [...state.participants],
        }),
        equalizer: areModifyHeatsStatesEqual,
        applier: (state) => {
          this.localHeats = state.heats;
          this.localParticipants = state.participants;
          this.updateDriverPool();
          this.updateDatabaseParticipants();
          this.updateDropListConnections();
        },
      },
      () => ({
        heats: this.localHeats,
        participants: this.localParticipants,
      }),
    );
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    handleUndoRedoKey(event, this.undoManager);
  }

  private updateScale() {
    this.scale = calculateModalScale(window.innerWidth, window.innerHeight);
  }

  ngOnInit() {
    this.updateScale();

    this.dataService.openModifyHeats().subscribe({
      error: (err) =>
        this.logger.error("Failed to notify server of open modify heats", err),
    });

    this.isLoading = true;
    this.localHeats = cloneInitialHeats(this.heats());
    this.localParticipants = [...this.participants()];

    const savedState = this.modifyHeatsService.restoreState();
    if (savedState) {
      this.localHeats = savedState.heats;
      this.localParticipants = savedState.participants;
      this.undoManager.clearRedo();
      this.undoManager.captureState();
      this.hasUnsavedChanges = true;
    }

    if (this.isStepUpEnabled) {
      inferBoundariesFromDrivers(this.localHeats);
      assignStepNumbers(this.localHeats, this.race()?.step_up);
    }

    this.cars.load(this.dataService);
    loadModifyHeatsData(this.dataService, !!savedState, {
      setAllDrivers: (drivers) => (this.allDrivers = drivers),
      setAllTeams: (teams) => (this.allTeams = teams),
      onLoaded: (saved) => {
        if (!saved) {
          this.initializeState();
        } else {
          this.updateDatabaseParticipants();
          this.updateDriverPool();
          this.updateDropListConnections();
          this.onLaneCheck(false);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      onError: (err, saved) => {
        this.logger.error("Failed to load database items", err);
        if (!saved) this.initializeState();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });

    this.raceConnectionService.connect();
    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.localRaceState.set(state);
      }),
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          !this.isRecovering &&
          (event.type === "undo" || event.type === "redo")
        ) {
          this.autoSave(event.type);
          this.cdr.detectChanges();
        }
      }),
      this.raceService.heats$.subscribe((heats) => {
        if (
          heats &&
          heats.length > 0 &&
          this.localHeats.length === 0 &&
          !savedState &&
          !this.hasUnsavedChanges &&
          !this.undoManager.hasChanges()
        ) {
          this.initializeState();
          this.cdr.detectChanges();
        }
      }),
    );

    this.updateDropListConnections();
  }

  private initializeState() {
    this.localHeats = cloneInitialHeats(this.heats());
    this.localParticipants = [...this.participants()];

    if (this.isStepUpEnabled) {
      inferBoundariesFromDrivers(this.localHeats);
      assignStepNumbers(this.localHeats, this.race()?.step_up);
    }

    this.undoManager.initialize({
      heats: this.localHeats,
      participants: this.localParticipants,
    });
    this.updateDatabaseParticipants();
    this.updateDriverPool();
    this.updateDropListConnections();
    this.onLaneCheck(false);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.raceConnectionService.disconnect();

    // Always finalize on exit so the server can reconcile race state
    // (e.g. advance past already-completed heats, or transition to RaceOver).
    this.dataService.finalizeModifyHeats().subscribe({
      next: () =>
        this.logger.debug("Modify heats finalized successfully on server"),
      error: (err) =>
        this.logger.error("Failed to finalize modify heats on server", err),
    });
  }

  protected getParticipantName = getParticipantName;
  protected getParticipantAvatar = getParticipantAvatar;
  protected getDatabaseItemTrackId = getDatabaseItemTrackId;
  protected isDriver = isDriver;
  protected isTeam = isTeam;
  protected getParticipantMeta = (p: RaceParticipant): string =>
    getParticipantMeta(p, this.translationService);
  protected validateGroupSequence = validateGroupSequence;

  protected isDriverHighlighted = (p: RaceParticipant | null | undefined) =>
    this.highlightManager.isDriverHighlighted(p);
  protected getDriverHighlightColor = (p: RaceParticipant | null | undefined) =>
    this.highlightManager.getDriverHighlightColor(p);
  protected toggleDriverHighlight = (
    p: RaceParticipant | null | undefined,
    event?: MouseEvent,
  ) => this.highlightManager.toggleDriverHighlight(p, event);
  protected clearDriverHighlights = () =>
    this.highlightManager.clearDriverHighlights();

  protected getContrastTextColor = getContrastTextColor;

  protected hasHighlightedDrivers = () =>
    this.highlightManager.hasHighlightedDrivers();
  protected isHeatHighlighted = (heat: Heat) =>
    this.highlightManager.isHeatHighlighted(heat);
  protected getHeatHighlightColors = (heat: Heat) =>
    this.highlightManager.getHeatHighlightColors(heat);

  protected getCustomGroupName = (groupIdx: number): string =>
    getCustomGroupName(this.race(), groupIdx);

  protected get isStepUpEnabled(): boolean {
    return isStepUpEnabledHelper(this.race(), this.localHeats);
  }

  private updateDriverPool() {
    this.driverPool = filterDriverPool(this.localParticipants);
    this.updateStepUpPool();
  }

  private updateStepUpPool() {
    this.stepUpPool = calculateStepUpPool(
      this.localHeats,
      this.race()?.step_up || 0,
      this.track()?.lanes?.length || 4,
      this.isStepUpEnabled,
    );
  }

  protected onStepChange(heat: Heat, newStep: number) {
    handleStepChange(heat, newStep);
    this.undoManager.captureState();
    this.autoSave();
  }

  protected toggleStepUpBoundary(heat: Heat) {
    handleToggleStepUpBoundary(
      heat,
      this.localHeats,
      this.isStepUpEnabled,
      this.race()?.step_up,
    );
    this.undoManager.captureState();
    this.autoSave();
  }

  protected isStepUpParticipant = isStepUpParticipant;

  private updateDatabaseParticipants() {
    const result = filterDatabaseParticipants(
      this.localParticipants,
      this.allDrivers,
      this.allTeams,
    );
    this.databaseDrivers = result.databaseDrivers;
    this.databaseTeams = result.databaseTeams;
    this.databaseParticipants = result.databaseParticipants;
  }

  private updateDropListConnections() {
    this.heatDropListIds = buildDropListConnections(
      this.localHeats.length,
      this.track()?.lanes?.length || 0,
    );
    this.connectedTo = [...this.heatDropListIds];
  }

  protected isHeatStarted(heat: Heat): boolean {
    return isHeatStartedHelper(
      heat,
      this.currentHeatNumber(),
      this.raceState(),
    );
  }

  protected get isRegenerateDisabled(): boolean {
    return false;
  }

  getOriginalHeatDisplay(heat: Heat): string {
    return getOriginalHeatDisplayHelper(heat, this.heats());
  }

  protected getDriverHeatDataInLane = (
    heatIdx: number,
    laneIdx: number,
  ): DriverHeatData | null =>
    getDriverHeatDataInLaneHelper(this.localHeats, heatIdx, laneIdx);
  protected isTeamLane = (dhd: DriverHeatData): boolean =>
    TeammateUtils.isTeam(dhd);
  protected getTeammates = (dhd: DriverHeatData): Driver[] =>
    TeammateUtils.getTeammates(dhd, this.allDrivers);
  protected getDropdownArrowBg = (color: string): SafeStyle =>
    createDropdownArrowBg(this.sanitizer, color);

  protected onTeammateChange(
    heatIdx: number,
    dhd: DriverHeatData,
    eventOrValue: any,
  ) {
    if (
      handleTeammateChange(
        this.localHeats,
        heatIdx,
        dhd,
        eventOrValue,
        this.allDrivers,
      )
    ) {
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  protected getHeatDriverMeta(dhd: DriverHeatData): string {
    return extractHeatDriverMeta(dhd, this.translationService);
  }

  protected getDriverStats(hd: DriverHeatData, driverId: string): string {
    return TeammateUtils.getDriverStats(hd, driverId, this.localHeats, {
      heatAbbr: this.translationService.translate("RD_STATS_HEAT_ABBR"),
      lapAbbr: this.translationService.translate("RD_STATS_LAP_ABBR"),
      totalAbbr: this.translationService.translate("RD_STATS_TOTAL_ABBR"),
    });
  }

  private getServiceContext(): DropContext {
    return {
      localHeats: this.localHeats,
      localParticipants: this.localParticipants,
      allDrivers: this.allDrivers,
      allTeams: this.allTeams,
      race: this.race(),
      isHeatStarted: (h) => this.isHeatStarted(h),
      isParticipantInStartedHeat: (p) => this.isParticipantInStartedHeat(p),
    };
  }

  private syncAndAutoSave(updateDb = false): void {
    if (updateDb) this.updateDatabaseParticipants();
    this.updateDriverPool();
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  private applyMutationResult(
    result: DropResult,
    removedParticipant?: RaceParticipant,
  ): void {
    if (result.error) {
      this.ackModalTitle = result.error.title;
      this.ackModalMessage = result.error.message;
      this.showAckModal = true;
    }
    if (result.actionTaken) {
      this.localHeats = result.updatedHeats;
      this.localParticipants = result.updatedParticipants;
      if (removedParticipant) {
        this.highlightManager.removeDriver(
          getParticipantKey(removedParticipant),
        );
      }
      this.updateSeeds();
      this.syncAndAutoSave(true);
    }
  }

  protected onDrop(event: CdkDragDrop<any>) {
    this.applyMutationResult(
      this.modifyHeatsService.handleDrop(event, this.getServiceContext()),
    );
  }

  protected onRemoveFromRacing(participant: RaceParticipant) {
    if (this.isSaving) return;
    this.applyMutationResult(
      this.modifyHeatsService.handleRemoveFromRacing(
        participant,
        this.getServiceContext(),
      ),
      participant,
    );
  }

  protected onAddFromAvailable(item: Driver | Team) {
    if (this.isSaving) return;
    this.applyMutationResult(
      this.modifyHeatsService.handleAddFromAvailable(
        item,
        this.getServiceContext(),
      ),
    );
  }

  protected isParticipantInStartedHeat(participant: RaceParticipant): boolean {
    return isParticipantInStartedHeat(participant, this.localHeats, (h) =>
      this.isHeatStarted(h),
    );
  }

  protected getLastStartedHeatIndex(): number {
    return getLastStartedHeatIndex(this.localHeats, (h) =>
      this.isHeatStarted(h),
    );
  }

  protected isHeatSwapHighlight(index: number, heat: Heat): boolean {
    return this.heatDragController.isHeatSwapHighlight(index, heat, (h) =>
      this.isHeatStarted(h),
    );
  }

  protected onHeatDragStarted(): void {
    this.heatDragController.onDragStarted();
  }
  protected onHeatDragEnded(): void {
    this.heatDragController.onDragEnded();
  }

  protected onHeatHover(index: number): void {
    this.heatDragController.onHover(
      index,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
    );
  }

  protected onHeatMouseEnter(index: number, event: MouseEvent): void {
    this.onHeatMouseMove(index, event);
  }

  protected onHeatMouseMove(index: number, event: MouseEvent): void {
    handleHeatMouseMove(
      index,
      event,
      this.heatDragController,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
    );
  }

  protected onGridMouseMove(event: MouseEvent): void {
    handlePointMouseMove(
      event.clientX,
      event.clientY,
      this.heatDragController,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h: Heat) => this.isHeatStarted(h),
    );
  }

  protected onHeatDragMoved(event: CdkDragMove<Heat>): void {
    handlePointMouseMove(
      event.pointerPosition.x,
      event.pointerPosition.y,
      this.heatDragController,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h: Heat) => this.isHeatStarted(h),
    );
  }

  protected getHeatCardBounds(): HeatCardBounds[] {
    return collectHeatCardBounds(this.localHeats, (h) => this.isHeatStarted(h));
  }

  protected onHeatDrop(event: CdkDragDrop<Heat[]>): void {
    const newHeats = handleHeatDropHelper(
      event,
      this.heatDragController,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
      () => this.getHeatCardBounds(),
      this.isStepUpEnabled,
      this.race()?.step_up,
    );
    if (newHeats) {
      this.localHeats = newHeats;
      this.syncAndAutoSave();
    }
  }

  protected onAddHeat(): void {
    if (this.isSaving) return;
    addHeatToState(
      this.localHeats,
      this.selectedGroup(),
      this.selectedStep(),
      this.race()?.step_up,
      this.isStepUpEnabled,
    );
    this.syncAndAutoSave();
  }

  protected onRemoveHeat(index: number): void {
    if (this.isSaving) return;
    if (
      !removeHeatHelper(
        this.localHeats,
        index,
        (h) => this.isHeatStarted(h),
        this.race()?.step_up,
        this.isStepUpEnabled,
      )
    ) {
      return;
    }
    this.syncAndAutoSave();
  }

  protected onRemoveFromHeat(heatIdx: number, laneIdx: number): void {
    if (this.isSaving) return;
    if (
      !removeDriverFromHeatHelper(this.localHeats, heatIdx, laneIdx, (h) =>
        this.isHeatStarted(h),
      )
    ) {
      return;
    }
    this.syncAndAutoSave();
  }

  protected onRegenerateHeats() {
    this.savingCount++;
    this.cdr.detectChanges();
    this.errorMessage.set(undefined);
    executeRegenerateHeats(
      this.localParticipants,
      this.dataService,
      (heats) => {
        this.localHeats = heats;
        this.syncAndAutoSave(true);
      },
      (msg) => {
        this.errorMessage.set(msg);
        this.ackModalTitle = "RD_REGENERATE_HEATS_FAILED";
        this.ackModalMessage = msg;
        this.showAckModal = true;
      },
      () => {
        this.savingCount--;
        this.cdr.detectChanges();
      },
    );
  }

  get canSave(): boolean {
    return !this.isSaving && this.getValidationError() === null;
  }

  private getValidationError(): string | null {
    return getModifyHeatsValidationError(
      this.localHeats,
      this.heats(),
      this.localParticipants,
      this.race(),
      (h) => this.isHeatStarted(h),
      this.translationService,
    );
  }

  get currentValidationError(): string | null {
    return this.getValidationError();
  }

  protected onAckModalClose = () => {
    this.showAckModal = false;
  };

  private navigateToEditor(path: string) {
    navigateToEditorHelper(
      path,
      this.route,
      this.router,
      this.modifyHeatsService,
      this.localHeats,
      this.localParticipants,
    );
  }

  onManageTeams = () => this.navigateToEditor("/team-editor");
  onManageDrivers = () => this.navigateToEditor("/driver-editor");

  protected onExitConfirm() {
    this.showExitConfirmation = false;
    handleExitConfirm(this.route, this.router, this.close);
  }

  protected onExitCancel() {
    this.showExitConfirmation = false;
  }

  protected onCarPicked(choice: CarChoice): void {
    if (this.cars.pick(choice)) this.autoSave();
  }

  protected autoSave(
    triggeredBy: UndoEventType = "push",
    isGroupChange: boolean = false,
  ) {
    const validationError = this.getValidationError();
    if (validationError) {
      this.errorMessage.set(validationError);

      if (
        triggeredBy === "push" &&
        !isGroupChange &&
        isHardValidationError(validationError, this.translationService)
      ) {
        this.undoManager.undo();
        this.undoManager.clearRedo();
      } else {
        this.hasUnsavedChanges = true;
      }
      return;
    }
    this.errorMessage.set(undefined);
    this.onLaneCheck(false);

    this.savingCount++;
    this.cdr.detectChanges();
    this.hasUnsavedChanges = true;

    executeAutoSave({
      localHeats: this.localHeats,
      localParticipants: this.localParticipants,
      track: this.track(),
      isHeatStarted: (h) => this.isHeatStarted(h),
      dataService: this.dataService,
      undoManager: this.undoManager,
      onSuccess: () => {
        this.hasUnsavedChanges = false;
      },
      onFailure: () => this.handleSaveFailure(triggeredBy),
      onComplete: () => {
        this.savingCount--;
        this.cdr.detectChanges();
      },
    });
  }

  private handleSaveFailure(triggeredBy: UndoEventType) {
    this.isRecovering = true;
    try {
      revertSaveFailure(triggeredBy, this.undoManager);
    } finally {
      this.isRecovering = false;
    }
    this.hasUnsavedChanges = false;
  }

  setGroupFilter = (grpIndex: number | null): void => {
    this.selectedGroup.set(grpIndex);
  };
  setStepFilter = (step: number | null): void => {
    this.selectedStep.set(step);
  };
  clearFilters = (): void => {
    this.selectedGroup.set(null);
    this.selectedStep.set(null);
  };
  getHeatIndex(heat: Heat): number {
    return this.localHeats.indexOf(heat);
  }

  onDriverDragStarted(
    participant: RaceParticipant | Driver | Team | null | undefined,
  ): void {
    this.draggedParticipant = resolveDraggedParticipant(participant);
  }

  onDriverDragEnded = () => {
    this.draggedParticipant = null;
  };

  isHeatIncompatible(heat: Heat): boolean {
    return isHeatIncompatibleWithDraggedParticipant(
      heat,
      this.draggedParticipant,
      this.localHeats,
      this.isStepUpEnabled,
      !!this.race()?.group_options?.enabled,
      (h) => this.isHeatStarted(h),
    );
  }

  isHeatCompatible = (heat: Heat): boolean =>
    !!this.draggedParticipant && !this.isHeatIncompatible(heat);

  getHeatWarning(heat: Heat): string | null {
    return getHeatValidationWarning(
      heat,
      this.localHeats,
      this.race(),
      this.isStepUpEnabled,
      this.translationService,
      (h) => this.isHeatStarted(h),
    );
  }

  getParticipantGroupBadge = (participant: RaceParticipant): string | null =>
    getParticipantGroupBadge(participant, this.localHeats, this.race());

  getParticipantStepBadge = (participant: RaceParticipant): string | null =>
    getParticipantStepBadge(participant, this.localHeats, this.isStepUpEnabled);

  protected onGroupSelectChange(heat: Heat, newValue: any): void {
    this.onGroupChange(heat, Number(newValue) + 1);
  }

  protected onGroupChange(heat: Heat, newValue: number) {
    if (!handleGroupChange(heat, newValue)) return;
    this.undoManager.captureState();
    this.hasUnsavedChanges = true;
    this.autoSave("push", true);
  }

  private updateSeeds() {
    this.localParticipants.forEach((p, i) => {
      p.seed = i + 1;
    });
  }

  protected onLaneCheck(showModal = true) {
    const result = executeLaneCheck(
      this.localParticipants,
      this.localHeats,
      this.track(),
      this.translationService,
      this.isStepUpEnabled,
      this.race(),
    );
    this.isHeatsEqual = result.allEqual;
    if (showModal) {
      this.equalityReport = result.reports;
    }
  }

  protected closeReport() {
    this.equalityReport = null;
  }
  protected toggleAvailableDrivers() {
    this.isAvailableDriversCollapsed = !this.isAvailableDriversCollapsed;
  }
}
