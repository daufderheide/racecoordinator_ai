import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { forkJoin, Subscription } from "rxjs";
import { AnchorPoint } from "src/app/components/raceday/column_definition";
import { UndoManager } from "src/app/components/shared/undo-redo-controls/undo-manager";
import {
  ReorderDialogData,
  ReorderDialogResult,
} from "src/app/components/ui-editor/reorder-dialog/reorder-dialog.component";
import { DataService } from "src/app/data.service";
import { DirtyComponent } from "src/app/interfaces/dirty-component";
import { Settings } from "src/app/models/settings";
import { RaceScreenConfig } from "src/app/models/race-screen";
import { FileSystemService } from "src/app/services/file-system.service";
import { SettingsService } from "src/app/services/settings.service";
import { RaceScreenService } from "src/app/services/race-screen.service";

@Component({
  selector: "app-ui-editor",
  templateUrl: "./ui-editor.component.html",
  styleUrl: "./ui-editor.component.css",
  standalone: false,
})
export class UIEditorComponent implements OnInit, OnDestroy, DirtyComponent {
  private isDestroyed = false;
  private dataSubscription: Subscription | null = null;
  settings!: Settings;
  editingSettings!: Settings;
  isLoading = true;
  isSaving = false;
  isAutoSaving = false;
  scale = 1;
  assets: any[] = [];
  customDirectoryName: string | null = null;
  isNavigationApproved = false;

  showReorderModal = false;
  reorderModalData: ReorderDialogData | null = null;

  // Screen management
  screens: RaceScreenConfig[] = [];
  currentScreen: RaceScreenConfig | null = null;
  private raceScreenSubscription: Subscription | null = null;

