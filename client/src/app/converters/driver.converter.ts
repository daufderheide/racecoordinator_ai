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
}
