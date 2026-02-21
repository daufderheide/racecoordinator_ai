import { Model } from "./model";

/**
 * A driver created by the user.  This model is 100% readonly and reflects the
 * driver as it exists in the database.
 */
export interface AudioConfig {
    type: 'preset' | 'tts';
    url?: string;
    text?: string;
}

export class Driver implements Model {
    entity_id: string;
    name: string;
    nickname: string;
    avatarUrl?: string;
    lapAudio: AudioConfig;
    bestLapAudio: AudioConfig;

    constructor(
        entity_id: string,
        name: string,
        nickname: string,
        avatarUrl?: string,
        lapAudio?: AudioConfig,
        bestLapAudio?: AudioConfig // TODO(aufderheide): Optional for now? Or ensure always set?
    ) {
        this.entity_id = entity_id;
        this.name = name;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;

        // Ensure we always have an object to avoid null checks everywhere
        this.lapAudio = (lapAudio && lapAudio.type) ? lapAudio : { type: 'preset' };
        this.bestLapAudio = (bestLapAudio && bestLapAudio.type) ? bestLapAudio : { type: 'preset' };
    }

    get objectId(): string {
        return this.entity_id;
    }
}