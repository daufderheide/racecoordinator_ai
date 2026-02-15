export class Settings {
    recentRaceIds: string[];
    selectedDriverIds: string[];

    serverIp: string;
    serverPort: number;
    language: string;
    racedaySetupWalkthroughSeen: boolean;

    constructor(
        recentRaceIds: string[] = [],
        selectedDriverIds: string[] = [],
        serverIp: string = 'localhost',
        serverPort: number = 7070,
        language: string = '',
        racedaySetupWalkthroughSeen: boolean = false
    ) {
        this.recentRaceIds = recentRaceIds;
        this.selectedDriverIds = selectedDriverIds;
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.language = language;
        this.racedaySetupWalkthroughSeen = racedaySetupWalkthroughSeen;
    }
}
