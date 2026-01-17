import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Heat } from 'src/app/models/heat';
import { HeatDriver } from 'src/app/models/heat_driver';
import { Driver } from 'src/app/models/driver';
import { Track } from 'src/app/models/track';
import { Lane } from 'src/app/models/lane';
import { ColumnDefinition } from 'src/app/models/column_definition';
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
    heat?: Heat;
    track!: Track;
    columns: ColumnDefinition[];
    errorMessage?: string;

    constructor(
        private translationService: TranslationService,
        private dataService: DataService,
        private raceService: RaceService,
        private cdr: ChangeDetectorRef
    ) {
        // Define columns to display with translation keys
        this.columns = [
            new ColumnDefinition('RD_COL_NAME', 'driver.name', 480),
            new ColumnDefinition('RD_COL_LAP', 'lapCount', 275),
            new ColumnDefinition('RD_COL_LAP_TIME', 'lastLapTime', 275),
            new ColumnDefinition('RD_COL_MEDIAN_LAP', 'medianLapTime', 275),
            new ColumnDefinition('RD_COL_BEST_LAP', 'bestLapTime', 275),
        ];
    }

    ngOnInit() {
        console.log('RacedayComponent: Initializing...');
        this.loadRaceData();
    }

    private loadRaceData() {
        console.log('RacedayComponent: Loading race data...');
        const selectedTrack = this.raceService.getTrack();

        if (!selectedTrack) {
            // TODO(aufderheide): throw an exception if there's not track.
            const errorMsg = 'No Track Selected!'; // Could translate if needed
            this.errorMessage = errorMsg;
            console.error(errorMsg);
            // Optionally redirect back to setup
            return;
        }

        this.track = selectedTrack;

        const selectedDrivers = this.raceService.getRacingDrivers();
        console.log('RacedayComponent: Selected drivers from service:', selectedDrivers);

        if (selectedDrivers.length > 0) {
            // Use drivers from setup
            const drivers = selectedDrivers.map(d => new HeatDriver(d));

            // Pad with Empty Lane if needed
            const emptyLaneName = this.translationService.translate('RD_EMPTY_LANE');
            while (drivers.length < this.track.lanes.length) {
                drivers.push(new HeatDriver(new Driver(emptyLaneName, '')));
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
        let x = 20 + 30; // Start position + left padding
        for (let i = 0; i < columnIndex; i++) {
            x += this.columns[i].width;
        }
        return x;
    }

    // Helper method to get column center X position
    getColumnCenterX(columnIndex: number): number {
        return this.getColumnX(columnIndex) + (this.columns[columnIndex].width / 2);
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
}
