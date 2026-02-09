import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { DataService } from '../../data.service';
import { Track } from '../../models/track';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

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

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.updateScale();
    this.loadTracks();
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
        this.tracks = data.map(t => new Track(t.entity_id, t.name, t.lanes || [], t.arduino_config));
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
    this.router.navigate(['/track-editor'], { queryParams: { id: 'new' } });
  }

  deleteTrack() {
    if (!this.selectedTrack) return;
    if (confirm(this.translationService.translate('TM_CONFIRM_DELETE'))) {
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
  }

  onBack() {
    this.router.navigate(['/raceday-setup']);
  }


}
