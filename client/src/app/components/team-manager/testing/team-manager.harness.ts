import { ComponentHarness } from '@angular/cdk/testing';
import { TeamManagerHarnessBase } from './team-manager.harness.base';

export class TeamManagerHarness extends ComponentHarness implements TeamManagerHarnessBase {
  static hostSelector = TeamManagerHarnessBase.hostSelector;

  protected getSearchInput = this.locatorFor(TeamManagerHarnessBase.selectors.searchInput);
  protected getTeamRows = this.locatorForAll(TeamManagerHarnessBase.selectors.teamRow);
  protected getConfigNameInput = this.locatorFor(TeamManagerHarnessBase.selectors.configNameInput);
  protected getMemberCountDisplay = this.locatorFor(TeamManagerHarnessBase.selectors.memberCountDisplay);
  protected getNewTeamBtn = this.locatorFor(TeamManagerHarnessBase.selectors.newTeamBtn);
  protected getEditBtn = this.locatorFor(TeamManagerHarnessBase.selectors.editBtn);
  protected getDeleteBtn = this.locatorFor(TeamManagerHarnessBase.selectors.deleteBtn);

  async getTeamCount(): Promise<number> {
    return (await this.getTeamRows()).length;
  }

  async getTeamName(index: number): Promise<string> {
    const rows = await this.getTeamRows();
    if (index < rows.length) {
      const nameCell = await rows[index].locatorFor(TeamManagerHarnessBase.selectors.nameCell)();
      return await nameCell.text();
    }
    return '';
  }

  async selectTeam(index: number): Promise<void> {
    const rows = await this.getTeamRows();
    if (index < rows.length) {
      await rows[index].click();
    }
  }

  async setSearchQuery(query: string): Promise<void> {
    const input = await this.getSearchInput();
    await input.clear();
    await input.sendKeys(query);
  }

  async getSelectedTeamName(): Promise<string> {
    const input = await this.getConfigNameInput();
    return await input.getProperty('value');
  }

  async getMemberCount(): Promise<number> {
    const el = await this.getMemberCountDisplay();
    const text = await el.text();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async clickNewTeam(): Promise<void> {
    const btn = await this.getNewTeamBtn();
    await btn.click();
  }

  async clickEdit(): Promise<void> {
    const btn = await this.getEditBtn();
    await btn.click();
  }

  async clickDelete(): Promise<void> {
    const btn = await this.getDeleteBtn();
    await btn.click();
  }
}