  // TODO(aufderheide): I think this list is duplicated below.  If they're the same they should share the code.
  availableColumns = [
    { key: "driver.name", label: "RD_COL_NAME" },
    { key: "driver.nickname", label: "RD_COL_NICKNAME" },
    { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
    { key: "lapCount", label: "RD_COL_LAP" },
    { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
    { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
    { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
    { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
    { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
    { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
    { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
    { key: "participant.team.name", label: "RD_COL_TEAM" },
    { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
    { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
    { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
  ];

  undoManager!: UndoManager<Settings>;

  constructor(
    private settingsService: SettingsService,
    private fileSystem: FileSystemService,
    private dataService: DataService,
    private raceScreenService: RaceScreenService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    this.undoManager = new UndoManager<Settings>(
      {
        clonner: (s) => this.cloneSettings(s),
        equalizer: (a, b) => this.areSettingsEqual(a, b),
        applier: (s) => {
          this.editingSettings = s;
        },
      },
      () => this.editingSettings,
    );
  }

  ngOnInit() {
    this.updateScale();
    this.loadData();
    
    // Load race screens
    this.raceScreenService.loadRaceScreens();
    
    // Subscribe to race screen changes
    this.raceScreenSubscription = this.raceScreenService.raceScreenManager$.subscribe(manager => {
      const newScreen = this.raceScreenService.getActiveScreen() || null;
      this.screens = this.raceScreenService.getScreens();
      
      // If active screen changed, load its config
      if (newScreen?.entity_id !== this.currentScreen?.entity_id) {
        this.currentScreen = newScreen;
        if (this.currentScreen) {
          this.loadScreenConfig(this.currentScreen);
        }
      }
      
      this.cdr.detectChanges();
    });

    // Auto-save on changes (like Driver Editor)
    if (this.undoManager) {
      this.undoManager.stateCommitted$.subscribe(() => {
        this.autoSaveSettings();
      });
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.raceScreenSubscription) {
      this.raceScreenSubscription.unsubscribe();
    }
    this.undoManager.destroy();
  }

  @HostListener("window:resize")
  onResize() {
    this.updateScale();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (this.showReorderModal) return; // Prevent undo during modal
      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
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
      dirHandle: this.fileSystem.getCustomDirectoryHandle(),
    }).subscribe({
      next: (result) => {
        // Include both images (for existing background selections) and image_sets (for new column support)
        this.assets = result.assets.filter((a: any) => a.type === "image");

        // Dynamic columns for image sets
        const imageSetColumns = result.assets
          .filter((a: any) => a.type === "image_set")
          .map((a: any) => ({
            key: `imageset_${a.model?.entityId}`,
            label: a.name || "Unknown Image Set",
          }));

        // Robustness: ensure imageset_fuel-gauge-builtin is available if a "Fuel Gauge" set exists
        const builtinKey = "imageset_fuel-gauge-builtin";
        if (!imageSetColumns.find((c) => c.key === builtinKey)) {
          const fuelGaugeAsset = result.assets.find(
            (a: any) => a.type === "image_set" && a.name === "Fuel Gauge",
          );
          if (fuelGaugeAsset) {
            imageSetColumns.push({
              key: builtinKey,
              label: fuelGaugeAsset.name,
            });
          }
        }

        // Reset availableColumns to base set + dynamic image sets
        this.availableColumns = [
          { key: "driver.name", label: "RD_COL_NAME" },
          { key: "driver.nickname", label: "RD_COL_NICKNAME" },
          { key: "driver.avatarUrl", label: "RD_COL_AVATAR" },
          { key: "lapCount", label: "RD_COL_LAP" },
          { key: "reactionTime", label: "RD_COL_REACTION_TIME" },
          { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
          { key: "medianLapTime", label: "RD_COL_MEDIAN_LAP" },
          { key: "averageLapTime", label: "RD_COL_AVG_LAP" },
          { key: "bestLapTime", label: "RD_COL_BEST_LAP" },
          { key: "gapLeader", label: "RD_COL_GAP_LEADER" },
          { key: "gapPosition", label: "RD_COL_GAP_POSITION" },
          { key: "seed", label: "RD_COL_SEED" },
          { key: "rankHeat", label: "RD_COL_RANK_HEAT" },
          { key: "rankOverall", label: "RD_COL_RANK_OVERALL" },
          { key: "participant.team.name", label: "RD_COL_TEAM" },
          { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
          { key: "fuelCapacity", label: "RD_COL_FUEL_CAPACITY" },
          { key: "fuelPercentage", label: "RD_COL_FUEL_PERCENTAGE" },
          { key: "mph", label: "RD_COL_MPH" },
          { key: "kph", label: "RD_COL_KPH" },
          { key: "fph", label: "RD_COL_FPH" },
          { key: "segmentTime", label: "RD_COL_SEGMENT_TIME" },
          ...imageSetColumns,
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
        console.error("Failed to load UI editor data", err);
        this.isLoading = false;
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      },
    });
  }

  get columnSlots() {
    if (!this.editingSettings) return [];
    return this.editingSettings.racedayColumns.map((key) => {
      const col = this.availableColumns.find((c) => c.key === key);
      return { key, label: col ? col.label : key };
    });
  }

  get resizingColumnKey(): string | null {
    if (!this.editingSettings) return null;
    const columns = this.editingSettings.racedayColumns;
    const layouts = this.editingSettings.columnLayouts || {};
    const nameKeys = ["driver.name", "driver.nickname"];

    for (const key of columns) {
      const layout = layouts[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some((v) =>
        nameKeys.includes((v as string).split("_")[0]),
      );
      if (containsName) return key;
    }
    return columns.length > 0 ? columns[0] : null;
  }

  openReorderDialog() {
    this.reorderModalData = {
      availableValues: this.availableColumns,
      columnSlots: this.columnSlots,
      columnLayouts: JSON.parse(
        JSON.stringify(this.editingSettings.columnLayouts || {}),
      ),
      columnVisibility: JSON.parse(
        JSON.stringify(this.editingSettings.columnVisibility || {}),
      ),
      screenName: this.currentScreen?.name || "Default",
    };
    this.showReorderModal = true;
  }

  async onReorderSave(result: ReorderDialogResult) {
    this.editingSettings.racedayColumns = result.columns;
    this.editingSettings.columnLayouts = result.columnLayouts;
    this.editingSettings.columnVisibility = result.columnVisibility;
    this.captureState();
    
    // Actually save to server, not just local state
    if (this.currentScreen) {
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        columns: result.columns,
        columnLayouts: result.columnLayouts,
        columnVisibility: result.columnVisibility
      });
    }
    
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

    // Safely clone layouts and visibility
    const layouts = s.columnLayouts || {};
    clone.columnLayouts = JSON.parse(JSON.stringify(layouts));

    const visibility = s.columnVisibility || {};
    clone.columnVisibility = JSON.parse(JSON.stringify(visibility));

    clone.highlightRowOnLap = s.highlightRowOnLap ?? true;

    return clone;
  }

  isColumnSelected(columnKey: string): boolean {
    return this.editingSettings.racedayColumns.includes(columnKey);
  }

  private areSettingsEqual(a: Settings, b: Settings): boolean {
    return (
      a.flagGreen === b.flagGreen &&
      a.flagYellow === b.flagYellow &&
      a.flagRed === b.flagRed &&
      a.flagWhite === b.flagWhite &&
      a.flagBlack === b.flagBlack &&
      a.flagCheckered === b.flagCheckered &&
      a.sortByStandings === b.sortByStandings &&
      a.highlightRowOnLap === b.highlightRowOnLap &&
      JSON.stringify(a.racedayColumns) === JSON.stringify(b.racedayColumns) &&
      JSON.stringify(a.columnLayouts) === JSON.stringify(b.columnLayouts) &&
      JSON.stringify(a.columnVisibility) === JSON.stringify(b.columnVisibility)
    );
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

  private autoSaveSettings() {
    if (this.isLoading) return;
    if (this.isSaving) return;
    if (!this.hasChanges()) return;

    this.isAutoSaving = true;
    this.isSaving = true;
    this.settingsService.saveSettings(this.editingSettings);
    this.undoManager.resetTracking(this.editingSettings);

    // Reset saving state after a brief delay
    setTimeout(() => {
      this.isAutoSaving = false;
      this.isSaving = false;
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }, 500);
  }

  private async saveScreenConfig(): Promise<void> {
    if (!this.currentScreen) return;
    
    await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
      columns: this.currentScreen.columns,
      columnAnchors: this.currentScreen.columnAnchors,
      columnLayouts: this.currentScreen.columnLayouts,
      columnVisibility: this.currentScreen.columnVisibility,
      sortByStandings: this.currentScreen.sortByStandings,
      highlightRowOnLap: this.currentScreen.highlightRowOnLap
    });
  }

  // Race Screen Management Methods
  private loadScreenConfig(screen: RaceScreenConfig): void {
    // Load screen columns into editingSettings so Configure Columns dialog shows them
    // Deep clone to prevent shared references between screens
    this.editingSettings = {
      ...this.editingSettings,
      racedayColumns: [...screen.columns],
      columnAnchors: { ...screen.columnAnchors },
      columnLayouts: JSON.parse(JSON.stringify(screen.columnLayouts)),
      columnVisibility: { ...screen.columnVisibility },
    };

    // Reset undo tracking so switching screens doesn't count as unsaved changes
    this.undoManager.resetTracking(this.editingSettings);
    this.cdr.detectChanges();
  }

  async selectScreen(screenId: string): Promise<void> {
    await this.raceScreenService.setActiveScreen(screenId);
  }

  // Screen management methods (delegating to race screen service)
  async openCreateScreen(): Promise<void> {
    const screenName = prompt('Enter screen name:');
    if (screenName) {
      await this.raceScreenService.createScreen(screenName);
    }
  }

  async openEditScreen(screen: RaceScreenConfig): Promise<void> {
    const newName = prompt('Enter screen name:', screen.name);
    if (newName && newName !== screen.name) {
      await this.raceScreenService.updateScreen(screen.entity_id, { name: newName });
    }
  }

  async openDeleteConfirm(screen: RaceScreenConfig): Promise<void> {
    if (confirm(`Are you sure you want to delete "${screen.name}"?`)) {
      try {
        await this.raceScreenService.deleteScreen(screen.entity_id);
      } catch (error) {
        console.error('Failed to delete screen:', error);
        alert('Failed to delete screen: ' + (error as Error).message);
      }
    }
  }

  async duplicateScreen(screen: RaceScreenConfig): Promise<void> {
    // First save any pending changes to the current screen
    if (this.currentScreen && this.hasChanges()) {
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        columns: this.editingSettings.racedayColumns,
        columnLayouts: this.editingSettings.columnLayouts,
        columnVisibility: this.editingSettings.columnVisibility
      });
    }
    // Now duplicate with fresh data
    await this.raceScreenService.duplicateScreen(screen.entity_id);
  }

  // Screen helper methods for UI
  isScreenActive(screenId: string): boolean {
    return this.currentScreen?.entity_id === screenId;
  }

  isScreenEnabled(screenId: string): boolean {
    return this.raceScreenService.isScreenEnabled(screenId);
  }

  async saveAndSwitchScreen(screenId: string): Promise<void> {
    // Save current screen if there are changes
    if (this.currentScreen && this.hasChanges()) {
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        columns: this.editingSettings.racedayColumns,
        columnLayouts: this.editingSettings.columnLayouts,
        columnVisibility: this.editingSettings.columnVisibility
      });
    }
    // Switch to new screen
    await this.selectScreen(screenId);
  }

  canDeleteScreen(screen: RaceScreenConfig): boolean {
    return !screen.isDefault;
  }

  async setDefaultScreen(screenId: string): Promise<void> {
    const screen = this.screens.find(s => s.entity_id === screenId);
    if (screen && !screen.isDefault) {
      // Unset current default
      const currentDefault = this.screens.find(s => s.isDefault);
      if (currentDefault) {
        await this.raceScreenService.updateScreen(currentDefault.entity_id, { isDefault: false });
      }
      // Set new default - this also updates defaultScreenId in the service
      await this.raceScreenService.updateScreen(screenId, { isDefault: true });
    }
  }

  async toggleScreenEnabled(screenId: string): Promise<void> {
    const isEnabled = this.isScreenEnabled(screenId);
    await this.raceScreenService.setScreenEnabled(screenId, !isEnabled);
  }

  async onSortByStandingsChange(value: boolean): Promise<void> {
    if (this.currentScreen) {
      this.currentScreen.sortByStandings = value;
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        sortByStandings: value
      });
    }
  }

  async onHighlightRowOnLapChange(value: boolean): Promise<void> {
    if (this.currentScreen) {
      this.currentScreen.highlightRowOnLap = value;
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        highlightRowOnLap: value
      });
    }
  }

  undo() {
    this.undoManager.undo();
  }
  redo() {
    this.undoManager.redo();
  }
  captureState() {
    this.undoManager.captureState();
  }

  hasChanges(): boolean {
    return this.undoManager.hasChanges();
  }

  async onBack() {
    // If screen columns changed, save them before navigating
    if (this.currentScreen && this.hasChanges()) {
      await this.raceScreenService.updateScreen(this.currentScreen.entity_id, {
        columns: this.editingSettings.racedayColumns,
        columnLayouts: this.editingSettings.columnLayouts,
        columnVisibility: this.editingSettings.columnVisibility
      });
    }
    this.isNavigationApproved = true;
    this.router.navigate(['/raceday-setup']);
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString();
  }
}
