import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Team } from 'src/app/models/team';
import { Driver } from 'src/app/models/driver';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription, forkJoin } from 'rxjs';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';

@Component({
  selector: 'app-team-editor',
  templateUrl: './team-editor.component.html',
  styleUrls: ['./team-editor.component.css'],
  standalone: false
})
export class TeamEditorComponent implements OnInit, OnDestroy {
  selectedTeam?: Team;
  editingTeam?: Team;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;

  showAvatarSelector: boolean = false;

  // Undo Manager
  undoManager!: UndoManager<Team>;

  // Data
  allDrivers: Driver[] = [];
  allTeams: Team[] = []; // For name uniqueness check

  // Pending Drag & Drop Avatar
  pendingAvatarFile: File | null = null;
  pendingAvatarPreview: string | null = null;

  // Assets
  avatarAssets: any[] = [];

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService
  ) {
    this.undoManager = new UndoManager<Team>(
      {
        clonner: (t) => this.cloneTeam(t),
        equalizer: (a, b) => this.areTeamsEqual(a, b),
        applier: (t) => {
          const currentId = this.editingTeam?.entity_id;
          this.editingTeam = t;
          if (currentId && this.editingTeam) {
            this.editingTeam.entity_id = currentId;
          }
          this.clearPendingAvatar();
        }
      },
      () => this.editingTeam
    );
  }

  ngOnInit() {
    setTimeout(() => this.updateScale());
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadData();
  }

  ngOnDestroy() {
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
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
    console.log('TeamEditor loadData. ID param:', idParam);
    if (!idParam) {
      console.warn('No ID provided, redirecting to manager');
      // Redirect back to manager instead of throwing
      this.router.navigate(['/team-manager']);
      return;
    }

    this.isLoading = true;
    forkJoin({
      drivers: this.dataService.getDrivers(),
      teams: this.dataService.getTeams(),
      assets: this.dataService.listAssets()
    }).subscribe({
      next: (result) => {
        try {
          this.allDrivers = result.drivers.map(d => new Driver(
            d.entity_id, d.name, d.nickname || '', d.avatarUrl
          ));
          this.allTeams = result.teams.map((t: any) => new Team(
            t.entity_id || t.entityId || '',
            t.name || '',
            t.avatarUrl || undefined,
            t.driverIds || []
          ));
          this.loadDataInternal(result.assets);
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cloneTeam(team: Team): Team {
    return new Team(
      team.entity_id,
      team.name,
      team.avatarUrl,
      [...team.driverIds]
    );
  }

  private areTeamsEqual(a: Team, b: Team): boolean {
    if (a.name !== b.name) return false;
    if (a.avatarUrl !== b.avatarUrl) return false;
    if (a.driverIds.length !== b.driverIds.length) return false;
    // Order matters? For now, assume yes or sort
    const aSorted = [...a.driverIds].sort();
    const bSorted = [...b.driverIds].sort();
    return aSorted.every((id, i) => id === bSorted[i]);
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingTeam) return true;
    const name = this.editingTeam.name.trim().toLowerCase();
    if (!name) return false;

    return !this.allTeams.some(t =>
      (excludeSelf ? t.entity_id !== this.editingTeam!.entity_id : true) &&
      t.name.toLowerCase() === name
    );
  }

  private clearPendingAvatar() {
    this.pendingAvatarFile = null;
    this.pendingAvatarPreview = null;
  }

  monitorConnection() {
    this.connectionSubscription = this.connectionMonitor.connectionState$.subscribe(state => {
      this.isConnectionLost = (state === ConnectionState.DISCONNECTED);
      if (this.isConnectionLost) {
        this.handleConnectionLoss();
      }
    });
  }

  openAvatarSelector() {
    this.showAvatarSelector = true;
  }

  closeAvatarSelector() {
    this.showAvatarSelector = false;
  }

  onAvatarSelected(asset: any) {
    if (this.editingTeam) {
      this.editingTeam.avatarUrl = asset.url;
      this.clearPendingAvatar();
      this.captureState();
    }
    this.closeAvatarSelector();
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
        this.router.navigate(['/team-manager']);
      }
    }, 1000);
  }

  private loadDataInternal(assets: any[]) {
    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter(a => a.type === 'image');

    const idParam = this.route.snapshot.queryParamMap.get('id');

    if (idParam === 'new') {
      this.selectedTeam = undefined;
      this.editingTeam = new Team('new', '', '', []);
      this.clearPendingAvatar();
    } else if (idParam) {
      const found = this.allTeams.find(t => t.entity_id === idParam);
      if (found) {
        this.selectedTeam = found;
        this.editingTeam = this.cloneTeam(found);
        this.clearPendingAvatar();
      } else {
        throw new Error(`Team Editor: Invalid entity ID "${idParam}".`);
      }
    }

    if (this.editingTeam) {
      this.undoManager.initialize(this.editingTeam);
    }
  }

  // Undo/Redo Proxies
  undo() { this.undoManager.undo(); }
  redo() { this.undoManager.redo(); }
  hasChanges() { return this.undoManager.hasChanges(); }
  onInputFocus() { this.undoManager.onInputFocus(); }
  onInputChange() { this.undoManager.onInputChange(); }
  onInputBlur() { this.undoManager.onInputBlur(); }
  captureState() { this.undoManager.captureState(); }

  updateTeam(isSaveAsNew: boolean = false) {
    if (!this.editingTeam) return;
    if (!isSaveAsNew && !this.hasChanges()) return;

    this.isSaving = true;

    if (this.pendingAvatarFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bytes = new Uint8Array(e.target.result);
        this.dataService.uploadAsset(this.pendingAvatarFile!.name, 'image', bytes).subscribe({
          next: (asset) => {
            if (this.editingTeam) {
              this.editingTeam.avatarUrl = asset.url ?? undefined;
              this.pendingAvatarFile = null;
              this.pendingAvatarPreview = null;
              this.saveTeamData(isSaveAsNew);
            }
          },
          error: (err) => {
            console.error('Avatar upload failed', err);
            this.isSaving = false;
            this.cdr.detectChanges();
          }
        });
      };
      reader.readAsArrayBuffer(this.pendingAvatarFile);
    } else {
      this.saveTeamData(isSaveAsNew);
    }
  }

  private saveTeamData(isSaveAsNew: boolean = false) {
    if (!this.editingTeam) return;

    const teamToSend = { ...this.editingTeam };
    const wasNew = isSaveAsNew || teamToSend.entity_id === 'new';

    if (wasNew) {
      teamToSend.entity_id = 'new';
    }

    const obs = teamToSend.entity_id === 'new'
      ? this.dataService.createTeam(teamToSend)
      : this.dataService.updateTeam(teamToSend.entity_id, teamToSend);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        if (this.editingTeam) {
          this.editingTeam.entity_id = result.entity_id;
          this.undoManager.resetTracking(this.editingTeam);
        }
        if (wasNew) {
          this.router.navigate(['/team-editor'], { queryParams: { id: result.entity_id } });
        }
        // Refresh valid names list
        this.refreshTeamList();
      },
      error: (err) => {
        console.error('Failed to save team', err);
        alert(this.translationService.translate('TM_ERROR_SAVE_FAILED') + (err.error || err.message));
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private refreshTeamList() {
    this.dataService.getTeams().subscribe({
      next: (teams) => {
        this.allTeams = teams.map((t: any) => new Team(
          t.entity_id || t.entityId || '',
          t.name || '',
          t.avatarUrl || undefined,
          t.driverIds || []
        ));
      }
    });
  }

  // Driver Membership Logic
  isDriverInTeam(driver: Driver): boolean {
    if (!this.editingTeam) return false;
    return this.editingTeam.driverIds.includes(driver.entity_id);
  }

  toggleDriver(driver: Driver) {
    if (!this.editingTeam) return;
    if (this.isDriverInTeam(driver)) {
      this.editingTeam.driverIds = this.editingTeam.driverIds.filter(id => id !== driver.entity_id);
    } else {
      this.editingTeam.driverIds.push(driver.entity_id);
    }
    this.captureState();
  }

  saveAsNew() {
    if (!this.editingTeam) return;
    this.updateTeam(true);
  }

  // Drag & Drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'avatar') {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      if (type === 'avatar') {
        const file = files[0];
        this.pendingAvatarFile = file;
        this.captureState();
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.pendingAvatarPreview = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  }
}
