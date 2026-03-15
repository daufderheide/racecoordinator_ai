import { Locator } from '@playwright/test';
import { DefaultRacedaySetupHarnessBase } from './default-raceday-setup.harness.base';

export class DefaultRacedaySetupHarnessE2e implements DefaultRacedaySetupHarnessBase {
  constructor(private locator: Locator) {}

  private get removeAllBtn() { return this.locator.locator('[data-testid="btn-remove-all"]'); }
  private get addAllBtn() { return this.locator.locator('.driver-action-bar .action-btn').nth(0); }
  private get randomizeBtn() { return this.locator.locator('.driver-action-bar .action-btn').nth(2); }
  private get startBtn() { return this.locator.locator('.btn-start'); }
  private get searchInput() { return this.locator.locator('input.driver-search'); }
  private get unselectedDrivers() { return this.locator.locator('.driver-item:not(.selected)'); }
  private get selectedDrivers() { return this.locator.locator('.driver-item.selected'); }
  private get raceCards() { return this.locator.locator('.race-card'); }
  private get dropdownTrigger() { return this.locator.locator('.dropdown-trigger'); }
  private get optionsMenu() { return this.locator.locator('.options-menu-container .menu-item'); }
  private get fileMenu() { return this.locator.locator('.file-menu-container .menu-item'); }
  private get configMenu() { return this.locator.locator('.config-menu-container .menu-item'); }
  private get helpMenu() { return this.locator.locator('.help-menu-container .menu-item'); }
  private get dropdownMenu() { return this.locator.locator('.menu-dropdown:visible'); }


  async clickRemoveAll(): Promise<void> {
    await this.removeAllBtn.click();
  }


  async clickAddAll(): Promise<void> {
    await this.addAllBtn.click();
  }

  async clickRandomize(): Promise<void> {
    await this.randomizeBtn.click();
  }

  async isStartEnabled(): Promise<boolean> {
    return await this.startBtn.isEnabled();
  }

  async clickStart(): Promise<void> {
    await this.startBtn.click();
  }

  async setSearchQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getUnselectedDriverCount(): Promise<number> {
    return await this.unselectedDrivers.count();
  }

  async getSelectedDriverCount(): Promise<number> {
    return await this.selectedDrivers.count();
  }

  async getUnselectedDriverName(index: number): Promise<string> {
    const item = this.unselectedDrivers.nth(index);
    return await item.locator('.driver-name').innerText();
  }

  async doubleClickUnselectedDriver(index: number): Promise<void> {
    await this.unselectedDrivers.nth(index).dblclick();
  }

  async getRaceCardCount(): Promise<number> {
    return await this.raceCards.count();
  }

  async clickRaceDropdown(): Promise<void> {
    await this.dropdownTrigger.click();
  }

  async openOptionsMenu(): Promise<void> {
    await this.optionsMenu.click();
  }

  async clickOptionsMenuOptionByText(text: string): Promise<void> {
    await this.dropdownMenu.locator(`.menu-dropdown-item:has-text("${text}")`).click();
  }

  async openFileMenu(): Promise<void> { await this.fileMenu.click(); }
  async openConfigMenu(): Promise<void> { await this.configMenu.click(); }
  async openHelpMenu(): Promise<void> { await this.helpMenu.click(); }

  async isMenuDropdownVisible(menuClass: string): Promise<boolean> {
    const dropdown = this.locator.locator(`.${menuClass} .menu-dropdown`);
    // Wait for it a bit if needed, or just check count/visibility
    return await dropdown.isVisible();
  }
}


