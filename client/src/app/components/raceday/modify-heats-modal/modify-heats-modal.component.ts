import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
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
import { ActivatedRoute, Router } from "@angular/router";
import { finalize, forkJoin, Subscription } from "rxjs";
import { AcknowledgementModalComponent } from "@app/components/shared/acknowledgement-modal/acknowledgement-modal.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import {
  UndoEventType,
  UndoManager,
} from "@app/components/shared/undo-redo-controls/undo-manager";
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
import { TranslationService } from "@app/services/translation.service";
import { checkLaneEquality } from "@app/utils/lane-equality";
import { naturalSortCompare } from "@app/utils/sorting.utils";

import { ModifyHeatsService } from "./modify-heats.service";
import {
  cloneHeat,
  convertHeatsToProto,
  convertParticipantsToProto,
  getDatabaseItemTrackId,
  getModifyHeatsValidationError,
  getParticipantAvatar,
  getParticipantMeta,
  getParticipantName,
  isDriver,
  isTeam,
  ModifyHeatsState,
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
  ],
})
export class ModifyHeatsModalComponent implements OnInit, OnDestroy {
  private raceService = inject(RaceService);
  private raceConnectionService = inject(RaceConnectionService);
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
  private isRecovering = false;
  protected hoveredHeatIdx = -1;
  protected isDraggingHeat = false;
  protected allTeams: Team[] = [];
  protected isLoading = false;
  protected equalityReport: any[] | null = null;
  protected isHeatsEqual: boolean = false;
  protected isAvailableDriversCollapsed = false;

  private translationService = inject(TranslationService);
  private router = inject(Router);
  private logger = inject(LoggerService);

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
        equalizer: (a, b) => {
          // Compare heats structure
          const heatsMatch =
            a.heats.length === b.heats.length &&
            a.heats.every((h, i) => {
              const otherH = b.heats[i];
              return (
                h.objectId === otherH.objectId &&
                h.group === otherH.group &&
                h.heatDrivers.length === otherH.heatDrivers.length &&
                h.heatDrivers.every((dhd, j) => {
                  const otherDhd = otherH.heatDrivers[j];
                  return (
                    dhd.laneIndex === otherDhd.laneIndex &&
                    dhd.participant.objectId === otherDhd.participant.objectId
                  );
                })
              );
            });

          // Compare participants
          const participantsMatch =
            a.participants.length === b.participants.length &&
            a.participants.every(
              (p, i) => p.objectId === b.participants[i].objectId,
            );

          return heatsMatch && participantsMatch;
        },
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
        this.allDrivers = (result.drivers as any[]).map(
          (d) =>
            new Driver(
              d.entity_id || d.entityId || d.id || "",
              d.name || "",
              d.nickname || "",
              d.avatarUrl || undefined,
              d.lapAudio,
              d.bestLapAudio,
              d.penaltyAudio,
            ),
        );
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

  private updateDriverPool() {
    this.driverPool = this.localParticipants.filter((p) => {
      // 1. Must be a real participant (not a placeholder empty lane)
      const isPlaceholder =
        (p.driver?.entity_id === "EMPTY_LANE" ||
          (p.driver as any)?.entityId === "EMPTY_LANE") &&
        !p.team;
      if (isPlaceholder) return false;

      return true;
    });
  }

  private updateDatabaseParticipants() {
    const participantDriverIds = new Set<string>();
    const participantTeamIds = new Set<string>();

    this.localParticipants.forEach((p) => {
      const dId =
        p.driver?.entity_id ||
        p.driver?.objectId ||
        (p.driver as any)?.entityId;
      if (dId && dId !== "EMPTY_LANE") {
        participantDriverIds.add(dId);
      }
      const team = p.team;
      const tId = team?.entity_id || team?.objectId || (team as any)?.entityId;
      if (tId && team) {
        participantTeamIds.add(tId);
        const driverIds = team.driverIds || (team as any).driver_ids || [];
        driverIds.forEach((id: string) => participantDriverIds.add(id));
      }
    });

    this.databaseDrivers = this.allDrivers.filter((d) => {
      const id = d.entity_id || d.objectId || (d as any).entityId;
      return id && id !== "EMPTY_LANE" && !participantDriverIds.has(id);
    });

    this.databaseTeams = this.allTeams.filter((t) => {
      const id = t.entity_id || t.objectId || (t as any).entityId;
      if (id && participantTeamIds.has(id)) return false;
      const driverIds = (t as any).driver_ids || t.driverIds || [];
      return !driverIds.some((dId: string) => participantDriverIds.has(dId));
    });

    this.databaseParticipants.length = 0;
    this.databaseParticipants.push(
      ...this.databaseDrivers,
      ...this.databaseTeams,
    );
    this.databaseParticipants.sort((a, b) =>
      naturalSortCompare(a.name, b.name),
    );
  }

