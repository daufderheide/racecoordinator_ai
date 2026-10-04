import { Locator } from "@playwright/test";

import { ModifyHeatsModalHarnessBase } from "./modify-heats-modal.harness.base";

export class ModifyHeatsModalHarnessE2e implements ModifyHeatsModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return ModifyHeatsModalHarnessBase;
  }

  private get driverItems() {
    return this.locator.locator(this.base.selectors.driverItem);
  }
  private get heatCards() {
    return this.locator.locator(this.base.selectors.heatCard);
  }
  private get lockedOverlays() {
    return this.locator.locator(this.base.selectors.lockedOverlay);
  }
  private get databaseDrivers() {
    return this.locator.locator(this.base.selectors.databaseDrivers);
  }
  private get driverPool() {
    return this.locator.locator(this.base.selectors.driverPool);
  }

  async getDatabaseDriverCount(): Promise<number> {
    return await this.databaseDrivers
      .locator(this.base.selectors.driverItem)
      .count();
  }

  async getDriverItemCount(): Promise<number> {
    return await this.driverItems.count();
  }

  async getHeatCardCount(): Promise<number> {
    return await this.heatCards.count();
  }

  async getLockedOverlayCount(): Promise<number> {
    return await this.lockedOverlays.count();
  }

  async isDriverVisibleInDatabase(name: string): Promise<boolean> {
    const driver = this.databaseDrivers.locator(
      this.base.selectors.driverItem,
      { hasText: name },
    );
    return await driver.isVisible();
  }

  async isDriverVisibleInPool(name: string): Promise<boolean> {
    const driver = this.driverPool.locator(this.base.selectors.driverItem, {
      hasText: name,
    });
    return await driver.isVisible();
  }
  async waitForLoaderToBeHidden(): Promise<void> {
    await this.locator
      .locator(this.base.selectors.loaderOverlay)
      .waitFor({ state: "hidden" });
  }

  async clickUndo(): Promise<void> {
    await this.waitForLoaderToBeHidden();
    await this.locator.locator(this.base.selectors.undoBtn).click();
  }

  async clickRedo(): Promise<void> {
    await this.waitForLoaderToBeHidden();
    await this.locator.locator(this.base.selectors.redoBtn).click();
  }

  async clickLaneCheck(): Promise<void> {
    await this.waitForLoaderToBeHidden();
    await this.locator.locator(this.base.selectors.laneCheckBtn).click();
  }

  async isEqualityReportVisible(): Promise<boolean> {
    return await this.locator
      .locator(this.base.selectors.equalityReportModal)
      .isVisible();
  }

  async dragDriverToHeat(driverName: string, heatIndex: number): Promise<void> {
    const driver = this.driverPool
      .locator(this.base.selectors.driverItem, { hasText: driverName })
      .first();
    const heat = this.heatCards.nth(heatIndex);

    await driver.waitFor({ state: "visible" });

    const sourceBox = await driver.boundingBox();
    const targetBox = await heat.boundingBox();

    if (sourceBox && targetBox) {
      const page = this.locator.page();
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 20 },
      );
      await page.waitForTimeout(500);
      await page.mouse.up();
    } else {
      await driver.dragTo(heat);
    }
  }
}
