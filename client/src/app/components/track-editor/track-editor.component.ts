import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
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
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
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
import { InputDialogComponent } from "@app/components/shared/input-dialog/input-dialog.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { ArduinoEditorComponent } from "@app/components/track-editor/arduino-editor/arduino-editor.component";
import { BartEditorComponent } from "@app/components/track-editor/bart-editor/bart-editor.component";
import { PhidgetEditorComponent } from "@app/components/track-editor/phidget-editor/phidget-editor.component";
import { TrackEditorCrudHelper } from "@app/components/track-editor/track-editor-crud.helper";
import { TrackEditorHelpHelper } from "@app/components/track-editor/track-editor-help.helper";
import {
  TrackEditorPersistenceHelper,
  TrackPersistenceHost,
} from "@app/components/track-editor/track-editor-persistence.helper";
import {
  TrackEditorSections,
  TrackEditorUiHelper,
} from "@app/components/track-editor/track-editor-ui.helper";
import { TrackInterfaceConfigsHelper } from "@app/components/track-editor/track-interface-configs.helper";
import {
  TRACK_SCALE_OPTIONS,
  TrackLaneHelper,
} from "@app/components/track-editor/track-lane.helper";
import { TrackLaneRemappingHelper } from "@app/components/track-editor/track-lane-remapping.helper";
import { TrackStateHelper } from "@app/components/track-editor/track-state.helper";
import { TrakmateEditorComponent } from "@app/components/track-editor/trakmate-editor/trakmate-editor.component";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  BartConfig,
  PhidgetConfig,
  Track,
  TrackmateConfig,
} from "@app/models/track";
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

