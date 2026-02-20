import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/settings';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { forkJoin } from 'rxjs';
import { DirtyComponent } from 'src/app/interfaces/dirty-component';

@Component({
  selector: 'app-ui-editor',
  templateUrl: './ui-editor.component.html',
  styleUrl: './ui-editor.component.css',
  standalone: false
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  settings!: Settings;
  editingSettings!: Settings;
  isLoading = true;
  isSaving = false;
  scale = 1;
  assets: any[] = [];
  customDirectoryName: string | null = null;
  isNavigationApproved = false;

  availableColumns = [
    { key: 'driver.name', label: 'RD_COL_NAME' },
    { key: 'driver.nickname', label: 'RD_COL_NICKNAME' },
    { key: 'lapCount', label: 'RD_COL_LAP' },
    { key: 'lastLapTime', label: 'RD_COL_LAP_TIME' },
    { key: 'medianLapTime', label: 'RD_COL_MEDIAN_LAP' },
    { key: 'averageLapTime', label: 'RD_COL_AVG_LAP' },
    { key: 'bestLapTime', label: 'RD_COL_BEST_LAP' }
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
    this.isLoading = true;
    forkJoin({
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load UI editor data', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cloneSettings(s: Settings): Settings {
    const clone = Object.assign(new Settings(), s);
    clone.recentRaceIds = [...s.recentRaceIds];
    clone.selectedDriverIds = [...s.selectedDriverIds];
    clone.racedayColumns = [...s.racedayColumns];
    return clone;
  }

  onColumnToggle(columnKey: string) {
    const columns = this.editingSettings.racedayColumns;
    const index = columns.indexOf(columnKey);

    if (index > -1) {
      // Don't allow deselecting if it's the only one left and it's name/nickname?
      // Actually, user said either name OR nickname is required.
      // And selecting one deselects the other.
      columns.splice(index, 1);
    } else {
      columns.push(columnKey);

      // Mutually exclusive Name/Nickname
      if (columnKey === 'driver.name') {
        const nicknameIndex = columns.indexOf('driver.nickname');
        if (nicknameIndex > -1) columns.splice(nicknameIndex, 1);
      } else if (columnKey === 'driver.nickname') {
        const nameIndex = columns.indexOf('driver.name');
        if (nameIndex > -1) columns.splice(nameIndex, 1);
      }
    }

    // Ensure at least one of Name or Nickname is selected
    if (!columns.includes('driver.name') && !columns.includes('driver.nickname')) {
      // If we just removed one, and neither is present, add the other back?
      // Or just prevent removal.
      if (columnKey === 'driver.name') {
        columns.push('driver.nickname');
      } else if (columnKey === 'driver.nickname') {
        columns.push('driver.name');
      }
    }

    this.captureState();
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
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns);
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
      this.cdr.detectChanges();
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
