/**
 * A column definition for the heat driver table that can be used to customize
 * the display of the race day screens.
 */
export class ColumnDefinition {
    readonly labelKey: string;
    readonly propertyName: string;
    readonly width: number;

    constructor(labelKey: string, propertyName: string, width: number) {
        this.labelKey = labelKey;
        this.propertyName = propertyName;
        this.width = width;
    }
}
