/**
 * A column definition for the heat driver table that can be used to customize
 * the display of the race day screens.
 */
export class ColumnDefinition {
    readonly labelKey: string;
    readonly propertyName: string;
    readonly width: number;
    readonly scaleToFit: boolean;

    constructor(labelKey: string, propertyName: string, width: number, scaleToFit: boolean = false) {
        this.labelKey = labelKey;
        this.propertyName = propertyName;
        this.width = width;
        this.scaleToFit = scaleToFit;
    }
}
