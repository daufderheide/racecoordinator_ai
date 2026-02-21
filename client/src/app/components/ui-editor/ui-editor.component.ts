import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/settings';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { forkJoin, Subscription } from 'rxjs';
import { DirtyComponent } from 'src/app/interfaces/dirty-component';
import { AnchorPoint } from '../raceday/column_definition';
import { ReorderDialogComponent, ReorderDialogData, ReorderDialogResult } from './reorder-dialog/reorder-dialog.component';


@Component({
  selector: 'app-ui-editor',
  templateUrl: './ui-editor.component.html',
  styleUrl: './ui-editor.component.css',
  standalone: false
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  settings!: Settings;
  editingSettings!: Settings;
  isLoading = true;
  isSaving = false;
  scale = 1;
  assets: any[] = [];
  customDirectoryName: string | null = null;
  isNavigationApproved = false;

  showReorderModal = false;
  reorderModalData: ReorderDialogData | null = null;

  availableColumns = [
    { key: 'driver.name', label: 'RD_COL_NAME' },
    { key: 'driver.nickname', label: 'RD_COL_NICKNAME' },
    { key: 'lapCount', label: 'RD_COL_LAP' },
    { key: 'reactionTime', label: 'UI_EDITOR_COL_REACTION_TIME' },
    { key: 'lastLapTime', label: 'RD_COL_LAP_TIME' },
    { key: 'medianLapTime', label: 'RD_COL_MEDIAN_LAP' },
    { key: 'averageLapTime', label: 'RD_COL_AVG_LAP' },
    { key: 'bestLapTime', label: 'RD_COL_BEST_LAP' },
    { key: 'gapLeader', label: 'UI_EDITOR_COL_GAP_LEADER' },
    { key: 'gapPosition', label: 'UI_EDITOR_COL_GAP_POSITION' },
    { key: 'participant.team.name', label: 'UI_EDITOR_COL_TEAM' },
  ];


  undoManager!: UndoManager<Settings>;

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.undoManager = new UndoManager<Settings>(
      {
        clonner: (s) => this.cloneSettings(s),
        equalizer: (a, b) => this.areSettingsEqual(a, b),
        applier: (s) => {
          this.editingSettings = s;
        }
      },
      () => this.editingSettings
    );
  }

  ngOnInit() {
    this.updateScale();
    this.loadData();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
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
      if (this.showReorderModal) return; // Prevent undo during modal
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
      event.preventDefault();
      if (this.showReorderModal) return;
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
    this.isLoading = true;
    this.dataSubscription = forkJoin({
      assets: this.dataService.listAssets(),
      dirHandle: this.fileSystem.getCustomDirectoryHandle()
    }).subscribe({
      next: (result) => {
        this.assets = result.assets.filter((a: any) => a.type === 'image');
        this.customDirectoryName = result.dirHandle?.name || null;
        this.settings = this.settingsService.getSettings();
        this.editingSettings = this.cloneSettings(this.settings);
        this.undoManager.initialize(this.editingSettings);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to load UI editor data', err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      }
    });
  }

  get columnSlots() {
    if (!this.editingSettings) return [];
    return this.editingSettings.racedayColumns.map(key => {
      const col = this.availableColumns.find(c => c.key === key);
      return { key, label: col ? col.label : key };
    });
  }

  get resizingColumnKey(): string | null {
    if (!this.editingSettings) return null;
    const columns = this.editingSettings.racedayColumns;
    const layouts = this.editingSettings.columnLayouts || {};
    const nameKeys = ['driver.name', 'driver.nickname'];

    for (const key of columns) {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some(v => nameKeys.includes((v as string).split('_')[0]));
      if (containsName) return key;
    }
    return columns.length > 0 ? columns[0] : null;
  }

  openReorderDialog() {
    this.reorderModalData = {
      availableValues: this.availableColumns,
      columnSlots: this.columnSlots,
      columnLayouts: JSON.parse(JSON.stringify(this.editingSettings.columnLayouts || {}))
    };
    this.showReorderModal = true;
  }

  onReorderSave(result: ReorderDialogResult) {
    this.editingSettings.racedayColumns = result.columns;
    this.editingSettings.columnLayouts = result.columnLayouts;
    this.showReorderModal = false;
    this.reorderModalData = null;
    this.captureState();
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }


  onReorderCancel() {
    this.showReorderModal = false;
    this.reorderModalData = null;
  }


  private cloneSettings(s: Settings): Settings {
    const clone = Object.assign(new Settings(), s);
    clone.recentRaceIds = [...(s.recentRaceIds || [])];
    clone.selectedDriverIds = [...(s.selectedDriverIds || [])];
    clone.racedayColumns = [...(s.racedayColumns || [])];
    clone.columnAnchors = { ...(s.columnAnchors || {}) };
    clone.columnLayouts = JSON.parse(JSON.stringify(s.columnLayouts || {}));
    return clone;
  }


  isColumnSelected(columnKey: string): boolean {
    return this.editingSettings.racedayColumns.includes(columnKey);
  }

  private areSettingsEqual(a: Settings, b: Settings): boolean {
    return a.flagGreen === b.flagGreen &&
      a.flagYellow === b.flagYellow &&
      a.flagRed === b.flagRed &&
      a.flagWhite === b.flagWhite &&
      a.flagBlack === b.flagBlack &&
      a.flagCheckered === b.flagCheckered &&
      a.sortByStandings === b.sortByStandings &&
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
      JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts);
  }

  async selectDirectory() {
    const success = await this.fileSystem.selectCustomFolder();
    if (success) {
      const handle = await this.fileSystem.getCustomDirectoryHandle();
      this.customDirectoryName = handle?.name || null;
      this.cdr.detectChanges();
    }
  }

  async resetDefault() {
    await this.fileSystem.clearCustomFolder();
    this.customDirectoryName = null;
    this.cdr.detectChanges();
  }

  save() {
    this.isSaving = true;
    this.settingsService.saveSettings(this.editingSettings);
    setTimeout(() => {
      this.isSaving = false;
      this.undoManager.resetTracking(this.editingSettings);
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }, 500);
  }

  onBack() {
    this.isNavigationApproved = true;
    this.router.navigate(['/raceday-setup']);
  }

  hasChanges() {
    return this.undoManager.hasChanges();
  }

  undo() { this.undoManager.undo(); }
  redo() { this.undoManager.redo(); }
  captureState() { this.undoManager.captureState(); }
}

