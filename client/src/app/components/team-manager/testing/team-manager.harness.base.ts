export abstract class TeamManagerHarnessBase {
  static readonly hostSelector = 'app-team-manager';

  static readonly selectors = {
    teamRow: '.list-container .list-item',
    configNameInput: '.detail-header h2',
    memberCountDisplay: '.member-count-display',
    newTeamBtn: '#add-item-btn',
    editBtn: '#edit-track-btn',
    deleteBtn: '#delete-track-btn',
    nameCell: '.item-name'
  };

  abstract getTeamCount(): Promise<number>;
  abstract getTeamName(index: number): Promise<string>;
  abstract selectTeam(index: number): Promise<void>;
  abstract getSelectedTeamName(): Promise<string>;

  abstract getMemberCount(): Promise<number>;
  abstract clickNewTeam(): Promise<void>;
  abstract clickEdit(): Promise<void>;
  abstract clickDelete(): Promise<void>;
}
