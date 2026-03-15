import { Locator } from '@playwright/test';
import { UndoRedoControlsHarnessBase } from './undo-redo-controls.harness.base';

export class UndoRedoControlsHarnessE2e implements UndoRedoControlsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return UndoRedoControlsHarnessBase; }

  private get buttons() { return this.locator.locator(this.base.selectors.buttons); }

  async clickUndo(): Promise<void> {
    await this.buttons.nth(0).click();
  }

  async clickRedo(): Promise<void> {
    await this.buttons.nth(1).click();
  }

  async isUndoDisabled(): Promise<boolean> {
    return await this.buttons.nth(0).isDisabled();
  }

  async isRedoDisabled(): Promise<boolean> {
    return await this.buttons.nth(1).isDisabled();
  }
}
