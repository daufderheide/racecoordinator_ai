export class Settings {
    recentRaceIds: string[];
    selectedDriverIds: string[];

    serverIp: string;
    serverPort: number;

    constructor(
        recentRaceIds: string[] = [],
        selectedDriverIds: string[] = [],
        serverIp: string = 'localhost',
        serverPort: number = 7070
    ) {
        this.recentRaceIds = recentRaceIds;
        this.selectedDriverIds = selectedDriverIds;
        this.serverIp = serverIp;
        this.serverPort = serverPort;
    }
}
