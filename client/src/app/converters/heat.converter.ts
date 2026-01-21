import { com } from "../proto/message";
import { Heat } from "../race/heat";
import { DriverHeatData } from "../race/driver_heat_data";
import { RaceParticipant } from "../race/race_participant";
import { Driver } from "../models/driver";
import { DriverConverter } from "./driver.converter";
import { ConverterCache } from "./converter_cache";

export class HeatConverter {
    private static participantCache = new Map<string, RaceParticipant>();
    private static heatCache = new ConverterCache<Heat>();
    private static heatDriverCache = new Map<string, DriverHeatData>();

    static clearCache() {
        this.participantCache.clear();
        this.heatCache.clear();
        this.heatDriverCache.clear();
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
                            const partProto = dProto.driver;
                            let participant: RaceParticipant | undefined;

                            if (partProto.objectId && HeatConverter.participantCache.has(partProto.objectId)) {
                                participant = HeatConverter.participantCache.get(partProto.objectId);
                            } else if (partProto.driver) {
                                const driver = DriverConverter.fromProto(partProto.driver);
                                if (driver) {
                                    participant = new RaceParticipant(driver, partProto.objectId || '');
                                    if (partProto.objectId) {
                                        HeatConverter.participantCache.set(partProto.objectId, participant);
                                    }
                                }
                            }

                            if (!participant) {
                                console.warn(`HeatConverter: Failed to resolve participant for heat driver ${dProto.objectId}`);
                                return null;
                            }

                            const heatDriverId = dProto.objectId;
                            return new DriverHeatData(heatDriverId || '', participant, index);
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
