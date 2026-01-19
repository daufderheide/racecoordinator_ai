import { Track } from "../models/track";
import { com } from "../proto/message";
import { LaneConverter } from "./lane.converter";

export class TrackConverter {
    static fromProto(proto: com.antigravity.ITrackModel): Track {
        if (!proto.lanes) {
            throw new Error("TrackConverter: proto.lanes is undefined");
        }
        const lanes = proto.lanes.map(l => LaneConverter.fromProto(l));
        return new Track(
            proto.model?.entityId || '',
            proto.name || '',
            lanes
        );
    }
}
