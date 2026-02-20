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
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  selectedDriver?: Driver;
  editingDriver?: Driver;
  isLoading: boolean = true;
  isSaving: boolean = false;
  isUploading: boolean = false;
  scale: number = 1;

  // Undo Manager
  undoManager!: UndoManager<Driver>;

  // Driver Data
  allDrivers: Driver[] = [];

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
        }
      },
      () => this.editingDriver // snapshotGetter
    );
  }

  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadData();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
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
    if (!idParam) {
      throw new Error('Driver Editor: No entity ID provided.');
    }

    this.isLoading = true;
    this.dataSubscription = forkJoin({
      drivers: this.dataService.getDrivers(),
      assets: this.dataService.listAssets()
    }).subscribe({
      next: (result) => {
        try {
          this.loadDataInternal(result.drivers, result.assets);
        } finally {
          this.isLoading = false;
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      }
    });
  }

  private cloneDriver(driver: Driver): Driver {
    return new Driver(
      driver.entity_id,
      driver.name,
      driver.nickname,
      driver.avatarUrl,
      driver.lapAudio ? { ...driver.lapAudio } : undefined,
      driver.bestLapAudio ? { ...driver.bestLapAudio } : undefined
    );
  }

  private areDriversEqual(d1: Driver, d2: Driver): boolean {
    return d1.name === d2.name &&
      d1.nickname === d2.nickname &&
      d1.avatarUrl === d2.avatarUrl &&
      (d1.lapAudio?.url || '') === (d2.lapAudio?.url || '') &&
      (d1.bestLapAudio?.url || '') === (d2.bestLapAudio?.url || '') &&
      (d1.lapAudio?.type || 'preset') === (d2.lapAudio?.type || 'preset') &&
      (d1.bestLapAudio?.type || 'preset') === (d2.bestLapAudio?.type || 'preset') &&
      (d1.lapAudio?.text || '') === (d2.lapAudio?.text || '') &&
      (d1.bestLapAudio?.text || '') === (d2.bestLapAudio?.text || '');
  }

  isNameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const name = this.editingDriver.name.trim().toLowerCase();
    if (!name) return false;

    return !this.allDrivers.some(d =>
      (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
      d.name.toLowerCase() === name
    );
  }

  isNicknameUnique(excludeSelf: boolean = true): boolean {
    if (!this.editingDriver) return true;
    const nickname = this.editingDriver.nickname?.trim().toLowerCase();
    if (!nickname) return true;

    return !this.allDrivers.some(d =>
      (excludeSelf ? d.entity_id !== this.editingDriver!.entity_id : true) &&
      d.nickname?.toLowerCase() === nickname
    );
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
    this.saveDriverData(isSaveAsNew);
  }

  private loadDataInternal(rawDrivers: any[], assets: any[]) {
    this.allDrivers = rawDrivers.map(d => new Driver(
      d.entity_id, d.name, d.nickname || '',
      d.avatarUrl,
      {
        type: this.mapSoundType(d.lapAudio?.type || d.lapSoundType),
        url: d.lapAudio?.url || d.lapSoundUrl,
        text: d.lapAudio?.text || d.lapSoundText
      },
      {
        type: this.mapSoundType(d.bestLapAudio?.type || d.bestLapSoundType),
        url: d.bestLapAudio?.url || d.bestLapSoundUrl,
        text: d.bestLapAudio?.text || d.bestLapSoundText
      }
    ));

    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter(a => a.type === 'image');
    this.soundAssets = allAssets.filter(a => a.type === 'sound');

    const idParam = this.route.snapshot.queryParamMap.get('id');

    if (idParam === 'new') {
      this.selectedDriver = undefined;
      this.editingDriver = new Driver('new', '', '', '', { type: 'preset' }, { type: 'preset' });
    } else if (idParam) {
      const found = this.allDrivers.find(d => d.entity_id === idParam);
      if (found) {
        this.selectDriver(found);
      } else {
        throw new Error(`Driver Editor: Invalid entity ID "${idParam}".`);
      }
    }

    if (this.editingDriver) {
      this.undoManager.initialize(this.editingDriver);
    }
  }

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
    this.undoManager.initialize(this.editingDriver);
  }

  private saveDriverData(isSaveAsNew: boolean = false) {
    if (!this.editingDriver) return;

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

        if (this.editingDriver) {
          this.editingDriver.entity_id = result.entity_id;
          this.undoManager.resetTracking(this.editingDriver);
        }

        if (wasNew) {
          this.router.navigate(['/driver-editor'], { queryParams: { id: result.entity_id } });
        }

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
        this.allDrivers = drivers.map(d => new Driver(
          d.entity_id, d.name, d.nickname || '',
          d.avatarUrl,
          {
            type: this.mapSoundType(d.lapAudio?.type || d.lapSoundType),
            url: d.lapAudio?.url || d.lapSoundUrl,
            text: d.lapAudio?.text || d.lapSoundText
          },
          {
            type: this.mapSoundType(d.bestLapAudio?.type || d.bestLapSoundType),
            url: d.bestLapAudio?.url || d.bestLapSoundUrl,
            text: d.bestLapAudio?.text || d.bestLapSoundText
          }
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

  getAvatarUrl(url?: string): string {
    if (!url) return 'assets/images/default_avatar.svg';
    if (url.startsWith('/')) return `http://localhost:7070${url}`;
    return url;
  }
}
