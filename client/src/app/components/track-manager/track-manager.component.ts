import {
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { ManagerHeaderComponent as ManagerHeaderComponent_1 } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import { Track } from "@app/models/track";
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

import { ArduinoSummaryComponent } from "./arduino-summary/arduino-summary.component";

@Component({
  standalone: true,
  selector: "app-track-manager",
  templateUrl: "./track-manager.component.html",
  styleUrls: ["./track-manager.component.css"],
  imports: [
    ConfirmationModalComponent,
    ManagerHeaderComponent_1,
    ArduinoSummaryComponent,
    TranslatePipe,
  ],
})
export class TrackManagerComponent implements OnInit, OnDestroy {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  tracks: Track[] = [];
  selectedTrack?: Track;
  scale: number = 1;
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.queryParams);

  backTargetUrl = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    const returnUrl =
      p?.["returnUrl"] || this.route.snapshot.queryParamMap.get("returnUrl");
    if (from === "modify-heats") {
      return returnUrl || "/default-raceday";
    }
    return "/raceday-setup";
  });

  backQueryParams = computed(() => {
    const p = this.params();
    const from = p?.["from"] || this.route.snapshot.queryParamMap.get("from");
    return from === "modify-heats" ? { modifyHeats: "true" } : {};
  });
  isLoading: boolean = true;
  isSaving: boolean = false;
  showDeleteConfirm: boolean = false;
  isLaneSummaryExpanded = true;

  // Race State
  isRaceRunning: boolean = false;
  showTrackEditorPrompt: boolean = false;
  pendingTrackAction: "edit" | "create" | null = null;

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private connectionMonitor: ConnectionMonitorService,
    private raceConnectionService: RaceConnectionService,
    private helpService: HelpService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {}

  toggleLaneSummary() {
    this.isLaneSummaryExpanded = !this.isLaneSummaryExpanded;
  }

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadTracks();
    this.raceConnectionService.connect();

    this.dataService.getSystemState().subscribe((state) => {
      if (state) {
        this.isRaceRunning = state.resourceLockState === "RACE_RUNNING";
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.raceConnectionService.disconnect();
    this.connectionMonitor.stopMonitoring();
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  getHelpSteps(): GuideStep[] {
    return [
      {
        title: this.translationService.translate("TM_HELP_WELCOME_TITLE"),
        content: this.translationService.translate("TM_HELP_WELCOME_CONTENT"),
        position: "center",
      },
      {
        selector: ".sidebar-list",
        title: this.translationService.translate("TM_HELP_SIDEBAR_TITLE"),
        content: this.translationService.translate("TM_HELP_SIDEBAR_CONTENT"),
        position: "right",
      },
      {
        selector: ".detail-content",
        title: this.translationService.translate("TM_HELP_DETAIL_TITLE"),
        content: this.translationService.translate("TM_HELP_DETAIL_CONTENT"),
        position: "left",
      },
    ];
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
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

  loadTracks() {
    this.isLoading = true;
    this.dataService.getTracks().subscribe({
      next: (data) => {
        this.tracks = data.map(
          (t) =>
            new Track(
              t.entity_id,
              t.name,
              t.num_track_sections ?? 100,
              t.lanes || [],
              t.has_digital_fuel ?? false,
              t.arduino_configs,
            ),
        );
        if (this.tracks.length > 0) {
          const queryId = this.route.snapshot.queryParamMap.get("selectedId");
          if (queryId) {
            const found = this.tracks.find((t) => t.entity_id === queryId);
            this.selectedTrack = found || this.tracks[0];
          } else if (this.selectedTrack) {
            // Maintain existing selection
            const found = this.tracks.find(
              (t) => t.entity_id === this.selectedTrack!.entity_id,
            );
            this.selectedTrack = found || this.tracks[0];
          } else {
            this.selectedTrack = this.tracks[0];
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.logger.error("Failed to load tracks", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectTrack(track: Track) {
    this.selectedTrack = track;
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

  editTrack() {
    if (!this.selectedTrack) return;
    if (this.isRaceRunning) {
      this.pendingTrackAction = "edit";
      this.showTrackEditorPrompt = true;
      this.cdr.detectChanges();
      return;
    }
    this.proceedWithEditTrack();
  }

  private proceedWithEditTrack() {
    this.router.navigate(["/track-editor"], {
      queryParams: {
        id: this.selectedTrack!.entity_id,
        from: this.route.snapshot.queryParamMap.get("from"),
        returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
      },
    });
  }

  createNewTrack() {
    if (this.isSaving) return;
    if (this.isRaceRunning) {
      this.pendingTrackAction = "create";
      this.showTrackEditorPrompt = true;
      this.cdr.detectChanges();
      return;
    }
    this.proceedWithCreateTrack();
  }

  private proceedWithCreateTrack() {
    this.isSaving = true;

    this.dataService.getTrackFactorySettings().subscribe({
      next: (factoryTrack) => {
        const baseName = this.translationService.translate(
          "TM_DEFAULT_TRACK_NAME",
        );
        const uniqueName = this.generateUniqueName(baseName);

        const newTrack = {
          ...factoryTrack,
          name: uniqueName,
          entity_id: "new",
        };

        this.dataService.createTrack(newTrack).subscribe({
          next: (createdTrack) => {
            this.isSaving = false;
            this.router.navigate(["/track-editor"], {
              queryParams: {
                id: createdTrack.entity_id,
                from: this.route.snapshot.queryParamMap.get("from"),
                returnUrl: this.route.snapshot.queryParamMap.get("returnUrl"),
              },
            });
          },
          error: (err) => {
            this.logger.error("Failed to create new track", err);
            this.isSaving = false;
          },
        });
      },
      error: (err) => {
        this.logger.error("Failed to get factory settings", err);
        this.isSaving = false;
      },
    });
  }

  onConfirmTrackEditor() {
    this.showTrackEditorPrompt = false;
    this.dataService.endRace().subscribe({
      next: (success) => {
        if (success) {
          this.logger.info(
            "Race ended successfully, proceeding to track editor",
          );
          if (this.pendingTrackAction === "edit") {
            this.proceedWithEditTrack();
          } else if (this.pendingTrackAction === "create") {
            this.proceedWithCreateTrack();
          }
        } else {
          this.logger.warn("Failed to end race");
        }
        this.pendingTrackAction = null;
      },
      error: (err) => {
        this.logger.error("Error ending race", err);
        this.pendingTrackAction = null;
      },
    });
  }

  onCancelTrackEditor() {
    this.showTrackEditorPrompt = false;
    this.pendingTrackAction = null;
  }

  private generateUniqueName(baseName: string): string {
    let name = baseName;
    if (!this.tracks.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return name;
    }

    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (
        !this.tracks.some(
          (t) => t.name.toLowerCase() === candidate.toLowerCase(),
        )
      ) {
        return candidate;
      }
      counter++;
    }
  }

  deleteTrack() {
    if (!this.selectedTrack) return;
    this.showDeleteConfirm = true;
  }

  onConfirmDelete() {
    this.showDeleteConfirm = false;
    if (!this.selectedTrack) return;
    this.isSaving = true;
    this.dataService.deleteTrack(this.selectedTrack.entity_id).subscribe({
      next: () => {
        this.selectedTrack = undefined;
        this.isSaving = false;
        this.loadTracks();
      },
      error: (err) => {
        this.logger.error("Failed to delete track", err);
        this.isSaving = false;
      },
    });
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }
}
