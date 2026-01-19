import { com } from "../proto/message";
import { Heat } from "../models/heat";
import { HeatDriver } from "../models/heat_driver";
import { RaceParticipant } from "../models/race-participant";
import { DriverConverter } from "./driver.converter";

export class HeatConverter {
    static fromProto(proto: com.antigravity.IHeat, heatNumber: number): Heat {
        const drivers = proto.heatDrivers?.map(hd => {
            const driverModel = DriverConverter.fromProto(hd.driver!.driver!);
            const participant = new RaceParticipant(driverModel);
            return new HeatDriver(participant);
        }) || [];

        return new Heat(heatNumber, drivers);
    }
}
