/* eslint-disable max-lines */
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
import { TrakmateEditorComponent } from "@app/components/track-editor/trakmate-editor/trakmate-editor.component";
import { DataService } from "@app/data.service";
import { AutoSelectDefaultDirective } from "@app/directives/auto-select-default.directive";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  BartConfig,
  LedString,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
  PhidgetConfig,
  Track,
  TrackmateConfig,
} from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior, RgbLedBehavior } from "@app/proto/antigravity";
import {} from "@app/proto/message";
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
import { deepCopy } from "@app/utils/clone.utils";
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
export class TrackEditorComponent implements OnInit, OnDestroy, DirtyComponent {
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
  private subscriptions: Subscription[] = [];
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
  readonly trackScaleOptions = [
    { label: "1/87", value: 1 / 87 },
    { label: "1/64", value: 1 / 64 },
    { label: "1/43", value: 1 / 43 },
    { label: "1/32", value: 1 / 32 },
    { label: "1/24", value: 1 / 24 },
    { label: "1/1", value: 1.0 },
  ];
  lanes: Lane[] = [];
  editingTrack?: Track;
  selectedTrack?: Track;
  selectedTrackId?: string;
  trackSelectItems: { id: string; name: string }[] = [];
  isEditMode: boolean = false;
  private isPreservingEditModeOnNavigation: boolean = false;
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
  sectionsExpanded = {
    general: true,
    interfaces: true,
    lanes: true,
  };

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  showLedStringDialog = false;
  requestingArduinoIndex = -1;

  toggleSection(section: keyof typeof this.sectionsExpanded) {
    this.sectionsExpanded[section] = !this.sectionsExpanded[section];
    localStorage.setItem(
      "rc.track-editor.sections",
      JSON.stringify(this.sectionsExpanded),
    );
  }

  get interfaceTabs(): EditorTab[] {
    const tabs: EditorTab[] = [];

    this.arduinoConfigs.forEach((_, i) => {
      tabs.push({ id: `interface-arduino-${i}`, label: `Arduino ${i + 1}` });
    });

    this.trackmateConfigs.forEach((_, i) => {
      tabs.push({ id: `interface-trackmate-${i}`, label: `Trakmate ${i + 1}` });
    });

    this.phidgetConfigs.forEach((_, i) => {
      tabs.push({ id: `interface-phidget-${i}`, label: `Phidget ${i + 1}` });
    });

    this.bartConfigs.forEach((_, i) => {
      tabs.push({ id: `interface-bart-${i}`, label: `BART ${i + 1}` });
    });

    return tabs;
  }

