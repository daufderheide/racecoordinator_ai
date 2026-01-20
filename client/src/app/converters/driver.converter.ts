import { Driver } from "../models/driver";
import { com } from "../proto/message";
import { ConverterCache } from "./converter-cache";

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
                proto.nickname || ''
            );
        });
    }
}
