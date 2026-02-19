import { Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
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
        // Define columns to display with translation keys
        this.columns = [
            new ColumnDefinition('RD_COL_NAME', 'driver.name', 480, true, 'start', 30),
            new ColumnDefinition('RD_COL_LAP', 'lapCount', 275),
            new ColumnDefinition('RD_COL_LAP_TIME', 'lastLapTime', 275),
            new ColumnDefinition('RD_COL_MEDIAN_LAP', 'medianLapTime', 275),
            new ColumnDefinition('RD_COL_BEST_LAP', 'bestLapTime', 275),
        ];
    }

    protected driverRankings = new Map<string, number>();
    protected isInterfaceConnected: boolean = false;
    protected raceState: com.antigravity.RaceState = com.antigravity.RaceState.UNKNOWN_STATE;
    protected assets: any[] = [];
    protected hasRacedInCurrentHeat: boolean = false;

    private driversLoaded = false;
    private pendingUpdate: com.antigravity.IRace | null = null;

    ngOnInit() {
        console.log('RacedayComponent: Initializing...');

        // Clear caches to ensure fresh data for new race
        RaceConverter.clearCache();
        DriverConverter.clearCache();
        HeatConverter.clearCache();
        TrackConverter.clearCache();
        LaneConverter.clearCache();

        this.dataService.listAssets().subscribe(assets => {
            this.assets = assets?.filter((a: any) => a.type === 'image') || [];
            this.cdr.detectChanges();
        });

        // Hydrate Driver Converter with all known drivers from DB to handle ID-only references in Proto
        this.dataService.getDrivers().subscribe({
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
        });

        this.detectShortcutKey();
        this.updateScale();

        // Subscribe to race data
        this.dataService.updateRaceSubscription(true);

        // Listen for Race Update to initialize race data
        this.dataService.getRaceUpdate().subscribe(update => {
            if (this.driversLoaded) {
                this.processRaceUpdate(update);
            } else {
                console.log('RacedayComponent: Deferring race update until drivers are hydrated.');
                this.pendingUpdate = update;
            }
        });

        this.dataService.getRaceTime().subscribe(time => {
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
            this.cdr.detectChanges();
        });

        this.dataService.getLaps().subscribe(lap => {
            console.log('Lap Received:', lap);
            // Locate driver by objectId from the lap message
            if (this.heat && this.heat.heatDrivers && lap && lap.objectId) {
                const driverData = this.heat.heatDrivers.find(d => d.objectId === lap.objectId);
                if (driverData) {
                    driverData.addLapTime(lap.lapNumber!, lap.lapTime!, lap.averageLapTime!, lap.medianLapTime!, lap.bestLapTime!);
                    this.cdr.detectChanges();

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
        });

        this.dataService.getReactionTimes().subscribe(rt => {
            if (this.heat && this.heat.heatDrivers && rt && rt.objectId) {
                const driver = this.heat.heatDrivers.find(d => d.objectId === rt.objectId);
                if (driver) {
                    driver.reactionTime = rt.reactionTime!;
                    this.cdr.detectChanges();
                }
            }
        });

        this.dataService.getStandingsUpdate().subscribe(update => {
            console.log('RacedayComponent: Received Standings Update:', update);
            if (this.heat && update.updates) {
                update.updates.forEach(u => {
                    if (u.objectId) this.driverRankings.set(u.objectId, u.rank || 0);
                });

                this.sortHeatDrivers();
            }
        });

        this.dataService.getOverallStandingsUpdate().subscribe(update => {
            console.log('RacedayComponent: Received Overall Standings Update:', update);
            if (update.participants) {
                const participants = update.participants.map(p => RaceParticipantConverter.fromProto(p));
                this.raceService.setParticipants(participants);
            }
        });

        this.dataService.getInterfaceEvents().subscribe(event => {
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
                this.cdr.detectChanges();
            }
        });

        this.dataService.getRaceState().subscribe(state => {
            this.raceState = state;
            if (state === com.antigravity.RaceState.RACING) {
                this.hasRacedInCurrentHeat = true;
            }
            this.cdr.detectChanges();
        });

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
        this.dataService.updateRaceSubscription(false);
        this.dataService.disconnectFromInterfaceDataSocket();

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

        this.sortedHeatDrivers = [...this.heat.heatDrivers].sort((a, b) => {
            const rankA = this.driverRankings.get(a.objectId) ?? 999;
            const rankB = this.driverRankings.get(b.objectId) ?? 999;
            return rankA - rankB;
        });
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
        let x = 20; // Start position
        for (let i = 0; i < columnIndex; i++) {
            x += this.columns[i].width;
        }
        return x;
    }

    // Helper method to get column center X position
    getColumnCenterX(columnIndex: number): number {
        return this.getColumnX(columnIndex) + (this.columns[columnIndex].width / 2);
    }

    // Helper method to get column text X position
    getColumnTextX(columnIndex: number): number {
        const column = this.columns[columnIndex];
        if (column.textAnchor === 'start') {
            return this.getColumnX(columnIndex) + column.padding;
        }
        return this.getColumnCenterX(columnIndex);
    }

    // Helper method to get max width for column text
    getColumnMaxWidth(columnIndex: number): number {
        const column = this.columns[columnIndex];
        return column.width - (column.padding * 2);
    }

    // Helper method to get value from HeatDriver using property path
    getPropertyValue(heatDriver: DriverHeatData, propertyPath: string): any {
        if (!heatDriver) return undefined;
        const parts = propertyPath.split('.');
        let value: any = heatDriver;
        for (const part of parts) {
            if (value === undefined || value === null) return undefined;
            value = value[part];
        }
        return value;
    }

    // Helper method to format column value for display
    formatColumnValue(heatDriver: DriverHeatData, column: ColumnDefinition): string {
        const value = this.getPropertyValue(heatDriver, column.propertyName);

        // Special handling for Name column
        if (column.propertyName === 'driver.name') {
            if (heatDriver.actualDriver && heatDriver.actualDriver.name) {
                return heatDriver.actualDriver.name;
            }
            return heatDriver.driver.name;
        }

        // Format numeric lap times
        if (column.propertyName.includes('LapTime')) {
            return value > 0 ? value.toFixed(3) : '--';
        }

        // Return value as-is for other types
        return value !== undefined && value !== null ? value.toString() : '--';
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
        const targetHeight = 930; // 900 (SVG) + 30 (Menu)
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
        return s === com.antigravity.RaceState.STARTING ||
            s === com.antigravity.RaceState.RACING ||
            s === com.antigravity.RaceState.PAUSED;
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

    protected trackByDriverId(index: number, hd: DriverHeatData): string {
        return hd.objectId;
    }


}
