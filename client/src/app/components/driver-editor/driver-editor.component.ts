import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription, forkJoin } from 'rxjs';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';

@Component({
  selector: 'app-driver-editor',
  templateUrl: './driver-editor.component.html',
  styleUrls: ['./driver-editor.component.css'],
  standalone: false
})

export class DriverEditorComponent implements OnInit, OnDestroy {
  selectedDriver?: Driver;
  editingDriver?: Driver;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;

  showAvatarSelector: boolean = false;

  // Undo Manager
  undoManager!: UndoManager<Driver>;

  // Driver Data
  allDrivers: Driver[] = [];

  // Pending Drag & Drop Avatar
  pendingAvatarFile: File | null = null;
  pendingAvatarPreview: string | null = null;

  // Assets for presets
  avatarAssets: any[] = [];
  soundAssets: any[] = [];

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
    this.undoManager = new UndoManager<Driver>(
      {
        clonner: (d) => this.cloneDriver(d),
        equalizer: (a, b) => this.areDriversEqual(a, b),
        applier: (d) => {
          // Preserve context ID safe-guard
          const currentId = this.editingDriver?.entity_id;
          this.editingDriver = d;
          if (currentId && this.editingDriver) {
            this.editingDriver.entity_id = currentId;
          }
          this.clearPendingAvatar();
        }
      },
      () => this.editingDriver // snapshotGetter
    );
  }

  // Remove old properties
  // undoStack, redoStack, initialState, _snapshot, textChange$ -> Removed

  ngOnInit() {
    this.updateScale();
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

  // ...

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
      throw new Error('Driver Editor: No entity ID provided.');
    }

    this.isLoading = true;
    forkJoin({
      drivers: this.dataService.getDrivers(),
      assets: this.dataService.listAssets()
    }).subscribe({
      next: (result) => {
        try {
          this.loadDataInternal(result.drivers, result.assets);
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

  private cloneDriver(driver: Driver): Driver {
    return new Driver(
      driver.entity_id,
      driver.name,
      driver.nickname,
      driver.avatarUrl,
      driver.lapSoundUrl,
      driver.bestLapSoundUrl,
      driver.lapSoundType,
      driver.bestLapSoundType,
      driver.lapSoundText,
      driver.bestLapSoundText
    );
  }

  private areDriversEqual(d1: Driver, d2: Driver): boolean {
    return d1.name === d2.name &&
      d1.nickname === d2.nickname &&
      d1.avatarUrl === d2.avatarUrl &&
      d1.lapSoundUrl === d2.lapSoundUrl &&
      d1.bestLapSoundUrl === d2.bestLapSoundUrl &&
      d1.lapSoundType === d2.lapSoundType &&
      d1.bestLapSoundType === d2.bestLapSoundType &&
      d1.lapSoundText === d2.lapSoundText &&
      d1.bestLapSoundText === d2.bestLapSoundText;
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const name = this.editingDriver.name.trim().toLowerCase();
    if (!name) return false; // Empty name is not unique/valid

    return !this.allDrivers.some(d =>
      (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
      d.name.toLowerCase() === name
    );
  }

  isNicknameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const nickname = this.editingDriver.nickname?.trim().toLowerCase();
    if (!nickname) return true; // Empty nickname is allowed

    return !this.allDrivers.some(d =>
      (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
      d.nickname?.toLowerCase() === nickname
    );
  }

  private clearPendingAvatar() {
    this.pendingAvatarFile = null;
    this.pendingAvatarPreview = null;
  }

  private mapSoundType(type: string | undefined): 'preset' | 'tts' {
    if (type === 'tts') return 'tts';
    return 'preset';
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
    if (this.editingDriver) {
      this.captureState();
      this.editingDriver.avatarUrl = asset.url;
      this.clearPendingAvatar();
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
        this.router.navigate(['/raceday-setup']);
      }
    }, 1000);
  }

  onBack() {
    sessionStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/raceday-setup']);
  }

  saveAsNew() {
    if (!this.editingDriver) return;
    this.updateDriver(true);
  }

  updateDriver(isSaveAsNew: boolean = false) {
    if (!this.editingDriver) return;
    if (!isSaveAsNew && !this.hasChanges()) return;

    this.isSaving = true;

    if (this.pendingAvatarFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bytes = new Uint8Array(e.target.result);
        this.dataService.uploadAsset(this.pendingAvatarFile!.name, 'image', bytes).subscribe({
          next: (asset) => {
            if (this.editingDriver) {
              // We don't capture state for upload completion as it's an internal sync
              this.editingDriver.avatarUrl = asset.url ?? undefined;
              this.pendingAvatarFile = null;
              this.pendingAvatarPreview = null;
              this.saveDriverData(isSaveAsNew);
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
      this.saveDriverData(isSaveAsNew);
    }
  }

  private loadDataInternal(rawDrivers: any[], assets: any[]) {
    this.allDrivers = rawDrivers.map(d => new Driver(
      d.entity_id, d.name, d.nickname || '',
      d.avatarUrl, d.lapSoundUrl, d.bestLapSoundUrl,
      this.mapSoundType(d.lapSoundType),
      this.mapSoundType(d.bestLapSoundType),
      d.lapSoundText, d.bestLapSoundText
    ));

    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter(a => a.type === 'image');
    this.soundAssets = allAssets.filter(a => a.type === 'sound');

    const idParam = this.route.snapshot.queryParamMap.get('id');

    if (idParam === 'new') {
      this.selectedDriver = undefined;
      this.editingDriver = new Driver('new', '', '', '', '', '', 'preset', 'preset', '', '');
      this.clearPendingAvatar();
    } else if (idParam) {
      const found = this.allDrivers.find(d => d.entity_id === idParam);
      if (found) {
        this.selectDriver(found);
      } else {
        throw new Error(`Driver Editor: Invalid entity ID "${idParam}".`);
      }
    }

    // Initialize tracking
    if (this.editingDriver) {
      this.undoManager.initialize(this.editingDriver);
    }
  }

  // Proxy methods
  undo() { this.undoManager.undo(); }
  redo() { this.undoManager.redo(); }
  hasChanges() { return this.undoManager.hasChanges(); }

  onInputFocus() { this.undoManager.onInputFocus(); }
  onInputChange() { this.undoManager.onInputChange(); }
  onInputBlur() { this.undoManager.onInputBlur(); }
  captureState() { this.undoManager.captureState(); }

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = this.cloneDriver(driver);
    this.clearPendingAvatar();

    this.undoManager.initialize(this.editingDriver);
  }

  // Update saveDriverData
  private saveDriverData(isSaveAsNew: boolean = false) {
    if (!this.editingDriver) return;

    // Create a copy to send, setting id to 'new' if it's a "Save as New" operation
    // or if we are already in "new" mode.
    // TODO(aufderheide): Update shouldn't accept "new".  If it's a new driver, we should
    // create it.
    const driverToSend = { ...this.editingDriver };
    const wasNew = isSaveAsNew || driverToSend.entity_id === 'new';

    if (wasNew) {
      driverToSend.entity_id = 'new';
    }

    const obs = driverToSend.entity_id === 'new'
      ? this.dataService.createDriver(driverToSend)
      : this.dataService.updateDriver(driverToSend.entity_id, driverToSend);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;

        // Update snapshot on save, BUT KEEP STACKS
        if (this.editingDriver) {
          this.editingDriver.entity_id = result.entity_id;
          // Reset tracking baseline but KEEP history
          this.undoManager.resetTracking(this.editingDriver);
        }

        if (wasNew) {
          this.router.navigate(['/driver-editor'], { queryParams: { id: result.entity_id } });
        }

        // Refresh valid drivers list without resetting current editor state
        this.refreshDriverList();
      },
      error: (err) => {
        console.error('Failed to save driver', err);
        if (err.status === 409) {
          alert(err.error || this.translationService.translate('DE_ERROR_NAME_EXISTS'));
        } else {
          alert(this.translationService.translate('DE_ERROR_SAVE_FAILED') + (err.error || err.message));
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private refreshDriverList() {
    this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        // Just update the list for uniqueness checks and sidebar
        this.allDrivers = drivers.map(d => new Driver(
          d.entity_id, d.name, d.nickname || '',
          d.avatarUrl, d.lapSoundUrl, d.bestLapSoundUrl,
          this.mapSoundType(d.lapSoundType),
          this.mapSoundType(d.bestLapSoundType),
          d.lapSoundText, d.bestLapSoundText
        ));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to refresh driver list', err)
    });
  }


  deleteDriver() {
    if (!this.editingDriver) return;
    if (confirm(this.translationService.translate('DE_CONFIRM_DELETE'))) {
      this.isSaving = true;
      this.dataService.deleteDriver(this.editingDriver.entity_id).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/driver-manager']);
        },
        error: (err) => {
          console.error('Failed to delete driver', err);
          this.isSaving = false;
        }
      });
    }
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

        // Drag drop is a discrete change, capture OLD state
        this.captureState();

        this.pendingAvatarFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.pendingAvatarPreview = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  getAvatarUrl(url?: string): string {
    if (!url) return 'assets/images/default_avatar.svg';
    if (url.startsWith('/')) return `http://localhost:7070${url}`;
    return url;
  }
}
