export class Settings {
    selectedRaceId: string;
    selectedDriverIds: string[];

    constructor(selectedRaceId: string = '', selectedDriverIds: string[] = []) {
        this.selectedRaceId = selectedRaceId;
        this.selectedDriverIds = selectedDriverIds;
    }
}
