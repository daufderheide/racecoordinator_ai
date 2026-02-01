import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Driver } from 'src/app/models/driver';
import { Router } from '@angular/router';
import { TranslationService } from 'src/app/services/translation.service';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

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
    this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        this.drivers = drivers.map((d: any) => new Driver(
          d.entity_id,
          d.name,
          d.nickname || '',
          d.avatarUrl,
          d.lapSoundUrl,
          d.bestLapSoundUrl,
          this.mapSoundType(d.lapSoundType),
          this.mapSoundType(d.bestLapSoundType),
          d.lapSoundText || '',
          d.bestLapSoundText || ''
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
      driver.lapSoundUrl,
      driver.bestLapSoundUrl,
      driver.lapSoundType,
      driver.bestLapSoundType,
      driver.lapSoundText,
      driver.bestLapSoundText
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

  deleteDriver() {
    if (!this.editingDriver) return;
    if (confirm(this.translationService.translate('DM_CONFIRM_DELETE'))) {
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

  trackByDriver(index: number, driver: Driver): string {
    return driver.entity_id;
  }
}
