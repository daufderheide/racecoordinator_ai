export abstract class TeamManagerHarnessBase {
  abstract getTeamCount(): Promise<number>;
  abstract getTeamName(index: number): Promise<string>;
  abstract selectTeam(index: number): Promise<void>;
  abstract setSearchQuery(query: string): Promise<void>;
  abstract getSelectedTeamName(): Promise<string>;
  abstract getMemberCount(): Promise<number>;
  abstract clickNewTeam(): Promise<void>;
  abstract clickEdit(): Promise<void>;
  abstract clickDelete(): Promise<void>;
}
