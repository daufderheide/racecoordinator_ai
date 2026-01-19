import { Driver } from "../models/driver";
import { com } from "../proto/message";

export class DriverConverter {
    static fromProto(proto: com.antigravity.IDriverModel): Driver {
        return new Driver(
            proto.model?.entityId || '',
            proto.name || '',
            proto.nickname || ''
        );
    }
}
