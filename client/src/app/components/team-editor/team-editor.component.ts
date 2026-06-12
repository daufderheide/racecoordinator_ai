import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { Location } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import {
  ConnectionMonitorService,
  ConnectionState,
} from "@app/services/connection-monitor.service";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { naturalSortCompare } from "@app/utils/sorting.utils";

@Component({
  standalone: true,
  selector: "app-team-editor",
  templateUrl: "./team-editor.component.html",
  styleUrls: ["./team-editor.component.css"],
  imports: [
    EditorTitleComponent,
    ImageSelectorComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    TranslatePipe,
    ConfirmationModalComponent,
  ],
})
export class TeamEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  selectedTeam?: Team;
  editingTeam?: Team;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isDirty: boolean = false;
  isAutoSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;

  // Undo Manager
  undoManager!: UndoManager<Team>;

  // Manual change tracking baseline
  originalTeam: Team | null = null;

  // Data
  allDrivers: Driver[] = [];
  allTeams: Team[] = []; // For name uniqueness check

  // Assets
  avatarAssets: any[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    protected route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private location: Location,
    private helpService: HelpService,
    private raceConnectionService: RaceConnectionService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {
    this.undoManager = new UndoManager<Team>(
      {
        clonner: (t) => this.cloneTeam(t),
        equalizer: (a, b) => this.areTeamsEqual(a, b),
        applier: (t) => {
          const currentId = this.editingTeam?.entity_id;
          this.editingTeam = t;
          if (currentId && this.editingTeam) {
            this.editingTeam.entity_id = currentId;
          }
        },
      },
      () => this.editingTeam,
    );
  }

  ngOnInit() {
    setTimeout(() => this.updateScale());
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();

    if (this.route.queryParamMap) {
      this.subscriptions.push(
        this.route.queryParamMap.subscribe((paramMap) => {
          if (this.isReverting) {
            this.isReverting = false;
            return;
          }
          const nextId = paramMap.get("id");
          const currentId = this.editingTeam?.entity_id;
          if (
            currentId &&
            nextId !== currentId &&
            this.hasChanges() &&
            !this.isNavigationApproved
          ) {
            this.confirmDiscard().then((confirmed) => {
              if (confirmed) {
                this.loadData();
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
            this.loadData();
          }
        }),
      );
    } else {
      this.loadData();
    }

    if (this.undoManager) {
      this.subscriptions.push(
        this.undoManager.stateCommitted$.subscribe(() => {
          this.autoSaveTeam();
        }),
      );
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.undoManager.destroy();
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
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      this.redo();
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

  loadData() {
    const idParam = this.route.snapshot.queryParamMap.get("id");
    this.logger.debug("TeamEditor loadData. ID param:", idParam);
    if (!idParam) {
      this.logger.warn("No ID provided, redirecting to manager");
      // Redirect back to manager instead of throwing
      this.router.navigate(["/team-manager"]);
      return;
    }

    this.isLoading = true;
    this.dataSubscription = forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      assets: this.dataService.listAssets(),
    }).subscribe({
      next: (result) => {
        try {
          this.allDrivers = result.drivers.map(
            (d) =>
              new Driver(d.entity_id, d.name, d.nickname || "", d.avatarUrl),
          );
          this.allTeams = result.teams.map(
            (t: any) =>
              new Team(
                t.entity_id || t.entityId || "",
                t.name || "",
                t.avatarUrl || undefined,
                t.driverIds || [],
              ),
          );
          this.loadDataInternal(result.assets);
        } finally {
          this.isLoading = false;
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        this.logger.error("Failed to load data", err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
    });
  }

  private cloneTeam(team: Team): Team {
    return new Team(team.entity_id, team.name, team.avatarUrl, [
      ...team.driverIds,
    ]);
  }

  private areTeamsEqual(a: Team, b: Team): boolean {
    if (a.name !== b.name) return false;
    if (a.avatarUrl !== b.avatarUrl) return false;
    if (a.driverIds.length !== b.driverIds.length) return false;
    return a.driverIds.every((id, i) => id === b.driverIds[i]);
  }

  get isNameInvalid(): boolean {
    if (this.isLoading || !this.editingTeam) return false;
    return !this.editingTeam.name.trim() || !this.isNameUnique(true);
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingTeam) return true;
    const name = this.editingTeam.name.trim().toLowerCase();
    if (!name) return false;

    return !this.allTeams.some(
      (t) =>
        (excludeSelf ? t.entity_id !== this.editingTeam!.entity_id : true) &&
        t.name.toLowerCase() === name,
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
        this.router.navigate(["/team-manager"]);
      }
    }, 1000);
  }

  private loadDataInternal(assets: any[]) {
    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter((a) => a && a.type === "image");

    const idParam = this.route.snapshot.queryParamMap.get("id");

    if (idParam === "new") {
      this.selectedTeam = undefined;
      this.editingTeam = new Team("new", "", "", []);
    } else if (idParam) {
      const found = this.allTeams.find((t) => t.entity_id === idParam);
      if (found) {
        this.selectedTeam = found;
        this.editingTeam = this.cloneTeam(found);
      } else {
        throw new Error(`Team Editor: Invalid entity ID "${idParam}".`);
      }
    }

    if (this.editingTeam) {
      this.originalTeam = this.cloneTeam(this.editingTeam);
      this.undoManager.initialize(this.editingTeam);
    }
  }

  // Undo/Redo Proxies
  undo() {
    this.undoManager.undo();
  }
  redo() {
    this.undoManager.redo();
  }
  onInputFocus() {
    this.undoManager.onInputFocus();
  }
  onInputChange() {
    this.isDirty = true;
    this.undoManager.onInputChange();
    this.cdr.detectChanges();
  }
  onInputBlur() {
    this.undoManager.onInputBlur();
    this.cdr.detectChanges();
  }
  captureState() {
    this.undoManager.captureState();
    this.cdr.detectChanges();
  }

  private autoSaveTeam() {
    this.logger.debug("autoSaveTeam triggered");
    if (!this.editingTeam) {
      this.logger.debug("autoSaveTeam: no editingTeam");
      return;
    }
    if (this.isNameInvalid) {
      this.logger.debug("autoSaveTeam: name invalid");
      return;
    }
    if (this.isSaving) {
      this.logger.debug("autoSaveTeam: isSaving is true");
      return;
    }
    this.logger.debug("autoSaveTeam Triggering updateTeam");
    this.updateTeam(false, true);
  }

  onBackClicked() {
    if (this.isConfigValid()) {
      if (this.isDirtyState()) {
        this.navigateBackOnSave = true;
        this.updateTeam();
      } else {
        this.onBack();
      }
    } else {
      this.onBack();
    }
  }

  isConfigValid(): boolean {
    return !this.isNameInvalid;
  }

  isDirtyState(): boolean {
    if (!this.undoManager) return false;
    const umChanges = this.undoManager.hasChanges();
    if (!this.editingTeam || !this.originalTeam) return umChanges;
    return this.isDirty || umChanges;
  }

  onBack() {
    this.isNavigationApproved = true;
    this.router.navigate(["/team-manager"], {
      queryParams: {
        id: this.editingTeam?.entity_id,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
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

  updateTeam(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingTeam || this.isSaving) return;
    if (!isSaveAsNew && !this.isDirtyState()) return;

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    this.saveTeamData(isSaveAsNew, isAutoSave);
  }

  private saveTeamData(
    isSaveAsNew: boolean = false,
    isAutoSave: boolean = false,
  ) {
    if (!this.editingTeam) return;

    const teamToSend = this.cloneTeam(this.editingTeam);
    const wasNew = isSaveAsNew || teamToSend.entity_id === "new";

    if (wasNew) {
      teamToSend.entity_id = "new";
    }

    const obs =
      teamToSend.entity_id === "new"
        ? this.dataService.createTeam(teamToSend)
        : this.dataService.updateTeam(teamToSend.entity_id, teamToSend);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        this.isAutoSaving = false;
        if (this.editingTeam) {
          this.editingTeam.entity_id = result.entity_id;
          this.isDirty = false;
          this.originalTeam = this.cloneTeam(this.editingTeam);
          this.undoManager.resetTracking(this.editingTeam);
        }
        if (wasNew) {
          const newId = result.entity_id || result.entityId;
          if (isAutoSave) {
            const url = this.router.serializeUrl(
              this.router.createUrlTree(["/team-editor"], {
                queryParams: {
                  id: newId,
                  from: this.route.snapshot.queryParamMap.get("from"),
                  returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
                },
              }),
            );
            this.location.replaceState(url);
          } else {
            this.router.navigate(["/team-editor"], {
              queryParams: {
                id: newId,
                from: this.route.snapshot.queryParamMap.get("from"),
                returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
              },
            });
          }
        }
        this.refreshTeamList();

        if (this.navigateBackOnSave) {
          this.navigateBackOnSave = false; // Reset flag
          this.onBack();
        }

        // Trigger auto-save again if concurrent edits occurred while saving
        if (this.isDirtyState()) {
          this.autoSaveTeam();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to save team", err);
        if (!isAutoSave) {
          alert(
            this.translationService.translate("TM_ERROR_SAVE_FAILED") +
              (err.error || err.message),
          );
        }
        this.isSaving = false;
        this.isAutoSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  private refreshTeamList() {
    this.dataService.getTeams().subscribe({
      next: (teams) => {
        this.allTeams = teams.map(
          (t: any) =>
            new Team(
              t.entity_id || t.entityId || "",
              t.name || "",
              t.avatarUrl || undefined,
              t.driverIds || [],
            ),
        );
      },
    });
  }

  // Driver Membership Logic
  get assignedDrivers(): Driver[] {
    if (!this.editingTeam) return [];
    return this.editingTeam.driverIds
      .map((id) => this.allDrivers.find((d) => d.entity_id === id))
      .filter((d) => !!d) as Driver[];
  }

  get availableDrivers(): Driver[] {
    if (!this.allDrivers) return [];
    return this.allDrivers
      .filter((d) => !this.isDriverInTeam(d))
      .sort((a, b) => naturalSortCompare(a.name, b.name));
  }

  isDriverInTeam(driver: Driver): boolean {
    if (!this.editingTeam) return false;
    return this.editingTeam.driverIds.includes(driver.entity_id);
  }

  addDriver(driver: Driver) {
    if (!this.editingTeam) return;
    if (!this.isDriverInTeam(driver)) {
      this.editingTeam.driverIds.push(driver.entity_id);
      this.captureState();
    }
  }

  removeDriver(driver: Driver) {
    if (!this.editingTeam) return;
    this.editingTeam.driverIds = this.editingTeam.driverIds.filter(
      (id) => id !== driver.entity_id,
    );
    this.captureState();
  }

  onDriverDrop(event: CdkDragDrop<Driver[]>) {
    if (!this.editingTeam) return;
    moveItemInArray(
      this.editingTeam.driverIds,
      event.previousIndex,
      event.currentIndex,
    );
    this.captureState();
  }

  saveAsNew() {
    if (!this.editingTeam || this.isSaving) return;

    this.isSaving = true; // Lock immediately to prevent auto-save from starting
    this.editingTeam.name = this.generateUniqueName(this.editingTeam.name);

    // Sync the UndoManager with the new name.
    // This will trigger stateCommitted$ but autoSaveTeam will exit because isSaving is true.
    this.undoManager.commitState();

    // Proceed with the save as new. updateTeam(true) would return early now,
    // so we call saveTeamData directly or reset isSaving.
    // Let's reset isSaving so updateTeam(true) can handle it normally,
    // but the gap is too small for autoSaveTeam to slip in.
    this.isSaving = false;
    this.updateTeam(true);
  }

  private generateUniqueName(baseName: string): string {
    let counter = 1;
    const pattern = /(_\d+)$/;
    const base = baseName.replace(pattern, "").trim();

    while (true) {
      const candidate = `${base}_${counter}`;
      if (
        !this.allTeams.some(
          (t) => t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  getAvatarUrl(url?: string): string {
    if (!url) return "assets/images/default_avatar.svg";
    if (url.startsWith("/")) return `http://localhost:7070${url}`;
    return url;
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("TEM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("TEM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#avatar-selector",
        title: this.translationService.translate("TEM_HELP_AVATAR_TITLE"),
        content: this.translationService.translate("TEM_HELP_AVATAR_CONTENT"),
        position: "right",
      },
      {
        selector: "#team-name-input",
        title: this.translationService.translate("TEM_HELP_NAME_TITLE"),
        content: this.translationService.translate("TEM_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#assigned-drivers-list",
        title: this.translationService.translate("TEM_HELP_ASSIGNED_TITLE"),
        content: this.translationService.translate("TEM_HELP_ASSIGNED_CONTENT"),
        position: "left",
      },
      {
        selector: "#available-drivers-list",
        title: this.translationService.translate("TEM_HELP_AVAILABLE_TITLE"),
        content: this.translationService.translate(
          "TEM_HELP_AVAILABLE_CONTENT",
        ),
        position: "left",
      },
    ];
  }

  startHelp() {
    this.helpService.startGuide(this.getHelpSteps());
  }
}
