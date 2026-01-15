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
