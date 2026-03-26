import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DataService } from '../../data.service';
import { Track } from '../../models/track';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { HelpService, GuideStep } from '../../services/help.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-track-manager',
  templateUrl: './track-manager.component.html',
  styleUrls: ['./track-manager.component.css'],
  standalone: false
})
export class TrackManagerComponent implements OnInit {
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
    private settingsService: SettingsService
  ) { }

  toggleLaneSummary() {
    this.isLaneSummaryExpanded = !this.isLaneSummaryExpanded;
  }

  ngOnInit() {
    this.updateScale();
    this.loadTracks();

    // Trigger help automatically on first visit or if requested via query param
    this.route.queryParams.subscribe(params => {
      const forceHelp = params['help'] === 'true';
      const settings = this.settingsService.getSettings();
      if (forceHelp || !settings.trackManagerHelpShown) {
        setTimeout(() => {
          this.startHelp();
          if (!forceHelp) {
            settings.trackManagerHelpShown = true;
            this.settingsService.saveSettings(settings);
          }
        }, 500); // Small delay to ensure view is ready
      }
    });
  }

  startHelp() {
    const steps: GuideStep[] = [
      {
        title: this.translationService.translate('TM_HELP_WELCOME_TITLE'),
        content: this.translationService.translate('TM_HELP_WELCOME_CONTENT'),
        position: 'center'
      },
      {
        selector: '.sidebar-list',
        title: this.translationService.translate('TM_HELP_SIDEBAR_TITLE'),
        content: this.translationService.translate('TM_HELP_SIDEBAR_CONTENT'),
        position: 'right'
      },
      {
        selector: '.detail-content',
        title: this.translationService.translate('TM_HELP_DETAIL_TITLE'),
        content: this.translationService.translate('TM_HELP_DETAIL_CONTENT'),
        position: 'left'
      },
      {
        selector: '#edit-track-btn',
        title: this.translationService.translate('TM_HELP_EDIT_TITLE'),
        content: this.translationService.translate('TM_HELP_EDIT_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#add-item-btn',
        title: this.translationService.translate('TM_HELP_CREATE_TITLE'),
        content: this.translationService.translate('TM_HELP_CREATE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#delete-track-btn',
        title: this.translationService.translate('TM_HELP_DELETE_TITLE'),
        content: this.translationService.translate('TM_HELP_DELETE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#help-track-btn',
        title: this.translationService.translate('TM_HELP_HELP_TITLE'),
        content: this.translationService.translate('TM_HELP_HELP_CONTENT'),
        position: 'bottom'
      }
    ];
    this.helpService.startGuide(steps);
  }

  @HostListener('window:resize')
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
        this.tracks = data.map(t => new Track(t.entity_id, t.name, t.lanes || [], t.has_digital_fuel ?? false, t.arduino_configs));
        if (this.tracks.length > 0) {
          const queryId = this.route.snapshot.queryParamMap.get('selectedId');
          if (queryId) {
            const found = this.tracks.find(t => t.entity_id === queryId);
            this.selectedTrack = found || this.tracks[0];
          } else if (this.selectedTrack) {
            // Maintain existing selection
            const found = this.tracks.find(t => t.entity_id === this.selectedTrack!.entity_id);
            this.selectedTrack = found || this.tracks[0];
          } else {
            this.selectedTrack = this.tracks[0];
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load tracks', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectTrack(track: Track) {
    this.selectedTrack = track;
  }

  editTrack() {
    if (!this.selectedTrack) return;
    this.router.navigate(['/track-editor'], { queryParams: { id: this.selectedTrack.entity_id } });
  }

  createNewTrack() {
    if (this.isSaving) return;
    this.isSaving = true;

    this.dataService.getTrackFactorySettings().subscribe({
      next: (factoryTrack) => {
        const baseName = this.translationService.translate('TM_DEFAULT_TRACK_NAME');
        const uniqueName = this.generateUniqueName(baseName);

        const newTrack = {
          ...factoryTrack,
          name: uniqueName,
          entity_id: 'new'
        };

        this.dataService.createTrack(newTrack).subscribe({
          next: (createdTrack) => {
            this.isSaving = false;
            this.router.navigate(['/track-editor'], { queryParams: { id: createdTrack.entity_id } });
          },
          error: (err) => {
            console.error('Failed to create new track', err);
            this.isSaving = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to get factory settings', err);
        this.isSaving = false;
      }
    });
  }

  private generateUniqueName(baseName: string): string {
    let name = baseName;
    if (!this.tracks.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      return name;
    }

    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (!this.tracks.some(t => t.name.toLowerCase() === candidate.toLowerCase())) {
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
        console.error('Failed to delete track', err);
        this.isSaving = false;
      }
    });
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }

  onBack() {
    this.router.navigate(['/raceday-setup']);
  }


}
