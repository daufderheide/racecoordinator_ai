import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationModalComponent } from "@app/components/shared/confirmation-modal/confirmation-modal.component";
import { ManagerHeaderComponent } from "@app/components/shared/manager-header/manager-header.component";
import { ManagerHeaderComponent as ManagerHeaderComponent_1 } from "@app/components/shared/manager-header/manager-header.component";
import { DataService } from "@app/data.service";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { GuideStep, HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
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
export class TrackManagerComponent implements OnInit {
  @ViewChild(ManagerHeaderComponent) header!: ManagerHeaderComponent;
  tracks: Track[] = [];
  selectedTrack?: Track;
  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;
  showDeleteConfirm: boolean = false;
  isLaneSummaryExpanded = true;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private helpService: HelpService,
    private settingsService: SettingsService,
    private logger: LoggerService,
  ) {}

  toggleLaneSummary() {
    this.isLaneSummaryExpanded = !this.isLaneSummaryExpanded;
  }

  ngOnInit() {
    this.updateScale();
    this.loadTracks();
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

  editTrack() {
    if (!this.selectedTrack) return;
    this.router.navigate(["/track-editor"], {
      queryParams: { id: this.selectedTrack.entity_id },
    });
  }

  createNewTrack() {
    if (this.isSaving) return;
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
              queryParams: { id: createdTrack.entity_id },
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

  onBack() {
    this.router.navigate(["/raceday-setup"]);
  }
}
