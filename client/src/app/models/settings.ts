export class Settings {
    recentRaceIds: string[];
    selectedDriverIds: string[];

    serverIp: string;
    serverPort: number;
    language: string;

    constructor(
        recentRaceIds: string[] = [],
        selectedDriverIds: string[] = [],
        serverIp: string = 'localhost',
        serverPort: number = 7070,
        language: string = ''
    ) {
        this.recentRaceIds = recentRaceIds;
        this.selectedDriverIds = selectedDriverIds;
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.language = language;
    }
}
