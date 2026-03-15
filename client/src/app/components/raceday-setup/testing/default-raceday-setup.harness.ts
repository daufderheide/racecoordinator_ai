import { ComponentHarness } from '@angular/cdk/testing';
import { DefaultRacedaySetupHarnessBase } from './default-raceday-setup.harness.base';

export class DriverItemHarness extends ComponentHarness {
  static hostSelector = DefaultRacedaySetupHarnessBase.selectors.driverItem;
  protected getNameEl = this.locatorFor(DefaultRacedaySetupHarnessBase.selectors.driverName);
  
  async getName(): Promise<string> { 
    return await (await this.getNameEl()).text(); 
  }
  
  async isSelected(): Promise<boolean> { 
    return await (await this.host()).hasClass('selected'); 
  }
}

export class MenuDropdownHarness extends ComponentHarness {
  static hostSelector = DefaultRacedaySetupHarnessBase.selectors.menuDropdown;
  protected getItems = this.locatorForAll(DefaultRacedaySetupHarnessBase.selectors.menuDropdownItem);

  async clickItemByText(text: string): Promise<void> {
    const items = await this.getItems();
    for (const item of items) {
      if ((await item.text()).includes(text)) {
         await item.click();
         return;
      }
    }
  }
}

export class DefaultRacedaySetupHarness extends ComponentHarness implements DefaultRacedaySetupHarnessBase {
  static hostSelector = DefaultRacedaySetupHarnessBase.hostSelector;

  protected getDriverItems = this.locatorForAll(DefaultRacedaySetupHarnessBase.selectors.driverItem);
  protected getRemoveAllBtn = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.removeAllBtn);
  protected getStartBtn = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.startBtn);
  protected getSearchInput = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.searchInput);
  protected getRaceCards = this.locatorForAll(DefaultRacedaySetupHarnessBase.selectors.raceCard);
  protected getDropdownTrigger = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.dropdownTrigger);
  protected getOptionsMenu = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.optionsMenu);
  protected getFileMenu = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.fileMenu);
  protected getConfigMenu = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.configMenu);
  protected getHelpMenu = this.locatorForOptional(DefaultRacedaySetupHarnessBase.selectors.helpMenu);

  // ... (clickAddAll/clickRandomize use driverActionBarBtn inside methods)

  // Existing methods for backward compatibility
  async clickDriverItem(): Promise<void> {
    const items = await this.getDriverItems();
    if (items.length > 0) {
      await items[0].click();
    }
  }

  async doubleClickDriverItem(): Promise<void> {
    const items = await this.getDriverItems();
    if (items.length > 0) {
      await items[0].dispatchEvent('dblclick');
    }
  }

  // Base methods implementation
  async clickRemoveAll(): Promise<void> {
    const btn = await this.getRemoveAllBtn();
    if (btn) await btn.click();
  }

  async clickAddAll(): Promise<void> {
    const buttons = await this.locatorForAll(DefaultRacedaySetupHarnessBase.selectors.driverActionBarBtn)();
    if (buttons.length > 0) await buttons[0].click();
  }

  async clickRandomize(): Promise<void> {
    const buttons = await this.locatorForAll(DefaultRacedaySetupHarnessBase.selectors.driverActionBarBtn)();
    if (buttons.length > 2) await buttons[2].click();
  }

  async isStartEnabled(): Promise<boolean> {
    const btn = await this.getStartBtn();
    if (!btn) return false;
    return !(await btn.getProperty('disabled'));
  }

  async clickStart(): Promise<void> {
    const btn = await this.getStartBtn();
    if (btn) await btn.click();
  }

  async setSearchQuery(query: string): Promise<void> {
    const input = await this.getSearchInput();
    if (input) {
      await input.clear();
      await input.sendKeys(query);
    }
  }

  async getUnselectedDriverCount(): Promise<number> {
    const drivers = await this.locatorForAll(DriverItemHarness)();
    let count = 0;
    for (const d of drivers) {
       if (!(await d.isSelected())) count++;
    }
    return count;
  }

  async getSelectedDriverCount(): Promise<number> {
    const drivers = await this.locatorForAll(DriverItemHarness)();
    let count = 0;
    for (const d of drivers) {
       if (await d.isSelected()) count++;
    }
    return count;
  }

  async getUnselectedDriverName(index: number): Promise<string> {
    const drivers = await this.locatorForAll(DriverItemHarness)();
    let unselectedCount = 0;
    for (const d of drivers) {
      if (!(await d.isSelected())) {
        if (unselectedCount === index) {
          return await d.getName();
        }
        unselectedCount++;
      }
    }
    return '';
  }

  async doubleClickUnselectedDriver(index: number): Promise<void> {
    const drivers = await this.locatorForAll(DriverItemHarness)();
    let unselectedCount = 0;
    for (const d of drivers) {
      if (!(await d.isSelected())) {
        if (unselectedCount === index) {
          const host = await d.host();
          await host.dispatchEvent('dblclick');
          return;
        }
        unselectedCount++;
      }
    }
  }


  async getRaceCardCount(): Promise<number> {
    return (await this.getRaceCards()).length;
  }

  async clickRaceDropdown(): Promise<void> {
    const trigger = await this.getDropdownTrigger();
    if (trigger) await trigger.click();
  }

  async openOptionsMenu(): Promise<void> {
    const menu = await this.getOptionsMenu();
    if (menu) await menu.click();
  }

  async clickOptionsMenuOptionByText(text: string): Promise<void> {
    const dropdowns = await this.locatorForAll(MenuDropdownHarness)();
    if (dropdowns.length > 0) {
        await dropdowns[0].clickItemByText(text);
    }
  }

  async openFileMenu(): Promise<void> {
    const menu = await this.getFileMenu();
    if (menu) await menu.click();
  }

  async openConfigMenu(): Promise<void> {
    const menu = await this.getConfigMenu();
    if (menu) await menu.click();
  }

  async openHelpMenu(): Promise<void> {
    const menu = await this.getHelpMenu();
    if (menu) await menu.click();
  }

  async isMenuDropdownVisible(menuClass: string): Promise<boolean> {
    const dropdown = await this.locatorForOptional(`.${menuClass} .menu-dropdown`)();
    return dropdown !== null;
  }
}


