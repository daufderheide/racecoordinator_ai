import { Race } from "../models/race";
import { com } from "../proto/message";
import { TrackConverter } from "./track.converter";
import { Track } from "../models/track";

export class RaceConverter {
    static fromProto(proto: com.antigravity.IRaceModel): Race {
        let track: Track;
        if (proto.track) {
            track = TrackConverter.fromProto(proto.track);
        } else {
            throw new Error("RaceConverter: proto.track is undefined");
        }

        return new Race(
            proto.model?.entityId || '',
            proto.name || '',
            track
        );
    }
}