@Component({
  standalone: true,
  selector: "app-track-editor",
  templateUrl: "./track-editor.component.html",
  styleUrls: ["./track-editor.component.css"],
  imports: [
    AutoSelectDefaultDirective,
    EditorTitleComponent,
    EditorSectionComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    EditorTabsComponent,
    ArduinoEditorComponent,
    TrakmateEditorComponent,
    PhidgetEditorComponent,
    BartEditorComponent,
    InputDialogComponent,
    TranslatePipe,
    ConfirmationModalComponent,
    AcknowledgementModalComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ],
})
export class TrackEditorComponent
  implements OnInit, OnDestroy, DirtyComponent, TrackPersistenceHost
{
  lifecycle!: EditorLifecycleHelper;
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
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  isDestroyed = false;
  subscriptions: Subscription[] = [];
  trackName: string = "";
  defaultTrackName: string = "";

  focusNameInput() {
    setTimeout(() => {
      const el = document.getElementById(
        "track-name-input",
      ) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 0);
  }
  numTrackSections: number = 100;
  trackScale: number = 1.0;
  readonly trackScaleOptions = TRACK_SCALE_OPTIONS;
  lanes: Lane[] = [];
  editingTrack?: Track;
  selectedTrack?: Track;
  selectedTrackId?: string;
  trackSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  isPreservingEditModeOnNavigation: boolean = false;
  originalTrack: Track | null = null;
  transitionToReadOnlyOnSave: boolean = false;
  arduinoConfigs: ArduinoConfig[] = [];
  trackmateConfigs: TrackmateConfig[] = [];
  phidgetConfigs: PhidgetConfig[] = [];
  bartConfigs: BartConfig[] = [];
  helpSteps: GuideStep[] = [];
  driverMissingError = false;

  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isDirty: boolean = false;
  isAutoSaving: boolean = false;
  public navigateBackOnSave = false;

  undoManager!: UndoManager<Track>;
  allTracks: Track[] = [];

  @ViewChildren(ArduinoEditorComponent)
  arduinoEditors!: QueryList<ArduinoEditorComponent>;
  @ViewChildren(BartEditorComponent)
  bartEditors!: QueryList<BartEditorComponent>;
  @ViewChildren(PhidgetEditorComponent)
  phidgetEditors!: QueryList<PhidgetEditorComponent>;
  @ViewChildren(TrakmateEditorComponent)
  trakmateEditors!: QueryList<TrakmateEditorComponent>;
  sectionsExpanded: TrackEditorSections =
    TrackEditorUiHelper.loadSavedSections();

  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  showLedStringDialog = false;
  requestingArduinoIndex = -1;

  toggleSection(section: keyof TrackEditorSections, forcedState?: boolean) {
    this.sectionsExpanded = TrackEditorUiHelper.toggleSection(
      this.sectionsExpanded,
      section,
      forcedState,
    );
  }

  areAllSectionsExpanded(): boolean {
    return Object.values(this.sectionsExpanded).every(Boolean);
  }

  toggleAllSections(forcedState?: boolean) {
    const { nextState, sections } = TrackEditorUiHelper.toggleAllSections(
      this.sectionsExpanded,
      forcedState,
    );
    this.sectionsExpanded = sections;
    if (nextState) {
      this.arduinoEditors?.forEach((e) => e.ensureSectionsExpanded());
      this.bartEditors?.forEach((e) => e.ensureSectionsExpanded());
      this.phidgetEditors?.forEach((e) => e.ensureSectionsExpanded());
      this.trakmateEditors?.forEach((e) => e.ensureSectionsExpanded());
    }
  }

  get interfaceTabs(): EditorTab[] {
    return TrackInterfaceConfigsHelper.buildInterfaceTabs(
      this.arduinoConfigs,
      this.trackmateConfigs,
      this.phidgetConfigs,
      this.bartConfigs,
    );
  }

  scrollToAndExpandInterface(tabId: string) {
    TrackInterfaceConfigsHelper.scrollToAndExpandInterface(
      tabId,
      {
        arduinoEditors: this.arduinoEditors,
        trakmateEditors: this.trakmateEditors,
        phidgetEditors: this.phidgetEditors,
        bartEditors: this.bartEditors,
      },
      this.cdr,
    );
  }

  constructor(
    public dataService: DataService,
    public cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    public router: Router,
    public route: ActivatedRoute,
    public location: Location,
    private helpService: HelpService,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private settingsService: SettingsService,
    public logger: LoggerService,
    public navigationService: NavigationService,
  ) {
    this.undoManager = new UndoManager<Track>(
      {
        clonner: (t) => this.cloneTrack(t),
        equalizer: (a, b) => this.areTracksEqual(a, b),
        applier: (t) => {
          this.editingTrack = t;
          if (this.editingTrack) {
            this.trackName = this.editingTrack.name;
            this.numTrackSections = this.editingTrack.num_track_sections;
            this.trackScale = this.normalizeTrackScale(
              this.editingTrack.track_scale,
            );
            this.lanes = [...this.editingTrack.lanes];
            this.syncInterfaceConfigsFromTrack(this.editingTrack);
            this.cdr.detectChanges();
          }
        },
      },
      () => this.createSnapshot(),
    );

    this.lifecycle = new EditorLifecycleHelper({
      cdr: this.cdr,
      translationService: this.translationService,
      getUnsavedReasons: () => this.getUnsavedReasons(),
      undoManager: this.undoManager,
      hasChanges: () => this.hasChanges(),
      isSaveValid: () =>
        Boolean(this.trackName?.trim() && this.isNameUnique(true)),
      isSaving: () => this.isSaving,
      onAutoSave: () => this.updateTrack(false, true),
      logger: this.logger,
    });
  }

  ngOnInit() {
    this.updateScale();

    const routeSub = TrackEditorPersistenceHelper.setupRouteSubscription(this);
    if (routeSub) {
      this.subscriptions.push(routeSub);
    }

    this.subscriptions.push(
      this.helpService.isVisible$.subscribe((visible) => {
        if (visible) {
          setTimeout(() => this.ensureSectionsExpandedForHelp());
        }
      }),
    );

    this.subscriptions.push(
      this.undoManager.stateCommitted$.subscribe((event) => {
        if (
          event.type === "push" ||
          event.type === "undo" ||
          event.type === "redo"
        ) {
          this.autoSaveTrack();
        }
      }),
    );

    this.dataService.connectToInterfaceDataSocket();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.raceConnectionService.connect();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    this.undoManager.destroy();
    this.dataService.disconnectFromInterfaceDataSocket();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this.dataService.closeInterface().subscribe({
      next: () => this.logger.debug("Interface closed successfully"),
      error: (err) => this.logger.error("Error closing interface", err),
    });
    if (this.colorDebounceTimer) {
      clearTimeout(this.colorDebounceTimer);
    }
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    TrackEditorUiHelper.handleKeyboardEvent(
      event,
      this.isEditMode,
      () => this.undo(),
      () => this.redo(),
    );
  }

  private updateScale() {
    this.scale = TrackEditorUiHelper.calculateScale(
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

  onRequestLedStringDialog(index: number) {
    this.requestingArduinoIndex = index;
    this.showLedStringDialog = true;
  }

  onLedStringDialogConfirm(numLeds: number) {
    this.showLedStringDialog = false;
    if (this.requestingArduinoIndex >= 0) {
      const editors = this.arduinoEditors.toArray();
      if (editors[this.requestingArduinoIndex]) {
        editors[this.requestingArduinoIndex].addLedString(numLeds);
        this.captureState();
      }
    }
    this.requestingArduinoIndex = -1;
  }

  onLedStringDialogCancel() {
    this.showLedStringDialog = false;
    this.requestingArduinoIndex = -1;
  }

  loadData() {
    TrackEditorPersistenceHelper.loadTracksData(this);
  }

  updateTrackSelectItems() {
    this.trackSelectItems = mapToSelectItems(this.allTracks);
  }

  selectTrack(track: Track) {
    this.selectedTrack = track;
    this.editingTrack = this.cloneTrack(track);
    this.originalTrack = this.cloneTrack(track);
    this.selectedTrackId = track.entity_id;
    this.applyTrackToState(this.editingTrack);
  }

  startNewTrack() {
    this.selectedTrack = undefined;
    this.originalTrack = null;
    this.selectedTrackId = undefined;
    this.isEditMode = true;
    this.isPreservingEditModeOnNavigation = true;
    const defaultName =
      this.translationService.translate("TM_DEFAULT_TRACK_NAME") || "New Track";
    this.trackName = this.generateUniqueName(defaultName, false);
    this.defaultTrackName = this.trackName;
    this.isLoading = true;

    this.subscriptions.push(
      this.dataService.getTrackFactorySettings().subscribe({
        next: (factoryTrack) => {
          const trackToCreate = TrackEditorCrudHelper.createTrackFromFactory(
            factoryTrack,
            this.trackName,
            () => this.generateId(),
          );
          TrackEditorPersistenceHelper.persistNewTrack(this, trackToCreate);
        },
        error: (err) => {
          this.logger.error("Failed to load factory settings", err);
          const fallbackTrack = TrackEditorCrudHelper.createFallbackTrack(
            this.trackName,
            () => this.generateId(),
          );
          TrackEditorPersistenceHelper.persistNewTrack(this, fallbackTrack);
        },
      }),
    );
  }

  applyTrackToState(track: Track) {
    this.trackName = track.name;
    this.numTrackSections = track.num_track_sections;
    this.trackScale = this.normalizeTrackScale(track.track_scale);
    this.lanes = track.lanes.map(
      (l) =>
        new Lane(l.entity_id, l.foreground_color, l.background_color, l.length),
    );
    this.syncInterfaceConfigsFromTrack(track);
    this.ensureInterfaceConfigsValid();
    this.undoManager.initialize(this.createSnapshot());
    this.initializeInterfaces();
    this.updateHelpSteps();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  private syncInterfaceConfigsFromTrack(track: Track) {
    const res = TrackStateHelper.syncInterfaceConfigsFromTrack(track, {
      arduinoConfigs: this.arduinoConfigs,
      trackmateConfigs: this.trackmateConfigs,
      phidgetConfigs: this.phidgetConfigs,
      bartConfigs: this.bartConfigs,
    });
    this.arduinoConfigs = res.arduinoConfigs;
    this.trackmateConfigs = res.trackmateConfigs;
    this.phidgetConfigs = res.phidgetConfigs;
    this.bartConfigs = res.bartConfigs;
  }

  private ensureInterfaceConfigsValid() {
    TrackStateHelper.ensureInterfaceConfigsValid(this.arduinoConfigs);
  }

  onSelectTrackById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedTrackId === id) return;
    const found = this.allTracks.find((t) => t.entity_id === id);
    if (found) {
      this.isSwitchingSelection = true;
      this.selectTrack(found);
      this.navigationService.setLastEditedId("track", found.entity_id);
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
        alert(this.translationService.translate("TE_ERROR_NAME_EXISTS"));
        return;
      }
      this.updateTrack(false, false);
    } else {
      this.isEditMode = false;
    }
  }

  onAddNewTrack() {
    if (this.isEditMode && this.isDirtyState()) {
      this.confirmDiscard().then((confirmed) => {
        if (confirmed) {
          this.startNewTrack();
        }
      });
    } else {
      this.startNewTrack();
    }
  }

  onDeleteTrack() {
    this.deleteTrack();
  }

  deleteTrack() {
    if (!this.editingTrack || this.editingTrack.entity_id === "new") return;
    this.showDeleteConfirm = true;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }

  onConfirmDelete() {
    this.showDeleteConfirm = false;
    TrackEditorPersistenceHelper.deleteTrack(this);
  }

  private initializeInterfaces() {
    TrackInterfaceConfigsHelper.initializeInterfaces(
      this.dataService,
      this.logger,
      {
        arduinoConfigs: this.arduinoConfigs,
        trackmateConfigs: this.trackmateConfigs,
        phidgetConfigs: this.phidgetConfigs,
        bartConfigs: this.bartConfigs,
        numLanes: this.lanes.length,
      },
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  cloneTrack(track: Track): Track {
    return TrackStateHelper.cloneTrack(track);
  }

  createSnapshot(): Track {
    return TrackStateHelper.createSnapshot({
      editingTrack: this.editingTrack,
      trackName: this.trackName,
      numTrackSections: this.numTrackSections,
      trackScale: this.trackScale,
      lanes: this.lanes,
      arduinoConfigs: this.arduinoConfigs,
      trackmateConfigs: this.trackmateConfigs,
      phidgetConfigs: this.phidgetConfigs,
      bartConfigs: this.bartConfigs,
    });
  }

  areTracksEqual(t1: Track, t2: Track): boolean {
    return TrackStateHelper.areTracksEqual(t1, t2);
  }

  areArduinoConfigsEqual(
    acs1: ArduinoConfig[],
    acs2: ArduinoConfig[],
  ): boolean {
    return TrackStateHelper.areArduinoConfigsEqual(acs1, acs2);
  }

  areTrackmateConfigsEqual(
    tcs1: TrackmateConfig[],
    tcs2: TrackmateConfig[],
  ): boolean {
    return TrackStateHelper.areTrackmateConfigsEqual(tcs1, tcs2);
  }

  arePhidgetConfigsEqual(
    pcs1: PhidgetConfig[],
    pcs2: PhidgetConfig[],
  ): boolean {
    return TrackStateHelper.arePhidgetConfigsEqual(pcs1, pcs2);
  }

  undo() {
    if (!this.isEditMode) return;
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.undo();
  }

  redo() {
    if (!this.isEditMode) return;
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.redo();
  }

  isConfigValid(): boolean {
    return !this.isNameInvalid;
  }

  isDirtyState(): boolean {
    if (!this.undoManager) return false;
    const umChanges = this.undoManager.hasChanges();
    if (!this.editingTrack || !this.originalTrack) return umChanges;
    const manualChanges = !this.areTracksEqual(
      this.createSnapshot(),
      this.originalTrack,
    );
    return this.isDirty || umChanges || manualChanges;
  }

  hasChanges(): boolean {
    return this.isDirtyState();
  }

  getUnsavedReasons(): string[] {
    return TrackEditorCrudHelper.getUnsavedTrackReasons(
      this.editingTrack,
      this.trackName,
      this.isNameUnique(true),
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
      if (this.originalTrack) {
        this.selectTrack(this.originalTrack);
      } else if (this.allTracks.length > 0) {
        this.selectTrack(this.allTracks[0]);
      }
      this.isEditMode = false;
    });
  }

  onCancelDiscard() {
    this.lifecycle.onCancelDiscard();
  }

  onBackClicked() {
    if (this.isConfigValid()) {
      if (this.isDirtyState()) {
        this.navigateBackOnSave = true;
        this.updateTrack();
      } else {
        this.onBack();
      }
    } else {
      this.onBack();
    }
  }

  getBaseHelpSteps(): GuideStep[] {
    return TrackEditorHelpHelper.getBaseHelpSteps(this.translationService);
  }

  getHelpSteps(): GuideStep[] {
    return TrackEditorHelpHelper.getHelpSteps(
      this.translationService,
      {
        arduinoEditors: this.arduinoEditors,
        bartEditors: this.bartEditors,
        phidgetEditors: this.phidgetEditors,
        trakmateEditors: this.trakmateEditors,
      },
      {
        arduinoConfigs: this.arduinoConfigs,
        bartConfigs: this.bartConfigs,
        phidgetConfigs: this.phidgetConfigs,
        trackmateConfigs: this.trackmateConfigs,
      },
    );
  }

  updateHelpSteps() {
    this.helpSteps = this.getHelpSteps();
  }

  private ensureSectionsExpandedForHelp() {
    const changed = TrackEditorHelpHelper.ensureSectionsExpandedForHelp(
      this.sectionsExpanded,
      this.lanes?.length > 0,
      {
        arduinoEditors: this.arduinoEditors,
        bartEditors: this.bartEditors,
        phidgetEditors: this.phidgetEditors,
        trakmateEditors: this.trakmateEditors,
      },
      {
        arduinoConfigs: this.arduinoConfigs,
        bartConfigs: this.bartConfigs,
        phidgetConfigs: this.phidgetConfigs,
        trackmateConfigs: this.trackmateConfigs,
      },
    );
    if (changed && !this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  startHelp() {
    this.ensureSectionsExpandedForHelp();
    const toolbarSteps = TrackEditorHelpHelper.getToolbarHelpSteps(
      this.translationService,
    );
    this.helpService.startGuide([...this.getHelpSteps(), ...toolbarSteps]);
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
    this.isDirty = true;
    this.undoManager.captureState();
    this.cdr.detectChanges();
  }

  // Lane Management
  addLane() {
    this.lanes = [
      ...this.lanes,
      TrackLaneHelper.createDefaultLane(this.generateId()),
    ];
    this.sectionsExpanded.lanes = true;
    this.captureState();
  }

  removeLane(index: number) {
    this.lanes.splice(index, 1);
    this.lanes = [...this.lanes];
    this.updateInterfaceConfigsOnLaneDeletion(index);
    this.captureState();
  }

  onLaneDropped(event: CdkDragDrop<Lane[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.lanes, event.previousIndex, event.currentIndex);
      this.lanes = [...this.lanes];

      this.updateInterfaceConfigsOnLaneOrderChange(
        event.previousIndex,
        event.currentIndex,
      );

      this.captureState();
    }
  }

  private updateInterfaceConfigsOnLaneOrderChange(
    prevIndex: number,
    currIndex: number,
  ) {
    TrackLaneRemappingHelper.updateInterfaceConfigsOnLaneOrderChange(
      this.arduinoConfigs,
      this.phidgetConfigs,
      prevIndex,
      currIndex,
    );
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.phidgetConfigs = [...this.phidgetConfigs];
  }

  private updateInterfaceConfigsOnLaneDeletion(deletedLaneIndex: number) {
    TrackLaneRemappingHelper.updateInterfaceConfigsOnLaneDeletion(
      this.arduinoConfigs,
      this.phidgetConfigs,
      deletedLaneIndex,
    );
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.phidgetConfigs = [...this.phidgetConfigs];
  }

  private colorDebounceTimer: any = null;

  updateLaneBackgroundColor(index: number, color: string) {
    this.lanes = TrackLaneHelper.updateLaneBackgroundColor(
      this.lanes,
      index,
      color,
      this.arduinoConfigs,
    );
    this.arduinoConfigs = [...(this.arduinoConfigs || [])];

    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
      this.lanes = [...this.lanes];
    }, 400);
  }

  updateLaneForegroundColor(index: number, color: string) {
    this.lanes = TrackLaneHelper.updateLaneForegroundColor(
      this.lanes,
      index,
      color,
    );

    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
    }, 400);
  }

  onTrackScaleChange(val: any) {
    this.trackScale = this.normalizeTrackScale(Number(val));
    this.onInputChange();
  }

  private normalizeTrackScale(scale: number | undefined): number {
    return TrackLaneHelper.normalizeTrackScale(scale);
  }

  updateLaneLength(index: number, length: any) {
    this.lanes = TrackLaneHelper.updateLaneLength(this.lanes, index, length);
    this.onInputChange();
  }

  // --- Arduino Configuration ---

  private onInterfaceListChanged() {
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  addArduinoConfig() {
    this.arduinoConfigs = TrackInterfaceConfigsHelper.addArduinoConfig(
      this.arduinoConfigs,
    );
    this.onInterfaceListChanged();
  }

  trackByArduinoConfig(index: number, _config: any): number {
    return index;
  }

  removeArduinoConfig(index: number) {
    this.arduinoConfigs = TrackInterfaceConfigsHelper.removeArduinoConfig(
      this.arduinoConfigs,
      index,
    );
    this.onInterfaceListChanged();
  }

  addTrackmateConfig() {
    this.trackmateConfigs = TrackInterfaceConfigsHelper.addTrackmateConfig(
      this.trackmateConfigs,
      this.lanes.length,
    );
    this.onInterfaceListChanged();
  }

  removeTrackmateConfig(index: number) {
    this.trackmateConfigs = TrackInterfaceConfigsHelper.removeTrackmateConfig(
      this.trackmateConfigs,
      index,
    );
    this.onInterfaceListChanged();
  }

  trackByTrackmateConfig(index: number, _config: any): number {
    return index;
  }

  // --- BART Configuration ---

  addBartConfig() {
    this.bartConfigs = TrackInterfaceConfigsHelper.addBartConfig(
      this.bartConfigs,
      this.lanes.length,
    );
    this.onInterfaceListChanged();
  }

  removeBartConfig(index: number) {
    this.bartConfigs = TrackInterfaceConfigsHelper.removeBartConfig(
      this.bartConfigs,
      index,
    );
    this.onInterfaceListChanged();
  }

  onArduinoConfigChange() {
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.onInterfaceListChanged();
  }

  onTrackmateConfigChange() {
    this.trackmateConfigs = [...this.trackmateConfigs];
    this.onInterfaceListChanged();
  }

  onBartConfigChange() {
    this.bartConfigs = [...this.bartConfigs];
    this.onInterfaceListChanged();
  }

  trackByBartConfig(index: number, _config: any): number {
    return index;
  }

  // --- Phidget Configuration ---

  addPhidgetConfig() {
    this.phidgetConfigs = TrackInterfaceConfigsHelper.addPhidgetConfig(
      this.phidgetConfigs,
    );
    this.captureState();
    this.initializeInterfaces();
  }

  removePhidgetConfig(index: number) {
    this.phidgetConfigs = TrackInterfaceConfigsHelper.removePhidgetConfig(
      this.phidgetConfigs,
      index,
    );
    this.onInterfaceListChanged();
  }

  onPhidgetDriverError() {
    this.driverMissingError = true;
  }

  onPhidgetConfigChange() {
    this.phidgetConfigs = [...this.phidgetConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  trackByPhidgetConfig(index: number, _config: any): number {
    return index;
  }

  saveAsNew() {
    this.isEditMode = true;
    this.isPreservingEditModeOnNavigation = true;
    this.trackName = this.generateUniqueName(this.trackName, true);
    this.defaultTrackName = this.trackName;
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.focusNameInput();
    this.updateTrack(true);
  }

  generateUniqueName(baseName: string, forceSuffix: boolean = false): string {
    return TrackEditorCrudHelper.generateUniqueTrackName(
      baseName,
      this.allTracks,
      forceSuffix,
    );
  }

  autoSaveTrack(): Promise<any> {
    this.logger.debug("autoSaveTrack triggered");
    if (!this.editingTrack) {
      this.logger.debug("autoSaveTrack: no editingTrack");
      return Promise.resolve();
    }
    if (!this.trackName?.trim() || !this.isNameUnique(true)) {
      this.logger.debug("autoSaveTrack: name invalid");
      return Promise.resolve();
    }
    this.logger.debug("autoSaveTrack: triggering updateTrack");
    return this.lifecycle.scheduleAutoSave(() => this.updateTrack(false, true));
  }

  updateTrack(
    isSaveAsNew: boolean = false,
    isAutoSave: boolean = false,
  ): Promise<any> {
    if (!this.editingTrack || this.isSaving) return Promise.resolve();
    const wasNew = isSaveAsNew || this.editingTrack.entity_id === "new";
    if (!wasNew && !this.isDirtyState()) return Promise.resolve();

    if (!this.trackName?.trim()) {
      if (!isAutoSave) {
        alert(this.translationService.translate("TE_ERROR_NAME_REQUIRED"));
      }
      return Promise.resolve();
    }

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    return TrackEditorPersistenceHelper.saveTrackData(
      this,
      isSaveAsNew,
      isAutoSave,
    );
  }

  get isNameInvalid(): boolean {
    if (this.isLoading) return false;
    return !isEntityNameUnique(
      this.trackName,
      this.editingTrack?.entity_id,
      this.allTracks,
      true,
    );
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    return isEntityNameUnique(
      this.trackName,
      this.editingTrack?.entity_id,
      this.allTracks,
      excludeSelf,
    );
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

  trackByLane(index: number, lane: Lane): string {
    return lane.entity_id;
  }
}
