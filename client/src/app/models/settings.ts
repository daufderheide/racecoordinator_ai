import { AnchorPoint } from '../components/raceday/column_definition';

export class Settings {
    static readonly DEFAULT_COLUMNS = ['driver.nickname', 'lapCount', 'lastLapTime', 'medianLapTime', 'bestLapTime'];

    recentRaceIds: string[] = [];
    selectedDriverIds: string[] = [];

    serverIp: string = 'localhost';
    serverPort: number = 7070;
    language: string = '';
    racedaySetupWalkthroughSeen: boolean = false;

    flagGreen?: string;
    flagYellow?: string;
    flagRed?: string;
    flagWhite?: string;
    flagBlack?: string;
    flagCheckered?: string;
    sortByStandings: boolean = true;
    racedayColumns: string[] = Settings.DEFAULT_COLUMNS;
    columnAnchors: { [key: string]: AnchorPoint } = {};
    columnLayouts: { [columnKey: string]: { [A in AnchorPoint]?: string } } = {};
}


