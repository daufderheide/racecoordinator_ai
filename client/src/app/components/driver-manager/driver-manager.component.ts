import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HelpService, GuideStep } from '../../services/help.service';
import { SettingsService } from '../../services/settings.service';


@Component({
  selector: 'app-driver-manager',
  templateUrl: './driver-manager.component.html',
  styleUrls: ['./driver-manager.component.css'],
  standalone: false
})
export class DriverManagerComponent implements OnInit, OnDestroy {
  drivers: Driver[] = [];
  selectedDriver?: Driver;
  editingDriver?: Driver;
  soundAssets: any[] = [];
  isLoading: boolean = true;

  isSaving: boolean = false;
  scale: number = 1;
  searchQuery: string = '';

  get filteredDrivers(): Driver[] {
    let filtered = this.drivers;
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = this.drivers.filter(d =>
        (d.name && d.name.toLowerCase().includes(query)) ||
        (d.nickname && d.nickname.toLowerCase().includes(query))
      );
    }
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private route: ActivatedRoute,
    private connectionMonitor: ConnectionMonitorService,
    private helpService: HelpService,
    private settingsService: SettingsService
  ) { }


  ngOnInit() {
    this.updateScale();
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadData();

    // Trigger help automatically on first visit or if requested via query param
    this.route.queryParams.subscribe(params => {
      const forceHelp = params['help'] === 'true';
      const settings = this.settingsService.getSettings();
      if (forceHelp || !settings.driverManagerHelpShown) {
        setTimeout(() => {
          this.startHelp();
          if (!forceHelp) {
            settings.driverManagerHelpShown = true;
            this.settingsService.saveSettings(settings);
          }
        }, 1000); // Wait for data to load
      }
    });
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
      next: (result: any) => {
        this.soundAssets = (result.assets || []).filter((a: any) => a.type === 'sound');
        
        this.drivers = (result.drivers || []).map((d: any) => new Driver(
          d.entity_id,
          d.name,
          d.nickname || '',
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

        const selectedId = this.route.snapshot.queryParamMap.get('id');
        if (selectedId) {
          const found = this.drivers.find(d => d.entity_id === selectedId);
          if (found) {
            this.selectDriver(found);
          } else if (this.drivers.length > 0 && !this.selectedDriver) {
            this.selectDriver(this.drivers[0]);
          }
        } else if (this.drivers.length > 0 && !this.selectedDriver) {
          this.selectDriver(this.drivers[0]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();

      },
      error: (err) => {
        console.error('Failed to load drivers', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectDriver(driver: Driver) {
    this.selectedDriver = driver;
    this.editingDriver = new Driver(
      driver.entity_id,
      driver.name,
      driver.nickname,
      driver.avatarUrl,
      { ...driver.lapAudio },
      { ...driver.bestLapAudio }
    );
  }

  monitorConnection() {
    this.connectionSubscription = this.connectionMonitor.connectionState$.subscribe(state => {
      this.isConnectionLost = (state === ConnectionState.DISCONNECTED);
    });
  }


  private mapSoundType(type: string | undefined): 'preset' | 'tts' {
    if (type === 'tts') return 'tts';
    return 'preset';
  }

  updateDriver() {
    if (!this.selectedDriver) return;
    this.router.navigate(['/driver-editor'], {
      queryParams: { id: this.selectedDriver.entity_id }
    });
  }

  showDeleteConfirmation = false;

  deleteDriver() {
    if (!this.editingDriver) return;
    this.showDeleteConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.editingDriver) return;
    this.showDeleteConfirmation = false;
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

  onCancelDelete() {
    this.showDeleteConfirmation = false;
  }

  trackByDriver(index: number, driver: Driver): string {
    return driver.entity_id;
  }

  createNewDriver() {
    if (this.isSaving) return;
    this.isSaving = true;

    const baseName = this.translationService.translate('DM_DEFAULT_DRIVER_NAME');
    const baseNickname = this.translationService.translate('DM_DEFAULT_DRIVER_NICKNAME');
    
    const uniqueName = this.generateUniqueDriverName(baseName);
    const uniqueNickname = this.generateUniqueDriverNickname(baseNickname);

    const newDriver = {
      name: uniqueName,
      nickname: uniqueNickname,
      lapAudio: { type: 'preset' },
      bestLapAudio: { type: 'preset' }
    };

    this.dataService.createDriver(newDriver).subscribe({
      next: (createdDriver: any) => {
        this.isSaving = false;
        this.router.navigate(['/driver-editor'], { queryParams: { id: createdDriver.entity_id } });
      },
      error: (err) => {
        console.error('Failed to create new driver', err);
        this.isSaving = false;
      }
    });
  }

  private generateUniqueDriverName(baseName: string): string {
    let name = baseName;
    if (!this.drivers.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      return name;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseName}_${counter}`;
      if (!this.drivers.some(d => d.name.toLowerCase() === candidate.toLowerCase())) {
        return candidate;
      }
      counter++;
    }
  }

  private generateUniqueDriverNickname(baseNickname: string): string {
    let nickname = baseNickname;
    if (!this.drivers.some(d => d.nickname.toLowerCase() === nickname.toLowerCase())) {
      return nickname;
    }
    let counter = 1;
    while (true) {
      const candidate = `${baseNickname}_${counter}`;
      if (!this.drivers.some(d => d.nickname.toLowerCase() === candidate.toLowerCase())) {
        return candidate;
      }
      counter++;
    }
  }

  startHelp() {
    const steps: GuideStep[] = [
      {
        title: this.translationService.translate('DM_HELP_WELCOME_TITLE'),
        content: this.translationService.translate('DM_HELP_WELCOME_CONTENT'),
        position: 'center'
      },
      {
        selector: '.sidebar-list',
        title: this.translationService.translate('TM_HELP_SIDEBAR_TITLE'),
        content: this.translationService.translate('DM_HELP_WELCOME_CONTENT'),
        position: 'right'
      },
      {
        selector: '.detail-panel',
        title: this.translationService.translate('TM_HELP_DETAIL_TITLE'),
        content: this.translationService.translate('DM_HELP_WELCOME_CONTENT'),
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
        title: this.translationService.translate('DM_CREATE_NEW'),
        content: this.translationService.translate('TM_HELP_CREATE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#delete-track-btn',
        title: this.translationService.translate('DM_BTN_DELETE_DRIVER'),
        content: this.translationService.translate('TM_HELP_DELETE_CONTENT'),
        position: 'bottom'
      },
      {
        selector: '#help-track-btn',
        title: this.translationService.translate('RDS_MENU_TUTORIAL'),
        content: this.translationService.translate('TM_HELP_HELP_CONTENT'),
        position: 'bottom'
      }
    ];
    this.helpService.startGuide(steps);
  }
}

