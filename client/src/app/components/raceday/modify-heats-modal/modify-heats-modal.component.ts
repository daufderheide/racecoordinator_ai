import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
} from "@angular/core";
import { HostListener } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
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
import { ParticipantValidationService } from "@app/services/participant-validation.service";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

interface ModifyHeatsState {
  heats: Heat[];
  participants: RaceParticipant[];
}

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
  race = input.required<Race>();
  track = input.required<Track>();
  participants = input<RaceParticipant[]>([]);
  heats = input<Heat[]>([]);
  currentHeatNumber = input<number>(0);
  raceState = input<RaceState>(RaceState.NOT_STARTED);
  close = output<boolean>();

  public instanceId = Math.random();

  protected localHeats: Heat[] = [];
  protected localParticipants: RaceParticipant[] = [];
  protected driverPool: RaceParticipant[] = [];
  protected databaseDrivers: Driver[] = [];
  protected databaseTeams: Team[] = [];
  protected databaseParticipants: (Driver | Team)[] = [];
  protected allDrivers: Driver[] = [];
  protected isSaving = false;
  protected hasUnsavedChanges = false;
  protected showExitConfirmation = false;
  protected errorMessage?: string;
  protected scale = 1;
  protected hoveredHeatIdx = -1;
  protected isDraggingHeat = false;
  protected allTeams: Team[] = [];

  private validationService = inject(ParticipantValidationService);
  private translationService = inject(TranslationService);

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

  constructor(private dataService: DataService) {
    this.undoManager = new UndoManager<ModifyHeatsState>(
      {
        clonner: (state) => ({
          heats: state.heats.map((h) => this.cloneHeat(h)),
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
    // Deep clone heats to avoid modifying original state until saved
    this.localHeats = this.heats().map((h) => this.cloneHeat(h));
    this.localParticipants = [...this.participants()];

    this.undoManager.initialize({
      heats: this.localHeats,
      participants: this.localParticipants,
    });

    this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        this.allDrivers = (drivers as any[]).map(
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
        this.updateDriverPool();
        this.updateDatabaseParticipants();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch drivers", err);
      },
    });

    this.dataService.getTeams().subscribe({
      next: (teams) => {
        this.allTeams = (teams as any[]).map(
          (t) =>
            new Team(
              t.entity_id || t.entityId || "",
              t.name || "",
              t.avatarUrl || undefined,
              t.driver_ids || t.driverIds || [],
            ),
        );
        this.updateDatabaseParticipants();
        this.updateDriverPool();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch teams", err);
      },
    });

    this.updateDropListConnections();

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (event.type === "undo" || event.type === "redo") {
          this.autoSave(event.type);
        }
      }),
    );

    this.updateDatabaseParticipants();
    this.updateDriverPool();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private cloneHeat(heat: Heat): Heat {
    const clonedDrivers = heat.heatDrivers.map((dhd: DriverHeatData) => {
      if (!dhd) return null;
      const newDhd = new DriverHeatData(
        dhd.objectId,
        dhd.participant,
        dhd.laneIndex,
        dhd.actualDriver,
      );
      // Copy other relevant fields if necessary (but for modification, we mostly care about the participant)
      newDhd.reactionTime = dhd.reactionTime;
      newDhd.addLapTime(0, 0, 0, 0, 0, dhd.lapTimes.length, "", false); // Placeholder to preserve lap count
      return newDhd;
    });
    const validDrivers = clonedDrivers.filter(
      (d: DriverHeatData | null): d is DriverHeatData => d !== null,
    );
    return new Heat(
      heat.objectId,
      heat.heatNumber,
      validDrivers,
      [...heat.standings],
      heat.started,
    );
  }

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
        s === RaceState.PAUSED ||
        s === RaceState.HEAT_OVER
      ) {
        return true;
      }
    }

    return false;
  }

  protected get isRegenerateDisabled(): boolean {
    return this.localHeats.some((h) => this.isHeatStarted(h));
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
    const fromId = event.previousContainer.id;
    const toId = event.container.id;

    if (fromId === toId) {
      if (toId === "driver-pool") {
        moveItemInArray(
          this.localParticipants,
          event.previousIndex,
          event.currentIndex,
        );
        this.updateSeeds();
        this.updateDriverPool();
        this.undoManager.captureState();
        this.autoSave();
      }
      return;
    }

    const data = event.item.data;
    let participant: RaceParticipant | undefined;

    // Resolve participant from source
    if (fromId === "database-drivers") {
      if (this.isDriver(data)) {
        const driver = data as Driver;
        const newParticipant = this.createParticipantFromDriver(driver);

        const potentialParticipants = [
          ...this.localParticipants,
          newParticipant,
        ];
        const validationResult = this.validationService.validate(
          potentialParticipants,
          this.allTeams,
          this.allDrivers,
        );

        if (!validationResult.isValid) {
          this.ackModalTitle = "RDS_ERR_VALIDATION_TITLE";
          this.ackModalMessage = this.validationService.getErrorMessage(
            validationResult,
            this.translationService,
          );
          this.showAckModal = true;
          return;
        }
        participant = newParticipant;
      } else {
        const team = data as Team;
        const newParticipant = this.createParticipantFromTeam(team);

        // Perform validation
        const potentialParticipants = [
          ...this.localParticipants,
          newParticipant,
        ];
        const validationResult = this.validationService.validate(
          potentialParticipants,
          this.allTeams,
          this.allDrivers,
        );

        if (!validationResult.isValid) {
          this.ackModalTitle = "RDS_ERR_VALIDATION_TITLE";
          this.ackModalMessage = this.validationService.getErrorMessage(
            validationResult,
            this.translationService,
          );
          this.showAckModal = true;
          return;
        }
        participant = newParticipant;
      }
    } else {
      participant = data as RaceParticipant;
    }

    if (!participant) return;

    // Destination handling
    if (toId.startsWith("heat-")) {
      const parts = toId.split("-");
      const toHIdx = parseInt(parts[1], 10);
      const toLIdx = parseInt(parts[3], 10);

      // Guard: Prevent dropping into a started heat
      if (this.isHeatStarted(this.localHeats[toHIdx])) {
        this.updateDriverPool();
        this.updateDatabaseParticipants();
        return;
      }

      // If we got here and it's a new participant, add it to the race
      if (fromId === "database-drivers") {
        this.localParticipants.push(participant);
        this.updateSeeds();
      }

      // Prevent duplicate drivers in the same heat (unless it's a swap in the same heat)
      const isAlreadyInHeat = this.localHeats[toHIdx].heatDrivers.some(
        (dhd) => dhd.participant.objectId === participant?.objectId,
      );

      const existingOccupant = this.getDriverInLane(toHIdx, toLIdx);

      if (fromId.startsWith("heat-")) {
        const fromParts = fromId.split("-");
        const fromHIdx = parseInt(fromParts[1], 10);
        const fromLIdx = parseInt(fromParts[3], 10);

        if (isAlreadyInHeat && fromHIdx !== toHIdx) {
          this.updateDriverPool();
          this.updateDatabaseParticipants();
          return;
        }

        if (existingOccupant) {
          // SWAP
          this.removeDriverFromHeat(fromHIdx, fromLIdx);
          this.removeDriverFromHeat(toHIdx, toLIdx);
          this.addDriverToHeat(toHIdx, toLIdx, participant);
          this.addDriverToHeat(fromHIdx, fromLIdx, existingOccupant);
        } else {
          // MOVE
          this.removeDriverFromHeat(fromHIdx, fromLIdx);
          this.addDriverToHeat(toHIdx, toLIdx, participant);
        }
      } else {
        // Dragging from pool/database to heat
        if (!isAlreadyInHeat) {
          if (existingOccupant) {
            // REPLACE
            this.removeDriverFromHeat(toHIdx, toLIdx);
            this.addDriverToHeat(toHIdx, toLIdx, participant);
          } else {
            // ADD
            this.addDriverToHeat(toHIdx, toLIdx, participant);
          }
        }
      }
    } else if (toId === "driver-pool") {
      if (fromId === "database-drivers") {
        // New participant to pool
        this.localParticipants.push(participant);
        this.updateSeeds();
      } else if (fromId.startsWith("heat-")) {
        const fromParts = fromId.split("-");
        const fromHIdx = parseInt(fromParts[1], 10);
        const fromLIdx = parseInt(fromParts[3], 10);
        this.removeDriverFromHeat(fromHIdx, fromLIdx);
      }
    } else if (toId === "database-drivers") {
      if (fromId === "driver-pool" || fromId.startsWith("heat-")) {
        const pToRemove = participant;

        // CHECK IF IN STARTED HEAT
        if (this.isParticipantInStartedHeat(pToRemove)) {
          this.ackModalTitle = this.translationService.translate(
            "RDS_ERR_VALIDATION_TITLE",
          );
          this.ackModalMessage = this.translationService.translate(
            "RD_ERR_PARTICIPANT_IN_STARTED_HEAT",
            { participant: pToRemove.driver.name },
          );
          this.showAckModal = true;
          this.updateDriverPool();
          this.updateDatabaseParticipants();
          return;
        }

        // Remove from race participants
        this.localParticipants = this.localParticipants.filter(
          (p) => p.objectId !== pToRemove.objectId,
        );

        // Also remove from all future heats if they were in any
        this.localHeats.forEach((h) => {
          if (!this.isHeatStarted(h)) {
            h.heatDrivers = h.heatDrivers.filter(
              (dhd) => dhd.participant.objectId !== pToRemove.objectId,
            );
          }
        });
        this.updateSeeds();
      }
    }

    this.updateDriverPool();
    this.updateDatabaseParticipants();
    this.undoManager.captureState();
    this.autoSave();
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

  private updateSeeds() {
    this.localParticipants.forEach((p, i) => {
      p.seed = i + 1;
    });
  }

  private createParticipantFromDriver(driver: Driver): RaceParticipant {
    const id = driver.entity_id || driver.objectId || (driver as any).entityId;
    return new RaceParticipant(
      `new-driver-${id}-${Math.random().toString(36).substring(7)}`,
      driver,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
    );
  }

  private createParticipantFromTeam(team: Team): RaceParticipant {
    const id = team.entity_id || team.objectId || (team as any).entityId;
    // When creating a participant from a team, we use an empty driver but attach the team
    return new RaceParticipant(
      `new-team-${id}-${Math.random().toString(36).substring(7)}`,
      new Driver("EMPTY_LANE", "Empty", "Empty"),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      100,
      team,
    );
  }

  protected isDriver(data: any): data is Driver {
    return (
      data instanceof Driver || ("nickname" in data && !("driverIds" in data))
    );
  }

  protected isTeam(data: any): data is Team {
    return data instanceof Team || "driverIds" in data;
  }

  protected getParticipantName(participant: RaceParticipant): string {
    if (participant.team) {
      return participant.team.name;
    }
    return participant.driver.name;
  }

  protected getParticipantMeta(p: RaceParticipant): string {
    if (p.team) {
      return `${p.team.driverIds.length} ${this.translationService.translate("RDS_TEAM_DRIVERS")}`;
    }
    return p.driver.nickname || p.driver.name;
  }

  protected getDatabaseItemTrackId(item: Driver | Team): string {
    const prefix = this.isDriver(item) ? "driver_" : "team_";
    const id =
      (item as any).entity_id ||
      (item as any).objectId ||
      (item as any).entityId ||
      "";
    return prefix + id;
  }

  protected getParticipantAvatar(
    participant: RaceParticipant,
  ): string | undefined {
    if (participant.team) {
      return participant.team.avatarUrl;
    }
    return participant.driver.avatarUrl;
  }

  private removeDriverFromHeat(heatIdx: number, laneIdx: number) {
    const heat = this.localHeats[heatIdx];
    heat.heatDrivers = heat.heatDrivers.filter(
      (d: DriverHeatData) => d.laneIndex !== laneIdx,
    );
  }

  private addDriverToHeat(
    heatIdx: number,
    laneIdx: number,
    participant: RaceParticipant,
  ) {
    const heat = this.localHeats[heatIdx];
    const newDhd = new DriverHeatData(
      `new-dhd-${Date.now()}-${Math.random()}`,
      participant,
      laneIdx,
    );
    heat.heatDrivers.push(newDhd);
  }

  protected onAddHeat() {
    const newHeatNumber = this.localHeats.length + 1;
    const newHeat = new Heat(`new-heat-${Date.now()}`, newHeatNumber, [], []);
    this.localHeats.push(newHeat);
    this.updateDropListConnections();
    this.undoManager.captureState();
    this.autoSave();
  }

  protected onRemoveHeat(index: number) {
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

  protected onRegenerateHeats() {
    this.isSaving = true;
    this.errorMessage = undefined;

    // Convert local participants to Proto IRaceParticipant[], filtering out empty drivers
    const protoParticipants: IRaceParticipant[] = this.localParticipants
      .filter((p) => !p.driver.isEmpty())
      .map((p) => ({
        objectId: p.objectId,
        driver: {
          name: p.driver.name,
          nickname: p.driver.nickname,
          avatarUrl: p.driver.avatarUrl,
          model: { entityId: p.driver.entity_id },
        },
        seed: p.seed,
      }));

    this.dataService.regenerateHeats(protoParticipants).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.heats) {
          // Update local heats with the newly generated ones
          this.localHeats = res.heats.map((hProto: IHeat) =>
            HeatConverter.fromProto(hProto),
          );
          this.updateDriverPool();
          this.updateDatabaseParticipants();
          this.updateDropListConnections();
          this.undoManager.captureState();
        } else {
          this.errorMessage =
            res.errorMessage || "Failed to regenerate heats. Please try again.";
          this.ackModalTitle = "RD_REGENERATE_HEATS_FAILED";
          this.ackModalMessage = this.errorMessage || "";
          this.showAckModal = true;
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = "Server error: " + err.message;
        this.ackModalTitle = "RD_REGENERATE_HEATS_FAILED";
        this.ackModalMessage = this.errorMessage || "";
        this.showAckModal = true;
      },
    });
  }

  get canSave(): boolean {
    return !this.isSaving && this.getValidationError() === null;
  }

  private getValidationError(): string | null {
    // 1. Check if any started heat was modified
    const originalHeats = this.heats();
    for (const localH of this.localHeats) {
      const originalH = originalHeats.find(
        (h) => h.objectId === localH.objectId,
      );
      if (originalH && this.isHeatStarted(originalH)) {
        // Compare drivers
        if (localH.heatDrivers.length !== originalH.heatDrivers.length) {
          return `RD_ERR_STARTED_HEAT_MODIFIED`;
        }
        for (let i = 0; i < localH.heatDrivers.length; i++) {
          const localDhd = localH.heatDrivers[i];
          const originalDhd = originalH.heatDrivers.find(
            (d) => d.laneIndex === localDhd.laneIndex,
          );
          if (
            !originalDhd ||
            localDhd.participant.objectId !== originalDhd.participant.objectId
          ) {
            return `RD_ERR_STARTED_HEAT_MODIFIED`;
          }
        }
      }
    }

    // 2. Check if any participant who was in a started heat was removed from the race
    for (const originalH of originalHeats) {
      if (this.isHeatStarted(originalH)) {
        for (const dhd of originalH.heatDrivers) {
          const stillInRace = this.localParticipants.some(
            (p) => p.objectId === dhd.participant.objectId,
          );
          if (!stillInRace) {
            return `RD_ERR_STARTED_PARTICIPANT_REMOVED`;
          }
        }
      }
    }

    return null;
  }

  get currentValidationError(): string | null {
    return this.getValidationError();
  }

  protected onAckModalClose() {
    this.showAckModal = false;
  }

  protected onBack() {
    if (this.hasUnsavedChanges || this.isSaving) {
      this.showExitConfirmation = true;
    } else {
      this.close.emit(true);
    }
  }

  protected onExitConfirm() {
    this.showExitConfirmation = false;
    this.close.emit(false); // Discard changes (don't force a final save)
  }

  protected onExitCancel() {
    this.showExitConfirmation = false;
  }

  protected autoSave(triggeredBy: UndoEventType = "push") {
    this.isSaving = true;
    this.hasUnsavedChanges = true;
    this.errorMessage = undefined;

    // Convert localHeats to Proto IHeat[]
    const currentTrack = this.track();
    const protoHeats: IHeat[] = this.localHeats.map((h: Heat) => {
      // Create an array for all lanes, ensuring the order matches the track's lanes
      const heatDrivers: any[] = [];
      const laneCount = currentTrack?.lanes?.length || 0;
      for (let i = 0; i < laneCount; i++) {
        const dhd = h.heatDrivers.find((d) => d.laneIndex === i);
        if (dhd) {
          heatDrivers.push({
            objectId: dhd.objectId,
            driver: { objectId: dhd.participant.objectId } as any,
          });
        } else {
          // Send an empty driver entry for empty lanes to maintain lane count and order
          heatDrivers.push({
            objectId: `empty-lane-${i}-${h.objectId}`,
            driver: { objectId: "" } as any,
          });
        }
      }

      return {
        objectId: h.objectId,
        heatNumber: h.heatNumber,
        heatDrivers: heatDrivers,
        started: this.isHeatStarted(h),
        standings: h.standings,
      } as IHeat;
    });

    // Participants list
    const protoParticipants: IRaceParticipant[] = this.localParticipants.map(
      (p: RaceParticipant) => {
        const proto: IRaceParticipant = {
          objectId: p.objectId,
          driver: {
            name: p.driver.name,
            nickname: p.driver.nickname,
            avatarUrl: p.driver.avatarUrl,
            model: { entityId: p.driver.entity_id || p.driver.objectId },
          },
          seed: p.seed,
        };
        if (p.team) {
          proto.team = {
            name: p.team.name,
            avatarUrl: p.team.avatarUrl,
            model: { entityId: p.team.entity_id || p.team.objectId },
            driverIds: p.team.driverIds,
          };
        }
        return proto;
      },
    );

    this.dataService.modifyHeats(protoHeats, protoParticipants).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.success) {
          this.hasUnsavedChanges = false;
        } else {
          this.handleSaveFailure(triggeredBy);
        }
      },
      error: (e: any) => {
        this.isSaving = false;
        this.handleSaveFailure(triggeredBy);
      },
    });
  }

  private handleSaveFailure(triggeredBy: UndoEventType) {
    // If the save failed (e.g., trying to modify a started heat),
    // automatically revert the change and clear it from history so it "never happened".

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
    this.hasUnsavedChanges = false;
  }
}
