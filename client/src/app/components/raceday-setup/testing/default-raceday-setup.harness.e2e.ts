import { Locator } from '@playwright/test';
import { DefaultRacedaySetupHarnessBase } from './default-raceday-setup.harness.base';

export class DefaultRacedaySetupHarnessE2e implements DefaultRacedaySetupHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return DefaultRacedaySetupHarnessBase; }

  private get removeAllBtn() { return this.locator.locator(this.base.selectors.removeAllBtn); }
  private get addAllBtn() { return this.locator.locator(this.base.selectors.driverActionBarBtn).nth(0); }
  private get randomizeBtn() { return this.locator.locator(this.base.selectors.driverActionBarBtn).nth(2); }
  private get startBtn() { return this.locator.locator(this.base.selectors.startBtn); }
  private get searchInput() { return this.locator.locator(this.base.selectors.searchInput); }
  private get unselectedDrivers() { return this.locator.locator(`${this.base.selectors.driverItem}:not(.selected)`); }
  private get selectedDrivers() { return this.locator.locator(`${this.base.selectors.driverItem}.selected`); }
  private get raceCards() { return this.locator.locator(this.base.selectors.raceCard); }
  private get dropdownTrigger() { return this.locator.locator(this.base.selectors.dropdownTrigger); }
  private get optionsMenu() { return this.locator.locator(this.base.selectors.optionsMenu); }
  private get fileMenu() { return this.locator.locator(this.base.selectors.fileMenu); }
  private get configMenu() { return this.locator.locator(this.base.selectors.configMenu); }
  private get helpMenu() { return this.locator.locator(this.base.selectors.helpMenu); }
  private get dropdownMenu() { return this.locator.locator(`${this.base.selectors.menuDropdown}:visible`); }


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
    return await item.locator(this.base.selectors.driverName).innerText();
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
    await this.dropdownMenu.locator(`${this.base.selectors.menuDropdownItem}:has-text("${text}")`).click();
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


