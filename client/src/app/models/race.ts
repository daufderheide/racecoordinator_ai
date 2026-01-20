import { Model } from "./model";
import { Track } from "./track";

export class Race implements Model {
    readonly entity_id: string;
    readonly name: string;
    readonly track: Track;

    constructor(entity_id: string, name: string, track: Track) {
        this.entity_id = entity_id;
        this.name = name;
        this.track = track;
    }

    get objectId(): string {
        return this.entity_id;
    }
}