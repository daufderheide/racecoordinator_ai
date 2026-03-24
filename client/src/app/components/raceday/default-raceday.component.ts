import { Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Heat } from '../../race/heat';
import { DriverHeatData } from '../../race/driver_heat_data';
import { Track } from 'src/app/models/track';
import { Race } from 'src/app/models/race';
import { TranslationService } from 'src/app/services/translation.service';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { RaceConverter } from 'src/app/converters/race.converter';
import { DriverConverter } from 'src/app/converters/driver.converter';
import { HeatConverter } from 'src/app/converters/heat.converter';
import { TrackConverter } from 'src/app/converters/track.converter';
import { LaneConverter } from 'src/app/converters/lane.converter';
import { playSound, createTTSContext } from 'src/app/utils/audio';
import { com } from 'src/app/proto/message';
import { SettingsService } from 'src/app/services/settings.service';
import { AnchorPoint } from './column_definition';
import { Settings, ColumnVisibility } from 'src/app/models/settings';
import { FinishMethod } from 'src/app/models/heat_scoring';
import InterfaceStatus = com.antigravity.InterfaceStatus;
import { RaceConnectionService } from 'src/app/services/race-connection.service';

import { ColumnDefinition } from './column_definition';

/**
 * The raceday component is the main component for the raceday screen.
 */
@Component({
  selector: 'app-default-raceday',
  templateUrl: './default-raceday.component.html',
  styleUrls: ['./default-raceday.component.css'],
  standalone: false
})
export class DefaultRacedayComponent implements OnInit, OnDestroy {
  private isDestroyed = false;
  private subscriptions: Subscription[] = [];
  protected heat?: Heat;
  protected track!: Track;
  protected race!: Race;
  protected columns: ColumnDefinition[];
  protected errorMessage?: string;
  protected startResumeShortcut: string = 'Ctrl+S';
  protected pauseShortcut: string = 'Ctrl+P';
  protected nextHeatShortcut: string = 'Ctrl+N';
  protected restartHeatShortcut: string = 'Ctrl+R';
  protected skipHeatShortcut: string = 'Alt+F5';
  protected deferHeatShortcut: string = 'Alt+F6';
  protected time: number = 0;
  protected timeFormat: string = '1.0-0';
  protected sortedHeatDrivers: DriverHeatData[] = [];
  protected allDrivers: any[] = [];

  private previousTime: number = 0;

  // Acknowledgement Modal State
  showAckModal = false;
  ackModalTitle = '';
  ackModalMessage = '';
  ackModalButtonText = 'ACK_MODAL_BTN_OK';

  private disconnectedTimeout: any;
  private noStatusWatchdog: any;
  private lastInterfaceStatus: InterfaceStatus | number = -1;
  private hasInitiallyConnected = false;
  // TODO(aufderheide): Test hooks like this have no business in production code.
  // Test hook for watchdogs
  private get WATCHDOG_TIMEOUT(): number {
    return (window as any).WATCHDOG_TIMEOUT || 5000;
  }

  constructor(
    private translationService: TranslationService,
    private dataService: DataService,
    private raceService: RaceService,
    private settingsService: SettingsService,
    private raceConnectionService: RaceConnectionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Initial default columns, will be overwritten in ngOnInit
    this.columns = [];
  }

  protected driverRankings = new Map<string, number>();
  protected isInterfaceConnected: boolean = false;
  protected raceState: com.antigravity.RaceState = com.antigravity.RaceState.UNKNOWN_STATE;
  protected assets: any[] = [];
  protected hasRacedInCurrentHeat: boolean = false;
  protected highlightedDrivers: Set<string> = new Set();
  private carLocations = new Map<number, number>();

  private driversLoaded = false;
  private pendingUpdate: com.antigravity.IRace | null = null;

