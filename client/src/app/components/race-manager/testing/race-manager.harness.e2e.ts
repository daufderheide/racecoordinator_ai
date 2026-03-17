import { Locator } from '@playwright/test';
import { RaceManagerHarnessBase } from './race-manager.harness.base';

export class RaceManagerHarnessE2e implements RaceManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return RaceManagerHarnessBase; }

  get listContainer() { return this.locator.locator(this.base.selectors.listContainer); }
  get listItems() { return this.locator.locator(this.base.selectors.listItem); }
  get selectedItem() { return this.locator.locator(this.base.selectors.selectedItem); }
  get detailPanel() { return this.locator.locator(this.base.selectors.detailPanel); }
  get deleteButton() { return this.locator.locator(this.base.selectors.deleteButton); }
  get createButton() { return this.locator.locator(this.base.selectors.createButton); }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async selectItem(index: number): Promise<void> {
    await this.listItems.nth(index).click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton.click({ force: true });
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }
}
