import { Model } from "./model";

/**
 * A driver created by the user.  This model is 100% readonly and reflects the
 * driver as it exists in the database.
 */
export class Driver implements Model {
    entity_id: string;
    name: string;
    nickname: string;
    avatarUrl?: string;
    lapSoundUrl?: string;
    bestLapSoundUrl?: string;
    lapSoundType?: 'preset' | 'tts';
    bestLapSoundType?: 'preset' | 'tts';
    lapSoundText?: string;
    bestLapSoundText?: string;

    constructor(
        entity_id: string,
        name: string,
        nickname: string,
        avatarUrl?: string,
        lapSoundUrl?: string,
        bestLapSoundUrl?: string,
        lapSoundType?: 'preset' | 'tts',
        bestLapSoundType?: 'preset' | 'tts',
        lapSoundText?: string,
        bestLapSoundText?: string
    ) {
        this.entity_id = entity_id;
        this.name = name;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.lapSoundUrl = lapSoundUrl;
        this.bestLapSoundUrl = bestLapSoundUrl;
        this.lapSoundType = lapSoundType;
        this.bestLapSoundType = bestLapSoundType;
        this.lapSoundText = lapSoundText;
        this.bestLapSoundText = bestLapSoundText;
    }

    get objectId(): string {
        return this.entity_id;
    }
}