  private updateDropListConnections() {
    this.heatDropListIds = ["driver-pool", "database-drivers"];
    this.localHeats.forEach((h, hIdx) => {
      this.track().lanes.forEach((_, lIdx) => {
        this.heatDropListIds.push(`heat-${hIdx}-lane-${lIdx}`);
      });
    });
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

  protected getDriverInLane(
    heatIdx: number,
    laneIdx: number,
  ): RaceParticipant | null {
    const dhd = this.localHeats[heatIdx].heatDrivers.find(
      (d: DriverHeatData) => d.laneIndex === laneIdx,
    );
    return dhd ? dhd.participant : null;
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

  protected isParticipantInStartedHeat(participant: RaceParticipant): boolean {
    for (const heat of this.localHeats) {
      if (this.isHeatStarted(heat)) {
        const isInHeat = heat.heatDrivers?.some(
          (dhd) => dhd.participant.objectId === participant.objectId,
        );
        if (isInHeat) {
          return true;
        }
      }
    }
    return false;
  }

  protected onHeatDragStarted() {
    this.isDraggingHeat = true;
  }

  protected onHeatHover(index: number) {
    if (this.isDraggingHeat) {
      this.hoveredHeatIdx = index;
    }
  }

  protected onHeatDrop(event: CdkDragDrop<Heat[]>) {
    this.isDraggingHeat = false;
    const toIdx = this.hoveredHeatIdx;
    this.hoveredHeatIdx = -1;

    if (toIdx === -1) return;

    // Get the actual heat that was being dragged
    const draggedHeat = event.item.data as Heat;
    const fromIdx = this.localHeats.findIndex(
      (h) => h.objectId === draggedHeat.objectId,
    );

    if (fromIdx === -1 || fromIdx === toIdx) return;

    const heatToMove = this.localHeats[fromIdx];
    const targetHeat = this.localHeats[toIdx];

    if (this.isHeatStarted(heatToMove) || this.isHeatStarted(targetHeat))
      return;

    // Find the index of the last started heat
    let lastStartedIdx = -1;
    for (let i = 0; i < this.localHeats.length; i++) {
      if (this.isHeatStarted(this.localHeats[i])) {
        lastStartedIdx = i;
      }
    }

    if (toIdx <= lastStartedIdx) return;

    console.log(`Swapping heat at ${fromIdx} with heat at ${toIdx}`);

    const temp = this.localHeats[fromIdx];
    this.localHeats[fromIdx] = this.localHeats[toIdx];
    this.localHeats[toIdx] = temp;

    // Renumber heats to maintain order
    this.localHeats.forEach((h, i) => (h.heatNumber = i + 1));
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
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

  protected onBack() {
    if (this.undoManager.hasChanges()) {
      this.showExitConfirmation = true;
    } else {
      this.close.emit(true);
      const returnUrl =
        this.route.snapshot.queryParamMap.get("returnUrl") || "/raceday";
      this.router.navigateByUrl(returnUrl);
    }
  }

  onManageTeams() {
    this.modifyHeatsService.saveState(this.localHeats, this.localParticipants);
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") ||
      this.router.url.split("?")[0];
    this.router.navigate(["/team-manager"], {
      queryParams: { from: "modify-heats", returnUrl },
    });
  }

  onManageDrivers() {
    this.modifyHeatsService.saveState(this.localHeats, this.localParticipants);
    const returnUrl =
      this.route.snapshot.queryParamMap.get("returnUrl") ||
      this.router.url.split("?")[0];
    this.router.navigate(["/driver-manager"], {
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
    // If the save failed (e.g., trying to modify a started heat),
    // automatically revert the change and clear it from history so it "never happened".
    this.isRecovering = true;
    try {
      if (triggeredBy === "undo") {
        // We tried to undo B -> A, but server rejected A.
        // We are at A on client. We should go back to B.
        // Going back to B from A is a redo.
        this.undoManager.redo();
        // Now B is applied, and A is in undoStack. Remove A.
        this.undoManager.popUndo();
      } else if (triggeredBy === "redo") {
        // We tried to redo A -> B, but server rejected B.
        // We are at B on client. We should go back to A.
        // Going back to A from B is an undo.
        this.undoManager.undo();
        // Now A is applied, and B is in redoStack. Remove B.
        this.undoManager.popRedo();
      } else {
        // Normal push (drag drop, etc)
        this.undoManager.undo();
        this.undoManager.clearRedo();
      }
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
    const activeParticipants = this.localParticipants.filter(
      (p) => p.driver && !p.driver.isEmpty(),
    );
    const driverIds = activeParticipants.map((p) => p.objectId);
    const driverNames = new Map<string, string>();
    activeParticipants.forEach((p) => {
      driverNames.set(p.objectId, getParticipantName(p));
    });

    const heats = this.localHeats.map((h) =>
      this.track().lanes.map((_, laneIdx) => {
        const dhd = h.heatDrivers.find((d) => d.laneIndex === laneIdx);
        return dhd &&
          dhd.participant &&
          dhd.participant.driver &&
          !dhd.participant.driver.isEmpty()
          ? dhd.participant.objectId
          : null;
      }),
    );

    const result = checkLaneEquality(
      this.track().lanes.length,
      driverIds,
      heats,
      driverNames,
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
