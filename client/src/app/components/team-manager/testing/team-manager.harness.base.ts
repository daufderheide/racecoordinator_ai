export abstract class TeamManagerHarnessBase {
  static readonly hostSelector = 'app-team-manager';

  static readonly selectors = {
    searchInput: '.search-input',
    teamRow: '.driver-table.body-only tbody tr',
    configNameInput: '.config-panel input',
    memberCountDisplay: '.member-count-display',
    newTeamBtn: '.dm-header .btn-add',
    editBtn: '.btn-edit',
    deleteBtn: '.btn-delete',
    nameCell: '.name-cell'
  };

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
