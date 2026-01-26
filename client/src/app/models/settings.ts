export class Settings {
    recentRaceIds: string[];
    selectedDriverIds: string[];

    constructor(recentRaceIds: string[] = [], selectedDriverIds: string[] = []) {
        this.recentRaceIds = recentRaceIds;
        this.selectedDriverIds = selectedDriverIds;
    }
}
