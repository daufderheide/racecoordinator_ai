export class Settings {
    recentRaceIds: string[];
    selectedDriverIds: string[];

    serverIp: string;
    serverPort: number;
    language: string;
    racedaySetupWalkthroughSeen: boolean;

    flagGreen?: string;
    flagYellow?: string;
    flagRed?: string;
    flagWhite?: string;
    flagBlack?: string;
    flagCheckered?: string;
    sortByStandings: boolean;

    constructor(
        recentRaceIds: string[] = [],
        selectedDriverIds: string[] = [],
        serverIp: string = 'localhost',
        serverPort: number = 7070,
        language: string = '',
        racedaySetupWalkthroughSeen: boolean = false,
        flagGreen?: string,
        flagYellow?: string,
        flagRed?: string,
        flagWhite?: string,
        flagBlack?: string,
        flagCheckered?: string,
        sortByStandings: boolean = true
    ) {
        this.recentRaceIds = recentRaceIds;
        this.selectedDriverIds = selectedDriverIds;
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.language = language;
        this.racedaySetupWalkthroughSeen = racedaySetupWalkthroughSeen;
        this.flagGreen = flagGreen;
        this.flagYellow = flagYellow;
        this.flagRed = flagRed;
        this.flagWhite = flagWhite;
        this.flagBlack = flagBlack;
        this.flagCheckered = flagCheckered;
        this.sortByStandings = sortByStandings;
    }
}
