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
import { EditorSectionComponent } from "@app/components/shared/editor-section/editor-section.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { AssetType, normalizeAssetType } from "@app/models/asset";
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
import { EditorLifecycleHelper } from "@app/utils/editor-lifecycle.helper";
import { naturalSortCompare } from "@app/utils/sorting.utils";

import {
  areDriversEqual,
  cloneDriver,
  createNewDriverTemplate,
  DriverAudioSlot,
  generateUniqueDriverName,
  generateUniqueDriverNickname,
  getDriverUnsavedReasons,
  isDriverNameUnique,
  isDriverNicknameUnique,
  loadDriverStorageJson,
  mergeDriverAsset,
  saveDriverStorageJson,
  toDriver,
  updateDriverAudioText,
  updateDriverAudioType,
  updateDriverAudioUrl,
} from "./driver-editor.helper";
import { buildDriverEditorHelpSteps } from "./driver-editor-help.helper";

export { DriverAudioSlot } from "./driver-editor.helper";

@Component({
  standalone: true,
  selector: "app-driver-editor",
  templateUrl: "./driver-editor.component.html",
  styleUrls: ["./driver-editor.component.css"],
  imports: [
    AutoSelectDefaultDirective,
    EditorTitleComponent,
    EditorSectionComponent,
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
  selectedDriver?: Driver;
  editingDriver?: Driver;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;
  public navigateBackOnSave = false;
  defaultDriverName: string = "";
  defaultDriverNickname: string = "";

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById(
        "driver-name-input",
      ) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }

  // Unified Editor & Selection State
  isEditMode: boolean = false;
  private isPreservingEditModeOnNavigation: boolean = false;
  private transitionToReadOnlyOnSave: boolean = false;
  driverSelectItems: { id: string; name: string }[] = [];
  selectedDriverId: string | undefined = undefined;

  // Manual change tracking baseline
  originalDriver: Driver | null = null;

  // Undo Manager
  undoManager!: UndoManager<Driver>;

  // Driver Data
  allDrivers: Driver[] = [];
  private initialLastEditedId: string | null = null;

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

  isNameNicknameLinked: boolean = false;

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    this.saveExpanderState();
  }

  saveExpanderState() {
    saveDriverStorageJson(
      "driver_editor_expanders",
      this.sectionsExpanded,
      this.logger,
      "Error saving expander state",
    );
  }

  loadExpanderState() {
    this.sectionsExpanded = loadDriverStorageJson(
      "driver_editor_expanders",
      this.sectionsExpanded,
      this.logger,
      "Error loading expander state",
    );
  }

  saveLinkState() {
    saveDriverStorageJson(
      "driver_editor_name_nickname_linked",
      this.isNameNicknameLinked,
      this.logger,
      "Error saving link state",
    );
  }

  loadLinkState() {
    this.isNameNicknameLinked = loadDriverStorageJson(
      "driver_editor_name_nickname_linked",
      this.isNameNicknameLinked,
      this.logger,
      "Error loading link state",
    );
  }

  toggleNameNicknameLink() {
    this.isNameNicknameLinked = !this.isNameNicknameLinked;
    this.saveLinkState();
    if (this.isNameNicknameLinked && this.editingDriver) {
      if (
        this.editingDriver.name &&
        this.editingDriver.nickname !== this.editingDriver.name
      ) {
        this.editingDriver.nickname = this.editingDriver.name;
        this.onInputChange();
      } else if (!this.editingDriver.name && this.editingDriver.nickname) {
        this.editingDriver.name = this.editingDriver.nickname;
        this.onInputChange();
      }
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
        clonner: (d) => cloneDriver(d),
        equalizer: (a, b) => areDriversEqual(a, b),
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
    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
    });
  }

  ngOnInit() {
    this.initialLastEditedId = this.navigationService.getLastEditedId("driver");
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();
    this.loadExpanderState();
    this.loadLinkState();

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
          } else if (!currentId || nextId !== currentId) {
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
            this.autoSaveDriver();
          }
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
    this.scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  }

  loadData() {
    this.isNavigationApproved = false;
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

  get isNameInvalid(): boolean {
    if (this.isLoading || !this.editingDriver) return false;
    return !this.editingDriver.name.trim() || !this.isNameUnique(true);
  }

  get isNicknameInvalid(): boolean {
    if (this.isLoading || !this.editingDriver) return false;
    return !this.editingDriver.nickname?.trim() || !this.isNicknameUnique(true);
  }

  areDriversEqual(d1: Driver, d2: Driver): boolean {
    return areDriversEqual(d1, d2);
  }

  toDriver(d: any): Driver {
    return toDriver(d);
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    return isDriverNameUnique(
      this.allDrivers,
      this.editingDriver?.name,
      excludeSelf ? this.editingDriver?.entity_id : undefined,
    );
  }

  isNicknameUnique(excludeSelf: boolean = true): boolean {
    return isDriverNicknameUnique(
      this.allDrivers,
      this.editingDriver?.nickname,
      excludeSelf ? this.editingDriver?.entity_id : undefined,
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

  onBack() {
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

  isConfigValid(): boolean {
    return !this.isNameInvalid && !this.isNicknameInvalid;
  }

  isDirtyState(): boolean {
    if (!this.undoManager) return false;
    const umChanges = this.undoManager.hasChanges();
    if (!this.editingDriver || !this.originalDriver) return umChanges;
    const manualChanges = !areDriversEqual(
      this.editingDriver,
      this.originalDriver,
    );
    return umChanges || manualChanges;
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return getDriverUnsavedReasons(
      this.editingDriver,
      this.isNameUnique(true),
      this.isNicknameUnique(true),
      this.isSaving,
      this.isDirtyState(),
    );
  }

  get discardMessage(): string {
    return this.lifecycle.discardMessage;
  }

  confirmDiscard(): Promise<boolean> {
    return this.lifecycle.confirmDiscard();
  }

  onConfirmDiscard() {
    this.lifecycle.onConfirmDiscard(() => {
      if (this.originalDriver) {
        this.editingDriver = cloneDriver(this.originalDriver);
        this.undoManager.resetTracking(this.editingDriver);
      } else if (this.allDrivers.length > 0) {
        this.selectDriver(this.allDrivers[0]);
      }
      this.isEditMode = false;
    });
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  saveAsNew() {
    if (!this.editingDriver) return;
    this.editingDriver.name = this.generateUniqueName(
      this.editingDriver.name,
      true,
    );
    if (this.editingDriver.nickname) {
      this.editingDriver.nickname = this.generateUniqueNickname(
        this.editingDriver.nickname,
        true,
      );
    }
    this.isEditMode = true;
    this.defaultDriverName = this.editingDriver.name;
    this.defaultDriverNickname = this.editingDriver.nickname || "";
    this.focusNameInput();
    this.updateDriver(true);
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    return generateUniqueDriverName(this.allDrivers, baseName, forceSuffix);
  }

  generateUniqueNickname(
    baseNickname: string,
    forceSuffix: boolean = false,
  ): string {
    return generateUniqueDriverNickname(
      this.allDrivers,
      baseNickname,
      forceSuffix,
    );
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
    this.allDrivers = rawDrivers.map((d) => toDriver(d));
    this.updateDriverSelectItems();

    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter((a) => a.type === "image");
    this.soundAssets = allAssets.filter(
      (a) => normalizeAssetType(a.type) === AssetType.AUDIO,
    );

    const idParam = this.route.snapshot.queryParamMap.get("id");

    if (idParam === "new") {
      this.startNewDriver();
    } else if (idParam) {
      const found = this.allDrivers.find((d) => d.entity_id === idParam);
      if (found) {
        this.selectDriver(found);
        this.isEditMode = false;
        this.navigationService.setLastEditedId("driver", found.entity_id);
      } else {
        const lastEdited =
          this.initialLastEditedId && this.initialLastEditedId !== idParam
            ? this.initialLastEditedId
            : this.navigationService.getLastEditedId("driver") !== idParam
              ? this.navigationService.getLastEditedId("driver")
              : null;
        const foundLast = lastEdited
          ? this.allDrivers.find((d) => d.entity_id === lastEdited)
          : undefined;
        if (foundLast) {
          this.selectDriver(foundLast);
          this.isEditMode = false;
          this.navigationService.setLastEditedId("driver", foundLast.entity_id);
        } else if (this.allDrivers.length > 0) {
          this.selectDriver(this.allDrivers[0]);
          this.isEditMode = false;
          this.navigationService.setLastEditedId(
            "driver",
            this.allDrivers[0].entity_id,
          );
        } else {
          this.startNewDriver();
        }
      }
    } else {
      const lastEdited = this.navigationService.getLastEditedId("driver");
      const found = lastEdited
        ? this.allDrivers.find((d) => d.entity_id === lastEdited)
        : undefined;
      if (found) {
        this.selectDriver(found);
        this.isEditMode = false;
      } else if (this.allDrivers.length > 0) {
        this.selectDriver(this.allDrivers[0]);
        this.isEditMode = false;
        this.navigationService.setLastEditedId(
          "driver",
          this.allDrivers[0].entity_id,
        );
      } else {
        this.startNewDriver();
      }
    }

    const isNew = this.route.snapshot.queryParamMap.get("isNew") === "true";
    if (
      this.isPreservingEditModeOnNavigation ||
      (isNew && this.editingDriver)
    ) {
      this.isPreservingEditModeOnNavigation = false;
      this.isEditMode = true;
      this.defaultDriverName = this.editingDriver?.name || "";
      this.defaultDriverNickname = this.editingDriver?.nickname || "";
      this.focusNameInput();
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
  onNameChange(name: string) {
    if (!this.editingDriver) return;
    this.editingDriver.name = name;
    if (this.isNameNicknameLinked) {
      this.editingDriver.nickname = name;
    }
    this.onInputChange();
  }
  onNicknameChange(nickname: string) {
    if (!this.editingDriver) return;
    this.editingDriver.nickname = nickname;
    if (this.isNameNicknameLinked) {
      this.editingDriver.name = nickname;
    }
    this.onInputChange();
  }
  onInputBlur() {
    this.undoManager.onInputBlur();
    this.cdr.detectChanges();
  }
  captureState() {
    this.undoManager.captureState();
    this.cdr.detectChanges();
  }

  onAudioTypeChange(
    slot: DriverAudioSlot,
    type: "preset" | "tts" | "none" | "audio_set",
  ) {
    if (!this.editingDriver) return;
    updateDriverAudioType(this.editingDriver, slot, type);
    this.captureState();
    this.cdr.markForCheck();
  }

  onAudioUrlChange(slot: DriverAudioSlot, url: string | undefined) {
    if (!this.editingDriver) return;
    updateDriverAudioUrl(this.editingDriver, slot, url);
    this.captureState();
    this.cdr.markForCheck();
  }

  onAudioTextChange(slot: DriverAudioSlot, text: string | undefined) {
    if (!this.editingDriver) return;
    updateDriverAudioText(this.editingDriver, slot, text);
    this.onInputChange();
    this.cdr.markForCheck();
  }

  onAssetSelected(asset: any) {
    if (!asset) return;
    const type = normalizeAssetType(asset.type);
    if (type === AssetType.AUDIO) {
      this.soundAssets = mergeDriverAsset(this.soundAssets, asset);
    } else if (type === AssetType.IMAGE) {
      this.avatarAssets = mergeDriverAsset(this.avatarAssets, asset);
    }
    this.captureState();
    this.cdr.markForCheck();
  }

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = cloneDriver(driver);
    this.originalDriver = cloneDriver(driver);
    this.selectedDriverId = driver.entity_id;
    this.undoManager.initialize(this.editingDriver);
  }

  updateDriverSelectItems() {
    this.driverSelectItems = this.allDrivers
      .slice()
      .sort((a, b) => naturalSortCompare(a.name || "", b.name || ""))
      .map((d) => ({
        id: d.entity_id,
        name: d.name,
      }));
  }

  onSelectDriverById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedDriverId === id) return;
    const found = this.allDrivers.find((d) => d.entity_id === id);
    if (found) {
      this.selectDriver(found);
      this.navigationService.setLastEditedId("driver", found.entity_id);
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
        alert(this.translationService.translate("DE_ERROR_NAME_EXISTS"));
        return;
      }
      this.updateDriver(false, false);
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewDriver() {
    if (this.isEditMode && this.isDirtyState()) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewDriver();
        }
      });
    } else {
      this.startNewDriver();
    }
  }

  startNewDriver() {
    this.isSaving = true;
    this.isEditMode = true;
    const defaultName =
      this.translationService.translate("DM_DEFAULT_DRIVER_NAME") ||
      "New Driver";
    const defaultNickname =
      this.translationService.translate("DM_DEFAULT_DRIVER_NICKNAME") ||
      "New Driver Nickname";
    const uniqueName = this.generateUniqueName(defaultName, false);
    const uniqueNickname = this.generateUniqueNickname(defaultNickname, false);

    const template = createNewDriverTemplate();
    template.name = uniqueName;
    template.nickname = uniqueNickname;
    delete (template as any).entity_id;

    this.subscriptions.push(
      this.dataService.createDriver(template).subscribe({
        next: (result) => {
          this.handleSaveSuccess(result, template, true, false, false);
        },
        error: (err) => {
          this.logger.error("Failed to create driver", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  onCopyDriver() {
    if (!this.editingDriver || !this.isConfigValid()) return;
    this.saveAsNew();
  }

  onDeleteDriver() {
    this.deleteDriver();
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
        this.handleSaveSuccess(
          result,
          driverToSend,
          wasNew,
          isSaveAsNew,
          isAutoSave,
        );
      },
      error: (err) => {
        this.handleSaveError(err, isAutoSave);
      },
    });
  }

  private handleSaveSuccess(
    result: any,
    driverToSend: any,
    wasNew: boolean,
    isSaveAsNew: boolean,
    isAutoSave: boolean,
  ) {
    this.isSaving = false;
    this.isAutoSaving = false;
    this.navigationService.setLastEditedId("driver", result.entity_id);

    const savedDriver = toDriver({
      ...driverToSend,
      entity_id: result.entity_id || driverToSend.entity_id,
    });

    if (wasNew || isSaveAsNew) {
      this.isEditMode = true;
      this.isPreservingEditModeOnNavigation = true;
      this.defaultDriverName = savedDriver.name;
      this.defaultDriverNickname = savedDriver.nickname || "";
    } else if (!isAutoSave || this.transitionToReadOnlyOnSave) {
      this.isEditMode = false;
      this.transitionToReadOnlyOnSave = false;
    }

    if (wasNew || isSaveAsNew || !this.editingDriver) {
      this.editingDriver = cloneDriver(savedDriver);
    } else {
      this.editingDriver.entity_id = savedDriver.entity_id;
    }
    this.selectedDriver = cloneDriver(savedDriver);
    this.originalDriver = cloneDriver(savedDriver);
    this.selectedDriverId = savedDriver.entity_id;
    this.undoManager.resetTracking(savedDriver);

    const idx = this.allDrivers.findIndex(
      (d) => d.entity_id === result.entity_id,
    );
    if (idx >= 0) {
      this.allDrivers[idx] = cloneDriver(this.editingDriver);
    } else {
      this.allDrivers.push(cloneDriver(this.editingDriver));
    }
    this.updateDriverSelectItems();

    this.cdr.detectChanges();
    if (wasNew || isSaveAsNew) {
      this.focusNameInput();
    }

    if (wasNew) {
      this.handleNewDriverNavigation(result.entity_id, isAutoSave);
    }

    if (this.navigateBackOnSave) {
      this.onBack();
    }

    if (this.isDirtyState()) {
      this.autoSaveDriver();
    }

    this.refreshDriverList();
  }

  private handleNewDriverNavigation(newId: string, isAutoSave: boolean) {
    const queryParams = {
      id: newId,
      from: this.route.snapshot.queryParamMap.get("from"),
      returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
    };
    if (isAutoSave) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/driver-editor"], { queryParams }),
      );
      this.location.replaceState(url);
    } else {
      this.router.navigate(["/driver-editor"], {
        queryParams,
        replaceUrl: true,
      });
    }
  }

  private handleSaveError(err: any, isAutoSave: boolean) {
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
    this.transitionToReadOnlyOnSave = false;
    this.cdr.detectChanges();
  }

  private refreshDriverList() {
    this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        this.allDrivers = drivers.map((d) => toDriver(d));
        this.updateDriverSelectItems();
        this.cdr.detectChanges();
      },
      error: (err) => this.logger.error("Failed to refresh driver list", err),
    });
  }

  deleteDriver() {
    if (!this.editingDriver || this.editingDriver.entity_id === "new") return;
    if (confirm(this.translationService.translate("DE_CONFIRM_DELETE"))) {
      this.isSaving = true;
      const idToDelete = this.editingDriver.entity_id;
      this.dataService.deleteDriver(idToDelete).subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditMode = false;
          this.allDrivers = this.allDrivers.filter(
            (d) => d.entity_id !== idToDelete,
          );
          this.updateDriverSelectItems();
          if (this.allDrivers.length > 0) {
            this.selectDriver(this.allDrivers[0]);
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: this.allDrivers[0].entity_id },
              queryParamsHandling: "merge",
              replaceUrl: true,
            });
          } else {
            this.startNewDriver();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to delete driver", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  getAvatarUrl(url?: string): string {
    if (!url) return "assets/images/default_avatar.svg";
    if (url.startsWith("/")) return `${this.dataService.serverUrl}${url}`;
    return url;
  }

  getHelpSteps(): GuideStep[] {
    return buildDriverEditorHelpSteps({
      translationService: this.translationService,
      expandAudioSection: () => {
        this.sectionsExpanded.audio = true;
      },
    });
  }
}
