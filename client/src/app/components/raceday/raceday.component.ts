import { Component } from '@angular/core';
import { Heat } from 'src/app/models/heat';
import { HeatDriver } from 'src/app/models/heat_driver';
import { Driver } from 'src/app/models/driver';
import { Track } from 'src/app/models/track';
import { Lane } from 'src/app/models/lane';
import { ColumnDefinition } from 'src/app/models/column_definition';
import { TranslationService } from 'src/app/services/translation.service';

@Component({
    selector: 'app-raceday',
    templateUrl: './raceday.component.html',
    styleUrls: ['./raceday.component.css'],
    standalone: false
})
export class RacedayComponent {
    heat: Heat;
    track: Track;
    columns: ColumnDefinition[];

    constructor(private translationService: TranslationService) {
        this.track = new Track('Bright Plume Raceway', [
            new Lane('black', '#ef4444', 100),
            new Lane('black', '#ffffff', 100),
            new Lane('black', '#3b82f6', 100),
            new Lane('black', '#fbbf24', 100),
        ]);

        // Define columns to display with translation keys
        this.columns = [
            new ColumnDefinition('NAME', 'driver.name', 480),
            new ColumnDefinition('LAP', 'lapCount', 275),
            new ColumnDefinition('LAP_TIME', 'lastLapTime', 275),
            new ColumnDefinition('MEDIAN_LAP', 'medianLapTime', 275),
            new ColumnDefinition('BEST_LAP', 'bestLapTime', 275),
        ];

        const drivers = [
            new HeatDriver(new Driver('Driver 1')),
            new HeatDriver(new Driver('Driver 2')),
            new HeatDriver(new Driver('Driver 3')),
            new HeatDriver(new Driver('Driver 4')),
        ];
        drivers[0].addLapTime(0.987654321);
        drivers[1].addLapTime(1.111);
        drivers[2].addLapTime(2.222);
        drivers[3].addLapTime(3.333);

        this.heat = new Heat(1, drivers);
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
        const parts = propertyPath.split('.');
        let value: any = heatDriver;
        for (const part of parts) {
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
