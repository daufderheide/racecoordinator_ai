import { Lane } from "../models/lane";
import { com } from "../proto/message";

export class LaneConverter {
    static fromProto(proto: com.antigravity.ILaneModel): Lane {
        return new Lane(
            'unset',
            proto.foregroundColor || '',
            proto.backgroundColor || '',
            proto.length || 0
        );
    }
}
