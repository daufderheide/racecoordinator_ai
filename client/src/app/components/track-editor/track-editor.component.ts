import { Component, OnInit, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { DataService } from '../../data.service';
import { Track } from '../../models/track';
import { Lane } from '../../models/lane';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';

@Component({
  selector: 'app-track-editor',
  templateUrl: './track-editor.component.html',
  styleUrls: ['./track-editor.component.css'],
  standalone: false
})
export class TrackEditorComponent implements OnInit, OnDestroy {
  trackName: string = '';
  lanes: Lane[] = [];
  editingTrack?: Track;

  scale: number = 1;
  isLoading: boolean = true;
  isSaving: boolean = false;

  undoManager!: UndoManager<Track>;
  allTracks: Track[] = [];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    public translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.undoManager = new UndoManager<Track>(
      {
        clonner: (t) => this.cloneTrack(t),
        equalizer: (a, b) => this.areTracksEqual(a, b),
        applier: (t) => {
          // Preserve context ID safe-guard
          const currentId = this.editingTrack?.entity_id;
          this.editingTrack = t;
          if (currentId && this.editingTrack) {
            // In case we are editing an existing track, we want to keep the ID unless explicitly discarded?
            // Actually, applier usually sets the whole state.
            // But if we switched from new -> saved, the ID changes appropriately outside.
            // If we undo to a state where ID was different? Not likely in this flow.
            // Just ensure we update local bound variables
            this.trackName = this.editingTrack.name;
            this.lanes = [...this.editingTrack.lanes];
          }
        }
      },
      () => this.createSnapshot()
    );
  }

  ngOnInit() {
    this.updateScale();
    this.loadData();
  }

  ngOnDestroy() {
    this.undoManager.destroy();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
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
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (!idParam) {
      this.router.navigate(['/track-manager']);
      return;
    }

    this.isLoading = true;
    this.dataService.getTracks().subscribe({
      next: (tracks) => {
        this.allTracks = tracks;

        if (idParam === 'new') {
          // Default new track
          this.editingTrack = new Track('new', '', [
            new Lane(this.generateId(), '#ef4444', 'black', 100),
            new Lane(this.generateId(), '#ffffff', 'black', 100)
          ]);
        } else {
          const found = tracks.find(t => t.entity_id === idParam);
          if (found) {
            // Deep copy for editing
            this.editingTrack = this.cloneTrack(found);
          } else {
            console.error('Track not found');
            this.router.navigate(['/track-manager']);
            return;
          }
        }

        if (this.editingTrack) {
          this.trackName = this.editingTrack.name;
          this.lanes = [...this.editingTrack.lanes];
          this.undoManager.initialize(this.editingTrack);
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

  // Helper for generating local IDs for new lanes if needed
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private cloneTrack(track: Track): Track {
    const lanesCopy = track.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));
    return new Track(track.entity_id, track.name, lanesCopy);
  }

  get isDirty(): boolean {
    return this.undoManager.hasChanges();
  }

  private createSnapshot(): Track {
    if (!this.editingTrack) {
      throw new Error("No track being edited");
    }
    return new Track(
      this.editingTrack.entity_id,
      this.trackName,
      this.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length))
    );
  }

  private areTracksEqual(t1: Track, t2: Track): boolean {
    if (t1.name !== t2.name) return false;
    if (t1.lanes.length !== t2.lanes.length) return false;
    for (let i = 0; i < t1.lanes.length; i++) {
      const l1 = t1.lanes[i];
      const l2 = t2.lanes[i];
      if (l1.entity_id !== l2.entity_id) return false; // Rough check, assuming order matters
      if (l1.background_color !== l2.background_color) return false;
      if (l1.foreground_color !== l2.foreground_color) return false;
      if (l1.length !== l2.length) return false;
    }
    return true;
  }

  // Undo/Redo Proxies
  undo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.undo();
    // View needs to update from the restored state
    // The applier updates editingTrack, but we need to sync local bound vars
    // (This logic is actually in the applier I defined in constructor)
  }
  redo() {
    clearTimeout(this.colorDebounceTimer);
    this.colorDebounceTimer = null;
    this.undoManager.redo();
  }
  hasChanges() { return this.undoManager.hasChanges(); }

  onInputFocus() { this.undoManager.onInputFocus(); }
  onInputChange() {
    // Update the underlying model temporarily so captureState works?
    // Actually captureState calls createSnapshot which reads this.trackName/this.lanes
    // So we just need to ensure those are up to date (Angular binding does this).
    this.undoManager.onInputChange();
  }
  onInputBlur() { this.undoManager.onInputBlur(); }
  captureState() { this.undoManager.captureState(); }

  // Lane Management
  addLane() {
    this.captureState();
    this.lanes.push(new Lane(this.generateId(), '#ffffff', 'black', 100)); // Default white lane
  }

  removeLane(index: number) {
    this.captureState();
    this.lanes.splice(index, 1);
  }

  private colorDebounceTimer: any = null;

  updateLaneBackgroundColor(index: number, color: string) {
    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, l.foreground_color, color, l.length);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
    }, 400);
  }

  updateLaneForegroundColor(index: number, color: string) {
    if (!this.colorDebounceTimer) {
      this.captureState();
    }
    clearTimeout(this.colorDebounceTimer);

    // Update live
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, color, l.background_color, l.length);

    this.colorDebounceTimer = setTimeout(() => {
      this.colorDebounceTimer = null;
    }, 400);
  }

  updateLaneLength(index: number, length: any) {
    this.captureState();
    const val = parseInt(length, 10);
    const l = this.lanes[index];
    this.lanes[index] = new Lane(l.entity_id, l.foreground_color, l.background_color, val);
  }

  saveAsNew() {
    this.updateTrack(true);
  }

  updateTrack(isSaveAsNew: boolean = false) {
    if (!this.editingTrack) return;

    // Validate
    if (!this.trackName.trim()) {
      alert(this.translationService.translate('TE_ERROR_NAME_REQUIRED'));
      return;
    }

    this.isSaving = true;

    // Construct payload
    const finalTrack = this.createSnapshot();
    if (isSaveAsNew || finalTrack.entity_id === 'new') {
      // ID will be generated by server/handler logic but we send 'new' or null ID implicitly
      // Client model constructor enforces ID, but for sending we can just rely on the object structure
      // If we really need to change ID to 'new' for the call:
      // We can't change readonly property easily, but createSnapshot uses editingTrack.entity_id
    }

    // We need to send a plain object usually, but DataService takes 'any'
    // If saving as new, we treat it as create
    const wasNew = isSaveAsNew || finalTrack.entity_id === 'new';

    const obs = wasNew
      ? this.dataService.createTrack({ ...finalTrack, entity_id: 'new' })
      : this.dataService.updateTrack(finalTrack.entity_id, finalTrack);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        // Update local state with result (especially ID)
        this.editingTrack = new Track(result.entity_id, result.name, result.lanes);

        // Sync local UI state with server result to ensure clean state matches
        this.trackName = this.editingTrack.name;
        // Ensure lanes are proper objects/arrays as expected
        this.lanes = this.editingTrack.lanes.map(l => new Lane(l.entity_id, l.foreground_color, l.background_color, l.length));

        this.undoManager.resetTracking(this.editingTrack);

        if (wasNew) {
          this.router.navigate(['/track-editor'], { queryParams: { id: result.entity_id } });
        }
      },
      error: (err) => {
        console.error('Failed to save track', err);
        if (err.status === 409) {
          alert(this.translationService.translate('TE_ERROR_NAME_EXISTS'));
        } else {
          alert(this.translationService.translate('TE_ERROR_SAVE_FAILED'));
        }
        this.isSaving = false;
      }
    });
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.trackName) return false;
    const name = this.trackName.trim().toLowerCase();
    return !this.allTracks.some(t => {
      if (excludeSelf && this.editingTrack && t.entity_id === this.editingTrack.entity_id) {
        return false;
      }
      return t.name.toLowerCase() === name;
    });
  }

  onBack() {
    this.router.navigate(['/track-manager']);
  }

  trackByLane(index: number, lane: Lane): string {
    return lane.entity_id;
  }
}
