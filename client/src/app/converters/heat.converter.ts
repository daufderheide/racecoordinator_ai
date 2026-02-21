import { com } from "../proto/message";
import { Heat } from "../race/heat";
import { DriverHeatData } from "../race/driver_heat_data";
import { RaceParticipant } from "../race/race_participant";
import { Driver } from "../models/driver";
import { DriverConverter } from "./driver.converter";
import { TeamConverter } from "./team.converter";
import { RaceParticipantConverter } from "./race_participant.converter";
import { ConverterCache } from "./converter_cache";

export class HeatConverter {
    private static participantCache = new Map<string, RaceParticipant>();
    private static heatCache = new ConverterCache<Heat>();

    static clearCache() {
        this.participantCache.clear();
        this.heatCache.clear();
    }

    static fromProto(proto: com.antigravity.IHeat, heatNumber: number = -1): Heat {
        // console.log('HeatConverter: Processing heat proto:', proto);
        const objectId = proto.objectId;
        // Is Reference if heatDrivers is empty/undefined
        const isReference = (!proto.heatDrivers || proto.heatDrivers.length === 0);

        return this.heatCache.process(
            objectId,
            isReference,
            () => {
                let heatDrivers: Array<DriverHeatData | null> = [];
                if (proto.heatDrivers) {
                    heatDrivers = proto.heatDrivers.map((dProto, index) => {
                        if (dProto.driver) {
                            const participant = RaceParticipantConverter.fromProto(dProto.driver);

                            if (!participant) {
                                console.warn(`HeatConverter: Failed to resolve participant for heat driver ${dProto.objectId}`);
                                return null;
                            }

                            let actualDriver: Driver | undefined;
                            if (dProto.actualDriver) {
                                actualDriver = DriverConverter.fromProto(dProto.actualDriver);
                                console.log(`HeatConverter (Client): DriverHeatData ${dProto.objectId} has actualDriver:`, actualDriver.name);
                            } else {
                                // console.log(`HeatConverter (Client): DriverHeatData ${dProto.objectId} missing actualDriver`);
                            }

                            const heatDriverId = dProto.objectId;
                            const hd = new DriverHeatData(heatDriverId || '', participant, index, actualDriver);
                            hd.gapLeader = dProto.gapLeader || 0;
                            hd.gapPosition = dProto.gapPosition || 0;
                            return hd;
                        }
                        return null;
                    });
                }
                const validHeatDrivers = heatDrivers.filter((d): d is DriverHeatData => d !== null);
                console.log(`HeatConverter: Processed ${validHeatDrivers.length} valid drivers for heat ${heatNumber}`);

                return new Heat(
                    objectId || '',
                    heatNumber !== -1 ? heatNumber : (proto.heatNumber || 0),
                    validHeatDrivers,
                    proto.standings || []
                );
            }
        );
    }
}
