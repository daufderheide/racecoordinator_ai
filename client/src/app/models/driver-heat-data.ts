import { RaceParticipant } from "./race-participant";

export class DriverHeatData {
    readonly driver: RaceParticipant;

    constructor(driver: RaceParticipant) {
        this.driver = driver;
    }
}
