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
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
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
import { NavigationService } from "@app/services/navigation.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { isEntityNameUnique, mapToSelectItems } from "@app/utils/editor-utils";
import { naturalSortCompare } from "@app/utils/sorting.utils";

@Component({
  standalone: true,
  selector: "app-team-editor",
  templateUrl: "./team-editor.component.html",
  styleUrls: ["./team-editor.component.css"],
  imports: [
    AutoSelectDefaultDirective,
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
  // Discard Changes Confirmation Modal
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
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  selectedTeam?: Team;
  editingTeam?: Team;
  originalTeam: Team | null = null;
  selectedTeamId?: string;
  teamSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  private isPreservingEditModeOnNavigation: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isDirty: boolean = false;
  isAutoSaving: boolean = false;
  isUploading: boolean = false;
  transitionToReadOnlyOnSave: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;
  defaultTeamName: string = "";
  private initialLastEditedId: string | null = null;

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById("team-name-input") as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

  // Undo Manager
  undoManager!: UndoManager<Team>;

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
    private navigationService: NavigationService,
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
    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
    });
  }

  ngOnInit() {
    this.initialLastEditedId = this.navigationService.getLastEditedId("team");
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
          const isEditorRoute =
            !this.router.url ||
            this.router.url === "/" ||
            this.router.url.startsWith("/team-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
          if (nextId && nextId !== "new") {
            this.navigationService.setLastEditedId("team", nextId);
          }
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
        this.undoManager.stateCommitted$.subscribe((event) => {
          if (
            event.type === "push" ||
            event.type === "undo" ||
            event.type === "redo"
          ) {
            this.autoSaveTeam();
          }
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
    this.isNavigationApproved = false;
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
    return !isEntityNameUnique(
      this.editingTeam.name,
      this.editingTeam.entity_id,
      this.allTeams,
      true,
    );
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingTeam) return true;
    return isEntityNameUnique(
      this.editingTeam.name,
      this.editingTeam.entity_id,
      this.allTeams,
      excludeSelf,
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

  private loadDataInternal(assets: any[]) {
    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter((a) => a && a.type === "image");
    this.updateTeamSelectItems();

    const idParam = this.route.snapshot.queryParamMap.get("id");

    if (idParam === "new") {
      this.startNewTeam();
    } else if (idParam) {
      const found = this.allTeams.find((t) => t.entity_id === idParam);
      if (found) {
        this.selectTeam(found);
        this.isEditMode = false;
        this.navigationService.setLastEditedId("team", found.entity_id);
      } else {
        const lastEdited =
          this.initialLastEditedId && this.initialLastEditedId !== idParam
            ? this.initialLastEditedId
            : this.navigationService.getLastEditedId("team") !== idParam
              ? this.navigationService.getLastEditedId("team")
              : null;
        const foundLast = lastEdited
          ? this.allTeams.find((t) => t.entity_id === lastEdited)
          : undefined;
        if (foundLast) {
          this.selectTeam(foundLast);
          this.isEditMode = false;
          this.navigationService.setLastEditedId("team", foundLast.entity_id);
        } else if (this.allTeams.length > 0) {
          this.selectTeam(this.allTeams[0]);
          this.isEditMode = false;
          this.navigationService.setLastEditedId(
            "team",
            this.allTeams[0].entity_id,
          );
        } else {
          this.startNewTeam();
        }
      }
    } else {
      const lastEdited = this.navigationService.getLastEditedId("team");
      const found = lastEdited
        ? this.allTeams.find((t) => t.entity_id === lastEdited)
        : undefined;
      if (found) {
        this.selectTeam(found);
        this.isEditMode = false;
      } else if (this.allTeams.length > 0) {
        this.selectTeam(this.allTeams[0]);
        this.isEditMode = false;
        this.navigationService.setLastEditedId(
          "team",
          this.allTeams[0].entity_id,
        );
      } else {
        this.startNewTeam();
      }
    }

    const isNew = this.route.snapshot.queryParamMap.get("isNew") === "true";
    if (this.isPreservingEditModeOnNavigation || (isNew && this.editingTeam)) {
      this.isPreservingEditModeOnNavigation = false;
      this.isEditMode = true;
      this.defaultTeamName = this.editingTeam?.name || "";
      this.focusNameInput();
    }
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    this.editingTeam = this.cloneTeam(team);
    this.originalTeam = this.cloneTeam(team);
    this.selectedTeamId = team.entity_id;
    this.undoManager.initialize(this.editingTeam);
  }

  updateTeamSelectItems() {
    this.teamSelectItems = mapToSelectItems(this.allTeams);
  }

  onSelectTeamById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedTeamId === id) return;
    const found = this.allTeams.find((t) => t.entity_id === id);
    if (found) {
      this.selectTeam(found);
      this.navigationService.setLastEditedId("team", found.entity_id);
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
        alert(this.translationService.translate("TEM_ERROR_NAME_EXISTS"));
        return;
      }
      this.updateTeam(false, false);
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewTeam() {
    if (this.isEditMode && this.isDirtyState()) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewTeam();
        }
      });
    } else {
      this.startNewTeam();
    }
  }

  startNewTeam() {
    this.isSaving = true;
    const defaultName =
      this.translationService.translate("TMM_DEFAULT_TEAM_NAME") || "New Team";
    const uniqueName = this.generateUniqueName(defaultName, false);
    const newTeam = new Team("new", uniqueName, undefined, []);

    this.subscriptions.push(
      this.dataService.createTeam(newTeam).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.isEditMode = true;
          this.isPreservingEditModeOnNavigation = true;
          this.navigationService.setLastEditedId("team", result.entity_id);

          const savedTeam = new Team(
            result.entity_id,
            uniqueName,
            undefined,
            [],
          );

          this.editingTeam = this.cloneTeam(savedTeam);
          this.selectedTeam = this.cloneTeam(savedTeam);
          this.originalTeam = this.cloneTeam(savedTeam);
          this.selectedTeamId = savedTeam.entity_id;
          this.undoManager.resetTracking(savedTeam);
          this.defaultTeamName = savedTeam.name;

          const idx = this.allTeams.findIndex(
            (t) => t.entity_id === result.entity_id,
          );
          if (idx >= 0) {
            this.allTeams[idx] = this.cloneTeam(this.editingTeam);
          } else {
            this.allTeams.push(this.cloneTeam(this.editingTeam));
          }
          this.updateTeamSelectItems();

          this.cdr.detectChanges();
          this.focusNameInput();

          this.router.navigate([], {
            queryParams: { id: result.entity_id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (err) => {
          this.logger.error("Failed to create team", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  onCopyTeam() {
    if (!this.editingTeam || !this.isConfigValid()) return;
    this.saveAsNew();
  }

  onDeleteTeam() {
    this.deleteTeam();
  }

  deleteTeam() {
    if (!this.editingTeam || this.editingTeam.entity_id === "new") return;
    if (confirm(this.translationService.translate("TEM_CONFIRM_DELETE"))) {
      this.isSaving = true;
      const idToDelete = this.editingTeam.entity_id;
      this.dataService.deleteTeam(idToDelete).subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditMode = false;
          this.allTeams = this.allTeams.filter(
            (t) => t.entity_id !== idToDelete,
          );
          this.updateTeamSelectItems();
          if (this.allTeams.length > 0) {
            this.selectTeam(this.allTeams[0]);
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: this.allTeams[0].entity_id },
              queryParamsHandling: "merge",
              replaceUrl: true,
            });
          } else {
            this.startNewTeam();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to delete team", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
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
    const manualChanges = !this.areTeamsEqual(
      this.editingTeam,
      this.originalTeam,
    );
    return this.isDirty || umChanges || manualChanges;
  }

  onBack() {
    this.isNavigationApproved = true;
    const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
    const from = this.route.snapshot.queryParamMap.get("from");
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else if (from === "modify-heats") {
      this.router.navigate(["/default-raceday"], {
        queryParams: { modifyHeats: "true" },
      });
    } else {
      this.router.navigate(["/raceday-setup"]);
    }
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    const reasons: string[] = [];
    if (!this.editingTeam) return reasons;

    const nameTrimmed = this.editingTeam.name?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_TEAM_NAME_EMPTY");
    } else if (!this.isNameUnique(true)) {
      reasons.push("DISCARD_REASON_TEAM_NAME_DUPLICATE");
    }

    if (this.isSaving) {
      reasons.push("DISCARD_REASON_SAVING");
    } else if (reasons.length === 0 && this.isDirtyState()) {
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

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard(() => {
      if (this.originalTeam) {
        this.editingTeam = this.cloneTeam(this.originalTeam);
        this.undoManager.resetTracking(this.editingTeam);
      } else if (this.allTeams.length > 0) {
        this.selectTeam(this.allTeams[0]);
      }
      this.isEditMode = false;
    });
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  updateTeam(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingTeam || this.isSaving) return;
    if (!isSaveAsNew && !this.isDirtyState()) return;

    if (!isAutoSave) {
      this.isSaving = true;
      this.isAutoSaving = false;
    } else {
      this.isSaving = true;
      this.isAutoSaving = true;
    }
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
      next: (result) =>
        this.handleSaveSuccess(result, teamToSend, wasNew, isAutoSave),
      error: (err) => this.handleSaveError(err, isAutoSave),
    });
  }

  private handleSaveSuccess(
    result: any,
    teamToSend: Team,
    wasNew: boolean,
    isAutoSave: boolean,
  ) {
    this.isSaving = false;
    this.isAutoSaving = false;
    this.navigationService.setLastEditedId("team", result.entity_id);

    const savedTeam = new Team(
      result.entity_id || teamToSend.entity_id,
      teamToSend.name,
      teamToSend.avatarUrl,
      [...teamToSend.driverIds],
    );

    if (wasNew) {
      this.isEditMode = true;
      this.isPreservingEditModeOnNavigation = true;
      this.defaultTeamName = savedTeam.name;
    } else if (!isAutoSave || this.transitionToReadOnlyOnSave) {
      this.isEditMode = false;
      this.transitionToReadOnlyOnSave = false;
    }

    if (this.editingTeam) {
      this.editingTeam.entity_id = savedTeam.entity_id;
      this.isDirty = false;
      this.selectedTeam = this.cloneTeam(savedTeam);
      this.originalTeam = this.cloneTeam(savedTeam);
      this.selectedTeamId = savedTeam.entity_id;
      this.undoManager.resetTracking(savedTeam);
    }

    const idx = this.allTeams.findIndex(
      (t) => t.entity_id === result.entity_id,
    );
    if (idx >= 0) {
      this.allTeams[idx] = this.cloneTeam(this.editingTeam!);
    } else if (this.editingTeam) {
      this.allTeams.push(this.cloneTeam(this.editingTeam));
    }
    this.updateTeamSelectItems();

    this.cdr.detectChanges();
    if (wasNew) {
      this.focusNameInput();
    }

    if (wasNew) {
      this.handleNewTeamNavigation(
        result.entity_id || result.entityId,
        isAutoSave,
      );
    }

    if (this.navigateBackOnSave) {
      this.navigateBackOnSave = false;
      this.onBack();
    }

    if (this.isDirtyState()) {
      this.autoSaveTeam();
    }

    this.refreshTeamList();
  }

  private handleNewTeamNavigation(newId: string, isAutoSave: boolean) {
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
        replaceUrl: true,
      });
    }
  }

  private handleSaveError(err: any, isAutoSave: boolean) {
    this.logger.error("Failed to save team", err);
    if (!isAutoSave) {
      if (err.status === 409) {
        alert(
          err.error ||
            this.translationService.translate("TEM_ERROR_NAME_EXISTS"),
        );
      } else {
        alert(
          this.translationService.translate("TEM_ERROR_SAVE_FAILED") +
            (err.error || err.message),
        );
      }
    }
    this.isSaving = false;
    this.isAutoSaving = false;
    this.transitionToReadOnlyOnSave = false;
    this.cdr.detectChanges();
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
        this.updateTeamSelectItems();
        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Failed to refresh team list", err),
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

    this.isSaving = true;
    this.editingTeam.name = this.generateUniqueName(
      this.editingTeam.name,
      true,
    );
    this.isEditMode = true;
    this.isPreservingEditModeOnNavigation = true;
    this.defaultTeamName = this.editingTeam.name;
    this.focusNameInput();
    this.isSaving = false;
    this.updateTeam(true);
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    let counter = forceSuffix ? 1 : 0;
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
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
    if (url.startsWith("/")) return `${this.dataService.serverUrl}${url}`;
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
