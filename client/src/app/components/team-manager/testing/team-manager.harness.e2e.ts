import { Locator } from '@playwright/test';
import { TeamManagerHarnessBase } from './team-manager.harness.base';

export class TeamManagerHarnessE2e implements TeamManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get searchInput() { return this.locator.locator('.search-input'); }
  private get teamRows() { return this.locator.locator('.driver-table.body-only tbody tr'); }
  private get configNameInput() { return this.locator.locator('.config-panel input').first(); }
  private get memberCountDisplay() { return this.locator.locator('.member-count-display'); }
  private get newTeamBtn() { return this.locator.locator('.dm-header .btn-add'); }
  private get editBtn() { return this.locator.locator('.btn-edit'); }
  private get deleteBtn() { return this.locator.locator('.btn-delete'); }

  async getTeamCount(): Promise<number> {
    return await this.teamRows.count();
  }

  async getTeamName(index: number): Promise<string> {
    const row = this.teamRows.nth(index);
    return await row.locator('.name-cell').innerText();
  }

  async selectTeam(index: number): Promise<void> {
    await this.teamRows.nth(index).click();
  }

  async setSearchQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getSelectedTeamName(): Promise<string> {
    return await this.configNameInput.inputValue();
  }

  async getMemberCount(): Promise<number> {
    const text = await this.memberCountDisplay.innerText();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async clickNewTeam(): Promise<void> {
    await this.newTeamBtn.click();
  }

  async clickEdit(): Promise<void> {
    await this.editBtn.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteBtn.click();
  }
}
