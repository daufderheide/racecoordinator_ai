export class ColumnDefinition {
    readonly label: string;
    readonly propertyName: string;
    readonly width: number;

    constructor(label: string, propertyName: string, width: number) {
        this.label = label;
        this.propertyName = propertyName;
        this.width = width;
    }
}
