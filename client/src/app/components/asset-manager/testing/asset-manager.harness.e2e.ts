import { Locator } from '@playwright/test';
import { AssetManagerHarnessBase } from './asset-manager.harness.base';

export class AssetManagerHarnessE2e implements AssetManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get dbName() { return this.locator.locator('.active-db-name'); }
  private get totalSizeText() { return this.locator.locator('.usage-text'); }
  private get assetCards() { return this.locator.locator('.asset-card'); }
  private get filterTabs() { return this.locator.locator('.filter-tabs .tab'); }
  private get backButton() { return this.locator.locator('app-back-button button'); }

  async getDatabaseName(): Promise<string> {
    return await this.dbName.innerText();
  }

  async getTotalSize(): Promise<string> {
    return await this.totalSizeText.innerText();
  }

  async getAssetCardsCount(): Promise<number> {
    return await this.assetCards.count();
  }

  async getAssetCardName(index: number): Promise<string> {
    const card = this.assetCards.nth(index);
    return await card.locator('.asset-name').innerText();
  }

  async setFilterType(type: 'all' | 'image' | 'image_set' | 'sound'): Promise<void> {
    const indexMap = { all: 0, image: 1, image_set: 2, sound: 3 };
    await this.filterTabs.nth(indexMap[type]).click();
  }

  async getActiveFilterType(): Promise<string> {
    const count = await this.filterTabs.count();
    for (let i = 0; i < count; i++) {
        const tab = this.filterTabs.nth(i);
        const classes = await tab.getAttribute('class');
        if (classes && classes.includes('active')) {
            return i === 0 ? 'all' : i === 1 ? 'image' : i === 2 ? 'image_set' : 'sound';
        }
    }
    return '';
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }
}
