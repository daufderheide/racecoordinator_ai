import { ComponentHarness } from "@angular/cdk/testing";

import { AssetManagerHarnessBase } from "./asset-manager.harness.base";

export class AssetManagerHarness
  extends ComponentHarness
  implements AssetManagerHarnessBase
{
  static hostSelector = AssetManagerHarnessBase.hostSelector;

  protected getDbName = this.locatorFor(
    AssetManagerHarnessBase.selectors.dbName,
  );
  protected getTotalSizeText = this.locatorFor(
    AssetManagerHarnessBase.selectors.totalSizeText,
  );
  protected getAssetCards = this.locatorForAll(
    AssetManagerHarnessBase.selectors.assetCard,
  );
  protected getAssetCardNames = this.locatorForAll(
    `${AssetManagerHarnessBase.selectors.assetCard} ${AssetManagerHarnessBase.selectors.assetName}`,
  );
  protected getFilterTabs = this.locatorForAll(
    AssetManagerHarnessBase.selectors.filterTab,
  );
  protected getFilterInput = this.locatorFor(
    AssetManagerHarnessBase.selectors.filterInput,
  );
  protected getBtnNewImageSet = this.locatorFor(
    AssetManagerHarnessBase.selectors.btnNewImageSet,
  );
  protected getBtnNewAudioSet = this.locatorFor(
    AssetManagerHarnessBase.selectors.btnNewAudioSet,
  );
  protected getBtnNewCustomRotation = this.locatorFor(
    AssetManagerHarnessBase.selectors.btnNewCustomRotation,
  );
  protected getBackButton = this.locatorFor(
    AssetManagerHarnessBase.selectors.backBtn,
  );

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
    const names = await this.getAssetCardNames();
    if (index < names.length) {
      return await names[index].text();
    }
    return "";
  }

  async setFilterType(
    type:
      | "all"
      | "image"
      | "image_set"
      | "sound"
      | "audio"
      | "audio_set"
      | "custom_rotation",
  ): Promise<void> {
    const tabs = await this.getFilterTabs();
    const indexMap = {
      all: 0,
      image: 1,
      image_set: 2,
      sound: 3,
      audio: 3,
      audio_set: 4,
      custom_rotation: 5,
    };
    const tab = tabs[indexMap[type]];
    await tab.click();
  }

  async getActiveFilterType(): Promise<string> {
    const tabs = await this.getFilterTabs();
    const typeMap = [
      "all",
      "image",
      "image_set",
      "sound",
      "audio_set",
      "custom_rotation",
    ];
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (await tab.hasClass("active")) {
        return typeMap[i] || "";
      }
    }
    return "";
  }

  async setSearchText(text: string): Promise<void> {
    const input = await this.getFilterInput();
    await input.clear();
    if (text) {
      await input.sendKeys(text);
    }
  }

  async clickNewImageSet(): Promise<void> {
    const btn = await this.getBtnNewImageSet();
    await btn.click();
  }

  async clickNewAudioSet(): Promise<void> {
    const btn = await this.getBtnNewAudioSet();
    await btn.click();
  }

  async clickNewCustomRotation(): Promise<void> {
    const btn = await this.getBtnNewCustomRotation();
    await btn.click();
  }

  async clickBack(): Promise<void> {
    const btn = await this.getBackButton();
    await btn.click();
  }
}
