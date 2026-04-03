import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { SettingsService } from 'src/app/services/settings.service';
import { Settings } from 'src/app/models/settings';
import { FileSystemService } from 'src/app/services/file-system.service';
import { DataService } from 'src/app/data.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { UndoManager } from '../shared/undo-redo-controls/undo-manager';
import { forkJoin, Subscription } from 'rxjs';
import { DirtyComponent } from 'src/app/interfaces/dirty-component';
import { AnchorPoint } from '../raceday/column_definition';
import { ReorderDialogComponent, ReorderDialogData, ReorderDialogResult } from './reorder-dialog/reorder-dialog.component';
import { ColumnVisibility } from 'src/app/models/settings';
import { ScreenType } from '../screen-selector/screen-selector.component';


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
  screenType: ScreenType = 'race-screen';
  screenTitleKey: string = 'UE_TITLE';

  showReorderModal = false;
  reorderModalData: ReorderDialogData | null = null;


  // TODO(aufderheide): I think this list is duplicated below.  If they're the same they should share the code.
  availableColumns = [
    { key: 'driver.name', label: 'RD_COL_NAME' },
    { key: 'driver.nickname', label: 'RD_COL_NICKNAME' },
    { key: 'driver.avatarUrl', label: 'RD_COL_AVATAR' },
    { key: 'lapCount', label: 'RD_COL_LAP' },
    { key: 'reactionTime', label: 'RD_COL_REACTION_TIME' },
    { key: 'lastLapTime', label: 'RD_COL_LAP_TIME' },
    { key: 'medianLapTime', label: 'RD_COL_MEDIAN_LAP' },
    { key: 'averageLapTime', label: 'RD_COL_AVG_LAP' },
    { key: 'bestLapTime', label: 'RD_COL_BEST_LAP' },
    { key: 'gapLeader', label: 'RD_COL_GAP_LEADER' },
    { key: 'gapPosition', label: 'RD_COL_GAP_POSITION' },
    { key: 'participant.team.name', label: 'RD_COL_TEAM' },
    { key: 'participant.fuelLevel', label: 'RD_COL_FUEL_LEVEL' },
    { key: 'fuelCapacity', label: 'RD_COL_FUEL_CAPACITY' },
    { key: 'fuelPercentage', label: 'RD_COL_FUEL_PERCENTAGE' },
  ];


  undoManager!: UndoManager<Settings>;

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
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
    
    // Read screen type from query parameters
    this.route.queryParams.subscribe(params => {
      this.screenType = params['screen'] as ScreenType || 'race-screen';
      this.updateScreenTitle();
    });
    
    this.loadData();
  }

  private updateScreenTitle() {
    if (this.screenType === 'extra-screen') {
      this.screenTitleKey = 'UE_TITLE_EXTRA_SCREEN';
    } else {
      this.screenTitleKey = 'UE_TITLE_RACE_SCREEN';
    }
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
        // Include both images (for existing background selections) and image_sets (for new column support)
        this.assets = result.assets.filter((a: any) => a.type === 'image');

        // Dynamic columns for image sets
        const imageSetColumns = result.assets
          .filter((a: any) => a.type === 'image_set')
          .map((a: any) => ({
            key: `imageset_${a.model?.entityId}`,
            label: a.name || 'Unknown Image Set'
          }));

        // Robustness: ensure imageset_fuel-gauge-builtin is available if a "Fuel Gauge" set exists
        const builtinKey = 'imageset_fuel-gauge-builtin';
        if (!imageSetColumns.find(c => c.key === builtinKey)) {
          const fuelGaugeAsset = result.assets.find((a: any) => a.type === 'image_set' && a.name === 'Fuel Gauge');
          if (fuelGaugeAsset) {
            imageSetColumns.push({
              key: builtinKey,
              label: fuelGaugeAsset.name
            });
          }
        }

        // Reset availableColumns to base set + dynamic image sets
        this.availableColumns = [
          { key: 'driver.name', label: 'RD_COL_NAME' },
          { key: 'driver.nickname', label: 'RD_COL_NICKNAME' },
          { key: 'driver.avatarUrl', label: 'RD_COL_AVATAR' },
          { key: 'lapCount', label: 'RD_COL_LAP' },
          { key: 'reactionTime', label: 'RD_COL_REACTION_TIME' },
          { key: 'lastLapTime', label: 'RD_COL_LAP_TIME' },
          { key: 'medianLapTime', label: 'RD_COL_MEDIAN_LAP' },
          { key: 'averageLapTime', label: 'RD_COL_AVG_LAP' },
          { key: 'bestLapTime', label: 'RD_COL_BEST_LAP' },
          { key: 'gapLeader', label: 'RD_COL_GAP_LEADER' },
          { key: 'gapPosition', label: 'RD_COL_GAP_POSITION' },
          { key: 'seed', label: 'RD_COL_SEED' },
          { key: 'rankHeat', label: 'RD_COL_RANK_HEAT' },
          { key: 'rankOverall', label: 'RD_COL_RANK_OVERALL' },
          { key: 'participant.team.name', label: 'RD_COL_TEAM' },
          { key: 'participant.fuelLevel', label: 'RD_COL_FUEL_LEVEL' },
          { key: 'fuelCapacity', label: 'RD_COL_FUEL_CAPACITY' },
          { key: 'fuelPercentage', label: 'RD_COL_FUEL_PERCENTAGE' },
          { key: 'mph', label: 'RD_COL_MPH' },
          { key: 'kph', label: 'RD_COL_KPH' },
          { key: 'fph', label: 'RD_COL_FPH' },
          { key: 'segmentTime', label: 'RD_COL_SEGMENT_TIME' },
          ...imageSetColumns
        ];

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
    const columns = this.screenType === 'extra-screen' 
      ? this.editingSettings.extraScreenColumns 
      : this.editingSettings.racedayColumns;
    return columns.map(key => {
      const col = this.availableColumns.find(c => c.key === key);
      return { key, label: col ? col.label : key };
    });
  }

  get columnLayouts() {
    if (!this.editingSettings) return {};
    return this.screenType === 'extra-screen'
      ? this.editingSettings.extraScreenColumnLayouts || {}
      : this.editingSettings.columnLayouts || {};
  }

  get columnVisibility() {
    if (!this.editingSettings) return {};
    return this.screenType === 'extra-screen'
      ? this.editingSettings.extraScreenColumnVisibility || {}
      : this.editingSettings.columnVisibility || {};
  }

  get resizingColumnKey(): string | null {
    if (!this.editingSettings) return null;
    const columns = this.screenType === 'extra-screen' 
      ? this.editingSettings.extraScreenColumns 
      : this.editingSettings.racedayColumns;
    const layouts = this.screenType === 'extra-screen'
      ? this.editingSettings.extraScreenColumnLayouts
      : this.editingSettings.columnLayouts || {};
    const nameKeys = ['driver.name', 'driver.nickname'];

    for (const key of columns) {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some(v => nameKeys.includes((v as string).split('_')[0]));
      if (containsName) return key;
    }
    return columns.length > 0 ? columns[0] : null;
  }

  openReorderDialog() {
    const layouts = this.screenType === 'extra-screen'
      ? this.editingSettings.extraScreenColumnLayouts
      : this.editingSettings.columnLayouts || {};
    const visibility = this.screenType === 'extra-screen'
      ? this.editingSettings.extraScreenColumnVisibility
      : this.editingSettings.columnVisibility || {};
      
    this.reorderModalData = {
      availableValues: this.availableColumns,
      columnSlots: this.columnSlots,
      columnLayouts: JSON.parse(JSON.stringify(layouts)),
      columnVisibility: JSON.parse(JSON.stringify(visibility))
    };
    this.showReorderModal = true;
  }

  onReorderSave(result: ReorderDialogResult) {
    if (this.screenType === 'extra-screen') {
      this.editingSettings.extraScreenColumns = result.columns;
      this.editingSettings.extraScreenColumnLayouts = result.columnLayouts;
      this.editingSettings.extraScreenColumnVisibility = result.columnVisibility;
    } else {
      this.editingSettings.racedayColumns = result.columns;
      this.editingSettings.columnLayouts = result.columnLayouts;
      this.editingSettings.columnVisibility = result.columnVisibility;
    }
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
    clone.extraScreenColumns = [...(s.extraScreenColumns || Settings.DEFAULT_EXTRA_SCREEN_COLUMNS)];
    clone.columnAnchors = { ...(s.columnAnchors || {}) };
    clone.extraScreenColumnAnchors = { ...(s.extraScreenColumnAnchors || {}) };

    // Safely clone layouts and visibility
    const layouts = s.columnLayouts || {};
    clone.columnLayouts = JSON.parse(JSON.stringify(layouts));
    
    const extraScreenLayouts = s.extraScreenColumnLayouts || {};
    clone.extraScreenColumnLayouts = JSON.parse(JSON.stringify(extraScreenLayouts));

    const visibility = s.columnVisibility || {};
    clone.columnVisibility = JSON.parse(JSON.stringify(visibility));
    
    const extraScreenVisibility = s.extraScreenColumnVisibility || {};
    clone.extraScreenColumnVisibility = JSON.parse(JSON.stringify(extraScreenVisibility));

    clone.highlightRowOnLap = s.highlightRowOnLap ?? true;

    return clone;
  }


  isColumnSelected(columnKey: string): boolean {
    const columns = this.screenType === 'extra-screen' 
      ? this.editingSettings.extraScreenColumns 
      : this.editingSettings.racedayColumns;
    return columns.includes(columnKey);
  }

  private areSettingsEqual(a: Settings, b: Settings): boolean {
    return a.flagGreen === b.flagGreen &&
      a.flagYellow === b.flagYellow &&
      a.flagRed === b.flagRed &&
      a.flagWhite === b.flagWhite &&
      a.flagBlack === b.flagBlack &&
      a.flagCheckered === b.flagCheckered &&
      a.sortByStandings === b.sortByStandings &&
      a.highlightRowOnLap === b.highlightRowOnLap &&
      a.extraScreenSortByStandings === b.extraScreenSortByStandings &&
      a.extraScreenHighlightRowOnLap === b.extraScreenHighlightRowOnLap &&
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
      JSON.stringify(a.extraScreenColumns) === JSON.stringify(b.extraScreenColumns) &&
      JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts) &&
      JSON.stringify(a.extraScreenColumnLayouts) === JSON.stringify(b.extraScreenColumnLayouts) &&
      JSON.stringify(a.columnVisibility) === JSON.stringify(b.columnVisibility) &&
      JSON.stringify(a.extraScreenColumnVisibility) === JSON.stringify(b.extraScreenColumnVisibility);
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

