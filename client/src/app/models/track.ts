import { Lane } from "./lane";

export class Track {
    readonly name: string;
    readonly lanes: Lane[];

    constructor(name: string, lanes: Lane[]) {
        this.name = name;
        this.lanes = lanes;
    }
}