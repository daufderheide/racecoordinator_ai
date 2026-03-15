import { Locator } from '@playwright/test';
import { DefaultRacedayHarnessBase } from './default-raceday.harness.base';

export class DefaultRacedayHarnessE2e implements DefaultRacedayHarnessBase {
  constructor(private locator: Locator) {}

  private get driverRows() { return this.locator.locator('.driver-row'); }
  private get menuButtons() { return this.locator.locator('.menu-button-top'); }
  private get menuItems() { return this.locator.locator('.menu-item'); }
  private get headers() { return this.locator.locator('.table-headers text'); }

  async getDriverRowCount(): Promise<number> {
    return await this.driverRows.count();
  }

  async getDriverRowText(index: number): Promise<string> {
    return await this.driverRows.nth(index).innerText();
  }

  async clickMenuButton(name: string): Promise<void> {
    await this.menuButtons.locator(`text=${name}`).click();
  }

  async clickMenuItem(name: string): Promise<void> {
    await this.menuItems.locator(`text=${name}`).click();
  }

  async isHeaderColumnVisible(text: string): Promise<boolean> {
    const count = await this.headers.count();
    for (let i = 0; i < count; i++) {
        if ((await this.headers.nth(i).innerText()).includes(text)) {
            return await this.headers.nth(i).isVisible();
        }
    }
    return false;
  }

  async getDriverAvatarHref(index: number): Promise<string | null> {
      const row = this.driverRows.nth(index);
      const img = row.locator('image').first();
      if (await img.count() > 0) {
          return await img.getAttribute('href');
      }
      return null;
  }
}
