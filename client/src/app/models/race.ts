import { Track } from "./track";

export class Race {
    readonly name: string;
    readonly track: Track;

    constructor(name: string, track: Track) {
        this.name = name;
        this.track = track;
    }
}