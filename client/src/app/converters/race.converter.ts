import { Race } from "../models/race";
import { com } from "../proto/message";
import { TrackConverter } from "./track.converter";
import { ConverterCache } from "./converter_cache";

export class RaceConverter {
    private static cache = new ConverterCache<Race>();

    static clearCache() {
        this.cache.clear();
    }

    static fromProto(proto: com.antigravity.IRaceModel): Race {
        const objectId = proto.model?.entityId;
        const isReference = !proto.track;

        return this.cache.process(
            objectId,
            isReference,
            () => {
                return new Race(
                    objectId || '',
                    proto.name || '',
                    TrackConverter.fromProto(proto.track!)
                );
            },
            () => {
                if (!proto.track) {
                    if (!objectId) {
                        throw new Error("RaceConverter: proto.track is undefined and no objectId");
                    }
                    throw new Error("RaceConverter: proto.track is undefined for new/full Race");
                }
            }
        );
    }
}
