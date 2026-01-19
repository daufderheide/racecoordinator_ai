import { Driver } from "./driver";

export class RaceParticipant {
    readonly driver: Driver;

    constructor(driver: Driver) {
        this.driver = driver;
    }
}
