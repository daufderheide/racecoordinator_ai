import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

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
  ) { }

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

  loadData() {
    this.isLoading = true;
    forkJoin({
      drivers: this.dataService.getDrivers(),
      assets: this.dataService.listAssets()
    }).subscribe({
      next: (result) => {
        this.loadDataInternal(result.drivers, result.assets);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadDataInternal(rawDrivers: any[], assets: any[]) {
    const allAssets = assets || [];
    this.avatarAssets = allAssets.filter(a => a.type === 'image');
    this.soundAssets = allAssets.filter(a => a.type === 'sound');

    // Check for ID in query params
    const idParam = this.route.snapshot.queryParamMap.get('id');

    if (idParam) {
      const found = rawDrivers.find(d => d.entity_id === idParam);
      if (found) {
        const driver = new Driver(
          found.entity_id,
          found.name,
          found.nickname || '',
          found.avatarUrl,
          found.lapSoundUrl,
          found.bestLapSoundUrl,
          found.lapSoundType || 'preset',
          found.bestLapSoundType || 'preset',
          found.lapSoundText || '',
          found.bestLapSoundText || ''
        );
        this.selectDriver(driver);
      } else {
        // ID provided but not found - clear or redirect?
        this.selectedDriver = undefined;
        this.editingDriver = undefined;
      }
    } else {
      // No ID provided - maybe new driver mode?
      this.selectedDriver = undefined;
      this.editingDriver = new Driver('new', '', '', '', '', '', 'preset', 'preset', '', '');
      this.clearPendingAvatar();
    }
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
    if (this.editingDriver) {
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


  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = new Driver(
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
    this.clearPendingAvatar();
  }

  onBack() {
    sessionStorage.setItem('skipIntro', 'true');
    this.router.navigate(['/raceday-setup']);
  }

  saveAsNew() {
    if (!this.editingDriver) return;
    this.editingDriver.entity_id = 'new';
    this.updateDriver();
  }

  updateDriver() {
    if (!this.editingDriver) return;
    this.isSaving = true;

    if (this.pendingAvatarFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bytes = new Uint8Array(e.target.result);
        this.dataService.uploadAsset(this.pendingAvatarFile!.name, 'image', bytes).subscribe({
          next: (asset) => {
            if (this.editingDriver) {
              this.editingDriver.avatarUrl = asset.url ?? undefined;
              this.pendingAvatarFile = null;
              this.pendingAvatarPreview = null;
              this.saveDriverData();
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
      this.saveDriverData();
    }
  }

  private saveDriverData() {
    if (!this.editingDriver) return;
    const obs = this.editingDriver.entity_id === 'new'
      ? this.dataService.createDriver(this.editingDriver)
      : this.dataService.updateDriver(this.editingDriver.entity_id, this.editingDriver);

    obs.subscribe({
      next: (result) => {
        this.isSaving = false;
        if (this.editingDriver?.entity_id === 'new') {
          this.router.navigate(['/driver-editor'], { queryParams: { id: result.entity_id } });
        }
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to save driver', err);
        if (err.status === 409) {
          alert(err.error || 'Driver name or nickname already exists');
        } else {
          alert('Failed to save driver: ' + (err.error || err.message));
        }
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteDriver() {
    if (!this.editingDriver) return;
    if (confirm(this.translationService.translate('Are you sure you want to delete this driver?'))) {
      this.isSaving = true;
      this.dataService.deleteDriver(this.editingDriver.entity_id).subscribe({
        next: () => {
          this.selectedDriver = undefined;
          this.editingDriver = undefined;
          this.isSaving = false;
          this.loadData();
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
