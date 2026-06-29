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
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { InputDialogComponent } from "@app/components/shared/input-dialog/input-dialog.component";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { ArduinoEditorComponent } from "@app/components/track-editor/arduino-editor/arduino-editor.component";
import { TrakmateEditorComponent } from "@app/components/track-editor/trakmate-editor/trakmate-editor.component";
import { DataService } from "@app/data.service";
import { DirtyComponent } from "@app/interfaces/dirty-component";
import { Lane } from "@app/models/lane";
import {
  ArduinoConfig,
  LedString,
  MAX_ANALOG_PINS,
  MAX_DIGITAL_PINS,
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
import { RaceConnectionService } from "@app/services/race-connection.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";

@Component({
  standalone: true,
  selector: "app-track-editor",
  templateUrl: "./track-editor.component.html",
  styleUrls: ["./track-editor.component.css"],
  imports: [
    EditorTitleComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ArduinoEditorComponent,
    TrakmateEditorComponent,
    InputDialogComponent,
    TranslatePipe,
    ConfirmationModalComponent,
  ],
})
export class TrackEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  isNavigationApproved = false;
  showDiscardConfirm = false;
  private pendingDeactivate: ((value: boolean) => void) | null = null;
  private isReverting = false;
  @ViewChild(EditorTitleComponent) titleComponent!: EditorTitleComponent;
  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  trackName: string = "";
  numTrackSections: number = 100;
  lanes: Lane[] = [];
  editingTrack?: Track;
  arduinoConfigs: ArduinoConfig[] = [];
  trackmateConfigs: TrackmateConfig[] = [];
  helpSteps: GuideStep[] = [];

  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isAutoSaving: boolean = false;
  public navigateBackOnSave = false;

  undoManager!: UndoManager<Track>;
  allTracks: Track[] = [];

  @ViewChildren(ArduinoEditorComponent)
  arduinoEditors!: QueryList<ArduinoEditorComponent>;
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
    private logger: LoggerService,
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
            this.cdr.detectChanges();
          }
        },
      },
      () => this.createSnapshot(),
    );
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
          console.log("DEBUG track-editor router.url:", this.router?.url);
          const isEditorRoute =
            !this.router.url ||
            this.router.url === "/" ||
            this.router.url.startsWith("/track-editor") ||
            this.router.url.includes("mock");
          if (!isEditorRoute) {
            return;
          }
          const nextId = paramMap.get("id");
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
          setTimeout(() => {
            this.ensureSectionsExpandedForHelp();
            this.updateHelpSteps();
          });
        }
      }),
    );

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
    this.subscriptions.push(
      this.dataService.closeInterface().subscribe({
        next: () => this.logger.debug("Interface closed successfully"),
        error: (err) => this.logger.error("Error closing interface", err),
      }),
    );
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
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
    const idParam = this.route.snapshot.queryParamMap.get("id");
    if (!idParam) {
      this.router.navigate(["/track-manager"]);
      return;
    }

    this.isLoading = true;
    this.subscriptions.push(
      this.dataService.getTracks().subscribe({
        next: (tracks) => {
          this.allTracks = tracks;

          if (idParam === "new") {
            // Fetch factory settings from server
            this.subscriptions.push(
              this.dataService.getTrackFactorySettings().subscribe({
                next: (factoryTrack) => {
                  this.editingTrack = new Track(
                    "new",
                    this.translationService.translate("TM_DEFAULT_TRACK_NAME"),
                    factoryTrack.num_track_sections || 100,
                    factoryTrack.lanes.map(
                      (l: any) =>
                        new Lane(
                          this.generateId(),
                          l.foreground_color,
                          l.background_color,
                          l.length,
                        ),
                    ),
                    false,
                    factoryTrack.arduino_configs,
                  );
                  this.initializeEditingState();
                },
                error: (err) => {
                  this.logger.error("Failed to load factory settings", err);
                  // Fallback default
                  this.editingTrack = new Track(
                    "new",
                    "",
                    100,
                    [
                      new Lane(this.generateId(), "#ef4444", "black", 100),
                      new Lane(this.generateId(), "#ffffff", "black", 100),
                    ],
                    false,
                  );
                  this.initializeEditingState();
                },
              }),
            );
            return; // Wait for factory settings
          } else {
            const found = tracks.find((t) => t.entity_id === idParam);
            if (found) {
              // Deep copy for editing
              this.editingTrack = this.cloneTrack(found);
            } else {
              this.logger.error("Track not found");
              this.router.navigate(["/track-manager"]);
              return;
            }
          }

          this.initializeEditingState();
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

  private initializeEditingState() {
    if (this.editingTrack) {
      // Restore Arduino Config
      if (
        this.editingTrack.arduino_configs &&
        this.editingTrack.arduino_configs.length > 0
      ) {
        this.arduinoConfigs = JSON.parse(
          JSON.stringify(this.editingTrack.arduino_configs),
        );
        // Ensure arrays exist
        for (let config of this.arduinoConfigs) {
          if (!config.digitalIds)
            config.digitalIds = new Array(MAX_DIGITAL_PINS).fill(-1);
          if (!config.analogIds)
            config.analogIds = new Array(MAX_ANALOG_PINS).fill(-1);
          if (!config.ledStrings) config.ledStrings = [];
          if (!config.voltageConfigs) config.voltageConfigs = {};

          // Ensure LedString sub-properties exist
          for (let ls of config.ledStrings) {
            if (!ls.leds) ls.leds = [];
            if (!ls.ledLaneColorOverrides) ls.ledLaneColorOverrides = [];
          }
        }
      } else {
        this.arduinoConfigs = [];
      }

      // Restore Trakmate Config
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

      this.trackName = this.editingTrack.name;
      this.numTrackSections = this.editingTrack.num_track_sections;
      this.lanes = [...this.editingTrack.lanes];

      // Now initialize tracking with a fully populated model
      this.undoManager.initialize(this.editingTrack);
    } else {
      this.editingTrack = new Track("new", "", 100, [], false);
      this.trackName = "";
      this.numTrackSections = 100;
      this.lanes = [];
      this.arduinoConfigs = [];
      this.trackmateConfigs = [];
      this.undoManager.initialize(this.editingTrack);
    }

    this.isLoading = false;
    this.updateHelpSteps();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }

    // Initialize all interfaces on the server
    this.initializeInterfaces();
  }

  private initializeInterfaces() {
    if (this.arduinoConfigs.length > 0 || this.trackmateConfigs.length > 0) {
      this.dataService
        .initializeInterface(
          this.arduinoConfigs,
          this.trackmateConfigs,
          this.lanes.length,
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
    return new Track(
      track.entity_id,
      track.name,
      track.num_track_sections,
      lanesCopy,
      track.has_digital_fuel,
      arduinoCopy,
      trackmateCopy,
    );
  }

  private createSnapshot(): Track {
    if (!this.editingTrack) {
      return new Track("new", "", 100, [], false);
    }
    const configs = this.arduinoConfigs ? deepCopy(this.arduinoConfigs) : [];
    const tmConfigs = this.trackmateConfigs
      ? deepCopy(this.trackmateConfigs)
      : [];
    return new Track(
      this.editingTrack.entity_id,
      this.trackName,
      this.numTrackSections,
      this.lanes.map(
        (l) =>
          new Lane(
            l.entity_id,
            l.foreground_color,
            l.background_color,
            l.length,
          ),
      ),
      this.editingTrack.has_digital_fuel,
      configs,
      tmConfigs,
    );
  }

  private areTracksEqual(t1: Track, t2: Track): boolean {
    if (
      t1.name !== t2.name ||
      t1.num_track_sections !== t2.num_track_sections
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
    const acs1 = t1.arduino_configs || [];
    const acs2 = t2.arduino_configs || [];
    if (acs1.length !== acs2.length) {
      return false;
    }

    for (let c = 0; c < acs1.length; c++) {
      const ac1 = acs1[c];
      const ac2 = acs2[c];

      // Robust comparison of ArduinoConfig fields
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

    // Check Trackmate Configs equality
    const tcs1 = t1.trackmate_configs || [];
    const tcs2 = t2.trackmate_configs || [];
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
    return this.undoManager?.hasChanges() || false;
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

  updateHelpSteps() {
    const steps: GuideStep[] = [
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
        position: "left",
      },
    ];

    // Add Arduino help steps if there are any configured
    if (this.arduinoConfigs?.length > 0 && this.arduinoEditors?.length > 0) {
      // Collect steps from the first Arduino editor
      const firstArduino = this.arduinoEditors.first;
      if (firstArduino) {
        steps.push(...firstArduino.getHelpSteps());
      }
    }

    this.helpSteps = steps;
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

    // Add Arduino help steps if there are any configured
    if (this.arduinoConfigs?.length > 0) {
      // Ensure interfaces section is expanded
      if (this.sectionsExpanded && !this.sectionsExpanded.interfaces) {
        this.sectionsExpanded.interfaces = true;
        changed = true;
      }
    }

    if (changed && !this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  startHelp() {
    this.updateHelpSteps();
    this.helpService.startGuide(this.helpSteps);
  }

  onInputFocus() {
    this.undoManager.onInputFocus();
  }
  onInputChange() {
    this.undoManager.onInputChange();
  }
  onInputBlur() {
    this.undoManager.onInputBlur();
    this.cdr.detectChanges();
  }
  captureState() {
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
    this.updateArduinoConfigsOnLaneDeletion(index);
    this.captureState();
  }

  onLaneDropped(event: CdkDragDrop<Lane[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.lanes, event.previousIndex, event.currentIndex);
      this.lanes = [...this.lanes]; // Trigger change detection

      // Update Arduino configs to match new lane order
      this.updateArduinoConfigsOnLaneOrderChange(
        event.previousIndex,
        event.currentIndex,
      );

      this.captureState();
    }
  }

  /* eslint-disable max-lines-per-function */
  private updateArduinoConfigsOnLaneOrderChange(
    prevIndex: number,
    currIndex: number,
  ) {
    /* eslint-disable max-lines-per-function */
    this.arduinoConfigs.forEach((config) => {
      // Helper to update pin IDs
      const updatePinIds = (ids: number[]) => {
        if (!ids) return;
        for (let i = 0; i < ids.length; i++) {
          const val = ids[i];
          // TODO(aufderheide): Remove the absolute paths here and replace with imports
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

      updatePinIds(config.digitalIds);
      updatePinIds(config.analogIds);

      // Shift voltageConfigs
      if (config.voltageConfigs) {
        const newVoltageConfigs: { [lane: number]: number } = {};
        Object.entries(config.voltageConfigs).forEach(([laneStr, value]) => {
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
        config.voltageConfigs = newVoltageConfigs;
      }

      // Shift ledLaneColorOverrides and update behaviors for each LedString
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
  }

  private updateArduinoConfigsOnLaneDeletion(deletedLaneIndex: number) {
    this.arduinoConfigs.forEach((config) => {
      // Helper to update pin IDs
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

      updatePinIds(config.digitalIds);
      updatePinIds(config.analogIds);

      // Shift voltageConfigs
      if (config.voltageConfigs) {
        const newVoltageConfigs: { [lane: number]: number } = {};
        Object.entries(config.voltageConfigs).forEach(([laneStr, value]) => {
          const lane = parseInt(laneStr, 10);
          if (lane < deletedLaneIndex) {
            newVoltageConfigs[lane] = value;
          } else if (lane > deletedLaneIndex) {
            newVoltageConfigs[lane - 1] = value;
          }
          // if lane === deletedLaneIndex, it's just omitted
        });
        config.voltageConfigs = newVoltageConfigs;
      }

      // Shift ledLaneColorOverrides and update behaviors for each LedString
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

    this.arduinoConfigs = [...this.arduinoConfigs]; // Trigger change detection
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

  updateLaneLength(index: number, length: any) {
    const val = parseInt(length, 10);
    const l = this.lanes[index];
    this.lanes[index] = new Lane(
      l.entity_id,
      l.foreground_color,
      l.background_color,
      val,
    );
    this.onInputChange();
  }

  // --- Arduino Configuration ---

  addArduinoConfig() {
    this.arduinoConfigs.push({
      name: `Arduino ${this.arduinoConfigs.length + 1}`,
      commPort: "",
      baudRate: 9600,
      debounceUs: 3,
      hardwareType: 0,
      normallyClosedLaneSensors: false,
      normallyClosedRelays: false,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: false,
      useLapsForSegments: false,
      lapPinPitBehavior: 0,
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

  saveAsNew() {
    this.trackName = this.generateUniqueName(this.trackName);
    this.updateTrack(true);
  }

  private generateUniqueName(baseName: string): string {
    let _name = baseName;
    let counter = 1;

    // We always want to append at least _1 if we are saving as new to avoid collision with self
    // and to follow the requirement "generate based on the old name with an _# at the end"
    const pattern = /(_\d+)$/;
    const base = baseName.replace(pattern, "");

    // Try appending _1, _2, etc.
    while (true) {
      const candidate = `${base}_${counter}`;
      if (
        !this.allTracks.some(
          (t) => t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  private autoSaveTrack() {
    if (!this.editingTrack) return;
    if (!this.trackName.trim() || !this.isNameUnique(true)) return;
    if (this.isSaving) return;
    this.updateTrack(false, true);
  }

  /* eslint-disable max-lines-per-function */
  updateTrack(isSaveAsNew: boolean = false, isAutoSave: boolean = false) {
    if (!this.editingTrack) return;

    // Validate
    if (!this.trackName.trim()) {
      if (!isAutoSave)
        alert(this.translationService.translate("TE_ERROR_NAME_REQUIRED"));
      return;
    }

    this.isSaving = true;
    this.isAutoSaving = isAutoSave;

    // Construct payload
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
          this.isSaving = false;
          this.isAutoSaving = false;
          // Update local state with result (especially ID)
          this.editingTrack = new Track(
            result.entity_id,
            result.name,
            result.num_track_sections ?? 100,
            result.lanes,
            result.has_digital_fuel ?? false,
            result.arduino_configs,
          );

          // Update allTracks cache to ensure name uniqueness checks stay in sync
          const idx = this.allTracks.findIndex(
            (t) => t.entity_id === result.entity_id,
          );
          if (idx >= 0) {
            this.allTracks[idx] = this.editingTrack;
          } else {
            this.allTracks.push(this.editingTrack);
          }

          // Sync local UI state with server result to ensure clean state matches
          this.trackName = this.editingTrack.name;
          // Only update lanes if they changed, to avoid triggering child effects unnecessarily
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

          if (
            this.editingTrack.arduino_configs &&
            this.editingTrack.arduino_configs.length > 0
          ) {
            const newConfigsJson = JSON.stringify(
              this.editingTrack.arduino_configs,
            );
            if (newConfigsJson !== JSON.stringify(this.arduinoConfigs)) {
              this.arduinoConfigs = JSON.parse(newConfigsJson);
            }
          } else {
            if (this.arduinoConfigs.length > 0) {
              this.arduinoConfigs = [];
            }
          }

          if (wasNew) {
            // Re-base the entire undo history onto the new track identity (ID and Name)
            // so that undoing doesn't take us back to the old ID or Name.
            this.undoManager.updateHistory((t) => {
              (t as any).entity_id = result.entity_id;
              (t as any).name = result.name;
              return t;
            });
          }

          if (this.editingTrack) {
            this.undoManager.resetTracking(this.createSnapshot());
          }

          // Force sync with UI and children (especially back-button confirm input)
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }

          if (this.navigateBackOnSave) {
            this.onBack();
          } else if (wasNew) {
            if (isAutoSave) {
              const url = this.router.serializeUrl(
                this.router.createUrlTree(["/track-editor"], {
                  queryParams: {
                    id: result.entity_id,
                    from: this.route.snapshot.queryParamMap.get("from"),
                    returnUrl:
                      this.route.snapshot.queryParamMap.get("returnUrl"),
                  },
                }),
              );
              this.location.replaceState(url);
            } else {
              this.router.navigate(["/track-editor"], {
                queryParams: {
                  id: result.entity_id,
                  from: this.route.snapshot.queryParamMap.get("from"),
                  returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
                },
                replaceUrl: true,
              });
            }
          } else {
            // If not wasNew, we still check navigateBackOnSave (which we did above)
            // The old code had no specific else for wasNew
          }
        },
        error: (err) => {
          this.logger.error("Failed to save track", err);
          if (!this.isDestroyed) {
            if (err.status === 409) {
              if (!isAutoSave)
                alert(
                  this.translationService.translate("TE_ERROR_NAME_EXISTS"),
                );
            } else {
              if (!isAutoSave)
                alert(
                  this.translationService.translate("TE_ERROR_SAVE_FAILED"),
                );
            }
          }
          this.isSaving = false;
          this.isAutoSaving = false;
        },
      }),
    );
  }

  get isNameInvalid(): boolean {
    if (this.isLoading) return false;
    return !this.trackName.trim() || !this.isNameUnique(true);
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.trackName) return false;
    const name = this.trackName.trim().toLowerCase();
    return !this.allTracks.some((t) => {
      if (
        excludeSelf &&
        this.editingTrack &&
        t.entity_id === this.editingTrack.entity_id
      ) {
        return false;
      }
      return t.name && t.name.toLowerCase() === name;
    });
  }

  onBack() {
    this.isNavigationApproved = true;
    this.router.navigate(["/track-manager"], {
      queryParams: {
        selectedId: this.editingTrack?.entity_id,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  trackByLane(index: number, lane: Lane): string {
    return lane.entity_id;
  }
}
