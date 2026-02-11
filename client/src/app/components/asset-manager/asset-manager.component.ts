import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { com } from 'src/app/proto/message';
import { forkJoin } from 'rxjs';
import { TranslationService } from 'src/app/services/translation.service';
import { Router } from '@angular/router';
import { ConnectionMonitorService, ConnectionState } from '../../services/connection-monitor.service';
import { Subscription } from 'rxjs';

// Interface matching the mock/view needs, mapped from Protobuf
export interface AssetView {
  id: string;
  name: string;
  type: 'image' | 'sound';
  size: string;
  url: string;
  editMode?: boolean;
}

@Component({
  selector: 'app-asset-manager',
  templateUrl: './asset-manager.component.html',
  styleUrls: ['./asset-manager.component.css'],
  standalone: false
})
export class AssetManagerComponent implements OnInit {
  // Data
  assets: AssetView[] = [];

  // Filtering
  filterType: 'all' | 'image' | 'sound' = 'all';
  filterName: string = '';
  isUploading: boolean = false;
  isLoading: boolean = true;
  isDragOver: boolean = false;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private router: Router,
    private connectionMonitor: ConnectionMonitorService
  ) { }

  activeDatabaseName: string = '';

  ngOnInit() {
    this.connectionMonitor.startMonitoring();
    this.monitorConnection();
    this.loadActiveDatabase();
    this.loadAssets();
  }

  loadActiveDatabase() {
    this.dataService.getCurrentDatabase().subscribe({
      next: (stats) => {
        console.log('AssetManager: Loaded active database stats:', stats);
        if (stats && stats.name) {
          this.activeDatabaseName = stats.name;
          this.cdr.detectChanges();
        } else {
          console.warn('AssetManager: Stats or name missing in response');
        }
      },
      error: (err) => console.error('Failed to load active database', err)
    });
  }

  ngOnDestroy() {
    this.connectionMonitor.stopMonitoring(); // Or let service handle app lifecycle if global, but good to be safe
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
  }

  // Connection Monitoring
  isConnectionLost = false;
  private connectionSubscription: Subscription | null = null;

  monitorConnection() {
    this.connectionSubscription = this.connectionMonitor.connectionState$.subscribe(state => {
      this.isConnectionLost = (state === ConnectionState.DISCONNECTED);
      this.cdr.detectChanges();

      if (this.isConnectionLost) {
        // Start a separate check to see if we timed out too long? 
        // Or just rely on user action / auto-reconnect from service.
        // Original code navigated away after 5s. 
        this.handleConnectionLoss();
      }
    });
  }

  handleConnectionLoss() {
    // We can rely on the service to keep checking. 
    // If we want the specific "navigate away after 5s" behavior, we implement that listener here.
    // The service continues to poll.

    // We verify if we are really lost or just glitching by checking service
    // But for now, let's keep the UI simple or consistent.

    // Original requirement: "respond to lost communication in the same way".
    // If RacedaySetup shows a overlay, we should probably do similar or just show an overlay here too.
    // The original code navigated to /raceday-setup. 

    let startTime = Date.now();
    const intervalId = setInterval(() => {
      if (!this.isConnectionLost) {
        clearInterval(intervalId);
        return;
      }

      if (Date.now() - startTime > 5000) {
        clearInterval(intervalId);
        console.warn('Connection retry timed out. Navigating to splash screen.');
        this.router.navigate(['/raceday-setup']);
      }
    }, 1000);
  }


  loadAssets() {
    this.isLoading = true;
    this.dataService.listAssets().subscribe({
      next: (serverAssets) => {
        if (serverAssets) {
          this.assets = serverAssets.map(a => {
            return {
              id: a.model?.entityId || '',
              name: a.name || 'Unknown',
              type: (a.type === 'image' || a.type === 'sound') ? a.type : 'image',
              size: a.size || '0 B',
              url: this.getAssetUrl(a),
              editMode: false
            };
          });
        } else {
          this.assets = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Failed to list assets', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Force update
      }
    });
  }

  // Helper to construct full URL if needed, or use what server sent
  getAssetUrl(asset: com.antigravity.IAsset): string {
    // If server provides a relative path, prepend base url
    if (asset.url && asset.url.startsWith('/')) {
      return `http://localhost:7070${asset.url}`;
    }
    return asset.url || '';
  }

  get filteredAssets(): AssetView[] {
    return this.assets.filter(asset => {
      const typeMatch = this.filterType === 'all' || asset.type === this.filterType;
      const nameMatch = !this.filterName || asset.name.toLowerCase().includes(this.filterName.toLowerCase());
      return typeMatch && nameMatch;
    });
  }

  get totalSize(): string {
    let totalBytes = 0;
    for (const asset of this.assets) {
      totalBytes += this.parseSize(asset.size);
    }
    return this.formatBytes(totalBytes);
  }

  private parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;

    // Handle IEC units (KiB, MiB) by converting to JEDEC-like (KB, MB) for the parser
    // This assumes the value is base-1024 in both cases, which it is.
    const normalized = sizeStr.replace('iB', 'B');

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const parts = normalized.split(' ');
    if (parts.length !== 2) return 0;

    const value = parseFloat(parts[0]);
    const unit = parts[1].toUpperCase();
    const power = units.indexOf(unit);

    if (power === -1) return 0;
    return value * Math.pow(1024, power);
  }

  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  get totalBytes(): number {
    return this.assets.reduce((sum, asset) => sum + this.parseSize(asset.size), 0);
  }

  get imageUsagePercent(): number {
    if (this.totalBytes === 0) return 0;
    const imageBytes = this.assets
      .filter(a => a.type === 'image')
      .reduce((sum, a) => sum + this.parseSize(a.size), 0);
    return (imageBytes / this.totalBytes) * 100;
  }

  get soundUsagePercent(): number {
    if (this.totalBytes === 0) return 0;
    const soundBytes = this.assets
      .filter(a => a.type === 'sound')
      .reduce((sum, a) => sum + this.parseSize(a.size), 0);
    return (soundBytes / this.totalBytes) * 100;
  }

  get imageCount(): number {
    return this.assets.filter(a => a.type === 'image').length;
  }

  get soundCount(): number {
    return this.assets.filter(a => a.type === 'sound').length;
  }

  setFilterType(type: 'all' | 'image' | 'sound') {
    this.filterType = type;
  }

  onContainerDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onContainerDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  onUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadFiles(files);
    }
  }

  uploadFiles(files: FileList) {
    if (files && files.length > 0) {
      this.isUploading = true;
      this.cdr.detectChanges();

      const readFilePromises = Array.from(files).map((file: any) => this.readFile(file));

      Promise.all(readFilePromises).then(fileDataList => {
        const uploadObservables = fileDataList.map((fileData: any) =>
          this.dataService.uploadAsset(fileData.name, fileData.type, fileData.data)
        );

        forkJoin(uploadObservables).subscribe({
          next: () => {
            console.log('All uploads successful');
            this.loadAssets();
            this.isUploading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('One or more uploads failed', err);
            this.isUploading = false;
            this.cdr.detectChanges();
          }
        });
      });
    }
  }

  readFile(file: File): Promise<{ name: string, type: string, data: Uint8Array }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        const type = file.type.startsWith('image/') ? 'image' : 'sound';
        resolve({ name: file.name, type, data: bytes });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  }

  onDelete(id: string) {
    const msg = this.translationService.translate('AM_CONFIRM_DELETE');
    if (confirm(msg)) {
      this.dataService.deleteAsset(id).subscribe({
        next: () => {
          this.loadAssets();
        },
        error: (err) => console.error('Delete failed', err)
      });
    }
  }

  startEditing(id: string) {
    const asset = this.assets.find(a => a.id === id);
    if (asset) {
      asset.editMode = true;
    }
  }

  cancelEditing(id: string) {
    const asset = this.assets.find(a => a.id === id);
    if (asset) {
      asset.editMode = false;
      this.loadAssets(); // Revert changes
    }
  }

  saveName(id: string, newName: string) {
    const asset = this.assets.find(a => a.id === id);
    if (asset) {
      this.dataService.renameAsset(id, newName).subscribe({
        next: () => {
          asset.editMode = false;
          asset.name = newName; // Optimistic update or reload
          this.loadAssets();
        },
        error: (err) => console.error('Rename failed', err)
      });
    }
  }
}