  ngOnInit() {
    this.loadColumns();

    // Clear caches to ensure fresh data for new race
    RaceConverter.clearCache();
    DriverConverter.clearCache();
    HeatConverter.clearCache();
    TrackConverter.clearCache();
    LaneConverter.clearCache();

    this.subscriptions.push(this.dataService.listAssets().subscribe(assets => {
      this.assets = assets || [];
      this.loadColumns(); // Refresh column definitions to pick up asset names and update formatters
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.dataService.getDrivers().subscribe(drivers => {
      this.allDrivers = drivers || [];
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.detectShortcutKey();
    this.updateScale();

    this.raceConnectionService.connect();

    this.subscriptions.push(this.raceService.currentHeat$.subscribe(() => {
      this.loadRaceData();
      this.cdr.detectChanges();
      this.updateScale();
    }));

    this.subscriptions.push(this.raceConnectionService.raceTime$.subscribe(time => {
      if (time > this.previousTime) {
        this.timeFormat = '1.0-0';
      } else if (time < this.previousTime) {
        if (time < 10) {
          this.timeFormat = '1.2-2';
        } else {
          this.timeFormat = '1.0-0';
        }
      } else {
        if (time === 0) this.timeFormat = '1.0-0';
      }

      const prev = this.previousTime;
      this.time = time;
      this.previousTime = time;
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.raceConnectionService.laps$.subscribe(lap => {
      if (this.heat && this.heat.heatDrivers && lap && lap.objectId) {
        const driverData = this.heat.heatDrivers.find(d => d.objectId === lap.objectId);
        if (driverData) {
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }

          const driver = driverData.driver;
          const isBestLap = lap.lapTime === lap.bestLapTime;
          const ttsContext = createTTSContext(driver, driverData);

          if (isBestLap && (driver.bestLapAudio.url || (driver.bestLapAudio.type === 'tts' && driver.bestLapAudio.text))) {
            playSound(driver.bestLapAudio.type, driver.bestLapAudio.url, driver.bestLapAudio.text, this.dataService.serverUrl, ttsContext);
          } else if (driver.lapAudio.url || (driver.lapAudio.type === 'tts' && driver.lapAudio.text)) {
            playSound(driver.lapAudio.type, driver.lapAudio.url, driver.lapAudio.text, this.dataService.serverUrl, ttsContext);
          }

          const settings = this.settingsService.getSettings();
          if (settings.highlightRowOnLap) {
            this.highlightedDrivers.add(lap.objectId!);
            if (!this.isDestroyed) {
              this.cdr.detectChanges();
            }
            setTimeout(() => {
              this.highlightedDrivers.delete(lap.objectId!);
              if (!this.isDestroyed) {
                this.cdr.detectChanges();
              }
            }, 400);
          }
        }
      }
    }));

    this.subscriptions.push(this.raceConnectionService.carData$.subscribe(carData => {
      if (!this.isDestroyed && carData && carData.lane !== null && carData.lane !== undefined && carData.location !== null && carData.location !== undefined) {
        this.carLocations.set(carData.lane, carData.location);
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.raceConnectionService.segments$.subscribe(segment => {
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.raceConnectionService.reactionTimes$.subscribe(rt => {
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.raceConnectionService.standingsUpdate$.subscribe(update => {
      if (update && update.updates) {
        update.updates.forEach(u => {
          if (u.objectId) {
            this.driverRankings.set(u.objectId, u.rank || 0);
          }
        });
      }
      this.sortHeatDrivers();
    }));

    this.subscriptions.push(this.raceConnectionService.interfaceEvents$.subscribe(event => {
      this.isInterfaceConnected = this.raceConnectionService.isInterfaceConnected;
      this.cdr.detectChanges();
    }));

    this.subscriptions.push(this.raceConnectionService.interfaceAlert$.subscribe(alert => {
      if (alert.titleKey === 'ACK_MODAL_TITLE_CONNECTED') {
        if (this.showAckModal) {
          this.showInterfaceError(alert.titleKey, alert.messageKey);
        }
      } else {
        this.showInterfaceError(alert.titleKey, alert.messageKey);
      }
    }));

    this.subscriptions.push(this.raceConnectionService.raceState$.subscribe(state => {
      this.raceState = state;
      if (state === com.antigravity.RaceState.RACING) {
        this.hasRacedInCurrentHeat = true;
      }
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));
  }



  private leaderBoardWindow: Window | null = null;
  private heatResultsWindow: Window | null = null;

  ngOnDestroy() {
    this.isDestroyed = true;
    this.raceConnectionService.disconnect();

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    if (this.leaderBoardWindow) {
      this.leaderBoardWindow.close();
      this.leaderBoardWindow = null;
    }
    if (this.heatResultsWindow) {
      this.heatResultsWindow.close();
      this.heatResultsWindow = null;
    }
  }

  private showInterfaceError(titleKey: string, messageKey: string) {
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.showAckModal = true;
    this.cdr.detectChanges();
  }

  onAcknowledgeModal() {
    this.showAckModal = false;
  }

  private sortHeatDrivers() {
    if (!this.heat) return;

    const settings = this.settingsService.getSettings();
    if (settings.sortByStandings) {
      this.sortedHeatDrivers = [...this.heat.heatDrivers].sort((a, b) => {
        const rankA = this.driverRankings.get(a.objectId) ?? 999;
        const rankB = this.driverRankings.get(b.objectId) ?? 999;
        return rankA - rankB;
      });
    } else {
      // Sort by lane index (static order)
      this.sortedHeatDrivers = [...this.heat.heatDrivers].sort((a, b) => a.laneIndex - b.laneIndex);
    }
    this.cdr.detectChanges();
  }

  private detectShortcutKey() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    if (isMac) {
      this.startResumeShortcut = 'Cmd+S';
      this.pauseShortcut = 'Cmd+P';
      this.nextHeatShortcut = 'Cmd+N';
      this.restartHeatShortcut = 'Cmd+R';
      this.skipHeatShortcut = 'Cmd+F5';
      this.deferHeatShortcut = 'Cmd+F6';
    }
  }

  private loadRaceData() {
    console.log('RacedayComponent: Loading race data...');

    const race = this.raceService.getRace();
    if (race) {
      console.log('RacedayComponent: using selected race:', race);
      console.log('RacedayComponent: Race tracks/lanes:', race.track, race.track?.lanes);
      this.race = race;
      this.track = race.track;
      this.loadColumns();
      this.initializeHeat();
    } else {
      console.log('RacedayComponent: Waiting for race data...');
      // Do not throw error, wait for Race
    }
  }

  protected totalHeats: number = 0;

  // ... existing properties ...

  private initializeHeat() {
    if (!this.track) return;

    const heats = this.raceService.getHeats();
    if (heats && heats.length > 0) {
      console.log('RacedayComponent: Using heats from server:', heats);
      this.totalHeats = heats.length;
      const prevHeatNumber = this.heat?.heatNumber;
      this.heat = this.raceService.getCurrentHeat();
      console.log('RacedayComponent: Current Heat:', this.heat);

      if (this.heat && this.heat.heatNumber !== prevHeatNumber) {
        console.log(`RacedayComponent: Heat changed from ${prevHeatNumber} to ${this.heat.heatNumber}. Resetting hasRacedInCurrentHeat.`);
        this.hasRacedInCurrentHeat = false;
      }

      // Initialize rankings
      this.driverRankings.clear();
      if (this.heat) {
        console.log('RacedayComponent: Heat drivers:', this.heat.heatDrivers);
        this.heat.heatDrivers.forEach((hd, idx) => {
          console.log(`Driver ${idx}:`, hd);
          if (hd) {
            console.log(`Driver ${idx} details:`, hd.driver.name);
          }
        });

        if (this.heat.standings && this.heat.standings.length > 0) {
          this.heat.standings.forEach((sid, index) => this.driverRankings.set(sid, index + 1));
        } else {
          // Default to initial order if no standings yet
          this.heat.heatDrivers.forEach((hd, index) => this.driverRankings.set(hd.objectId, index + 1));
        }
      }

      this.sortHeatDrivers();
      this.cdr.detectChanges();
    } else {
      console.warn('RacedayComponent: No heats available from server.');
    }
  }

  // Get translated column label
  getColumnLabel(column: ColumnDefinition): string {
    const translation = this.translationService.translate(column.labelKey);
    if (column.propertyName.startsWith('segmentTime')) {
      const segmentColumns = this.columns.filter(c => c.propertyName.startsWith('segmentTime'));
      if (segmentColumns.length > 1) {
        const parts = column.propertyName.split('_');
        const index = parts.length > 1 ? parseInt(parts[1], 10) + 1 : 1;
        return `${translation} ${index}`;
      }
    }
    return translation;
  }

  // Helper method to get column X position
  getColumnX(columnIndex: number): number {
    if (!this.columns || this.columns.length === 0) return 0;
    let x = 0; // Start position
    const limit = Math.min(columnIndex, this.columns.length);
    for (let i = 0; i < limit; i++) {
      x += this.columns[i].width;
    }
    return x;
  }

  // Helper method to get column center X position
  getColumnCenterX(columnIndex: number): number {
    if (!this.columns || !this.columns[columnIndex]) return 0;
    return this.getColumnX(columnIndex) + (this.columns[columnIndex].width / 2);
  }

  getRowHeight(): number {
    return 560 / (this.track?.lanes?.length || 1);
  }

  getImageMetrics(colIndex: number) {
    const rowHeight = this.getRowHeight();
    const column = this.columns ? this.columns[colIndex] : undefined;
    const colWidth = column ? column.width : 100;

    // Scale to fit both row height (80%) and column width (90%)
    // Added 0.9 multiplier for column width to give some breathing room
    const targetSize = Math.min(rowHeight * 0.8, colWidth * 0.9);

    return {
      width: targetSize,
      height: targetSize,
      x: this.getColumnCenterX(colIndex) - (targetSize / 2),
      y: (rowHeight - targetSize) / 2
    };
  }

  // Helper method to get column text X position
  getColumnTextX(columnIndex: number, anchor?: any): number {

    const column = this.columns ? this.columns[columnIndex] : undefined;
    if (!column) return 0;

    const xBase = this.getColumnX(columnIndex);
    const width = column.width;
    const padding = column.padding || 10;
    const targetAnchor = anchor || column.anchor;

    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return xBase + padding;
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return xBase + width - padding;
      case AnchorPoint.TopCenter:
      case AnchorPoint.CenterCenter:
      case AnchorPoint.BottomCenter:
      default:
        return xBase + (width / 2);
    }
  }

  // Helper method to get column text Y position
  getColumnTextY(columnIndex: number, hasTeam: boolean = false, anchor?: any): number {
    const rowHeight = 560 / (this.track?.lanes?.length || 8);
    const targetAnchor = anchor || AnchorPoint.CenterCenter;

    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.TopCenter:
      case AnchorPoint.TopRight:
        return rowHeight * 0.22; // Adjusted from 0.18 for better spacing
      case AnchorPoint.BottomLeft:
      case AnchorPoint.BottomCenter:
      case AnchorPoint.BottomRight:
        return rowHeight * 0.78; // Adjusted from 0.82 for better spacing
      default:
        return rowHeight * 0.52; // Slightly adjusted from 0.55
    }
  }

  // Helper method to get SVG text-anchor
  getColumnTextAnchor(columnIndex: number, anchor?: any): string {

    const column = this.columns ? this.columns[columnIndex] : undefined;
    if (!column) return 'middle';

    const targetAnchor = anchor || column.anchor;
    switch (targetAnchor) {
      case AnchorPoint.TopLeft:
      case AnchorPoint.CenterLeft:
      case AnchorPoint.BottomLeft:
        return 'start';
      case AnchorPoint.TopRight:
      case AnchorPoint.CenterRight:
      case AnchorPoint.BottomRight:
        return 'end';
      default:
        return 'middle';
    }
  }


  // Helper method to get max width for column text
  getColumnMaxWidth(columnIndex: number): number {
    const column = this.columns ? this.columns[columnIndex] : undefined;
    if (!column) return 0;
    return column.width - (column.padding * 2);
  }

  // Helper method to get font size based on anchor
  getAnchorFontSize(anchor: string): number {
    switch (anchor) {
      case AnchorPoint.CenterCenter:
        return 45;
      default:
        return 20;
    }
  }



  // Helper method to get value from HeatDriver using property path
  getPropertyValue(heatDriver: DriverHeatData, propertyPath: string): any {
    if (!heatDriver) return undefined;

    // Strip suffixes like _1, _2 from each part if they exist
    const parts = propertyPath.split('.').map(part => part.split('_')[0]);
    let value: any = heatDriver;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value;
  }

  formatColumnValue(heatDriver: DriverHeatData, column: ColumnDefinition, propertyName?: string): string {
    const prop = propertyName || column.propertyName;
    // Use column formatter if it's the main property for this column
    if (prop === column.propertyName && column.formatter) {
      return column.formatter(this.getPropertyValue(heatDriver, prop), heatDriver, column);
    }
    const value = this.getPropertyValue(heatDriver, prop);
    return this.formatValue(prop, value, heatDriver, column);
  }


  // Menu logic
  isMenuOpen = false;
  isFileMenuOpen = false;
  scale: number = 1;



  @HostListener('window:resize')
  onResize() {
    this.updateScale();
  }

  private updateScale() {
    const targetWidth = 1600;
    const targetHeight = 900; // 900 (Total SVG height including menu)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;

    this.scale = Math.min(scaleX, scaleY);
  }

  toggleMenu() {
    console.log('Toggling Race Director menu. Current state:', this.isMenuOpen);
    this.isMenuOpen = !this.isMenuOpen;
    this.isFileMenuOpen = false; // Close other menus
    this.isWindowsMenuOpen = false;
    this.isLanesMenuOpen = false;
  }

  toggleFileMenu() {
    console.log('Toggling File menu. Current state:', this.isFileMenuOpen);
    this.isFileMenuOpen = !this.isFileMenuOpen;
    this.isMenuOpen = false; // Close other menus
    this.isWindowsMenuOpen = false;
    this.isLanesMenuOpen = false;
  }

  isWindowsMenuOpen = false;
  isLanesMenuOpen = false;

  toggleWindowsMenu() {
    console.log('Toggling Windows menu. Current state:', this.isWindowsMenuOpen);
    this.isWindowsMenuOpen = !this.isWindowsMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isLanesMenuOpen = false;
  }

  toggleLanesMenu() {
    console.log('Toggling Lanes menu. Current state:', this.isLanesMenuOpen);
    this.isLanesMenuOpen = !this.isLanesMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
    this.isWindowsMenuOpen = false;
  }

  onMenuSelect(action: string) {
    // Enforce disabled states
    if (action === 'START_RESUME' && this.isStartResumeDisabled) return;
    if (action === 'PAUSE' && this.isPauseDisabled) return;
    if (action === 'NEXT_HEAT' && this.isNextHeatDisabled) return;
    if (action === 'RESTART_HEAT' && this.isRestartHeatDisabled) return;
    if (action === 'SKIP_HEAT' && this.isSkipHeatDisabled) return;
    if (action === 'DEFER_HEAT' && this.isDeferHeatDisabled) return;
    if (action === 'SKIP_RACE' && this.isSkipRaceDisabled) return;
    if (action === 'MODIFY' && this.isModifyDisabled) return;
    if (action === 'ADD_LAP' && this.isAddLapDisabled) return;
    if (action === 'EDIT_LAPS' && this.isEditLapsDisabled) return;

    this.isMenuOpen = false;
    console.log('Menu Action Selected:', action);
    if (action === 'START_RESUME') {
      this.dataService.startRace().subscribe(success => {
        if (success) {
          console.log('Race start command sent successfully');
        } else {
          console.error('Failed to send race start command');
        }
      }, error => {
        console.error('Error starting race:', error);
      });
    } else if (action === 'PAUSE') {
      this.dataService.pauseRace().subscribe(success => {
        if (success) {
          console.log('Race pause command sent successfully');
        } else {
          console.error('Failed to send race pause command');
        }
      }, error => {
        console.error('Error pausing race:', error);
      });
    } else if (action === 'NEXT_HEAT') {
      this.dataService.nextHeat().subscribe(success => {
        if (success) {
          console.log('Next heat command sent successfully');
        } else {
          console.error('Failed to send next heat command');
        }
      }, error => {
        console.error('Error moving to next heat:', error);
      });
    } else if (action === 'RESTART_HEAT') {
      this.dataService.restartHeat().subscribe(success => {
        if (success) {
          console.log('Restart heat command sent successfully');
        } else {
          console.error('Failed to send restart heat command');
        }
      }, error => {
        console.error('Error restarting heat:', error);
      });
    } else if (action === 'SKIP_HEAT') {
      this.dataService.skipHeat().subscribe(success => {
        if (success) {
          console.log('Skip heat command sent successfully');
        } else {
          console.error('Failed to send skip heat command');
        }
      }, error => {
        console.error('Error skipping heat:', error);
      });
    } else if (action === 'DEFER_HEAT') {
      this.dataService.deferHeat().subscribe(success => {
        if (success) {
          console.log('Defer heat command sent successfully');
        } else {
          console.error('Failed to send defer heat command');
        }
      }, error => {
        console.error('Error deferring heat:', error);
      });
    }
    this.isMenuOpen = false;
  }

  activeMenu: string | null = null;
  showExitConfirmation = false;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    $event.returnValue = true;
  }

  @HostListener('window:unload', ['$event'])
  onUnload($event: any) {
    if (this.leaderBoardWindow) {
      this.leaderBoardWindow.close();
      this.leaderBoardWindow = null;
    }
    if (this.heatResultsWindow) {
      this.heatResultsWindow.close();
      this.heatResultsWindow = null;
    }
  }

  onFileMenuSelect(action: string) {
    console.log('File menu action:', action);
    // Assuming 'activeMenu' is a property that controls which menu is open.
    // If not defined, it might need to be added to the class properties.
    // For now, we'll assume it exists or is intended to be added.
    // The original `this.isFileMenuOpen = false;` is removed as per the instruction's snippet.
    this.activeMenu = null;
    this.isFileMenuOpen = false;
    if (action === 'EXIT') {
      this.showExitConfirmation = true;
    } else if (action === 'EXPORT_CSV') {
      this.exportToCsv();
    } else if (action === 'SAVE') {
      // Save logic here
    }
  }

  async exportToCsv() {
    try {
      const suggestedName = `race_export_${this.race?.name || 'data'}.csv`;
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: suggestedName,
        types: [{
          description: 'CSV Files',
          accept: { 'text/csv': ['.csv'] },
        }],
      });

      this.dataService.exportRaceToCsv().subscribe({
        next: async (csvData: string) => {
          const writable = await handle.createWritable();
          await writable.write(csvData);
          await writable.close();
          console.log('CSV Exported successfully');
        },
        error: (err: any) => {
          console.error('Failed to export CSV', err);
        }
      });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User cancelled save');
        return;
      }
      console.error('Save error', err);
    }
  }

  onWindowMenuSelect(action: string) {
    if (action !== 'LEADER_BOARD' && action !== 'HEAT_RESULTS') {
      return;
    }
    console.log('Window menu action:', action);
    this.isWindowsMenuOpen = false;
    if (action === 'LEADER_BOARD') {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/leaderboard'])
      );
      this.leaderBoardWindow = window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
    } else if (action === 'HEAT_RESULTS') {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/heat-results'])
      );
      this.heatResultsWindow = window.open(url, '_blank', 'width=1600,height=900,menubar=no,toolbar=no,location=no,status=no');
    }
  }

  onLaneSelect(laneIndex: number) {
    console.log('Lane selected for Driver Station:', laneIndex);
    this.isLanesMenuOpen = false; // Close menu

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/driver-station', laneIndex])
    );
    window.open(url, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
  }

  onExitConfirm() {
    this.dataService.updateRaceSubscription(false);
    this.showExitConfirmation = false;
    this.router.navigate(['/raceday-setup']);
  }
  onExitCancel() {
    this.showExitConfirmation = false;
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUpEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      // Don't trigger if typing in an input field
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      const s = this.raceState;
      const RS = com.antigravity.RaceState;

      if (s === RS.HEAT_OVER) {
        if (!this.isNextHeatDisabled) {
          this.onMenuSelect('NEXT_HEAT');
        }
      } else if (s === RS.NOT_STARTED || s === RS.PAUSED) {
        if (!this.isStartResumeDisabled) {
          this.onMenuSelect('START_RESUME');
        }
      } else {
        if (!this.isPauseDisabled) {
          this.onMenuSelect('PAUSE');
        }
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Space bar
    if (event.code === 'Space') {
      // Don't trigger if typing in an input field
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      event.preventDefault(); // Prevent page scroll
      return;
    }

    // Ctrl+S or Cmd+S for Start/Resume
    if (isCtrlOrCmd && event.key === 's') {
      event.preventDefault(); // Prevent browser save dialog
      this.onMenuSelect('START_RESUME');
    }

    // Ctrl+P or Cmd+P for Pause
    if (isCtrlOrCmd && event.key === 'p') {
      event.preventDefault(); // Prevent print dialog
      this.onMenuSelect('PAUSE');
    }

    // Ctrl+N or Cmd+N for Next Heat
    if (isCtrlOrCmd && event.key === 'n') {
      event.preventDefault(); // Prevent new window
      this.onMenuSelect('NEXT_HEAT');
    }

    // Ctrl+R or Cmd+R for Restart Heat
    if (isCtrlOrCmd && event.key === 'r') {
      event.preventDefault(); // Prevent refresh
      this.onMenuSelect('RESTART_HEAT');
    }

    // Cmd+F5 or Alt+F5 for Skip Heat
    const isSkipHeatKey = (isCtrlOrCmd && event.key === 'F5') || (event.altKey && event.key === 'F5');
    if (isSkipHeatKey) {
      event.preventDefault();
      this.onMenuSelect('SKIP_HEAT');
    }

    // Cmd+F6 or Alt+F6 for Defer Heat
    const isDeferHeatKey = (isCtrlOrCmd && event.key === 'F6') || (event.altKey && event.key === 'F6');
    if (isDeferHeatKey) {
      event.preventDefault();
      this.onMenuSelect('DEFER_HEAT');
    }
  }

  // Menu State Helpers
  public get isStartResumeDisabled(): boolean {
    // Disabled if disconnected OR (Starting, Racing, HeatOver, RaceOver)
    // Note: User said "Starting: Start/Resume ... disabled", "Racing: Same as Starting", "Heat Over: Everything ... disabled"
    // Also technically disabled in PAUSED? No, Resume is allowed in Paused.
    // NOT_STARTED: Enabled.
    const s = this.raceState;
    return !this.isInterfaceConnected ||
      s === com.antigravity.RaceState.STARTING ||
      s === com.antigravity.RaceState.RACING ||
      s === com.antigravity.RaceState.HEAT_OVER ||
      s === com.antigravity.RaceState.RACE_OVER;
  }

  public get isPauseDisabled(): boolean {
    // Disabled if disconnected OR (NotStarted, Paused, HeatOver, RaceOver)
    // Enabled in STARTING? User didn't say disabled. Usually can pause countdown.
    // Enabled in RACING.
    const s = this.raceState; // Shortcut
    const RS = com.antigravity.RaceState;
    return !this.isInterfaceConnected ||
      s === RS.NOT_STARTED ||
      s === RS.PAUSED ||
      s === RS.HEAT_OVER ||
      s === RS.RACE_OVER;
  }

  public get isNextHeatDisabled(): boolean {
    const s = this.raceState;
    const RS = com.antigravity.RaceState;
    return s === RS.STARTING ||
      s === RS.RACING ||
      s === RS.PAUSED ||
      s === RS.RACE_OVER;
  }

  getCurrentFlagUrl(): string {
    const RS = com.antigravity.RaceState;
    const settings = this.settingsService.getSettings();
    const race = this.raceService.getRace();
    const scoring = race?.heat_scoring;

    let flagType: 'red' | 'green' | 'yellow' | 'white' | 'checkered' = 'red';

    switch (this.raceState) {
      case RS.NOT_STARTED:
      case RS.HEAT_OVER:
        flagType = 'red';
        break;
      case RS.STARTING:
        // Use yellow if heat is in progress (resuming), red if it hasn't started yet
        flagType = this.hasRacedInCurrentHeat ? 'yellow' : 'red';
        break;
      case RS.RACING:
        flagType = 'green';
        // Check for White Flag (1 lap to go)
        if (scoring?.finishMethod === FinishMethod.Lap && this.heat?.heatDrivers) {
          const lapsToFinish = scoring.finishValue;
          const anyDriverOneLapToGo = this.heat.heatDrivers.some(d => d.lapCount === lapsToFinish - 1);
          if (anyDriverOneLapToGo) {
            flagType = 'white';
          }
        }
        break;
      case RS.PAUSED:
        flagType = 'yellow';
        break;
      case RS.RACE_OVER:
        flagType = 'checkered';
        break;
      default:
        flagType = 'red';
    }

    // Check local settings first
    let url: string | undefined;
    if (flagType === 'red') url = settings.flagRed;
    if (flagType === 'green') url = settings.flagGreen;
    if (flagType === 'yellow') url = settings.flagYellow;
    if (flagType === 'white') url = settings.flagWhite;
    if (flagType === 'checkered') url = settings.flagCheckered;

    if (url) {
      // Check if it's a dead asset reference (e.g. after a DB reset)
      const isAssetUrl = url.startsWith('/assets/');
      // Only consider it a dead reference if we've successfully loaded at least one asset
      const assetExists = (isAssetUrl && this.assets.length > 0) ? this.assets.some(a => a.url === url) : true;

      if (assetExists) {
        const finalUrl = this.getFullUrl(url);
        console.log(`Flag resolution for ${flagType}: Using custom URL: ${finalUrl}`);
        return finalUrl;
      } else {
        console.log(`Flag resolution for ${flagType}: Custom URL ${url} is a dead asset reference, falling back to defaults.`);
      }
    }

    // Fallback to default assets
    const displayNames: { [key: string]: string } = {
      'red': 'Red Flag',
      'green': 'Green Flag',
      'yellow': 'Yellow Flag',
      'white': 'White Flag',
      'black': 'Black Flag',
      'checkered': 'Checkered Flag'
    };

    const displayName = displayNames[flagType];
    const slug = displayName.replace(/\s+/g, '_');
    // Strict match by name first, then by slugified name
    const defaultAsset = this.assets.find(a => a.name === displayName) ||
      this.assets.find(a => a.name === slug) ||
      this.assets.find(a => a.url?.includes(slug));

    if (defaultAsset) {
      const finalUrl = this.getFullUrl(defaultAsset.url);
      console.log(`Flag resolution for ${flagType}: Using default asset: ${defaultAsset.name} -> ${finalUrl}`);
      return finalUrl;
    }

    // Ultimate fallback
    // TODO(aufderheide): Remove this fallback and just and throw an error and/or do nothing
    console.warn(`Flag resolution for ${flagType}: No asset found, using ultimate fallback.`);
    return 'assets/images/crossed_racing_flags.png';
  }

  getFullUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('assets/')) return url;

    const serverUrl = this.dataService.serverUrl;
    if (!serverUrl || serverUrl.includes('undefined')) return url;

    // Ensure single slash between serverUrl and url
    const normalizedUrl = url.startsWith('/') ? url : '/' + url;
    return serverUrl + normalizedUrl;
  }

  public get isRestartHeatDisabled(): boolean {
    // Disabled in Starting, Racing.
    // "Heat Over: Everything... disabled".
    const s = this.raceState;
    const RS = com.antigravity.RaceState;
    return s === RS.STARTING ||
      s === RS.RACING ||
      s === RS.NOT_STARTED ||
      s === RS.HEAT_OVER ||
      s === RS.RACE_OVER;
  }

  public get isDeferHeatDisabled(): boolean {
    // Disabled in Starting, Racing.
    // "Heat Over: Everything... disabled".
    const s = this.raceState;
    const RS = com.antigravity.RaceState;
    return s !== RS.NOT_STARTED;
  }

  public get isSkipHeatDisabled(): boolean {
    const s = this.raceState;
    const RS = com.antigravity.RaceState;
    return s === RS.STARTING ||
      s === RS.RACING ||
      s === RS.HEAT_OVER ||
      s === RS.RACE_OVER;
  }

  public get isSkipRaceDisabled(): boolean {
    const s = this.raceState;
    return s === com.antigravity.RaceState.STARTING ||
      s === com.antigravity.RaceState.RACING ||
      s === com.antigravity.RaceState.RACE_OVER;
  }

  public get isAddLapDisabled(): boolean {
    // User said "except edit laps/add secions". Assuming ADD_LAP is "add secions" or similar allowed action?
    // Let's assume enabled.
    return false;
  }

  public get isModifyDisabled(): boolean {
    // "Heat Over: Everything... disabled".
    const s = this.raceState;
    const RS = com.antigravity.RaceState;
    return s === RS.RACE_OVER;
  }

  public get isEditLapsDisabled(): boolean {
    // Always enabled.
    return false;
  }

  private loadColumns() {
    const settings = this.settingsService.getSettings();
    let selectedColumns = settings.racedayColumns;
    if (!selectedColumns || selectedColumns.length === 0) {
      selectedColumns = Settings.DEFAULT_COLUMNS;
    }

    // Filter columns based on race settings
    const race = this.raceService.getRace();
    const isFuelRace = (race?.fuel_options?.enabled || race?.digital_fuel_options?.enabled) ?? false;
    const visibilityMap = settings.columnVisibility || {};

    selectedColumns = selectedColumns.filter(key => {
      const visibility = visibilityMap[key] || ColumnVisibility.Always;
      if (visibility === ColumnVisibility.Always) return true;
      if (visibility === ColumnVisibility.FuelRaceOnly) return isFuelRace;
      if (visibility === ColumnVisibility.NonFuelRaceOnly) return !isFuelRace;
      return true;
    });

    const nameKeys = ['driver.name', 'driver.nickname'];

    // Specific widths as per requirements
    // Time fields: 275
    // Lap count: 180
    // Name/Nickname: Remaining width (1600 - sum(other_widths))

    const fixedWidths: { [key: string]: number } = {
      'lapCount': 180,
      'reactionTime': 275,
      'lastLapTime': 275,
      'medianLapTime': 275,
      'averageLapTime': 275,
      'bestLapTime': 275,
      'gapLeader': 275,
      'gapPosition': 275,
      'driver.name': 400,
      'driver.nickname': 400,
      'driver.avatarUrl': 100,
      'participant.team.name': 275,
      'participant.fuelLevel': 180,
      'fuelCapacity': 180,
      'fuelPercentage': 180,
      'seed': 180,
      'rankHeat': 180,
      'rankOverall': 180,
      'mph': 275,
      'kph': 275,
      'fph': 275,
      'segmentTime': 275,
      'imageset': 180
    };

    let totalFixedWithoutResizingColumn = 0;
    let resizingColumnKey: string | null = null;

    // Find the first column containing name/nickname in its layout to use as resizing column
    for (const key of selectedColumns) {
      const layout = (settings.columnLayouts || {})[key] || { [AnchorPoint.CenterCenter]: key };
      const containsName = Object.values(layout).some(v => nameKeys.includes((v as string).split('_')[0]));

      if (containsName) {
        resizingColumnKey = key;
        break;
      }
    }

    // Fallback: if no column contains name, resize the first one that has multiple anchors, or the first name key itself
    if (!resizingColumnKey && selectedColumns.length > 0) {
      resizingColumnKey = selectedColumns[0];
    }

    // Sum up widths of all OTHER columns
    selectedColumns.forEach(key => {
      if (key === resizingColumnKey) return;
      const layout = (settings.columnLayouts || {})[key] || { [AnchorPoint.CenterCenter]: key };
      const primaryProp = layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;
      const baseKey = primaryProp.split('_')[0];
      totalFixedWithoutResizingColumn += fixedWidths[baseKey] || 275;
    });

    const remainingWidth = Math.max(300, 1600 - totalFixedWithoutResizingColumn);

    this.columns = selectedColumns.map(key => {
      const layout = (settings.columnLayouts || {})[key] || { [AnchorPoint.CenterCenter]: key };
      const primaryProp = layout[AnchorPoint.CenterCenter] || Object.values(layout)[0] || key;
      const baseKey = primaryProp.split('_')[0];

      const labelKey = this.getLabelKeyForColumn(key, layout);
      const isResizing = (key === resizingColumnKey);
      const width = isResizing ? remainingWidth : (fixedWidths[baseKey] || 275);
      const anchor = settings.columnAnchors[key] || AnchorPoint.CenterCenter;

      const renderer = (v: any, hd: DriverHeatData, col: ColumnDefinition) => {
        return this.formatValue(primaryProp, v, hd, col);
      };

      if (key.startsWith('imageset_')) {
        const assetId = key.replace('imageset_', '');
        const asset = this.findAssetById(assetId);
        const label = ''; // Hide label for image set columns on raceday

        const renderer = (v: any, hd: DriverHeatData, col: ColumnDefinition) => {
          return this.getSelectedImageFromSet(asset, v, hd);
        };

        return new ColumnDefinition(label, key, width, false, 'middle', 0, anchor, renderer, layout);
      }

      const finalLayout = this.reindexColumnLayout(layout);
      if (isResizing) {
        return new ColumnDefinition(labelKey, key, width, true, 'start', 30, anchor, renderer, finalLayout);
      }

      return new ColumnDefinition(labelKey, key, width, false, 'middle', 0, anchor, renderer, finalLayout);
    });
  }

  private reindexColumnLayout(layout: { [A in AnchorPoint]?: string }): { [A in AnchorPoint]?: string } {
    const anchorOrder = [
      AnchorPoint.TopLeft, AnchorPoint.TopCenter, AnchorPoint.TopRight,
      AnchorPoint.CenterLeft, AnchorPoint.CenterCenter, AnchorPoint.CenterRight,
      AnchorPoint.BottomLeft, AnchorPoint.BottomCenter, AnchorPoint.BottomRight
    ];

    let segmentCounter = 0;
    const newLayout = { ...layout };
    anchorOrder.forEach(anchor => {
      const prop = newLayout[anchor];
      if (prop && prop.split('_')[0] === 'segmentTime') {
        const newProp = segmentCounter === 0 ? 'segmentTime' : `segmentTime_${segmentCounter}`;
        newLayout[anchor] = newProp;
        segmentCounter++;
      }
    });
    return newLayout;
  }

  // Helper method to get the selected image URL from an image set based on value or fuel percentage
  private getSelectedImageFromSet(asset: any, value: any, hd: DriverHeatData): string {
    if (!asset || asset.type !== 'image_set' || !asset.images || asset.images.length === 0) {
      return '';
    }

    // If value is a string that explicitly points to an image in the set by name
    if (typeof value === 'string') {
      const match = asset.images.find((img: any) => img.name === value || img.url?.includes(value));
      if (match) return this.getFullUrl(match.url || '');
    }

    // Calculate fuel percentage if value is not provided or is a number
    const level = hd.participant?.fuelLevel;
    const race = this.raceService.getRace();
    const capacity = (this.track?.hasDigitalFuel() ? race?.digital_fuel_options?.capacity : race?.fuel_options?.capacity) || 100;

    let fuelPercentage = 0;
    if (typeof value === 'number') {
      fuelPercentage = value;
    } else if (level !== undefined && capacity !== undefined && capacity > 0) {
      fuelPercentage = (level / capacity) * 100;
    } else {
      return '';
    }

    // Special case: 0 percent should only be used if it is exactly 0
    if (fuelPercentage === 0) {
      const zeroImage = asset.images.find((img: any) => img.percentage === 0);
      if (zeroImage) return this.getFullUrl(zeroImage.url || '');
    }

    // Filter out 0 from candidates for non-zero percentages
    const candidates = asset.images.filter((img: any) => (img.percentage || 0) !== 0);
    if (candidates.length === 0) {
      // Fallback to any image if no non-zero ones exist
      return this.getFullUrl(asset.images[0].url || '');
    }

    // Find the image with percentage closest to current fuelPercentage
    let bestMatch = candidates[0];
    let minDiff = Math.abs((bestMatch.percentage || 0) - fuelPercentage);

    for (const img of candidates) {
      const diff = Math.abs((img.percentage || 0) - fuelPercentage);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = img;
      }
    }
    return this.getFullUrl(bestMatch.url || '');
  }

  private findAssetById(assetId: string): any {
    let asset = this.assets.find(a => a.model?.entityId === assetId);

    // Robustness: fallback for builtin fuel gauge if ID doesn't match
    if (!asset && assetId === 'fuel-gauge-builtin') {
      asset = this.assets.find(a => a.type === 'image_set' && a.name === 'Fuel Gauge');
    }

    return asset;
  }

  private isEmptyDriver(hd: DriverHeatData): boolean {
    if (!hd) return true;
    // TODO(aufderheide): An empty driver should be signified by a specific entity_id like
    // undefined or 0.  We shouldn't be looking at the name to figure out if it's a valid
    // driver or not.
    const name = hd.actualDriver?.name || hd.driver?.name;
    const entityId = hd.actualDriver?.entity_id ?? hd.participant?.driver?.entity_id;

    if (!name || name.trim() === '') {
      return true;
    }

    // A driver is empty IF it has the literal name "Empty" AND either an empty/missing entityId.
    // This avoids false positives on minimal mocks in unit/screendiff tests that omit IDs.
    return name === 'Empty' && (!entityId || entityId === '');
  }

  // Format any value based on property name
  formatValue(propertyName: string, value: any, hd: DriverHeatData, column?: ColumnDefinition): string {
    const baseKey = propertyName.split('_')[0];

    if (this.isEmptyDriver(hd)) {
      // Hide some columns for empty lanes.  All others not in this list should show the default formatting for the colunn.
      if (baseKey === 'seed' || baseKey === 'rankHeat' || baseKey === 'rankOverall') {
        return '';
      }
      if (baseKey === 'gapLeader' || baseKey === 'gapPosition') {
        return '--.---';
      }
    }

    if (baseKey.includes('LapTime') || baseKey === 'reactionTime') {
      return value > 0 ? value.toFixed(3) : '--.---';
    } else if (baseKey === 'gapLeader' || baseKey === 'gapPosition') {
      if (value === 0) return '--.---';
      const sign = value > 0 ? '+' : '';
      return sign + value.toFixed(3);
    } else if (baseKey === 'lapCount') {
      if (value === null || value === undefined || (value === 0 && hd.reactionTime === 0)) return '--';
      return value.toString();
    } else if (baseKey === 'driver.name') {
      if (this.isEmptyDriver(hd)) {
        return this.translationService.translate('RD_EMPTY_LANE');
      }
      return hd.actualDriver?.name || hd.driver.name;
    } else if (baseKey === 'driver.nickname') {
      if (this.isEmptyDriver(hd)) {
        return this.translationService.translate('RD_EMPTY_LANE');
      }
      return hd.actualDriver?.nickname || hd.driver.nickname || hd.driver.name;
    } else if (baseKey === 'participant.team.name') {
      return hd.participant?.team?.name || '';
    } else if (baseKey === 'participant.fuelLevel') {
      return value !== undefined ? value.toFixed(1) : '--.-';
    } else if (baseKey === 'fuelCapacity') {
      const race = this.raceService.getRace();
      const capacity = (this.track?.hasDigitalFuel() ? race?.digital_fuel_options?.capacity : race?.fuel_options?.capacity);
      return capacity !== undefined ? capacity.toFixed(1) : '--.-';
    } else if (baseKey === 'fuelPercentage') {
      const level = hd.participant?.fuelLevel;
      const race = this.raceService.getRace();
      const capacity = (this.track?.hasDigitalFuel() ? race?.digital_fuel_options?.capacity : race?.fuel_options?.capacity);
      if (level !== undefined && capacity !== undefined && capacity > 0) {
        const percentage = Math.round((level / capacity) * 100);
        return percentage + '%';
      }
      return '--%';
    } else if (baseKey === 'driver.avatarUrl') {
      return this.getFullUrl(value);
    } else if (baseKey === 'seed') {
      const seed = hd.participant?.seed;
      return seed ? `(${seed})` : '--';
    } else if (baseKey === 'rankHeat') {
      if (this.isEmptyDriver(hd)) return '';
      const rank = this.driverRankings.get(hd.objectId);
      return rank ? `(${rank})` : '--';
    } else if (baseKey === 'rankOverall') {
      if (this.isEmptyDriver(hd)) return '';
      const rank = hd.participant?.rank;
      return rank ? `(${rank})` : '--';
    } else if (baseKey === 'segmentTime') {
      const parts = propertyName.split('_');
      const index = parts.length > 1 ? parseInt(parts[1], 10) : 0;

      let useIndex = true;
      let segmentCount = 0;
      if (column) {
        // Check if this column has other segments in its layout
        segmentCount = Object.values(column.layout).filter(v => v?.startsWith('segmentTime')).length;
        if (segmentCount <= 1) {
          useIndex = false;
        }
      } else if (index === 0) {
        // Fallback for when column is missing: default to "most recent" for the base property
        useIndex = false;
      }

      if (useIndex) {
        // If propertyName is the bare 'segmentTime' but useIndex is true, we must re-calculate 
        // its actual relative index in this column's layout to be safe.
        let actualIndex = index;
        if (propertyName === 'segmentTime' && column) {
          // Find which anchor has this property
          const anchorOrder = [
            AnchorPoint.TopLeft, AnchorPoint.TopCenter, AnchorPoint.TopRight,
            AnchorPoint.CenterLeft, AnchorPoint.CenterCenter, AnchorPoint.CenterRight,
            AnchorPoint.BottomLeft, AnchorPoint.BottomCenter, AnchorPoint.BottomRight
          ];
          let counter = 0;
          for (const anchor of anchorOrder) {
            const p = column.layout[anchor];
            if (p && p.split('_')[0] === 'segmentTime') {
              if (p === 'segmentTime') {
                actualIndex = counter;
                break;
              }
              counter++;
            }
          }
        }

        const segmentVal = hd.currentLapSegments[actualIndex];
        return (segmentVal !== undefined && segmentVal > 0) ? segmentVal.toFixed(3) : '--.---';
      } else {
        // Fallback to "most recent" for single-segment columns or base property
        return hd.lastSegmentTime > 0 ? hd.lastSegmentTime.toFixed(3) : '--.---';
      }
    } else if (baseKey === 'mph' || baseKey === 'kph' || baseKey === 'fph') {
      const lastLapTime = hd.lastLapTime;
      const lane = this.track?.lanes?.[hd.laneIndex];
      const length = lane?.length;

      if (lastLapTime > 0 && length !== undefined && length > 0) {
        const fph = (length / lastLapTime) * 3600;
        if (baseKey === 'fph') return fph.toFixed(0);

        const mph = fph / 5280;
        if (baseKey === 'mph') return mph.toFixed(2);

        const kph = mph * 1.609344;
        if (baseKey === 'kph') return kph.toFixed(2);
      }
      return '--.--';
    }
    return value?.toString() ?? '';
  }

  private getLabelKeyForColumn(key: string, layout?: { [A in AnchorPoint]?: string }): string {
    const propertyKey = layout?.[AnchorPoint.CenterCenter] ||
      (layout ? Object.values(layout)[0] : null) ||
      key;

    const baseKey = propertyKey.split('_')[0];
    const labels: { [key: string]: string } = {
      'lapCount': 'RD_COL_LAP',
      'lastLapTime': 'RD_COL_LAP_TIME',
      'medianLapTime': 'RD_COL_MEDIAN_LAP',
      'averageLapTime': 'RD_COL_AVG_LAP',
      'bestLapTime': 'RD_COL_BEST_LAP',
      'gapLeader': 'RD_COL_GAP_LEADER',
      'gapPosition': 'RD_COL_GAP_POSITION',
      'reactionTime': 'RD_COL_REACTION_TIME',
      'participant.team.name': 'RD_COL_TEAM',
      'driver.name': 'RD_COL_NAME',
      'driver.nickname': 'RD_COL_NICKNAME',
      'participant.fuelLevel': 'RD_COL_FUEL_LEVEL',
      'fuelCapacity': 'RD_COL_FUEL_CAPACITY',
      'fuelPercentage': 'RD_COL_FUEL_PERCENTAGE',
      'seed': 'RD_COL_SEED',
      'rankHeat': 'RD_COL_RANK_HEAT',
      'rankOverall': 'RD_COL_RANK_OVERALL',
      'mph': 'RD_COL_MPH',
      'kph': 'RD_COL_KPH',
      'fph': 'RD_COL_FPH',
      'segmentTime': 'RD_COL_SEGMENT_TIME',
      'driver.avatarUrl': 'RD_COL_AVATAR'
    };
    return labels[baseKey] ?? 'UNKNOWN';
  }

  protected trackByDriverId(index: number, hd: DriverHeatData): string {
    return hd.objectId;
  }

  getDropdownArrowBg(hd: DriverHeatData): string {
    const color = this.track.lanes[hd.laneIndex]?.foreground_color || '#ffffff';
    // Use an inline SVG with the correct fill color
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="${color}" d="M7 10l5 5 5-5z"/></svg>`;
    return `url("data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(svg)}")`;
  }

  getTeammates(hd: DriverHeatData): any[] {
    console.log(`getTeammates called for ${hd.driver?.name}. Team:`, hd.participant?.team);
    if (hd.participant && hd.participant.team) {
      const team = hd.participant.team;
      const teammates = this.allDrivers.filter(d => team.driverIds.includes(d.entity_id || d.id));
      console.log(`Found ${teammates.length} teammates in allDrivers:`, teammates);
      return teammates;
    }
    return [];
  }

  onTeammateChange(hd: DriverHeatData, event: any) {
    const driverId = event.target.value;
    const lane = hd.laneIndex;
    this.dataService.changeActualDriver(lane, driverId).subscribe({
      next: () => {
        console.log(`Teammate changed for lane ${lane} to ${driverId}`);
      },
      error: (err) => {
        console.error('Error changing teammate:', err);
        this.ackModalTitle = 'RD_ERR_DRIVER_CHANGE_TITLE';
        this.ackModalMessage = err.error || 'RD_ERR_DRIVER_CHANGE_MESSAGE';
        this.showAckModal = true;
        // Rollback select value
        if (event.target) {
          event.target.value = hd.actualDriver?.entity_id || hd.driver?.entity_id;
        }
      }
    });
  }

  isDriverSwapDisabled(hd: any): boolean {
    const race = this.raceService.getRace();
    if (!race?.team_options?.require_pit_stop_change_driver) {
      return false;
    }
    if (this.raceState !== com.antigravity.RaceState.RACING && this.raceState !== com.antigravity.RaceState.STARTING) {
      return false;
    }
    const location = this.carLocations.get(hd.laneIndex);
    if (location === undefined) return false;
    const inPit = location === 1 || location >= 2000;
    return !inPit;
  }

  getDriverStats(hd: any, driverId: string): string {
    let heatLaps = 0;
    let heatTime = 0;
    let overallLaps = 0;
    let overallTime = 0;

    if (hd.lapsWithDrivers) {
      hd.lapsWithDrivers.forEach((l: any) => {
        if (l.driverId === driverId) {
          heatLaps++;
          heatTime += l.time;
        }
      });
    }

    const heats = this.raceService.getHeats();
    if (heats) {
      heats.forEach((h: any) => {
        if (h.heatDrivers) {
          h.heatDrivers.forEach((d_hd: any) => {
            if (d_hd.lapsWithDrivers) {
              d_hd.lapsWithDrivers.forEach((l: any) => {
                if (l.driverId === driverId) {
                  overallLaps++;
                  overallTime += l.time;
                }
              });
            }
          });
        }
      });
    }

    const formatTime = (t: number) => {
      if (t >= 60) {
        const m = Math.floor(t / 60);
        const s = (t % 60).toFixed(1).padStart(4, '0');
        return `${m}:${s}`;
      }
      return `${t.toFixed(1)}s`;
    };

    return `(H: ${heatLaps} L / ${formatTime(heatTime)}, T: ${overallLaps} L / ${formatTime(overallTime)})`;
  }
}
