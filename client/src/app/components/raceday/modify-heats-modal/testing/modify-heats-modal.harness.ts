import { ComponentHarness } from "@angular/cdk/testing";

import { ModifyHeatsModalHarnessBase } from "./modify-heats-modal.harness.base";

export class ModifyHeatsModalHarness
  extends ComponentHarness
  implements ModifyHeatsModalHarnessBase
{
  static hostSelector = ModifyHeatsModalHarnessBase.hostSelector;

  protected getDriverItems = this.locatorForAll(
    ModifyHeatsModalHarnessBase.selectors.driverItem,
  );
  protected getHeatCards = this.locatorForAll(
    ModifyHeatsModalHarnessBase.selectors.heatCard,
  );
  protected getLockedOverlays = this.locatorForAll(
    ModifyHeatsModalHarnessBase.selectors.lockedOverlay,
  );
  protected getUndoBtn = this.locatorFor(
    ModifyHeatsModalHarnessBase.selectors.undoBtn,
  );
  protected getRedoBtn = this.locatorFor(
    ModifyHeatsModalHarnessBase.selectors.redoBtn,
  );

  async getDriverItemCount(): Promise<number> {
    return (await this.getDriverItems()).length;
  }

  async getHeatCardCount(): Promise<number> {
    return (await this.getHeatCards()).length;
  }

  async getLockedOverlayCount(): Promise<number> {
    return (await this.getLockedOverlays()).length;
  }

  async isDriverVisibleInDatabase(name: string): Promise<boolean> {
    const items = await this.getDriverItems();
    for (const item of items) {
      const text = await item.text();
      if (text.includes(name)) return true;
    }
    return false;
  }

  async isDriverVisibleInPool(name: string): Promise<boolean> {
    const items = await this.getDriverItems();
    for (const item of items) {
      const text = await item.text();
      if (text.includes(name)) return true;
    }
    return false;
  }

  async clickUndo(): Promise<void> {
    const btn = await this.getUndoBtn();
    await btn.click();
  }

  async clickRedo(): Promise<void> {
    const btn = await this.getRedoBtn();
    await btn.click();
  }

  async waitForLoaderToBeHidden(): Promise<void> {}

  async dragDriverToHeat(
    _driverName: string,
    _heatIndex: number,
  ): Promise<void> {}
}
