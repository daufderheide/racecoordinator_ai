import { ComponentHarness } from '@angular/cdk/testing';
import { UndoRedoControlsHarnessBase } from './undo-redo-controls.harness.base';

export class UndoRedoControlsHarness extends ComponentHarness implements UndoRedoControlsHarnessBase {
  static hostSelector = UndoRedoControlsHarnessBase.hostSelector;

  protected getButtons = this.locatorForAll(UndoRedoControlsHarnessBase.selectors.buttons);

  async clickUndo(): Promise<void> {
    const btns = await this.getButtons();
    if (btns.length >= 1) await btns[0].click();
  }

  async clickRedo(): Promise<void> {
    const btns = await this.getButtons();
    if (btns.length >= 2) await btns[1].click();
  }

  async isUndoDisabled(): Promise<boolean> {
    const btns = await this.getButtons();
    if (btns.length >= 1) {
      return (await btns[0].getProperty('disabled')) === true;
    }
    return true;
  }

  async isRedoDisabled(): Promise<boolean> {
    const btns = await this.getButtons();
    if (btns.length >= 2) {
      return (await btns[1].getProperty('disabled')) === true;
    }
    return true;
  }
}
