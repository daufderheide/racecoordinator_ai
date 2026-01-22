import { Component, ElementRef, HostListener, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
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

import { ColumnDefinition } from './column_definition';

/**
 * The raceday component is the main component for the raceday screen.
 */
@Component({
    selector: 'app-raceday',
    templateUrl: './raceday.component.html',
    styleUrls: ['./raceday.component.css'],
    standalone: false
})
export class RacedayComponent implements OnInit {
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

    constructor(
        private translationService: TranslationService,
        private dataService: DataService,
        private raceService: RaceService,
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

    ngOnInit() {
        console.log('RacedayComponent: Initializing...');

        // Clear caches to ensure fresh data for new race
        RaceConverter.clearCache();
        DriverConverter.clearCache();
        HeatConverter.clearCache();
        TrackConverter.clearCache();
        LaneConverter.clearCache();

        this.detectShortcutKey();
        this.updateScale();

        // Subscribe to race data
        this.dataService.updateRaceSubscription(true);

        // Listen for Race Update to initialize race data
        this.dataService.getRaceUpdate().subscribe(update => {
            console.log('RacedayComponent: Received Race:', update);
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

            this.previousTime = this.time; // Store LAST displayed time, which is now current
            this.time = time;
            this.cdr.detectChanges();
        });

        this.dataService.getLaps().subscribe(lap => {
            // Locate driver by objectId from the lap message
            if (this.heat && this.heat.heatDrivers && lap && lap.objectId) {
                const driver = this.heat.heatDrivers.find(d => d.objectId === lap.objectId);
                if (driver) {
                    driver.addLapTime(lap.lapNumber!, lap.lapTime!, lap.averageLapTime!, lap.medianLapTime!, lap.bestLapTime!);
                    this.cdr.detectChanges();
                } else {
                    // Throw error if driver not found for given objectId
                    throw new Error(`Lap objectId ${lap.objectId} not found among heat drivers`);
                }
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
            this.heat = this.raceService.getCurrentHeat();
            console.log('RacedayComponent: Current Heat:', this.heat);

            // Initialize rankings
            this.driverRankings.clear();
            if (this.heat) {
                console.log('RacedayComponent: Heat drivers:', this.heat.heatDrivers);
                this.heat.heatDrivers.forEach((hd, idx) => {
                    console.log(`Driver ${idx}:`, hd);
                    if (hd) {
                        console.log(`Driver ${idx} details:`, hd.participant?.driver?.name);
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
            this.router.navigate(['/leaderboard']);
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

    protected trackByDriverId(index: number, hd: DriverHeatData): string {
        return hd.objectId;
    }
}
