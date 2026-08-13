import { Locator } from "@playwright/test";

import { AssetManagerHarnessBase } from "./asset-manager.harness.base";

export class AssetManagerHarnessE2e implements AssetManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AssetManagerHarnessBase;
  }

  private get dbName() {
    return this.locator.locator(this.base.selectors.dbName);
  }
  private get totalSizeText() {
    return this.locator.locator(this.base.selectors.totalSizeText);
  }
  private get assetCards() {
    return this.locator.locator(this.base.selectors.assetCard);
  }
  private get filterTabs() {
    return this.locator.locator(this.base.selectors.filterTab);
  }
  private get filterInput() {
    return this.locator.locator(this.base.selectors.filterInput);
  }
  private get btnNewImageSet() {
    return this.locator.locator(this.base.selectors.btnNewImageSet);
  }
  private get btnNewAudioSet() {
    return this.locator.locator(this.base.selectors.btnNewAudioSet);
  }
  private get btnNewCustomRotation() {
    return this.locator.locator(this.base.selectors.btnNewCustomRotation);
  }
  private get backButton() {
    return this.locator.locator(this.base.selectors.backBtn);
  }

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
    return await card.locator(this.base.selectors.assetName).innerText();
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
    const indexMap = {
      all: 0,
      image: 1,
      image_set: 2,
      sound: 3,
      audio: 3,
      audio_set: 4,
      custom_rotation: 5,
    };
    await this.filterTabs.nth(indexMap[type]).click();
  }

  async getActiveFilterType(): Promise<string> {
    const count = await this.filterTabs.count();
    const typeMap = [
      "all",
      "image",
      "image_set",
      "sound",
      "audio_set",
      "custom_rotation",
    ];
    for (let i = 0; i < count; i++) {
      const tab = this.filterTabs.nth(i);
      const classes = await tab.getAttribute("class");
      if (classes && classes.includes("active")) {
        return typeMap[i] || "";
      }
    }
    return "";
  }

  async setSearchText(text: string): Promise<void> {
    await this.filterInput.fill(text);
  }

  async clickNewImageSet(): Promise<void> {
    await this.btnNewImageSet.click();
  }

  async clickNewAudioSet(): Promise<void> {
    await this.btnNewAudioSet.click();
  }

  async clickNewCustomRotation(): Promise<void> {
    await this.btnNewCustomRotation.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }
}
