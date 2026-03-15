import { ComponentHarness } from '@angular/cdk/testing';
import { TeamManagerHarnessBase } from './team-manager.harness.base';

export class TeamManagerHarness extends ComponentHarness implements TeamManagerHarnessBase {
  static hostSelector = 'app-team-manager';

  protected getSearchInput = this.locatorFor('.search-input');
  protected getTeamRows = this.locatorForAll('.driver-table.body-only tbody tr');
  protected getConfigNameInput = this.locatorFor('.config-panel input');
  protected getMemberCountDisplay = this.locatorFor('.member-count-display');
  protected getNewTeamBtn = this.locatorFor('.dm-header .btn-add');
  protected getEditBtn = this.locatorFor('.btn-edit');
  protected getDeleteBtn = this.locatorFor('.btn-delete');

  async getTeamCount(): Promise<number> {
    return (await this.getTeamRows()).length;
  }

  async getTeamName(index: number): Promise<string> {
    const rows = await this.getTeamRows();
    if (index < rows.length) {
      const nameCell = await rows[index].locatorFor('.name-cell')();
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
