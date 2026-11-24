import {
  CdkDragDrop,
  CdkDragMove,
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
import { finalize, forkJoin, Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import {
  CustomOptionComponent,
  CustomSelectComponent,
} from "@app/components/shared/custom-select/custom-select.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IRaceParticipant, RaceState } from "@app/proto/antigravity";
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
  performLaneCheck,
  revertSaveFailure,
  validateGroupSequence,
} from "./modify-heats-modal.utils";
import {
  addHeatToState,
  applyTeammateChange,
  AvailableGroup,
  AvailableStep,
  buildSavePayload,
  calculateStepUpPool,
  canEnterDriverDropListPredicate,
  canEnterHeatsGridPredicate,
  cloneInitialHeats,
  convertParticipantsToProto,
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
  loadAndRegisterDrivers,
  loadAndRegisterTeams,
  mapRegeneratedHeatsFromProto,
  removeDriverFromHeatState,
  removeHeatFromState,
  resolveDraggedParticipant,
} from "./modify-heats-ui.helper";

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
  draggedParticipant: RaceParticipant | null = null;

  hasGroupFilter(): boolean {
    return !!this.race()?.group_options?.enabled;
  }
  hasStepFilter(): boolean {
    return this.isStepUpEnabled;
  }
  isFilterActive(): boolean {
    return this.selectedGroup() !== null || this.selectedStep() !== null;
  }

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
  protected canEnterDriverDropList = canEnterDriverDropListPredicate;

  private modifyHeatsService = inject(ModifyHeatsService);

  constructor(private dataService: DataService) {
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

    // Ensure we are connected to the websocket to maintain race persistence
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.localRaceState.set(state);
      }),
    );

    this.isLoading = true;
    this.localHeats = cloneInitialHeats(this.heats());
    this.localParticipants = [...this.participants()];

    const savedState = this.modifyHeatsService.restoreState();
    if (savedState) {
      this.localHeats = savedState.heats;
      this.localParticipants = savedState.participants;
      this.undoManager.clearRedo();
      // We don't want to capture the initial state if we just restored it,
      // as it might be 'dirty' relative to the server but it's what the user wants.
      this.undoManager.captureState();
      this.hasUnsavedChanges = true;
    }

    if (this.isStepUpEnabled) {
      inferBoundariesFromDrivers(this.localHeats);
      assignStepNumbers(this.localHeats, this.race()?.step_up);
    }

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
    }).subscribe({
      next: (result: any) => {
        this.allDrivers = loadAndRegisterDrivers(result.drivers);
        this.allTeams = loadAndRegisterTeams(result.teams);

        if (!savedState) {
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
      error: (err: any) => {
        this.logger.error("Failed to load database items", err);
        if (!savedState) {
          this.initializeState();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          !this.isRecovering &&
          (event.type === "undo" || event.type === "redo")
        ) {
          this.autoSave(event.type);
          this.cdr.detectChanges();
        }
      }),
    );

    this.subscriptions.push(
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

  protected getParticipantMeta(p: RaceParticipant): string {
    return getParticipantMeta(p, this.translationService);
  }

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

  protected getCustomGroupName(groupIdx: number): string {
    return getCustomGroupName(this.race(), groupIdx);
  }

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
    heat.step = Math.max(1, Number(newStep) || 1);
    this.undoManager.captureState();
    this.autoSave();
  }

  protected toggleStepUpBoundary(heat: Heat) {
    heat.isStepUpBoundary = !heat.isStepUpBoundary;
    if (this.isStepUpEnabled) {
      assignStepNumbers(this.localHeats, this.race()?.step_up);
    }
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

  protected getDriverHeatDataInLane(
    heatIdx: number,
    laneIdx: number,
  ): DriverHeatData | null {
    return getDriverHeatDataInLaneHelper(this.localHeats, heatIdx, laneIdx);
  }

  protected isTeamLane(dhd: DriverHeatData): boolean {
    return TeammateUtils.isTeam(dhd);
  }

  protected getTeammates(dhd: DriverHeatData): Driver[] {
    return TeammateUtils.getTeammates(dhd, this.allDrivers);
  }

  protected getDropdownArrowBg(color: string): SafeStyle {
    return createDropdownArrowBg(this.sanitizer, color);
  }

  protected onTeammateChange(
    heatIdx: number,
    dhd: DriverHeatData,
    eventOrValue: any,
  ) {
    const selectedDriverId =
      typeof eventOrValue === "string"
        ? eventOrValue
        : ((eventOrValue?.target as HTMLSelectElement)?.value ?? eventOrValue);
    if (
      applyTeammateChange(
        this.localHeats,
        heatIdx,
        dhd,
        selectedDriverId,
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
      this.updateDriverPool();
      this.updateDatabaseParticipants();
      this.updateDropListConnections();
      this.undoManager.captureState();
      this.autoSave();
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
    if (this.isDraggingHeat) {
      this.heatDragController.updateCardHover(
        index,
        event,
        this.getLastStartedHeatIndex(),
        this.localHeats[index],
        (h) => this.isHeatStarted(h),
      );
    }
  }

  protected onHeatMouseLeave(_index: number): void {}

  protected onGridMouseMove(event: MouseEvent): void {
    if (!this.isDraggingHeat) return;
    this.heatDragController.updatePointHover(
      event.clientX,
      event.clientY,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
    );
  }

  protected onHeatDragMoved(event: CdkDragMove<Heat>): void {
    if (!this.isDraggingHeat) return;
    this.heatDragController.updatePointHover(
      event.pointerPosition.x,
      event.pointerPosition.y,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
    );
  }

  protected getHeatCardBounds(): HeatCardBounds[] {
    return collectHeatCardBounds(this.localHeats, (h) => this.isHeatStarted(h));
  }

  protected onHeatDrop(event: CdkDragDrop<Heat[]>): void {
    const result = this.heatDragController.handleDrop(
      event,
      this.localHeats,
      this.getLastStartedHeatIndex(),
      (h) => this.isHeatStarted(h),
      () => this.getHeatCardBounds(),
    );
    if (result.reordered) {
      this.localHeats = result.newHeats;
      if (this.isStepUpEnabled) {
        assignStepNumbers(this.localHeats, this.race()?.step_up);
      }
      this.updateDropListConnections();
      this.undoManager.captureState();
      this.autoSave();
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
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRemoveHeat(index: number): void {
    if (this.isSaving) return;
    if (
      !removeHeatFromState(
        this.localHeats,
        index,
        (h) => this.isHeatStarted(h),
        this.race()?.step_up,
        this.isStepUpEnabled,
      )
    ) {
      return;
    }
    this.updateDriverPool();
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRemoveFromHeat(heatIdx: number, laneIdx: number): void {
    if (this.isSaving) return;
    if (
      !removeDriverFromHeatState(this.localHeats, heatIdx, laneIdx, (h) =>
        this.isHeatStarted(h),
      )
    ) {
      return;
    }
    this.updateDriverPool();
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRegenerateHeats() {
    this.savingCount++;
    this.cdr.detectChanges();
    this.errorMessage.set(undefined);
    try {
      // Convert local participants to Proto IRaceParticipant[]
      const protoParticipants: IRaceParticipant[] = convertParticipantsToProto(
        this.localParticipants,
      );

      this.dataService
        .regenerateHeats(protoParticipants)
        .pipe(
          finalize(() => {
            this.savingCount--;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.heats) {
              // Update local heats with the newly generated ones
              this.localHeats = mapRegeneratedHeatsFromProto(res.heats);
              this.updateDriverPool();
              this.updateDatabaseParticipants();
              this.updateDropListConnections();
              this.undoManager.captureState();
              this.autoSave();
            } else {
              this.errorMessage.set(
                res.errorMessage ||
                  "Failed to regenerate heats. Please try again.",
              );
              this.ackModalTitle = "RD_REGENERATE_HEATS_FAILED";
              this.ackModalMessage = this.errorMessage() || "";
              this.showAckModal = true;
            }
          },
          error: (err) => {
            this.errorMessage.set("Server error: " + err.message);
            this.ackModalTitle = "RD_REGENERATE_HEATS_FAILED";
            this.ackModalMessage = this.errorMessage() || "";
            this.showAckModal = true;
          },
        });
    } catch (e) {
      console.error("Error building regenerate heats payload:", e);
      this.savingCount--;
      this.cdr.detectChanges();
    }
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
    this.modifyHeatsService.saveState(this.localHeats, this.localParticipants);
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") ||
      this.router.url.split("?")[0];
    this.router.navigate([path], {
      queryParams: { from: "modify-heats", returnUrl },
    });
  }

  onManageTeams = () => this.navigateToEditor("/team-editor");
  onManageDrivers = () => this.navigateToEditor("/driver-editor");

  protected onExitConfirm() {
    this.showExitConfirmation = false;
    this.close.emit(false); // Discard changes (don't force a final save)
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") || "/raceday";
    this.router.navigateByUrl(returnUrl);
  }

  protected onExitCancel() {
    this.showExitConfirmation = false;
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
        // Revert invalid started heat / started participant change
        this.undoManager.undo();
        this.undoManager.clearRedo();
      } else {
        this.hasUnsavedChanges = true;
      }
      // No increment happened yet for this call, but if we were called from another save
      // we don't want to mess with it. Wait, actually we DIDN'T increment yet.
      // autoSave is called, first thing it does is check validation.
      // If invalid, it returns BEFORE incrementing savingCount.
      return;
    }
    this.errorMessage.set(undefined);
    this.onLaneCheck(false);

    this.savingCount++;
    this.cdr.detectChanges();
    this.hasUnsavedChanges = true;

    try {
      const { protoHeats, protoParticipants } = buildSavePayload(
        this.localHeats,
        this.track(),
        (h) => this.isHeatStarted(h),
        this.localParticipants,
      );

      this.dataService
        .modifyHeats(protoHeats, protoParticipants)
        .pipe(
          finalize(() => {
            this.savingCount--;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.hasUnsavedChanges = false;
              this.undoManager.resetTracking({
                heats: this.localHeats,
                participants: this.localParticipants,
              });
            } else {
              this.handleSaveFailure(triggeredBy);
            }
          },
          error: (e: any) => {
            this.handleSaveFailure(triggeredBy);
          },
        });
    } catch (e) {
      console.error("Error building save payload:", e);
      this.savingCount--;
      this.cdr.detectChanges();
    }
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

  setGroupFilter(grpIndex: number | null): void {
    this.selectedGroup.set(grpIndex);
  }
  setStepFilter(step: number | null): void {
    this.selectedStep.set(step);
  }
  clearFilters(): void {
    this.selectedGroup.set(null);
    this.selectedStep.set(null);
  }
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
    const oldGroup = heat.group;
    const newGroupIndex = newValue - 1;
    if (newGroupIndex === oldGroup) return;

    heat.group = newGroupIndex;
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
    const result = performLaneCheck(
      this.localParticipants,
      this.localHeats,
      this.track(),
      this.translationService,
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
