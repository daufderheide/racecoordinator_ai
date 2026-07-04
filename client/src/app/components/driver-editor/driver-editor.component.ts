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
import { AudioSelectorComponent } from "@app/components/shared/audio-selector/audio-selector.component";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Driver } from "@app/models/driver";
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
import { createTTSContext, mockTTSContext } from "@app/utils/audio";

@Component({
  standalone: true,
  selector: "app-driver-editor",
  templateUrl: "./driver-editor.component.html",
  styleUrls: ["./driver-editor.component.css"],
  imports: [
    EditorTitleComponent,
    ImageSelectorComponent,
    FormsModule,
    AudioSelectorComponent,
    TranslatePipe,
    ConfirmationModalComponent,
  ],
})
export class DriverEditorComponent
  implements OnInit, OnDestroy, DirtyComponent
{
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  selectedDriver?: Driver;
  editingDriver?: Driver;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;

  // Manual change tracking baseline
  originalDriver: Driver | null = null;

  // Undo Manager
  undoManager!: UndoManager<Driver>;

  // Driver Data
  allDrivers: Driver[] = [];

  // Assets for presets
  avatarAssets: any[] = [];
  soundAssets: any[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  sectionsExpanded = {
    audio: true,
  };

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  saveExpanderState() {
    try {
      localStorage.setItem(
        "driver_editor_expanders",
        JSON.stringify(this.sectionsExpanded),
      );
    } catch (e) {
      this.logger.error("Error saving expander state", e);
    }
  }

  loadExpanderState() {
    try {
      const saved = localStorage.getItem("driver_editor_expanders");
      if (saved) {
        this.sectionsExpanded = {
          ...this.sectionsExpanded,
          ...JSON.parse(saved),
        };
      }
    } catch (e) {
      this.logger.error("Error loading expander state", e);
    }
  }

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
    this.undoManager = new UndoManager<Driver>(
      {
        clonner: (d) => this.cloneDriver(d),
        equalizer: (a, b) => this.areDriversEqual(a, b),
        applier: (d) => {
          // Preserve context ID safe-guard
          const currentId = this.editingDriver?.entity_id;
          this.editingDriver = d;
          if (currentId && this.editingDriver) {
            this.editingDriver.entity_id = currentId;
          }
        },
      },
      () => this.editingDriver, // snapshotGetter
    );
  }

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();
    this.loadExpanderState();

    this.subscriptions.push(
      this.helpService.currentStep$.subscribe((step) => {
        if (step?.selector?.includes("audio")) {
          this.sectionsExpanded.audio = true;
          this.cdr.detectChanges();
        }
      }),
    );
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
            this.router.url.startsWith("/driver-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
          if (nextId && nextId !== "new") {
            this.navigationService.setLastEditedId("driver", nextId);
          }
          const currentId = this.editingDriver?.entity_id;
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
          this.autoSaveDriver();
        }),
      );
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.undoManager.destroy();
  }

  get ttsContext(): any {
    if (!this.editingDriver) return mockTTSContext();
    return createTTSContext(this.editingDriver, {
      lastLapTime: 1.234,
      bestLapTime: 1.234,
      averageLapTime: 1.5,
      lapCount: 10,
    });
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
    const idParam = this.route.snapshot.queryParamMap.get("id");
    if (!idParam) {
      throw new Error("Driver Editor: No entity ID provided.");
    }

    this.isLoading = true;
    this.dataSubscription = forkJoin({
      drivers: this.dataService.getDrivers(),
      assets: this.dataService.listAssets(),
    }).subscribe({
      next: (result) => {
        try {
          this.loadDataInternal(result.drivers, result.assets);
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

  private cloneDriver(driver: Driver): Driver {
    return new Driver(
      driver.entity_id,
      driver.name,
      driver.nickname,
      driver.avatarUrl,
      driver.lapAudio ? { ...driver.lapAudio } : undefined,
      driver.bestLapAudio ? { ...driver.bestLapAudio } : undefined,
      driver.penaltyAudio ? { ...driver.penaltyAudio } : undefined,
    );
  }

  get isNameInvalid(): boolean {
    if (this.isLoading || !this.editingDriver) return false;
    return !this.editingDriver.name.trim() || !this.isNameUnique(true);
  }

  get isNicknameInvalid(): boolean {
    if (this.isLoading || !this.editingDriver) return false;
    return !this.isNicknameUnique(true);
  }

  private areDriversEqual(d1: Driver, d2: Driver): boolean {
    const normalizeString = (val: any) =>
      val === null || val === undefined ? "" : String(val).trim();

    const nameMatch = normalizeString(d1.name) === normalizeString(d2.name);
    const nicknameMatch =
      normalizeString(d1.nickname) === normalizeString(d2.nickname);
    const avatarMatch =
      normalizeString(d1.avatarUrl) === normalizeString(d2.avatarUrl);

    const checkAudio = (a1: any, a2: any) => {
      if (!a1 || !a2) return a1 === a2;
      return (
        normalizeString(a1.url) === normalizeString(a2.url) &&
        normalizeString(a1.type || "preset") ===
          normalizeString(a2.type || "preset") &&
        normalizeString(a1.text) === normalizeString(a2.text)
      );
    };

    return (
      nameMatch &&
      nicknameMatch &&
      avatarMatch &&
      checkAudio(d1.lapAudio, d2.lapAudio) &&
      checkAudio(d1.bestLapAudio, d2.bestLapAudio) &&
      checkAudio(d1.penaltyAudio, d2.penaltyAudio)
    );
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const name = this.editingDriver.name.trim().toLowerCase();
    if (!name) return false;

    return !this.allDrivers.some(
      (d) =>
        (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
        d.name.toLowerCase() === name,
    );
  }

  isNicknameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const nickname = this.editingDriver.nickname?.trim().toLowerCase();
    if (!nickname) return true;

    return !this.allDrivers.some(
      (d) =>
        (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
        d.nickname?.toLowerCase() === nickname,
    );
  }

  private mapSoundType(type: string | undefined): "preset" | "tts" | "none" {
    if (type === "tts") return "tts";
    if (type === "none") return "none";
    return "preset";
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

  onBackClicked() {
    if (this.isConfigValid()) {
      if (this.isDirtyState()) {
        this.navigateBackOnSave = true;
        this.updateDriver();
      } else {
        this.onBack();
      }
    } else {
      this.onBack();
    }
  }

  onBack() {
    this.isNavigationApproved = true;
    this.router.navigate(["/driver-manager"], {
      queryParams: {
        id: this.editingDriver?.entity_id,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  isConfigValid(): boolean {
    return !this.isNameInvalid && !this.isNicknameInvalid;
  }

  isDirtyState(): boolean {
    if (!this.undoManager) return false;
    const umChanges = this.undoManager.hasChanges();
    if (!this.editingDriver || !this.originalDriver) return umChanges;
    const manualChanges = !this.areDriversEqual(
      this.editingDriver,
      this.originalDriver,
    );
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

  saveAsNew() {
    if (!this.editingDriver) return;
    this.editingDriver.name = this.generateUniqueName(this.editingDriver.name);
    if (this.editingDriver.nickname) {
      this.editingDriver.nickname = this.generateUniqueNickname(
        this.editingDriver.nickname,
      );
    }
    this.updateDriver(true);
  }

  private generateUniqueName(baseName: string): string {
    let counter = 1;
    const pattern = /(_\d+)$/;
    const base = baseName.replace(pattern, "");

    while (true) {
      const candidate = `${base}_${counter}`;
      if (
        !this.allDrivers.some(
          (d) => d.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  private generateUniqueNickname(baseNickname: string): string {
    let counter = 1;
    const pattern = /(_\d+)$/;
    const base = baseNickname.replace(pattern, "");

    while (true) {
      const candidate = `${base}_${counter}`;
      if (
        !this.allDrivers.some(
          (d) => d.nickname?.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  private autoSaveDriver() {
    if (!this.editingDriver) return;
    if (this.isNameInvalid || this.isNicknameInvalid) return;
    if (this.isSaving) return;
    this.updateDriver(false, true);
  }

  updateDriver(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingDriver) return;
    if (!isSaveAsNew && !this.isDirtyState()) return;

    if (!isAutoSave) {
      this.isSaving = true;
      this.isAutoSaving = false;
    } else {
      this.isSaving = true;
      this.isAutoSaving = true;
    }
    this.saveDriverData(isSaveAsNew, isAutoSave);
  }

  private loadDataInternal(rawDrivers: any[], assets: any[]) {
    this.allDrivers = rawDrivers.map(
      (d) =>
        new Driver(
          d.entity_id,
          d.name,
          d.nickname || "",
          d.avatarUrl,
          {
            type: this.mapSoundType(d.lapAudio?.type || d.lapSoundType),
            url: d.lapAudio?.url || d.lapSoundUrl,
            text: d.lapAudio?.text || d.lapSoundText,
          },
          {
            type: this.mapSoundType(d.bestLapAudio?.type || d.bestLapSoundType),
            url: d.bestLapAudio?.url || d.bestLapSoundUrl,
            text: d.bestLapAudio?.text || d.bestLapSoundText,
          },
          {
            type: this.mapSoundType(d.penaltyAudio?.type || d.penaltySoundType),
            url: d.penaltyAudio?.url || d.penaltySoundUrl,
            text: d.penaltyAudio?.text || d.penaltySoundText,
          },
        ),
    );

    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter((a) => a.type === "image");
    this.soundAssets = allAssets.filter((a) => a.type === "sound");

    const idParam = this.route.snapshot.queryParamMap.get("id");

    if (idParam === "new") {
      this.selectedDriver = undefined;
      this.editingDriver = new Driver(
        "new",
        "",
        "",
        "",
        { type: "preset", url: "default_beep" },
        { type: "preset", url: "default_driveby" },
        { type: "preset", url: "default_penalty" },
      );
    } else if (idParam) {
      const found = this.allDrivers.find((d) => d.entity_id === idParam);
      if (found) {
        this.selectDriver(found);
      } else {
        throw new Error(`Driver Editor: Invalid entity ID "${idParam}".`);
      }
    }

    // undoManager.initialize will be called inside selectDriver if count > 0,
    // or we call it once here if it's 'new'
    if (idParam === "new" && this.editingDriver) {
      this.undoManager.initialize(this.editingDriver);
    }
  }

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

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = this.cloneDriver(driver);
    this.originalDriver = this.cloneDriver(driver);
    this.undoManager.initialize(this.editingDriver);
  }

  private saveDriverData(
    isSaveAsNew: boolean = false,
    isAutoSave: boolean = false,
  ) {
    if (!this.editingDriver) return;

    const driverToSend = { ...this.editingDriver };
    const wasNew = isSaveAsNew || driverToSend.entity_id === "new";

    if (wasNew) {
      driverToSend.entity_id = "new";
    }

    const obs =
      driverToSend.entity_id === "new"
        ? this.dataService.createDriver(driverToSend)
        : this.dataService.updateDriver(driverToSend.entity_id, driverToSend);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        this.isAutoSaving = false;
        this.navigationService.setLastEditedId("driver", result.entity_id);

        if (this.editingDriver) {
          this.editingDriver.entity_id = result.entity_id;
          this.originalDriver = this.cloneDriver(this.editingDriver);
          this.undoManager.resetTracking(this.editingDriver);
        }

        this.cdr.detectChanges();

        if (wasNew) {
          if (isAutoSave) {
            const url = this.router.serializeUrl(
              this.router.createUrlTree(["/driver-editor"], {
                queryParams: {
                  id: result.entity_id,
                  from: this.route.snapshot.queryParamMap.get("from"),
                  returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
                },
              }),
            );
            this.location.replaceState(url);
          } else {
            this.router.navigate(["/driver-editor"], {
              queryParams: {
                id: result.entity_id,
                from: this.route.snapshot.queryParamMap.get("from"),
                returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
              },
              replaceUrl: true,
            });
          }
        }

        if (this.navigateBackOnSave) {
          this.onBack();
        }

        this.refreshDriverList();
      },
      error: (err) => {
        this.logger.error("Failed to save driver", err);
        if (!isAutoSave) {
          if (err.status === 409) {
            alert(
              err.error ||
                this.translationService.translate("DE_ERROR_NAME_EXISTS"),
            );
          } else {
            alert(
              this.translationService.translate("DE_ERROR_SAVE_FAILED") +
                (err.error || err.message),
            );
          }
        }
        this.isSaving = false;
        this.isAutoSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  private refreshDriverList() {
    this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        this.allDrivers = drivers.map(
          (d) =>
            new Driver(
              d.entity_id,
              d.name,
              d.nickname || "",
              d.avatarUrl,
              {
                type: this.mapSoundType(d.lapAudio?.type || d.lapSoundType),
                url: d.lapAudio?.url || d.lapSoundUrl,
                text: d.lapAudio?.text || d.lapSoundText,
              },
              {
                type: this.mapSoundType(
                  d.bestLapAudio?.type || d.bestLapSoundType,
                ),
                url: d.bestLapAudio?.url || d.bestLapSoundUrl,
                text: d.bestLapAudio?.text || d.bestLapSoundText,
              },
              {
                type: this.mapSoundType(
                  d.penaltyAudio?.type || d.penaltySoundType,
                ),
                url: d.penaltyAudio?.url || d.penaltySoundUrl,
                text: d.penaltyAudio?.text || d.penaltySoundText,
              },
            ),
        );
        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Failed to refresh driver list", err),
    });
  }

  deleteDriver() {
    if (!this.editingDriver) return;
    if (confirm(this.translationService.translate("DE_CONFIRM_DELETE"))) {
      this.isSaving = true;
      this.isNavigationApproved = true;
      this.dataService.deleteDriver(this.editingDriver.entity_id).subscribe({
        next: () => {
          this.isSaving = false;
          this.onBack();
        },
        error: (err) => {
          this.logger.error("Failed to delete driver", err);
          this.isSaving = false;
        },
      });
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
        title: this.translationService.translate("DE_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("DE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: "#driver-avatar-section",
        title: this.translationService.translate("DE_HELP_AVATAR_TITLE"),
        content: this.translationService.translate("DE_HELP_AVATAR_CONTENT"),
        position: "right",
      },
      {
        selector: "#driver-name-section",
        title: this.translationService.translate("DE_HELP_NAME_TITLE"),
        content: this.translationService.translate("DE_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#driver-nickname-section",
        title: this.translationService.translate("DE_HELP_NICKNAME_TITLE"),
        content: this.translationService.translate("DE_HELP_NICKNAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#driver-audio-section",
        title: this.translationService.translate("DE_HELP_AUDIO_SECTION_TITLE"),
        content: this.translationService.translate(
          "DE_HELP_AUDIO_SECTION_CONTENT",
        ),
        position: "left",
      },
      {
        selector: "#driver-lap-audio",
        title: this.translationService.translate("DE_HELP_LAP_SOUND_TITLE"),
        content: this.translationService.translate("DE_HELP_LAP_SOUND_CONTENT"),
        position: "left",
      },
      {
        selector: "#driver-best-lap-audio",
        title: this.translationService.translate(
          "DE_HELP_BEST_LAP_SOUND_TITLE",
        ),
        content: this.translationService.translate(
          "DE_HELP_BEST_LAP_SOUND_CONTENT",
        ),
        position: "left",
      },
      {
        selector: "#driver-penalty-audio",
        title: this.translationService.translate("DE_HELP_PENALTY_SOUND_TITLE"),
        content: this.translationService.translate(
          "DE_HELP_PENALTY_SOUND_CONTENT",
        ),
        position: "left",
      },
    ];
  }
}
