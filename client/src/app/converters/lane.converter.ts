import { Lane } from "../models/lane";
import { com } from "../proto/message";
import { ConverterCache } from "./converter_cache";

export class LaneConverter {
    private static cache = new ConverterCache<Lane>();

    static clearCache() {
        this.cache.clear();
    }

    static fromProto(proto: com.antigravity.ILaneModel): Lane {
        const objectId = proto.objectId;
        const isReference = !proto.foregroundColor && !proto.backgroundColor && proto.length === undefined;

        return this.cache.process(objectId, isReference, () => {
            return new Lane(
                objectId || 'unset',
                proto.foregroundColor || '',
                proto.backgroundColor || '',
                proto.length || 0
            );
        });
    }
}
