import { Driver } from "../models/driver";
import { com } from "../proto/message";
import { ConverterCache } from "./converter_cache";

export class DriverConverter {
    private static cache = new ConverterCache<Driver>();

    static clearCache() {
        this.cache.clear();
    }

    static get(id: string): Driver | undefined {
        return this.cache.get(id);
    }

    static fromProto(proto: com.antigravity.IDriverModel): Driver {
        const objectId = proto.model?.entityId;

        // Is Reference if name is falsey (undefined, null, empty string)
        const isReference = !proto.name;

        if (isReference) {
            console.log(`DriverConverter: Resolving reference for Driver ID: ${objectId}`);
            const cached = this.cache.get(objectId || '');
            if (!cached) {
                console.warn(`DriverConverter: FAILED to find Driver ID ${objectId} in cache!`);
            } else {
                console.log(`DriverConverter: Resolved ${objectId} to ${cached.name}`);
            }
        }

        return this.cache.process(objectId, isReference, () => {
            return new Driver(
                objectId || '',
                proto.name || '',
                proto.nickname || '',
                proto.avatarUrl || undefined,
                {
                    type: proto.lapAudio?.type === 'tts' ? 'tts' : 'preset',
                    url: proto.lapAudio?.url || undefined,
                    text: proto.lapAudio?.text || undefined
                },
                {
                    type: proto.bestLapAudio?.type === 'tts' ? 'tts' : 'preset',
                    url: proto.bestLapAudio?.url || undefined,
                    text: proto.bestLapAudio?.text || undefined
                }
            );
        });
    }

    static fromJSON(json: any): Driver {
        const d = new Driver(
            json.entity_id || json.id || '', // Handle typical JSON id fields
            json.name || '',
            json.nickname || '',
            json.avatarUrl,
            json.lapAudio,
            json.bestLapAudio
        );
        return d;
    }

    static register(driver: Driver): void {
        if (!driver || !driver.entity_id) return;

        const existing = this.cache.get(driver.entity_id);
        if (existing) {
            // Update in place to preserve references
            existing.name = driver.name;
            existing.nickname = driver.nickname;
            existing.avatarUrl = driver.avatarUrl;
            existing.lapAudio = driver.lapAudio;
            existing.bestLapAudio = driver.bestLapAudio;
        } else {
            // Manually populate cache using process to ensure valid state
            // access private cache if possible, or use a workaround.
            // Since `process` is the main entry, we can use it with isRef=false
            this.cache.process(driver.entity_id, false, () => driver);
        }
    }
}
