export class Lane {
    readonly foreground_color: string;
    readonly background_color: string;
    readonly length: number;

    constructor(foreground_color: string, background_color: string, length: number) {
        this.foreground_color = foreground_color;
        this.background_color = background_color;
        this.length = length;
    }
}