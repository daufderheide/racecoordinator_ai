import { Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Heat } from '../../race/heat';
import { DriverHeatData } from '../../race/driver_heat_data';
import { Track } from 'src/app/models/track';
import { TranslationService } from 'src/app/services/translation.service';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';
import { RaceConverter } from 'src/app/converters/race.converter';
import { DriverConverter } from 'src/app/converters/driver.converter';
import { HeatConverter } from 'src/app/converters/heat.converter';
import { TrackConverter } from 'src/app/converters/track.converter';
import { LaneConverter } from 'src/app/converters/lane.converter';
import { RaceParticipantConverter } from 'src/app/converters/race_participant.converter';
import { playSound } from 'src/app/utils/audio';
import { com } from 'src/app/proto/message';
import { SettingsService } from 'src/app/services/settings.service';
import { AnchorPoint } from './column_definition';
import { Settings } from 'src/app/models/settings';
import { FinishMethod } from 'src/app/models/heat_scoring';
import InterfaceStatus = com.antigravity.InterfaceStatus;


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

  private previousTime: number = 0;

  // Acknowledgement Modal State
  showAckModal = false;
  ackModalTitle = '';
  ackModalMessage = '';
  ackModalButtonText = 'ACK_MODAL_BTN_OK';

  private wasInterfaceErrorShown = false;
  private disconnectedTimeout: any;
  private noStatusWatchdog: any;
  private lastInterfaceStatus: InterfaceStatus | number = -1;
  private readonly WATCHDOG_TIMEOUT = 5000;


  constructor(
    private translationService: TranslationService,
    private dataService: DataService,
    private raceService: RaceService,
    private settingsService: SettingsService,
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
      this.assets = assets?.filter((a: any) => a.type === 'image') || [];
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    // Hydrate Driver Converter with all known drivers from DB to handle ID-only references in Proto
    this.subscriptions.push(this.dataService.getDrivers().subscribe({
      next: (drivers) => {
        console.log(`RacedayComponent: Hydrating ${drivers.length} drivers into cache.`);
        drivers.forEach(d => {
          const driver = DriverConverter.fromJSON(d);
          DriverConverter.register(driver);
        });
        console.log('RacedayComponent: Hydration COMPLETE. Current Cache Keys:', (DriverConverter as any).cache.getKeys());
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          console.log('RacedayComponent: Processing pending race update after hydration.');
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      },
      error: (err) => {
        console.error('RacedayComponent: Failed to load drivers for hydration', err);
        // Proceed anyway to avoid blocking execution, though names might be missing
        this.driversLoaded = true;
        if (this.pendingUpdate) {
          this.processRaceUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
      }
    }));

    this.detectShortcutKey();
    this.updateScale();

    // Subscribe to race data
    this.dataService.updateRaceSubscription(true);

    // Listen for Race Update to initialize race data
    this.subscriptions.push(this.dataService.getRaceUpdate().subscribe(update => {
      if (this.driversLoaded) {
        this.processRaceUpdate(update);
      } else {
        console.log('RacedayComponent: Deferring race update until drivers are hydrated.');
        this.pendingUpdate = update;
      }
    }));

    this.subscriptions.push(this.dataService.getRaceTime().subscribe(time => {
      // Determine timer direction and format
      // If new time > previous time (and not 0 reset), it's increasing -> Whole Numbers
      // If new time < previous time, it's decreasing -> Check for < 10s

      if (time > this.previousTime) {
        // Increasing
        this.timeFormat = '1.0-0';
      } else if (time < this.previousTime) {
        // Decreasing
        if (time < 10) {
          this.timeFormat = '1.2-2';
        } else {
          this.timeFormat = '1.0-0';
        }
      } else {
        // Equal (paused or no change), keep previous format or default?
        // If 0, assume default
        if (time === 0) this.timeFormat = '1.0-0';
      }

      // Fallback for initial state or reset
      if (this.previousTime === 0 && time > 0) {
        this.timeFormat = '1.0-0';
      }

      this.time = time;
      this.previousTime = time;
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    this.subscriptions.push(this.dataService.getLaps().subscribe(lap => {
      console.log('Lap Received:', lap);
      // Locate driver by objectId from the lap message
      if (this.heat && this.heat.heatDrivers && lap && lap.objectId) {
        const driverData = this.heat.heatDrivers.find(d => d.objectId === lap.objectId);
        if (driverData) {
          driverData.addLapTime(lap.lapNumber!, lap.lapTime!, lap.averageLapTime!, lap.medianLapTime!, lap.bestLapTime!);
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }

          // Audio Feedback
          const driver = driverData.driver;
          const isBestLap = lap.lapTime === lap.bestLapTime;

          console.log('Lap Audio Debug:', {
            driverName: driver.name,
            isBestLap,
            lapTime: lap.lapTime,
            bestLapTime: lap.bestLapTime,
            audioConfig: {
              bestSound: driver.bestLapAudio,
              lapSound: driver.lapAudio
            }
          });

          if (isBestLap && (driver.bestLapAudio.url || (driver.bestLapAudio.type === 'tts' && driver.bestLapAudio.text))) {
            // Play Best Lap Sound
            console.log('Triggering Best Lap Sound');
            playSound(driver.bestLapAudio.type, driver.bestLapAudio.url, driver.bestLapAudio.text, this.dataService.serverUrl);
          } else if (driver.lapAudio.url || (driver.lapAudio.type === 'tts' && driver.lapAudio.text)) {
            // Play Regular Lap Sound
            console.log('Triggering Regular Lap Sound');
            playSound(driver.lapAudio.type, driver.lapAudio.url, driver.lapAudio.text, this.dataService.serverUrl);
          } else {
            console.log('No audio configured for this driver/scenario');
          }
        } else {
          console.warn(`Lap objectId ${lap.objectId} not found among heat drivers. Heat Drivers:`, this.heat.heatDrivers.map(d => d.objectId));
        }
      } else {
        console.warn('Lap received but heat or drivers not ready', { heat: !!this.heat, lap: !!lap });
      }
    }));

    this.subscriptions.push(this.dataService.getReactionTimes().subscribe(rt => {
      if (this.heat && this.heat.heatDrivers && rt && rt.objectId) {
        const driver = this.heat.heatDrivers.find(d => d.objectId === rt.objectId);
        if (driver) {
          driver.reactionTime = rt.reactionTime!;
          if (!this.isDestroyed) {
            this.cdr.detectChanges();
          }
        }
      }
    }));

    this.subscriptions.push(this.dataService.getStandingsUpdate().subscribe(update => {
      if (this.heat && update.updates) {
        update.updates.forEach(u => {
          if (u.objectId) {
            this.driverRankings.set(u.objectId, u.rank || 0);

            // Apply gaps to the local driver data
            const driverData = this.heat!.heatDrivers.find(d => d.objectId === u.objectId);
            if (driverData) {
              driverData.gapLeader = u.gapLeader || 0;
              driverData.gapPosition = u.gapPosition || 0;
            }
          }
        });

        this.sortHeatDrivers();
      }
    }));

    this.subscriptions.push(this.dataService.getOverallStandingsUpdate().subscribe(update => {
      if (update.participants) {
        const participants = update.participants.map(p => RaceParticipantConverter.fromProto(p));
        this.raceService.setParticipants(participants);
      }
    }));

    this.subscriptions.push(this.dataService.getInterfaceEvents().subscribe(event => {
      if (event.status) {
        this.resetWatchdog();

        const status = event.status.status;
        if (status === this.lastInterfaceStatus) {
          return;
        }
        this.lastInterfaceStatus = status ?? -1;

        this.isInterfaceConnected = status === InterfaceStatus.CONNECTED;

        if (status === InterfaceStatus.NO_DATA) {
          this.showInterfaceError('ACK_MODAL_TITLE_NO_DATA', 'ACK_MODAL_MSG_NO_DATA');
        } else if (status === InterfaceStatus.DISCONNECTED) {
          this.scheduleDisconnectedError();
        } else if (status === InterfaceStatus.CONNECTED) {
          this.clearDisconnectedError();
          if (this.wasInterfaceErrorShown) {
            this.showInterfaceError('ACK_MODAL_TITLE_CONNECTED', 'ACK_MODAL_MSG_CONNECTED');
          }
        }
        if (!this.isDestroyed) {
          this.cdr.detectChanges();
        }
      }
    }));

    this.subscriptions.push(this.dataService.getRaceState().subscribe(state => {
      this.raceState = state;
      if (state === com.antigravity.RaceState.RACING) {
        this.hasRacedInCurrentHeat = true;
      }
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    }));

    // Ensure we are connected to the interface socket to receive status updates
    this.dataService.connectToInterfaceDataSocket();

    // Start watchdog
    this.resetWatchdog();
  }

  private processRaceUpdate(update: com.antigravity.IRace) {
    console.log('RacedayComponent: Processing Race Update:', update);
    let raceDataChanged = false;

    if (update.race) {
      const race = RaceConverter.fromProto(update.race);
      this.raceService.setRace(race);
      raceDataChanged = true;
    }

    if (update.drivers && update.drivers.length > 0) {
      const participants = update.drivers.map(d => RaceParticipantConverter.fromProto(d));
      this.raceService.setParticipants(participants);
      raceDataChanged = true;
    }

    if (update.heats && update.heats.length > 0) {
      const heats = update.heats.map((h, index) => HeatConverter.fromProto(h, index + 1));
      this.raceService.setHeats(heats);
      raceDataChanged = true;
    }

    if (update.currentHeat) {
      const currentHeat = HeatConverter.fromProto(update.currentHeat);
      this.raceService.setCurrentHeat(currentHeat);
      raceDataChanged = true;
    }

    if (raceDataChanged) {
      this.loadRaceData();
      // Force change detection and update scale just in case
      this.cdr.detectChanges();
      this.updateScale();
    }
  }

  private leaderBoardWindow: Window | null = null;

  ngOnDestroy() {
    this.isDestroyed = true;
    this.dataService.updateRaceSubscription(false);
    this.dataService.disconnectFromInterfaceDataSocket();

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    this.clearDisconnectedError();

    if (this.leaderBoardWindow) {
      this.leaderBoardWindow.close();
      this.leaderBoardWindow = null;
    }
  }

  private resetWatchdog() {
    if (this.noStatusWatchdog) clearTimeout(this.noStatusWatchdog);
    this.noStatusWatchdog = setTimeout(() => {
      this.lastInterfaceStatus = -1;
      this.showInterfaceError('ACK_MODAL_TITLE_NO_STATUS', 'ACK_MODAL_MSG_NO_STATUS');
    }, this.WATCHDOG_TIMEOUT);
  }

  private showInterfaceError(titleKey: string, messageKey: string) {
    this.clearDisconnectedError();
    this.ackModalTitle = titleKey;
    this.ackModalMessage = messageKey;
    this.showAckModal = true;
    this.wasInterfaceErrorShown = true;
    this.cdr.detectChanges();
  }

  private scheduleDisconnectedError() {
    if (this.disconnectedTimeout) return; // Already scheduled
    this.disconnectedTimeout = setTimeout(() => {
      this.showInterfaceError('ACK_MODAL_TITLE_DISCONNECTED', 'ACK_MODAL_MSG_DISCONNECTED');
    }, 5000);
  }

  private clearDisconnectedError() {
    if (this.disconnectedTimeout) {
      clearTimeout(this.disconnectedTimeout);
      this.disconnectedTimeout = null;
    }
  }

  onAcknowledgeModal() {
    this.showAckModal = false;
    if (this.ackModalTitle === 'ACK_MODAL_TITLE_CONNECTED') {
      this.wasInterfaceErrorShown = false;
    }
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
      this.track = race.track;
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
    return this.translationService.translate(column.labelKey);
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

  // Helper method to format column value for display
  formatColumnValue(heatDriver: DriverHeatData, column: ColumnDefinition, propertyName?: string): string {
    const prop = propertyName || column.propertyName;
    const value = this.getPropertyValue(heatDriver, prop);
    return this.formatValue(prop, value, heatDriver);
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
  }

  toggleFileMenu() {
    console.log('Toggling File menu. Current state:', this.isFileMenuOpen);
    this.isFileMenuOpen = !this.isFileMenuOpen;
    this.isMenuOpen = false; // Close other menus
    this.isWindowsMenuOpen = false;
  }

  isWindowsMenuOpen = false;
  toggleWindowsMenu() {
    console.log('Toggling Windows menu. Current state:', this.isWindowsMenuOpen);
    this.isWindowsMenuOpen = !this.isWindowsMenuOpen;
    this.isFileMenuOpen = false;
    this.isMenuOpen = false;
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
    } else if (action === 'SAVE') {
      // Save logic here
    }
  }

  onWindowMenuSelect(action: string) {
    console.log('Window menu action:', action);
    this.isWindowsMenuOpen = false;
    if (action === 'LEADER_BOARD') {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/leaderboard'])
      );
      this.leaderBoardWindow = window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
    }
  }

  onExitConfirm() {
    this.dataService.updateRaceSubscription(false);
    this.showExitConfirmation = false;
    this.router.navigate(['/raceday-setup']);
  }

  onExitCancel() {
    this.showExitConfirmation = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

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
    console.warn(`Flag resolution for ${flagType}: No asset found, using ultimate fallback.`);
    return 'assets/crossed_racing_flags.png';
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
      'participant.team.name': 275
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

      const renderer = (v: any, hd: DriverHeatData) => {
        return this.formatValue(baseKey, v, hd);
      };

      if (isResizing) {
        return new ColumnDefinition(labelKey, key, width, true, 'start', 30, anchor, renderer, layout);
      }

      return new ColumnDefinition(labelKey, key, width, false, 'middle', 0, anchor, renderer, layout);
    });
  }



  // Format any value based on property name
  formatValue(propertyName: string, value: any, hd: DriverHeatData): string {
    const baseKey = propertyName.split('_')[0];

    if (baseKey.includes('LapTime') || baseKey === 'reactionTime') {
      return value > 0 ? value.toFixed(3) : '--.---';
    } else if (baseKey === 'gapLeader' || baseKey === 'gapPosition') {
      if (value === 0) return '--.---';
      const sign = value > 0 ? '+' : '';
      return sign + value.toFixed(3);
    } else if (baseKey === 'lapCount') {
      if (value === 0 && hd.reactionTime === 0) return '--';
      return value.toString();
    } else if (baseKey === 'driver.name') {
      return hd.actualDriver?.name || hd.driver.name;
    } else if (baseKey === 'driver.nickname') {
      return hd.actualDriver?.nickname || hd.driver.nickname || hd.driver.name;
    } else if (baseKey === 'participant.team.name') {
      return hd.participant?.team?.name || '';
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
      'driver.nickname': 'RD_COL_NICKNAME'
    };
    return labels[baseKey] || 'UNKNOWN';
  }



  protected trackByDriverId(index: number, hd: DriverHeatData): string {
    return hd.objectId;
  }


}
