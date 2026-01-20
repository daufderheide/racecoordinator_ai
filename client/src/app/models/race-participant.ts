import { Driver } from "./driver";

export class RaceParticipant {
    readonly driver: Driver;
    readonly objectId: string;

    constructor(driver: Driver, objectId: string) {
        this.driver = driver;
        this.objectId = objectId;
    }
}
