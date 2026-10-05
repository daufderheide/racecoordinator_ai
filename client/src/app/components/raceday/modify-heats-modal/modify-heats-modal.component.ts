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
import { DriverConverter } from "@app/converters/driver.converter";
import { HeatConverter } from "@app/converters/heat.converter";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Race } from "@app/models/race";
import { RaceParticipant } from "@app/models/race_participant";
import { Team } from "@app/models/team";
import { Track } from "@app/models/track";
import { AvatarUrlPipe } from "@app/pipes/avatar-url.pipe";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { IHeat, IRaceParticipant, RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";
import { Heat } from "@app/race/heat";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { TeammateUtils } from "@app/utils/teammate.utils";

import { ModifyHeatsService } from "./modify-heats.service";
import {
  allocateHighlightColor,
  areModifyHeatsStatesEqual,
  buildDropListConnections,
  calculateHeatCardHoverAction,
  calculateHeatDropAction,
  cloneHeat,
  collectHeatCardBounds,
  convertHeatsToProto,
  convertParticipantsToProto,
  executeHeatReorder,
  filterDatabaseParticipants,
  filterDriverPool,
  getContrastTextColor,
  getDatabaseItemTrackId,
  getLastStartedHeatIndex,
  getModifyHeatsValidationError,
  getParticipantAvatar,
  getParticipantKey,
  getParticipantMeta,
  getParticipantName,
  HeatCardBounds,
  HeatDropAction,
  isDriver,
  isParticipantInStartedHeat,
  isTeam,
  ModifyHeatsState,
  performLaneCheck,
  revertSaveFailure,
  validateGroupSequence,
} from "./modify-heats-modal.utils";

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
  protected hoveredHeatIdx = -1;
  protected isDraggingHeat = false;
  protected heatDropAction: HeatDropAction = null;
  protected get activeInsertSlot(): number {
    return this.heatDropAction?.type === "insert"
      ? this.heatDropAction.slotIndex
      : -1;
  }
  protected allTeams: Team[] = [];
  protected isLoading = false;
  protected equalityReport: any[] | null = null;
  protected isHeatsEqual: boolean = false;
  protected isAvailableDriversCollapsed = false;
  protected highlightedDrivers = new Map<string, string>();

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
  protected heatDropListIds: string[] = ["driver-pool", "database-drivers"];
  protected connectedTo: string[] = ["driver-pool", "database-drivers"];

  private cdr = inject(ChangeDetectorRef);
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
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        this.undoManager.redo();
      } else {
        this.undoManager.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      this.undoManager.redo();
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
  }

  ngOnInit() {
    (window as any).tempModifyHeats = this;
    this.updateScale();

    // Ensure we are connected to the websocket to maintain race persistence
    this.raceConnectionService.connect();

    this.subscriptions.push(
      this.raceConnectionService.raceState$.subscribe((state) => {
        this.localRaceState.set(state);
      }),
    );

    this.isLoading = true;
    this.localHeats = this.heats().map((h) => cloneHeat(h));
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

    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
    }).subscribe({
      next: (result: any) => {
        this.allDrivers = (result.drivers as any[]).map((d) => {
          const driver = DriverConverter.fromJSON(d);
          DriverConverter.register(driver);
          return driver;
        });
        this.allTeams = (result.teams as any[]).map(
          (t) =>
            new Team(
              t.entity_id || t.entityId || "",
              t.name || "",
              t.avatarUrl || undefined,
              t.driver_ids || t.driverIds || [],
            ),
        );

        if (!savedState) {
          this.initializeState();
        } else {
          this.updateDatabaseParticipants();
          this.updateDriverPool();
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
    // Deep clone heats to avoid modifying original state until saved
    this.localHeats = this.heats().map((h) => cloneHeat(h));
    this.localParticipants = [...this.participants()];

    this.undoManager.initialize({
      heats: this.localHeats,
      participants: this.localParticipants,
    });
    this.updateDatabaseParticipants();
    this.updateDriverPool();
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

  protected isDriverHighlighted(
    participant: RaceParticipant | null | undefined,
  ): boolean {
    if (!participant) return false;
    const key = getParticipantKey(participant);
    return key !== "" && this.highlightedDrivers.has(key);
  }

  protected getDriverHighlightColor(
    participant: RaceParticipant | null | undefined,
  ): string | null {
    if (!participant) return null;
    const key = getParticipantKey(participant);
    return key !== "" ? (this.highlightedDrivers.get(key) ?? null) : null;
  }

  protected toggleDriverHighlight(
    participant: RaceParticipant | null | undefined,
    event?: MouseEvent,
  ) {
    if (event) {
      event.stopPropagation();
      if (event.button !== 0) return;
    }
    if (!participant) return;
    const key = getParticipantKey(participant);
    if (!key) return;

    if (this.highlightedDrivers.has(key)) {
      this.highlightedDrivers.delete(key);
    } else {
      const usedColors = new Set(
        Array.from(this.highlightedDrivers.values()).map((c) =>
          c.toLowerCase(),
        ),
      );
      const color = allocateHighlightColor(usedColors);
      this.highlightedDrivers.set(key, color);
    }
    this.cdr.markForCheck();
  }

  protected clearDriverHighlights(): void {
    this.highlightedDrivers.clear();
    this.cdr.markForCheck();
  }

  protected getContrastTextColor = getContrastTextColor;

  protected hasHighlightedDrivers(): boolean {
    return this.highlightedDrivers.size > 0;
  }

  protected isHeatHighlighted(heat: Heat): boolean {
    if (this.highlightedDrivers.size === 0) return false;
    return heat.heatDrivers.some((dhd) =>
      this.isDriverHighlighted(dhd.participant),
    );
  }

  protected getHeatHighlightColors(heat: Heat): string[] {
    if (this.highlightedDrivers.size === 0) return [];
    const colors: string[] = [];
    for (const dhd of heat.heatDrivers) {
      const color = this.getDriverHighlightColor(dhd.participant);
      if (color && !colors.includes(color)) {
        colors.push(color);
      }
    }
    return colors;
  }

  protected getCustomGroupName(groupIdx: number): string {
    const r = this.race();
    if (!r || !r.group_options?.enabled) return "";
    const names = r.group_options.names;
    if (
      groupIdx !== undefined &&
      groupIdx !== null &&
      names &&
      names[groupIdx] &&
      names[groupIdx].trim() !== ""
    ) {
      return names[groupIdx].trim();
    }
    return "";
  }

  private updateDriverPool() {
    this.driverPool = filterDriverPool(this.localParticipants);
  }

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
      this.track().lanes.length,
    );
    this.connectedTo = [...this.heatDropListIds];
  }

  protected isHeatStarted(heat: Heat): boolean {
    if (
      heat.started ||
      heat.heatNumber < this.currentHeatNumber() ||
      this.raceState() === RaceState.RACE_OVER
    ) {
      return true;
    }

    // Also consider it started if it's the current heat and the race is active
    if (heat.heatNumber === this.currentHeatNumber()) {
      const s = this.raceState();
      if (
        s === RaceState.STARTING ||
        s === RaceState.RACING ||
        s === RaceState.HEAT_OVER ||
        s === RaceState.PAUSED
      ) {
        return true;
      }
    }

    return false;
  }

  protected get isRegenerateDisabled(): boolean {
    return false;
  }

  protected getDriverHeatDataInLane(
    heatIdx: number,
    laneIdx: number,
  ): DriverHeatData | null {
    const dhd = this.localHeats[heatIdx].heatDrivers.find(
      (d: DriverHeatData) => d.laneIndex === laneIdx,
    );
    return dhd || null;
  }

  protected isTeamLane(dhd: DriverHeatData): boolean {
    return TeammateUtils.isTeam(dhd);
  }

  protected getTeammates(dhd: DriverHeatData): Driver[] {
    return TeammateUtils.getTeammates(dhd, this.allDrivers);
  }

  protected getDropdownArrowBg(color: string): SafeStyle {
    const encodedColor = encodeURIComponent(color);
    const svg = `data:image/svg+xml;utf8,<svg fill="%23${encodedColor.replace(/^%23/, "")}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>`;
    return this.sanitizer.bypassSecurityTrustStyle(`url('${svg}')`);
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
    const driver = this.allDrivers.find((d) => {
      const id = d.entity_id;
      return id === selectedDriverId;
    });
    if (driver) {
      const newDhd = new DriverHeatData(
        dhd.objectId,
        dhd.participant,
        dhd.laneIndex,
        driver,
      );
      const heat = this.localHeats[heatIdx];
      heat.heatDrivers = heat.heatDrivers.map((d) =>
        d.laneIndex === dhd.laneIndex ? newDhd : d,
      );
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  protected getHeatDriverMeta(dhd: DriverHeatData): string {
    if (dhd.participant && dhd.participant.team) {
      const actual = dhd.actualDriver;
      if (actual && !actual.isEmpty()) {
        return actual.nickname || actual.name;
      }
      return (
        dhd.participant.driver?.nickname || dhd.participant.driver?.name || ""
      );
    }
    return this.getParticipantMeta(dhd.participant);
  }

  protected getDriverStats(hd: DriverHeatData, driverId: string): string {
    return TeammateUtils.getDriverStats(hd, driverId, this.localHeats, {
      heatAbbr: this.translationService.translate("RD_STATS_HEAT_ABBR"),
      lapAbbr: this.translationService.translate("RD_STATS_LAP_ABBR"),
      totalAbbr: this.translationService.translate("RD_STATS_TOTAL_ABBR"),
    });
  }

  // eslint-disable-next-line max-lines-per-function
  protected onDrop(event: CdkDragDrop<any>) {
    const result = this.modifyHeatsService.handleDrop(event, {
      localHeats: this.localHeats,
      localParticipants: this.localParticipants,
      allDrivers: this.allDrivers,
      allTeams: this.allTeams,
      race: this.race(),
      isHeatStarted: (h) => this.isHeatStarted(h),
      isParticipantInStartedHeat: (p) => this.isParticipantInStartedHeat(p),
    });

    if (result.error) {
      this.ackModalTitle = result.error.title;
      this.ackModalMessage = result.error.message;
      this.showAckModal = true;
    }

    if (result.actionTaken) {
      this.localHeats = result.updatedHeats;
      this.localParticipants = result.updatedParticipants;
      this.updateSeeds();
      this.updateDriverPool();
      this.updateDatabaseParticipants();
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  protected onRemoveFromRacing(participant: RaceParticipant) {
    if (this.isSaving) return;
    const result = this.modifyHeatsService.handleRemoveFromRacing(participant, {
      localHeats: this.localHeats,
      localParticipants: this.localParticipants,
      allDrivers: this.allDrivers,
      allTeams: this.allTeams,
      race: this.race(),
      isHeatStarted: (h) => this.isHeatStarted(h),
      isParticipantInStartedHeat: (p) => this.isParticipantInStartedHeat(p),
    });

    if (result.error) {
      this.ackModalTitle = result.error.title;
      this.ackModalMessage = result.error.message;
      this.showAckModal = true;
    }

    if (result.actionTaken) {
      this.localHeats = result.updatedHeats;
      this.localParticipants = result.updatedParticipants;
      const removedKey = getParticipantKey(participant);
      if (removedKey && this.highlightedDrivers.has(removedKey)) {
        this.highlightedDrivers.delete(removedKey);
      }
      this.updateSeeds();
      this.updateDriverPool();
      this.updateDatabaseParticipants();
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  protected onAddFromAvailable(item: Driver | Team) {
    if (this.isSaving) return;
    const result = this.modifyHeatsService.handleAddFromAvailable(item, {
      localHeats: this.localHeats,
      localParticipants: this.localParticipants,
      allDrivers: this.allDrivers,
      allTeams: this.allTeams,
      race: this.race(),
      isHeatStarted: (h) => this.isHeatStarted(h),
      isParticipantInStartedHeat: (p) => this.isParticipantInStartedHeat(p),
    });

    if (result.error) {
      this.ackModalTitle = result.error.title;
      this.ackModalMessage = result.error.message;
      this.showAckModal = true;
    }

    if (result.actionTaken) {
      this.localHeats = result.updatedHeats;
      this.localParticipants = result.updatedParticipants;
      this.updateSeeds();
      this.updateDriverPool();
      this.updateDatabaseParticipants();
      this.undoManager.captureState();
      this.autoSave();
    }
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
    if (this.isHeatStarted(heat)) return false;
    return (
      this.heatDropAction?.type === "swap" &&
      this.heatDropAction.targetIndex === index
    );
  }

  protected onHeatDragStarted() {
    this.isDraggingHeat = true;
    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;
  }

  protected onHeatDragEnded() {
    this.isDraggingHeat = false;
    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;
  }

  protected onHeatHover(index: number) {
    if (this.isDraggingHeat) {
      if (index === -1) {
        this.heatDropAction = null;
        this.hoveredHeatIdx = -1;
      } else {
        const lastStartedIdx = this.getLastStartedHeatIndex();
        if (
          index > lastStartedIdx &&
          !this.isHeatStarted(this.localHeats[index])
        ) {
          this.heatDropAction = { type: "swap", targetIndex: index };
          this.hoveredHeatIdx = index;
        }
      }
    }
  }

  protected onHeatMouseEnter(index: number, event: MouseEvent) {
    if (this.isDraggingHeat) {
      this.updateHeatCardHover(index, event);
    }
  }

  protected onHeatMouseMove(index: number, event: MouseEvent) {
    if (this.isDraggingHeat) {
      this.updateHeatCardHover(index, event);
    }
  }

  protected onHeatMouseLeave(_index: number) {
    // Retain action until next movement or grid leave
  }

  private updateHeatCardHover(index: number, event: MouseEvent) {
    const cardEl = event.currentTarget as HTMLElement;
    if (!cardEl) return;
    const action = calculateHeatCardHoverAction(
      index,
      cardEl.getBoundingClientRect(),
      event.clientX,
      this.getLastStartedHeatIndex(),
      this.localHeats[index],
      (h) => this.isHeatStarted(h),
    );
    this.heatDropAction = action;
    this.hoveredHeatIdx = action?.type === "swap" ? action.targetIndex : -1;
  }

  protected onGridMouseMove(event: MouseEvent) {
    if (!this.isDraggingHeat) return;
    this.updateDropActionFromPoint(event.clientX, event.clientY);
  }

  protected onHeatDragMoved(event: CdkDragMove<Heat>) {
    if (!this.isDraggingHeat) return;
    this.updateDropActionFromPoint(
      event.pointerPosition.x,
      event.pointerPosition.y,
    );
  }

  private updateDropActionFromPoint(pointerX: number, pointerY: number) {
    const cards = this.getHeatCardBounds();
    const lastStartedIdx = this.getLastStartedHeatIndex();
    const action = calculateHeatDropAction(
      pointerX,
      pointerY,
      cards,
      lastStartedIdx,
    );
    this.heatDropAction = action;
    this.hoveredHeatIdx = action?.type === "swap" ? action.targetIndex : -1;
  }

  private getHeatCardBounds(): HeatCardBounds[] {
    return collectHeatCardBounds(this.localHeats, (h) => this.isHeatStarted(h));
  }

  protected onHeatDrop(event: CdkDragDrop<Heat[]>) {
    this.isDraggingHeat = false;

    let action = this.heatDropAction;
    if (!action && event.dropPoint) {
      const cards = this.getHeatCardBounds();
      const lastStartedIdx = this.getLastStartedHeatIndex();
      action = calculateHeatDropAction(
        event.dropPoint.x,
        event.dropPoint.y,
        cards,
        lastStartedIdx,
      );
    }

    this.heatDropAction = null;
    this.hoveredHeatIdx = -1;

    if (!action) return;

    const draggedHeat = event.item?.data as Heat;
    if (!draggedHeat) return;

    const fromIdx = this.localHeats.findIndex(
      (h) => h.objectId === draggedHeat.objectId,
    );
    if (fromIdx === -1) return;

    const lastStartedIdx = this.getLastStartedHeatIndex();
    const result = executeHeatReorder(
      this.localHeats,
      fromIdx,
      action,
      lastStartedIdx,
    );

    if (result.reordered) {
      this.localHeats = result.newHeats;
      this.updateDropListConnections();
      this.undoManager.captureState();
      this.autoSave();
    }
  }

  protected onAddHeat() {
    if (this.isSaving) return;
    const newHeatNumber = this.localHeats.length + 1;
    const newHeat = new Heat(`new-heat-${Date.now()}`, newHeatNumber, [], []);
    this.localHeats.push(newHeat);
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRemoveHeat(index: number) {
    if (this.isSaving) return;
    if (this.isHeatStarted(this.localHeats[index])) return;

    // Move drivers to pool
    // Drivers stay in the pool/participants list, so we just remove from heat

    this.localHeats.splice(index, 1);
    // Renumber heats
    this.localHeats.forEach((h, i) => (h.heatNumber = i + 1));

    this.updateDriverPool();
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRemoveFromHeat(heatIdx: number, laneIdx: number) {
    if (this.isSaving) return;
    const heat = this.localHeats[heatIdx];
    if (this.isHeatStarted(heat)) return;

    const dhd = heat.heatDrivers.find((d) => d.laneIndex === laneIdx);
    if (!dhd || !dhd.participant) return;

    // Remove from the heat
    heat.heatDrivers = heat.heatDrivers.filter((d) => d.laneIndex !== laneIdx);

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
              this.localHeats = res.heats.map((hProto: IHeat) =>
                HeatConverter.fromProto(hProto),
              );
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

  protected onAckModalClose() {
    this.showAckModal = false;
  }

  onManageTeams() {
    this.modifyHeatsService.saveState(this.localHeats, this.localParticipants);
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") ||
      this.router.url.split("?")[0];
    this.router.navigate(["/team-editor"], {
      queryParams: { from: "modify-heats", returnUrl },
    });
  }

  onManageDrivers() {
    this.modifyHeatsService.saveState(this.localHeats, this.localParticipants);
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") ||
      this.router.url.split("?")[0];
    this.router.navigate(["/driver-editor"], {
      queryParams: { from: "modify-heats", returnUrl },
    });
  }

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

      if (triggeredBy === "push" && !isGroupChange) {
        // Revert invalid non-group change
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
      // Convert localHeats to Proto IHeat[]
      const protoHeats: IHeat[] = convertHeatsToProto(
        this.localHeats,
        this.track(),
        (h) => this.isHeatStarted(h),
      );

      // Participants list
      const protoParticipants: IRaceParticipant[] = convertParticipantsToProto(
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
