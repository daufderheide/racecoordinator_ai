import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Heat } from 'src/app/models/heat';
import { HeatDriver } from 'src/app/models/heat_driver';
import { Driver } from 'src/app/models/driver';
import { Track } from 'src/app/models/track';
import { Lane } from 'src/app/models/lane';
import { ColumnDefinition } from './column_definition';
import { TranslationService } from 'src/app/services/translation.service';
import { DataService } from 'src/app/data.service';
import { RaceService } from 'src/app/services/race.service';

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
    protected time: number = 0;
    protected timeFormat: string = '1.0-0';

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
            new ColumnDefinition('RD_COL_NAME', 'driver.nickname', 480, true, 'start', 30),
            new ColumnDefinition('RD_COL_LAP', 'lapCount', 275),
            new ColumnDefinition('RD_COL_LAP_TIME', 'lastLapTime', 275),
            new ColumnDefinition('RD_COL_MEDIAN_LAP', 'medianLapTime', 275),
            new ColumnDefinition('RD_COL_BEST_LAP', 'bestLapTime', 275),
        ];
    }

    ngOnInit() {
        console.log('RacedayComponent: Initializing...');
        this.detectShortcutKey();
        this.updateScale();
        this.loadRaceData();

        this.dataService.connectToRaceDataSocket();
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
    }

    private detectShortcutKey() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
        if (isMac) {
            this.startResumeShortcut = 'Cmd+S';
        }
    }

    private loadRaceData() {
        console.log('RacedayComponent: Loading race data...');

        const race = this.raceService.getRace();
        if (race) {
            console.log('RacedayComponent: using selected race:', race);
            this.track = race.track;
            this.initializeHeat();
        } else {
            const errorMsg = 'Error: No race selected. Please start from setup.';
            this.errorMessage = errorMsg;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    private initializeHeat() {
        if (!this.track) return;


        const selectedDrivers = this.raceService.getRacingDrivers();
        console.log('RacedayComponent: Selected drivers from service:', selectedDrivers);

        if (selectedDrivers.length > 0) {
            // Use drivers from setup
            const drivers = selectedDrivers.map(d => new HeatDriver(d));

            // Pad with Empty Lane if needed
            const emptyLaneName = this.translationService.translate('RD_EMPTY_LANE');
            while (drivers.length < this.track.lanes.length) {
                drivers.push(new HeatDriver(new Driver('', emptyLaneName, emptyLaneName)));
            }

            this.heat = new Heat(1, drivers);
            this.cdr.detectChanges();
        } else {
            const errorMsg = this.translationService.translate('RD_ERROR_NO_DRIVERS');
            this.errorMessage = errorMsg;
            this.cdr.detectChanges();
            throw new Error(errorMsg);
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
    getPropertyValue(heatDriver: HeatDriver, propertyPath: string): any {
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
    formatColumnValue(heatDriver: HeatDriver, column: ColumnDefinition): string {
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
    }

    toggleFileMenu() {
        console.log('Toggling File menu. Current state:', this.isFileMenuOpen);
        this.isFileMenuOpen = !this.isFileMenuOpen;
        this.isMenuOpen = false; // Close other menus
    }

    onMenuSelect(action: string) {
        console.log('Menu Action Selected:', action);
        this.isMenuOpen = false;
    }

    onFileMenuSelect(action: string) {
        console.log('File Menu Action Selected:', action);
        if (action === 'EXIT') {
            this.router.navigate(['/raceday-setup']);
        }
        this.isFileMenuOpen = false;
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        // Ctrl+S or Cmd+S for Start/Resume
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault(); // Prevent browser save dialog
            this.onMenuSelect('START_RESUME');
        }
    }
}
