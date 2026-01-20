import { Track } from "../models/track";
import { com } from "../proto/message";
import { LaneConverter } from "./lane.converter";
import { ConverterCache } from "./converter-cache";

export class TrackConverter {
    private static cache = new ConverterCache<Track>();

    static clearCache() {
        this.cache.clear();
    }

    static fromProto(proto: com.antigravity.ITrackModel): Track {
        const objectId = proto.model?.entityId;
        const isReference = (!proto.lanes || proto.lanes.length === 0);

        return this.cache.process(
            objectId,
            isReference,
            () => {
                const lanes = proto.lanes!.map(l => LaneConverter.fromProto(l));
                return new Track(
                    objectId || '',
                    proto.name || '',
                    lanes
                );
            },
            () => {
                if (!proto.lanes) {
                    if (!objectId) {
                        console.error("TrackConverter: proto.lanes is undefined and no objectId");
                        throw new Error("TrackConverter: proto.lanes is undefined and no objectId");
                    }
                    console.error("TrackConverter: proto.lanes is undefined for new/full Track", objectId);
                    throw new Error("TrackConverter: proto.lanes is undefined for new/full Track");
                }
            }
        );
    }
}