  scrollToAndExpandInterface(tabId: string) {
    const match = tabId.match(
      /interface-(arduino|trackmate|phidget|bart)-(\d+)/,
    );
    if (!match) return;

    const type = match[1];
    const index = parseInt(match[2], 10);

    switch (type) {
      case "arduino":
        this.arduinoEditors.get(index)?.ensureSectionsExpanded();
        break;
      case "trackmate":
        this.trakmateEditors.get(index)?.ensureSectionsExpanded();
        break;
      case "phidget":
        this.phidgetEditors.get(index)?.ensureSectionsExpanded();
        break;
      case "bart":
        this.bartEditors.get(index)?.ensureSectionsExpanded();
        break;
    }

    this.cdr.detectChanges();
    setTimeout(() => {
      const element = document.getElementById(tabId);
      const container = document.querySelector(".preview-panel");
      if (element && container) {
        // Calculate the relative position to scroll safely without shifting the whole page or outer containers
        const topPos =
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;

        container.scrollTo({
          top: topPos - 24, // 24px padding-top adjustment
          behavior: "smooth",
        });
      } else if (element) {
        // Fallback
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    protected route: ActivatedRoute,
    private location: Location,
    private helpService: HelpService,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private settingsService: SettingsService,
    private logger: LoggerService,
    private navigationService: NavigationService,
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

            // Restore Arduino Configs
            if (
              this.editingTrack.arduino_configs &&
              this.editingTrack.arduino_configs.length > 0
            ) {
              this.arduinoConfigs = JSON.parse(
                JSON.stringify(this.editingTrack.arduino_configs),
              );
            } else {
              this.arduinoConfigs = [];
            }
            // Restore Trakmate Configs
            if (
              this.editingTrack.trackmate_configs &&
              this.editingTrack.trackmate_configs.length > 0
            ) {
              this.trackmateConfigs = JSON.parse(
                JSON.stringify(this.editingTrack.trackmate_configs),
              );
            } else {
              this.trackmateConfigs = [];
            }
            // Restore Phidget Configs
            if (
              this.editingTrack.phidget_configs &&
              this.editingTrack.phidget_configs.length > 0
            ) {
              this.phidgetConfigs = JSON.parse(
                JSON.stringify(this.editingTrack.phidget_configs),
              );
            } else {
              this.phidgetConfigs = [];
            }
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
    });
  }

  ngOnInit() {
    this.updateScale();

    // Load expanded state from localStorage
    const saved = localStorage.getItem("rc.track-editor.sections");
    if (saved) {
      try {
        const savedSections = JSON.parse(saved);
        this.sectionsExpanded = { ...this.sectionsExpanded, ...savedSections };
      } catch (e) {
        this.logger.error("Failed to parse saved sections", e);
      }
    }

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
            this.router.url.startsWith("/track-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
          if (nextId && nextId !== "new") {
            this.navigationService.setLastEditedId("track", nextId);
          }
          const currentId = this.editingTrack?.entity_id;
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
    this.isNavigationApproved = false;
    this.isLoading = true;
    this.subscriptions.push(
      this.dataService.getTracks().subscribe({
        next: (tracks) => {
          this.allTracks = tracks;
          this.updateTrackSelectItems();

          const idParam = this.route.snapshot.queryParamMap.get("id");
          if (idParam === "new") {
            this.startNewTrack();
            return;
          } else if (idParam) {
            const found = this.allTracks.find((t) => t.entity_id === idParam);
            if (found) {
              this.selectTrack(found);
              this.isEditMode = false;
            } else if (this.allTracks.length > 0) {
              this.selectTrack(this.allTracks[0]);
              this.isEditMode = false;
            } else {
              this.startNewTrack();
              return;
            }
          } else {
            const lastEdited = this.navigationService.getLastEditedId("track");
            const found = lastEdited
              ? this.allTracks.find((t) => t.entity_id === lastEdited)
              : undefined;
            if (found) {
              this.selectTrack(found);
              this.isEditMode = false;
            } else if (this.allTracks.length > 0) {
              this.selectTrack(this.allTracks[0]);
              this.isEditMode = false;
            } else {
              this.startNewTrack();
              return;
            }
          }

          const isNew =
            this.route.snapshot.queryParamMap.get("isNew") === "true";
          if (
            this.isPreservingEditModeOnNavigation ||
            (isNew && this.editingTrack)
          ) {
            this.isPreservingEditModeOnNavigation = false;
            this.isEditMode = true;
            this.defaultTrackName = this.editingTrack?.name || "";
            this.trackName = this.editingTrack?.name || "";
            this.focusNameInput();
          }

          this.isLoading = false;
          this.updateHelpSteps();
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.logger.error("Failed to load tracks", err);
          this.isLoading = false;
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        },
      }),
    );
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
          const trackToCreate = new Track({
            entity_id: "new",
            name: this.trackName,
            num_track_sections: factoryTrack.num_track_sections || 100,
            track_scale: factoryTrack.track_scale ?? 1.0,
            lanes: (factoryTrack.lanes || []).map(
              (l: any) =>
                new Lane(
                  this.generateId(),
                  l.foreground_color,
                  l.background_color,
                  l.length,
                ),
            ),
            has_digital_fuel: false,
            arduino_configs: factoryTrack.arduino_configs,
            has_per_lane_relays: factoryTrack.has_per_lane_relays || false,
            has_main_relay: factoryTrack.has_main_relay || false,
            trackmate_configs: factoryTrack.trackmate_configs,
            phidget_configs: factoryTrack.phidget_configs,
            bart_configs: factoryTrack.bart_configs,
          });
          this.persistNewTrack(trackToCreate);
        },
        error: (err) => {
          this.logger.error("Failed to load factory settings", err);
          const fallbackTrack = new Track({
            entity_id: "new",
            name: this.trackName,
            num_track_sections: 100,
            track_scale: 1.0,
            lanes: [
              new Lane(this.generateId(), "#ef4444", "black", 100),
              new Lane(this.generateId(), "#ffffff", "black", 100),
            ],
            has_digital_fuel: false,
          });
          this.persistNewTrack(fallbackTrack);
        },
      }),
    );
  }

  private persistNewTrack(trackToCreate: Track) {
    const payload: any = {
      ...trackToCreate,
      "@id": 1,
      lanes: trackToCreate.lanes.map((l, i) => ({
        ...l,
        "@id": i + 2,
      })),
    };

    this.dataService.createTrack(payload).subscribe({
      next: (created) => {
        this.isLoading = false;
        const merged = {
          ...payload,
          ...created,
          entity_id: created?.entity_id || payload?.entity_id,
        };
        this.handleSaveSuccess(merged, true, false);
      },
      error: (err) => {
        this.logger.error("Failed to create track", err);
        this.isLoading = false;
        this.editingTrack = trackToCreate;
        this.applyTrackToState(trackToCreate);
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
        this.focusNameInput();
      },
    });
  }

  private applyTrackToState(track: Track) {
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
    if (track.arduino_configs && track.arduino_configs.length > 0) {
      const newConfigsJson = JSON.stringify(track.arduino_configs);
      if (newConfigsJson !== JSON.stringify(this.arduinoConfigs)) {
        this.arduinoConfigs = JSON.parse(newConfigsJson);
      }
    } else if (this.arduinoConfigs.length > 0) {
      this.arduinoConfigs = [];
    }

    if (track.trackmate_configs && track.trackmate_configs.length > 0) {
      const newTmConfigsJson = JSON.stringify(track.trackmate_configs);
      if (newTmConfigsJson !== JSON.stringify(this.trackmateConfigs)) {
        this.trackmateConfigs = JSON.parse(newTmConfigsJson);
      }
    } else if (this.trackmateConfigs.length > 0) {
      this.trackmateConfigs = [];
    }

    if (track.phidget_configs && track.phidget_configs.length > 0) {
      const newPhConfigsJson = JSON.stringify(track.phidget_configs);
      if (newPhConfigsJson !== JSON.stringify(this.phidgetConfigs)) {
        this.phidgetConfigs = JSON.parse(newPhConfigsJson);
      }
    } else if (this.phidgetConfigs.length > 0) {
      this.phidgetConfigs = [];
    }

    if (track.bart_configs && track.bart_configs.length > 0) {
      const newBartConfigsJson = JSON.stringify(track.bart_configs);
      if (newBartConfigsJson !== JSON.stringify(this.bartConfigs)) {
        this.bartConfigs = JSON.parse(newBartConfigsJson);
      }
    } else if (this.bartConfigs.length > 0) {
      this.bartConfigs = [];
    }
  }

  private ensureInterfaceConfigsValid() {
    for (const config of this.arduinoConfigs) {
      if (!config.digitalIds) {
        config.digitalIds = new Array(MAX_DIGITAL_PINS).fill(-1);
      }
      if (!config.analogIds) {
        config.analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
      }
      if (!config.ledStrings) config.ledStrings = [];
      if (!config.voltageConfigs) config.voltageConfigs = {};

      for (const ls of config.ledStrings) {
        if (!ls.leds) ls.leds = [];
        if (!ls.ledLaneColorOverrides) ls.ledLaneColorOverrides = [];
      }
    }
  }

  onSelectTrackById(id: string) {
    if (this.isEditMode) return;
    if (this.selectedTrackId === id) return;
    const found = this.allTracks.find((t) => t.entity_id === id);
    if (found) {
      this.selectTrack(found);
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
    if (confirm(this.translationService.translate("TE_CONFIRM_DELETE"))) {
      this.isSaving = true;
      const idToDelete = this.editingTrack.entity_id;
      this.dataService.deleteTrack(idToDelete).subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditMode = false;
          this.allTracks = this.allTracks.filter(
            (t) => t.entity_id !== idToDelete,
          );
          this.updateTrackSelectItems();
          if (this.allTracks.length > 0) {
            this.selectTrack(this.allTracks[0]);
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: this.allTracks[0].entity_id },
              queryParamsHandling: "merge",
              replaceUrl: true,
            });
          } else {
            this.startNewTrack();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Failed to delete track", err);
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  private initializeInterfaces() {
    if (
      this.arduinoConfigs.length > 0 ||
      this.trackmateConfigs.length > 0 ||
      this.phidgetConfigs.length > 0 ||
      this.bartConfigs.length > 0
    ) {
      this.dataService
        .initializeInterface(
          this.arduinoConfigs,
          this.trackmateConfigs,
          this.phidgetConfigs,
          this.lanes.length,
          this.bartConfigs,
        )
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.logger.warn(
                `Failed to initialize interfaces: ${response.message}`,
              );
            } else {
              this.logger.info("Interfaces initialized successfully");
            }
          },
          error: (err) => {
            this.logger.error("Error calling initializeInterface", err);
          },
        });
    } else {
      this.dataService.closeInterface().subscribe({
        next: () => this.logger.debug("Interface closed successfully"),
        error: (err) => this.logger.error("Error closing interface", err),
      });
    }
  }

  // Helper for generating local IDs for new lanes if needed
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private cloneTrack(track: Track): Track {
    const lanesCopy = track.lanes.map(
      (l) =>
        new Lane(l.entity_id, l.foreground_color, l.background_color, l.length),
    );
    const arduinoCopy = track.arduino_configs
      ? JSON.parse(JSON.stringify(track.arduino_configs))
      : [];
    const trackmateCopy = track.trackmate_configs
      ? JSON.parse(JSON.stringify(track.trackmate_configs))
      : [];
    const phidgetCopy = track.phidget_configs
      ? JSON.parse(JSON.stringify(track.phidget_configs))
      : [];
    const bartCopy = track.bart_configs
      ? JSON.parse(JSON.stringify(track.bart_configs))
      : [];
    return new Track({
      entity_id: track.entity_id,
      name: track.name,
      num_track_sections: track.num_track_sections,
      track_scale: track.track_scale ?? 1.0,
      lanes: lanesCopy,
      has_digital_fuel: track.has_digital_fuel,
      arduino_configs: arduinoCopy,
      has_per_lane_relays: track.has_per_lane_relays,
      has_main_relay: track.has_main_relay,
      trackmate_configs: trackmateCopy,
      phidget_configs: phidgetCopy,
      bart_configs: bartCopy,
    });
  }

  private createSnapshot(): Track {
    if (!this.editingTrack) {
      return new Track({
        entity_id: "new",
        name: "",
        num_track_sections: 100,
        track_scale: 1.0,
        lanes: [],
        has_digital_fuel: false,
      });
    }
    const configs = this.arduinoConfigs ? deepCopy(this.arduinoConfigs) : [];
    const tmConfigs = this.trackmateConfigs
      ? deepCopy(this.trackmateConfigs)
      : [];
    const phConfigs = this.phidgetConfigs ? deepCopy(this.phidgetConfigs) : [];
    const bConfigs = this.bartConfigs ? deepCopy(this.bartConfigs) : [];
    return new Track({
      entity_id: this.editingTrack.entity_id,
      name: this.trackName,
      num_track_sections: this.numTrackSections,
      track_scale: this.trackScale,
      lanes: this.lanes.map(
        (l) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      ),
      has_digital_fuel: this.editingTrack.has_digital_fuel,
      arduino_configs: configs,
      has_per_lane_relays: this.editingTrack.has_per_lane_relays,
      has_main_relay: this.editingTrack.has_main_relay,
      trackmate_configs: tmConfigs,
      phidget_configs: phConfigs,
      bart_configs: bConfigs,
    });
  }

  private areTracksEqual(t1: Track, t2: Track): boolean {
    if (
      t1.name !== t2.name ||
      t1.num_track_sections !== t2.num_track_sections ||
      (t1.track_scale ?? 1.0) !== (t2.track_scale ?? 1.0)
    ) {
      return false;
    }
    if (t1.lanes.length !== t2.lanes.length) {
      return false;
    }
    for (let i = 0; i < t1.lanes.length; i++) {
      const l1 = t1.lanes[i];
      const l2 = t2.lanes[i];
      if (
        l1.entity_id !== l2.entity_id ||
        l1.background_color !== l2.background_color ||
        l1.foreground_color !== l2.foreground_color ||
        l1.length !== l2.length
      ) {
        return false;
      }
    }

    // Check Arduino Configs equality
    if (
      !this.areArduinoConfigsEqual(
        t1.arduino_configs || [],
        t2.arduino_configs || [],
      )
    ) {
      return false;
    }

    // Check Trackmate Configs equality
    if (
      !this.areTrackmateConfigsEqual(
        t1.trackmate_configs || [],
        t2.trackmate_configs || [],
      )
    ) {
      return false;
    }

    // Check BART Configs equality
    if (
      JSON.stringify(t1.bart_configs || []) !==
      JSON.stringify(t2.bart_configs || [])
    ) {
      return false;
    }

    // Check Phidget Configs equality
    if (
      !this.arePhidgetConfigsEqual(
        t1.phidget_configs || [],
        t2.phidget_configs || [],
      )
    ) {
      return false;
    }

    return true;
  }

  private areArduinoConfigsEqual(
    acs1: ArduinoConfig[],
    acs2: ArduinoConfig[],
  ): boolean {
    if (acs1.length !== acs2.length) {
      return false;
    }

    for (let c = 0; c < acs1.length; c++) {
      const ac1 = acs1[c];
      const ac2 = acs2[c];

      const keys = Object.keys(ac1) as (keyof ArduinoConfig)[];
      for (const key of keys) {
        const v1 = ac1[key];
        const v2 = (ac2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) {
            return false;
          }
          const v2Effective = v2Arr;
          for (let i = 0; i < v1.length; i++) {
            if (key === "ledStrings") {
              const ls1 = v1 as unknown as LedString[];
              const ls2 = v2Effective as unknown as LedString[];
              if (!this.isLedStringsEqual(ls1[i], ls2[i])) {
                return false;
              }
            } else if (v1[i] !== v2Effective[i]) {
              return false;
            }
          }
        } else if (key === "voltageConfigs") {
          const vc1 = (v1 || {}) as { [lane: number]: number };
          const vc2 = (v2 || {}) as { [lane: number]: number };
          const entries1 = Object.entries(vc1);
          const entries2 = Object.entries(vc2);
          if (entries1.length !== entries2.length) {
            return false;
          }
          for (const [lane, val] of entries1) {
            if (vc2[lane as any] !== val) {
              return false;
            }
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  private areTrackmateConfigsEqual(
    tcs1: TrackmateConfig[],
    tcs2: TrackmateConfig[],
  ): boolean {
    if (tcs1.length !== tcs2.length) {
      return false;
    }

    for (let c = 0; c < tcs1.length; c++) {
      const tc1 = tcs1[c];
      const tc2 = tcs2[c];

      const keys = Object.keys(tc1) as (keyof TrackmateConfig)[];
      for (const key of keys) {
        const v1 = tc1[key];
        const v2 = (tc2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) return false;
          for (let i = 0; i < v1.length; i++) {
            if (v1[i] !== v2Arr[i]) return false;
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  private arePhidgetConfigsEqual(
    pcs1: PhidgetConfig[],
    pcs2: PhidgetConfig[],
  ): boolean {
    if (pcs1.length !== pcs2.length) return false;

    for (let c = 0; c < pcs1.length; c++) {
      const pc1 = pcs1[c];
      const pc2 = pcs2[c];

      const keys = Object.keys(pc1) as (keyof PhidgetConfig)[];
      for (const key of keys) {
        const v1 = pc1[key];
        const v2 = (pc2 as any)[key];

        if (Array.isArray(v1)) {
          const v2Arr = Array.isArray(v2) ? v2 : [];
          if (v1.length !== v2Arr.length) return false;
          for (let i = 0; i < v1.length; i++) {
            if (v1[i] !== v2Arr[i]) return false;
          }
        } else if (key === "voltageConfigs") {
          const vc1 = (v1 || {}) as { [lane: number]: number };
          const vc2 = (v2 || {}) as { [lane: number]: number };
          const entries1 = Object.entries(vc1);
          const entries2 = Object.entries(vc2);
          if (entries1.length !== entries2.length) return false;
          for (const [lane, val] of entries1) {
            if (vc2[lane as any] !== val) return false;
          }
        } else if (v1 !== v2) {
          return false;
        }
      }
    }

    return true;
  }

  private isLedStringsEqual(s1: LedString, s2: LedString): boolean {
    if (!s1 || !s2) return s1 === s2;
    if (
      s1.pin !== s2.pin ||
      s1.numUsedLeds !== s2.numUsedLeds ||
      s1.addressableLeds !== s2.addressableLeds ||
      s1.brightness !== s2.brightness ||
      s1.colorOrder !== s2.colorOrder ||
      s1.flagFlashRate !== s2.flagFlashRate
    ) {
      return false;
    }

    if (s1.leds?.length !== s2.leds?.length) return false;
    if (s1.leds) {
      for (let i = 0; i < s1.leds.length; i++) {
        if (s1.leds[i] !== s2.leds[i]) return false;
      }
    }

    if (s1.ledLaneColorOverrides?.length !== s2.ledLaneColorOverrides?.length)
      return false;
    if (s1.ledLaneColorOverrides) {
      for (let i = 0; i < s1.ledLaneColorOverrides.length; i++) {
        if (s1.ledLaneColorOverrides[i] !== s2.ledLaneColorOverrides[i])
          return false;
      }
    }

    return true;
  }

  // Undo/Redo Proxies
  undo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.undo();
  }
  redo() {
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
    const reasons: string[] = [];
    if (!this.editingTrack) return reasons;

    const nameTrimmed = this.trackName?.trim() || "";
    if (!nameTrimmed) {
      reasons.push("DISCARD_REASON_TRACK_NAME_EMPTY");
    } else if (!this.isNameUnique(true)) {
      reasons.push("DISCARD_REASON_TRACK_NAME_DUPLICATE");
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

  private getBaseHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("TE_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("TE_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        title: this.translationService.translate("TE_HELP_GENERAL_TITLE"),
        content: this.translationService.translate("TE_HELP_GENERAL_CONTENT"),
        position: "center",
      },
      {
        selector: "#track-name-input",
        title: this.translationService.translate("TE_HELP_NAME_TITLE"),
        content: this.translationService.translate("TE_HELP_NAME_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#num-track-sections-section",
        title: this.translationService.translate(
          "TE_HELP_NUM_TRACK_SECTIONS_TITLE",
        ),
        content: this.translationService.translate(
          "TE_HELP_NUM_TRACK_SECTIONS_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#track-scale-section",
        title: this.translationService.translate("TE_HELP_TRACK_SCALE_TITLE"),
        content: this.translationService.translate(
          "TE_HELP_TRACK_SCALE_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#lane-editor-section",
        title: this.translationService.translate("TE_HELP_LANES_TITLE"),
        content: this.translationService.translate("TE_HELP_LANES_CONTENT"),
        position: "right",
      },
      {
        selector: "#lane-bg-0",
        title: this.translationService.translate("TE_HELP_LANE_BG_TITLE"),
        content: this.translationService.translate("TE_HELP_LANE_BG_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-fg-0",
        title: this.translationService.translate("TE_HELP_LANE_FG_TITLE"),
        content: this.translationService.translate("TE_HELP_LANE_FG_CONTENT"),
        position: "bottom",
      },
      {
        selector: "#lane-length-0",
        title: this.translationService.translate("TE_HELP_LANE_LENGTH_TITLE"),
        content: this.translationService.translate(
          "TE_HELP_LANE_LENGTH_CONTENT",
        ),
        position: "bottom",
      },
      {
        selector: "#lane-drag-0",
        title: this.translationService.translate("TE_HELP_LANE_DRAG_TITLE"),
        content: this.translationService.translate("TE_HELP_LANE_DRAG_CONTENT"),
        position: "right",
      },
      {
        selector: "#lane-delete-0",
        title: this.translationService.translate("TE_HELP_DELETE_LANE_TITLE"),
        content: this.translationService.translate(
          "TE_HELP_DELETE_LANE_CONTENT",
        ),
        position: "right",
      },
      {
        selector: "#add-interface-btn",
        title: this.translationService.translate("TE_HELP_ADD_INTERFACE_TITLE"),
        content: this.translationService.translate(
          "TE_HELP_ADD_INTERFACE_CONTENT",
        ),
        position: "right",
      },
    ];
  }

  private getInterfaceHelpSteps(): GuideStep[] {
    const steps: GuideStep[] = [];

    // Add Arduino help steps if there are any configured (first one only)
    if (this.arduinoConfigs?.length > 0) {
      const firstArduino = this.arduinoEditors?.first;
      if (firstArduino) {
        steps.push(...firstArduino.getHelpSteps());
      }
    }

    // Add Bart help steps if there are any configured (first one only)
    if (this.bartConfigs?.length > 0) {
      const firstBart = this.bartEditors?.first;
      if (firstBart) {
        steps.push(...firstBart.getHelpSteps());
      }
    }

    // Add Phidget help steps if there are any configured (first one only)
    if (this.phidgetConfigs?.length > 0) {
      const firstPhidget = this.phidgetEditors?.first;
      if (firstPhidget) {
        steps.push(...firstPhidget.getHelpSteps());
      }
    }

    // Add Trackmate help steps if there are any configured (first one only)
    if (this.trackmateConfigs?.length > 0) {
      const firstTrackmate = this.trakmateEditors?.first;
      if (firstTrackmate) {
        steps.push(...firstTrackmate.getHelpSteps());
      }
    }

    return steps;
  }

  getHelpSteps(): GuideStep[] {
    return [...this.getBaseHelpSteps(), ...this.getInterfaceHelpSteps()];
  }

  updateHelpSteps() {
    this.helpSteps = this.getHelpSteps();
  }

  private ensureSectionsExpandedForHelp() {
    let changed = false;
    // Ensure lanes section is expanded if we are going to highlight items inside it
    if (
      this.sectionsExpanded &&
      !this.sectionsExpanded.lanes &&
      this.lanes?.length > 0
    ) {
      this.sectionsExpanded.lanes = true;
      changed = true;
    }

    // Ensure interfaces section is expanded so the Add Interface button is visible
    if (this.sectionsExpanded && !this.sectionsExpanded.interfaces) {
      this.sectionsExpanded.interfaces = true;
      changed = true;
    }

    if (this.arduinoConfigs?.length > 0 && this.arduinoEditors?.first) {
      this.arduinoEditors.first.ensureSectionsExpanded();
    }
    if (this.bartConfigs?.length > 0 && this.bartEditors?.first) {
      this.bartEditors.first.ensureSectionsExpanded();
    }
    if (this.phidgetConfigs?.length > 0 && this.phidgetEditors?.first) {
      this.phidgetEditors.first.ensureSectionsExpanded();
    }
    if (this.trackmateConfigs?.length > 0 && this.trakmateEditors?.first) {
      this.trakmateEditors.first.ensureSectionsExpanded();
    }

    if (changed && !this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  startHelp() {
    this.ensureSectionsExpandedForHelp();
    const toolbarSteps: GuideStep[] = [
      {
        targetId: "undo-btn",
        title: this.translationService.translate("TOOLBAR_HELP_UNDO_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_UNDO_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "redo-btn",
        title: this.translationService.translate("TOOLBAR_HELP_REDO_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_REDO_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "copy-item-btn",
        title: this.translationService.translate("TOOLBAR_HELP_COPY_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_COPY_CONTENT"),
        position: "bottom",
      },
      {
        targetId: "help-track-btn",
        title: this.translationService.translate("TOOLBAR_HELP_HELP_TITLE"),
        content: this.translationService.translate("TOOLBAR_HELP_HELP_CONTENT"),
        position: "bottom",
      },
    ];
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
      new Lane(this.generateId(), "black", "#ffffff", 100),
    ]; // Default white lane with black text
    this.sectionsExpanded.lanes = true;
    this.captureState();
  }

  removeLane(index: number) {
    this.lanes.splice(index, 1);
    this.lanes = [...this.lanes]; // Trigger change detection
    this.updateInterfaceConfigsOnLaneDeletion(index);
    this.captureState();
  }

  onLaneDropped(event: CdkDragDrop<Lane[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.lanes, event.previousIndex, event.currentIndex);
      this.lanes = [...this.lanes]; // Trigger change detection

      // Update Interface configs to match new lane order
      this.updateInterfaceConfigsOnLaneOrderChange(
        event.previousIndex,
        event.currentIndex,
      );

      this.captureState();
    }
  }

  /* eslint-disable max-lines-per-function */
  private updateInterfaceConfigsOnLaneOrderChange(
    prevIndex: number,
    currIndex: number,
  ) {
    const updatePinIds = (ids: number[]) => {
      if (!ids) return;
      for (let i = 0; i < ids.length; i++) {
        const val = ids[i];
        if (
          val === PinBehavior.BEHAVIOR_UNUSED ||
          val === PinBehavior.BEHAVIOR_RESERVED ||
          val === PinBehavior.BEHAVIOR_CALL_BUTTON ||
          val === PinBehavior.BEHAVIOR_RELAY
        ) {
          continue;
        }

        let base = -1;
        if (
          val >= PinBehavior.BEHAVIOR_LAP_BASE &&
          val < PinBehavior.BEHAVIOR_SEGMENT_BASE
        ) {
          base = PinBehavior.BEHAVIOR_LAP_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_SEGMENT_BASE &&
          val < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
        ) {
          base = PinBehavior.BEHAVIOR_SEGMENT_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
          val < PinBehavior.BEHAVIOR_RELAY_BASE
        ) {
          base = PinBehavior.BEHAVIOR_CALL_BUTTON_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_RELAY_BASE &&
          val < PinBehavior.BEHAVIOR_RELAY_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_RELAY_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
          val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_IN_BASE &&
          val < PinBehavior.BEHAVIOR_PIT_OUT_BASE
        ) {
          base = PinBehavior.BEHAVIOR_PIT_IN_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
          val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
        ) {
          base = PinBehavior.BEHAVIOR_PIT_OUT_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
          val < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE;
        } else if (
          val >= (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE &&
          val < (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1000
        ) {
          base = (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE;
        }

        if (base !== -1) {
          const lane = val - base;
          if (lane === prevIndex) {
            ids[i] = base + currIndex;
          } else if (prevIndex < currIndex) {
            if (lane > prevIndex && lane <= currIndex) {
              ids[i] = val - 1;
            }
          } else {
            if (lane >= currIndex && lane < prevIndex) {
              ids[i] = val + 1;
            }
          }
        }
      }
    };

    const updateVoltageConfigs = (voltageConfigs?: {
      [lane: number]: number;
    }) => {
      if (!voltageConfigs) return voltageConfigs;
      const newVoltageConfigs: { [lane: number]: number } = {};
      Object.entries(voltageConfigs).forEach(([laneStr, value]) => {
        const lane = parseInt(laneStr, 10);
        if (lane === prevIndex) {
          newVoltageConfigs[currIndex] = value;
        } else if (prevIndex < currIndex) {
          if (lane > prevIndex && lane <= currIndex) {
            newVoltageConfigs[lane - 1] = value;
          } else {
            newVoltageConfigs[lane] = value;
          }
        } else {
          if (lane >= currIndex && lane < prevIndex) {
            newVoltageConfigs[lane + 1] = value;
          } else {
            newVoltageConfigs[lane] = value;
          }
        }
      });
      return newVoltageConfigs;
    };

    this.arduinoConfigs?.forEach((config) => {
      updatePinIds(config.digitalIds);
      updatePinIds(config.analogIds);
      config.voltageConfigs = updateVoltageConfigs(config.voltageConfigs);

      if (config.ledStrings) {
        config.ledStrings.forEach((ls) => {
          if (ls.ledLaneColorOverrides) {
            moveItemInArray(ls.ledLaneColorOverrides, prevIndex, currIndex);
          }

          if (ls.leds) {
            ls.leds = ls.leds.map((val) => {
              const bases = [
                RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
              ];
              const base = bases.find((b) => val >= b && val < b + 1000);
              if (base !== undefined) {
                const lane = val - base;
                if (lane === prevIndex) {
                  return base + currIndex;
                } else if (prevIndex < currIndex) {
                  if (lane > prevIndex && lane <= currIndex) {
                    return val - 1;
                  }
                } else {
                  if (lane >= currIndex && lane < prevIndex) {
                    return val + 1;
                  }
                }
              }
              return val;
            });
          }
        });
      }
    });
    this.arduinoConfigs = [...this.arduinoConfigs];

    this.phidgetConfigs?.forEach((config) => {
      updatePinIds(config.digitalInIds);
      updatePinIds(config.digitalOutIds);
      updatePinIds(config.analogIds);
      config.voltageConfigs = updateVoltageConfigs(config.voltageConfigs);
    });
    this.phidgetConfigs = [...this.phidgetConfigs];
  }

  private updateInterfaceConfigsOnLaneDeletion(deletedLaneIndex: number) {
    const updatePinIds = (ids: number[]) => {
      if (!ids) return;
      for (let i = 0; i < ids.length; i++) {
        const val = ids[i];
        if (
          val === PinBehavior.BEHAVIOR_UNUSED ||
          val === PinBehavior.BEHAVIOR_RESERVED ||
          val === PinBehavior.BEHAVIOR_CALL_BUTTON ||
          val === PinBehavior.BEHAVIOR_RELAY
        ) {
          continue;
        }

        let base = -1;
        if (
          val >= PinBehavior.BEHAVIOR_LAP_BASE &&
          val < PinBehavior.BEHAVIOR_SEGMENT_BASE
        ) {
          base = PinBehavior.BEHAVIOR_LAP_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_SEGMENT_BASE &&
          val < PinBehavior.BEHAVIOR_CALL_BUTTON_BASE
        ) {
          base = PinBehavior.BEHAVIOR_SEGMENT_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_CALL_BUTTON_BASE &&
          val < PinBehavior.BEHAVIOR_RELAY_BASE
        ) {
          base = PinBehavior.BEHAVIOR_CALL_BUTTON_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_RELAY_BASE &&
          val < PinBehavior.BEHAVIOR_RELAY_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_RELAY_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE &&
          val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_IN_BASE &&
          val < PinBehavior.BEHAVIOR_PIT_OUT_BASE
        ) {
          base = PinBehavior.BEHAVIOR_PIT_IN_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_OUT_BASE &&
          val < PinBehavior.BEHAVIOR_VOLTAGE_LEVEL_BASE
        ) {
          base = PinBehavior.BEHAVIOR_PIT_OUT_BASE;
        } else if (
          val >= PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE &&
          val < PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE + 1000
        ) {
          base = PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE;
        } else if (
          val >= (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE &&
          val < (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE + 1000
        ) {
          base = (PinBehavior as any).BEHAVIOR_ANALOG_LED_HEAT_LEADER_BASE;
        }

        if (base !== -1) {
          const lane = val - base;
          if (lane === deletedLaneIndex) {
            ids[i] = PinBehavior.BEHAVIOR_UNUSED;
          } else if (lane > deletedLaneIndex) {
            ids[i] = val - 1;
          }
        }
      }
    };

    const updateVoltageConfigs = (voltageConfigs?: {
      [lane: number]: number;
    }) => {
      if (!voltageConfigs) return voltageConfigs;
      const newVoltageConfigs: { [lane: number]: number } = {};
      Object.entries(voltageConfigs).forEach(([laneStr, value]) => {
        const lane = parseInt(laneStr, 10);
        if (lane < deletedLaneIndex) {
          newVoltageConfigs[lane] = value;
        } else if (lane > deletedLaneIndex) {
          newVoltageConfigs[lane - 1] = value;
        }
      });
      return newVoltageConfigs;
    };

    this.arduinoConfigs?.forEach((config) => {
      updatePinIds(config.digitalIds);
      updatePinIds(config.analogIds);
      config.voltageConfigs = updateVoltageConfigs(config.voltageConfigs);

      if (config.ledStrings) {
        config.ledStrings.forEach((ls) => {
          if (
            ls.ledLaneColorOverrides &&
            ls.ledLaneColorOverrides.length > deletedLaneIndex
          ) {
            ls.ledLaneColorOverrides.splice(deletedLaneIndex, 1);
          }

          if (ls.leds) {
            ls.leds = ls.leds.map((val) => {
              const bases = [
                RgbLedBehavior.RGB_LED_BEHAVIOR_HEAT_LEADER_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_FUEL_LEVEL_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_REFUELING_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_INDICATOR_BASE,
                RgbLedBehavior.RGB_LED_BEHAVIOR_LAP_SENSOR_BASE,
              ];
              const base = bases.find((b) => val >= b && val < b + 1000);
              if (base !== undefined) {
                const lane = val - base;
                if (lane === deletedLaneIndex) {
                  return RgbLedBehavior.RGB_LED_BEHAVIOR_UNUSED;
                } else if (lane > deletedLaneIndex) {
                  return val - 1;
                }
              }
              return val;
            });
          }
        });
      }
    });
    this.arduinoConfigs = [...this.arduinoConfigs];

    this.phidgetConfigs?.forEach((config) => {
      updatePinIds(config.digitalInIds);
      updatePinIds(config.digitalOutIds);
      updatePinIds(config.analogIds);
      config.voltageConfigs = updateVoltageConfigs(config.voltageConfigs);
    });
    this.phidgetConfigs = [...this.phidgetConfigs];
  }

  private colorDebounceTimer: any = null;

  updateLaneBackgroundColor(index: number, color: string) {
    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(
      l.entity_id,
      l.foreground_color,
      color,
      l.length,
    );

    // 1. ALWAYS sync the LED overrides live for smooth dragging
    this.arduinoConfigs?.forEach((config) => {
      config.ledStrings?.forEach((ls) => {
        if (
          ls.ledLaneColorOverrides &&
          ls.ledLaneColorOverrides.length > index
        ) {
          ls.ledLaneColorOverrides[index] = color;
        }
      });
    });

    // 2. Trigger an immediate UI refresh for the child components
    this.arduinoConfigs = [...(this.arduinoConfigs || [])];

    // 3. Debounce the heavy state capture/server saving
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
    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(
      l.entity_id,
      color,
      l.background_color,
      l.length,
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
    if (
      scale === undefined ||
      scale === null ||
      isNaN(scale) ||
      scale <= 0 ||
      scale > 1.0
    ) {
      return 1.0;
    }
    const matched = this.trackScaleOptions.find(
      (opt) => Math.abs(opt.value - scale) < 0.0001,
    );
    return matched ? matched.value : scale;
  }

  updateLaneLength(index: number, length: any) {
    const val = typeof length === "number" ? length : parseFloat(length);
    const parsedVal = isNaN(val) ? 0 : val;
    const l = this.lanes[index];
    this.lanes[index] = new Lane(
      l.entity_id,
      l.foreground_color,
      l.background_color,
      parsedVal,
    );
    this.onInputChange();
  }

  // --- Arduino Configuration ---

  addArduinoConfig() {
    this.arduinoConfigs.push({
      name: `Arduino ${this.arduinoConfigs.length + 1}`,
      commPort: "",
      baudRate: 115200,
      debounceUs: 3,
      hardwareType: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 3,
      digitalIds: [],
      analogIds: [],
      ledStrings: [],
    });
    this.arduinoConfigs = [...this.arduinoConfigs]; // Ensure reference change for Angular change detection
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  trackByArduinoConfig(index: number, _config: any): number {
    return index;
  }

  removeArduinoConfig(index: number) {
    this.arduinoConfigs.splice(index, 1);
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  addTrackmateConfig() {
    this.trackmateConfigs.push({
      name: `Trackmate ${this.trackmateConfigs.length + 1}`,
      commPort: "",
      normallyClosedRelays: true,
      normallyClosedLaneSensors: true,
      useIR: true,
      debounce: 1,
      numLanes: this.lanes.length,
      hasPerLaneRelays: false,
      lapPinPitBehavior: 3,
      lapPinBehaviors: Array(this.lanes.length)
        .fill(0)
        .map((_, i) => PinBehavior.BEHAVIOR_LAP_BASE + i),
    });
    this.trackmateConfigs = [...this.trackmateConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  removeTrackmateConfig(index: number) {
    this.trackmateConfigs.splice(index, 1);
    this.trackmateConfigs = [...this.trackmateConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  trackByTrackmateConfig(index: number, _config: any): number {
    return index;
  }

  // --- BART Configuration ---

  addBartConfig() {
    this.bartConfigs.push({
      name: `BART ${this.bartConfigs.length + 1}`,
      deviceName: "",
      deviceAddress: "",
      numLanes: this.lanes.length,
      minLapMs: 1,
      lapPinPitBehavior: 3,
      lapPinBehaviors: Array(this.lanes.length)
        .fill(0)
        .map((_, i) => PinBehavior.BEHAVIOR_LAP_BASE + i),
    });
    this.bartConfigs = [...this.bartConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  removeBartConfig(index: number) {
    this.bartConfigs.splice(index, 1);
    this.bartConfigs = [...this.bartConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  onArduinoConfigChange() {
    this.arduinoConfigs = [...this.arduinoConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  onTrackmateConfigChange() {
    this.trackmateConfigs = [...this.trackmateConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  onBartConfigChange() {
    this.bartConfigs = [...this.bartConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
  }

  trackByBartConfig(index: number, _config: any): number {
    return index;
  }

  // --- Phidget Configuration ---

  addPhidgetConfig() {
    this.phidgetConfigs.push({
      name: `Phidget ${this.phidgetConfigs.length + 1}`,
      serialNumber: -1,
      isHubPort: false,
      hubPort: 0,
      normallyClosedLaneSensors: true,
      normallyClosedRelays: true,
      useLapsForSegments: false,
      lapPinPitBehavior: 3,
      digitalInIds: Array(32).fill(0),
      digitalOutIds: Array(32).fill(0),
      analogIds: Array(16).fill(0),
    });
    this.phidgetConfigs = [...this.phidgetConfigs];
    this.captureState();
    this.initializeInterfaces();
  }

  removePhidgetConfig(index: number) {
    this.phidgetConfigs.splice(index, 1);
    this.phidgetConfigs = [...this.phidgetConfigs];
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
    this.initializeInterfaces();
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
    let counter = forceSuffix ? 1 : 0;
    const pattern = /(_\d+)$/;
    const base = (baseName || "").replace(pattern, "").trim();

    while (true) {
      const candidate = counter === 0 ? base : `${base}_${counter}`;
      if (
        !this.allTracks.some(
          (t) => t.name && t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  private autoSaveTrack() {
    this.logger.debug("autoSaveTrack triggered");
    if (!this.editingTrack) {
      this.logger.debug("autoSaveTrack: no editingTrack");
      return;
    }
    if (!this.trackName.trim() || !this.isNameUnique(true)) {
      this.logger.debug("autoSaveTrack: name invalid");
      return;
    }
    if (this.isSaving) {
      this.logger.debug("autoSaveTrack: isSaving is true");
      return;
    }
    this.logger.debug("autoSaveTrack: triggering updateTrack");
    this.updateTrack(false, true);
  }

  updateTrack(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingTrack || this.isSaving) return;
    const wasNew = isSaveAsNew || this.editingTrack.entity_id === "new";
    if (!wasNew && !this.isDirtyState()) return;

    // Validate
    if (!this.trackName.trim()) {
      if (!isAutoSave) {
        alert(this.translationService.translate("TE_ERROR_NAME_REQUIRED"));
      }
      return;
    }

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;
    this.saveTrackData(isSaveAsNew, isAutoSave);
  }

  private saveTrackData(isSaveAsNew: boolean, isAutoSave: boolean) {
    const finalTrack = this.createSnapshot();
    const wasNew = isSaveAsNew || finalTrack.entity_id === "new";

    // Inject @id for Jackson identity resolution
    const payload: any = {
      ...finalTrack,
      "@id": 1,
      lanes: finalTrack.lanes.map((l, i) => ({
        ...l,
        "@id": i + 2,
      })),
    };

    const obs = wasNew
      ? this.dataService.createTrack({ ...payload, entity_id: "new" })
      : this.dataService.updateTrack(payload.entity_id, payload);

    this.subscriptions.push(
      obs.subscribe({
        next: (result) => {
          const merged = {
            ...payload,
            ...result,
            entity_id: result?.entity_id || payload?.entity_id,
          };
          this.handleSaveSuccess(merged, wasNew, isAutoSave);
        },
        error: (err) => this.handleSaveError(err, isAutoSave),
      }),
    );
  }

  private handleSaveSuccess(result: any, wasNew: boolean, isAutoSave: boolean) {
    this.isSaving = false;
    this.isAutoSaving = false;
    if (wasNew) {
      this.isEditMode = true;
      this.isPreservingEditModeOnNavigation = true;
      this.defaultTrackName = result.name;
      this.trackName = result.name;
    } else if (!isAutoSave || this.transitionToReadOnlyOnSave) {
      this.isEditMode = false;
      this.transitionToReadOnlyOnSave = false;
    }
    this.navigationService.setLastEditedId("track", result.entity_id);

    this.editingTrack = new Track({
      entity_id: result.entity_id,
      name: result.name,
      num_track_sections: result.num_track_sections ?? 100,
      track_scale: result.track_scale ?? 1.0,
      lanes: result.lanes,
      has_digital_fuel: result.has_digital_fuel ?? false,
      arduino_configs: result.arduino_configs,
      has_per_lane_relays: result.has_per_lane_relays ?? false,
      has_main_relay: result.has_main_relay ?? false,
      trackmate_configs: result.trackmate_configs,
      phidget_configs: result.phidget_configs,
      bart_configs: result.bart_configs,
    });

    this.selectedTrack = this.cloneTrack(this.editingTrack);
    this.originalTrack = this.cloneTrack(this.editingTrack);
    this.selectedTrackId = this.editingTrack.entity_id;
    this.isDirty = false;

    // Update allTracks cache to ensure name uniqueness checks stay in sync
    const idx = this.allTracks.findIndex(
      (t) => t.entity_id === result.entity_id,
    );
    if (idx >= 0) {
      this.allTracks[idx] = this.cloneTrack(this.editingTrack);
    } else {
      this.allTracks.push(this.cloneTrack(this.editingTrack));
    }
    this.updateTrackSelectItems();

    if (!isAutoSave) {
      this.trackName = this.editingTrack.name;
    }
    this.syncSavedConfigsWithState();

    if (wasNew) {
      // Re-base the entire undo history onto the new track identity (ID and Name)
      this.undoManager.updateHistory((t) => {
        (t as any).entity_id = result.entity_id;
        (t as any).name = result.name;
        return t;
      });
    }

    if (this.editingTrack) {
      this.undoManager.resetTracking(this.createSnapshot());
    }

    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }

    if (wasNew) {
      this.focusNameInput();
    }

    if (this.navigateBackOnSave) {
      this.navigateBackOnSave = false;
      this.onBack();
    } else if (wasNew) {
      this.handleNewTrackNavigation(result.entity_id, isAutoSave);
    }

    if (this.isDirtyState()) {
      this.autoSaveTrack();
    }
  }

  private syncSavedConfigsWithState() {
    if (!this.editingTrack) return;
    const newLanesJson = JSON.stringify(this.editingTrack.lanes);
    if (newLanesJson !== JSON.stringify(this.lanes)) {
      this.lanes = this.editingTrack.lanes.map(
        (l) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      );
    }
    this.syncInterfaceConfigsFromTrack(this.editingTrack);
  }

  private handleSaveError(err: any, isAutoSave: boolean) {
    this.logger.error("Failed to save track", err);
    if (!this.isDestroyed && !isAutoSave) {
      if (err?.status === 409) {
        alert(this.translationService.translate("TE_ERROR_NAME_EXISTS"));
      } else {
        alert(this.translationService.translate("TE_ERROR_SAVE_FAILED"));
      }
    }
    this.isSaving = false;
    this.isAutoSaving = false;
  }

  private handleNewTrackNavigation(newId: string, isAutoSave: boolean) {
    if (isAutoSave) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/track-editor"], {
          queryParams: {
            id: newId,
            from: this.route.snapshot.queryParamMap.get("from"),
            returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
          },
        }),
      );
      this.location.replaceState(url);
    } else {
      this.router.navigate(["/track-editor"], {
        queryParams: {
          id: newId,
          from: this.route.snapshot.queryParamMap.get("from"),
          returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
        },
        replaceUrl: true,
      });
    }
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
