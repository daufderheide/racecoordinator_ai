import { ComponentHarness } from '@angular/cdk/testing';
import { AssetManagerHarnessBase } from './asset-manager.harness.base';

export class AssetManagerHarness extends ComponentHarness implements AssetManagerHarnessBase {
  static hostSelector = AssetManagerHarnessBase.hostSelector;

  protected getDbName = this.locatorFor(AssetManagerHarnessBase.selectors.dbName);
  protected getTotalSizeText = this.locatorFor(AssetManagerHarnessBase.selectors.totalSizeText);
  protected getAssetCards = this.locatorForAll(AssetManagerHarnessBase.selectors.assetCard);
  protected getFilterTabs = this.locatorForAll(AssetManagerHarnessBase.selectors.filterTab);
  protected getBackButton = this.locatorFor(AssetManagerHarnessBase.selectors.backBtn);

  async getDatabaseName(): Promise<string> {
    const el = await this.getDbName();
    return await el.text();
  }

  async getTotalSize(): Promise<string> {
    const el = await this.getTotalSizeText();
    return await el.text();
  }

  async getAssetCardsCount(): Promise<number> {
    return (await this.getAssetCards()).length;
  }

  async getAssetCardName(index: number): Promise<string> {
    const cards = await this.getAssetCards();
    if (index < cards.length) {
      const nameEl = await cards[index].locatorFor(AssetManagerHarnessBase.selectors.assetName)();
      return await nameEl.text();
    }
    return '';
  }

  async setFilterType(type: 'all' | 'image' | 'image_set' | 'sound'): Promise<void> {
    const tabs = await this.getFilterTabs();
    const indexMap = { all: 0, image: 1, image_set: 2, sound: 3 };
    const tab = tabs[indexMap[type]];
    await tab.click();
  }

  async getActiveFilterType(): Promise<string> {
    const tabs = await this.getFilterTabs();
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (await tab.hasClass('active')) {
            return i === 0 ? 'all' : i === 1 ? 'image' : i === 2 ? 'image_set' : 'sound';
        }
    }
    return '';
  }

  async clickBack(): Promise<void> {
    const btn = await this.getBackButton();
    await btn.click();
  }
}
