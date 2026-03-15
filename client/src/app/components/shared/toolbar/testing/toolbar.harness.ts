import { ComponentHarness } from '@angular/cdk/testing';
import { ToolbarHarnessBase } from './toolbar.harness.base';

export class ToolbarHarness extends ComponentHarness implements ToolbarHarnessBase {
  static hostSelector = ToolbarHarnessBase.hostSelector;

  protected getUndoButton = this.locatorForOptional(ToolbarHarnessBase.selectors.undo);
  protected getRedoButton = this.locatorForOptional(ToolbarHarnessBase.selectors.redo);
  protected getEditButton = this.locatorForOptional(ToolbarHarnessBase.selectors.edit);
  protected getHelpButton = this.locatorForOptional(ToolbarHarnessBase.selectors.help);
  protected getDeleteButton = this.locatorForOptional(ToolbarHarnessBase.selectors.delete);

  async isUndoVisible(): Promise<boolean> {
    return (await this.getUndoButton()) !== null;
  }
  async isRedoVisible(): Promise<boolean> {
    return (await this.getRedoButton()) !== null;
  }
  async isEditVisible(): Promise<boolean> {
    return (await this.getEditButton()) !== null;
  }
  async isHelpVisible(): Promise<boolean> {
    return (await this.getHelpButton()) !== null;
  }
  async isDeleteVisible(): Promise<boolean> {
    return (await this.getDeleteButton()) !== null;
  }

  async isUndoDisabled(): Promise<boolean> {
    const btn = await this.getUndoButton();
    return btn ? await btn.getProperty('disabled') === true : false;
  }
  async isRedoDisabled(): Promise<boolean> {
    const btn = await this.getRedoButton();
    return btn ? await btn.getProperty('disabled') === true : false;
  }
  async isEditDisabled(): Promise<boolean> {
    const btn = await this.getEditButton();
    return btn ? await btn.getProperty('disabled') === true : false;
  }
  async isDeleteDisabled(): Promise<boolean> {
    const btn = await this.getDeleteButton();
    return btn ? await btn.getProperty('disabled') === true : false;
  }

  async clickUndo(): Promise<void> {
    const btn = await this.getUndoButton();
    if (btn) await btn.click();
  }
  async clickRedo(): Promise<void> {
    const btn = await this.getRedoButton();
    if (btn) await btn.click();
  }
  async clickEdit(): Promise<void> {
    const btn = await this.getEditButton();
    if (btn) await btn.click();
  }
  async clickHelp(): Promise<void> {
    const btn = await this.getHelpButton();
    if (btn) await btn.click();
  }
  async clickDelete(): Promise<void> {
    const btn = await this.getDeleteButton();
    if (btn) await btn.click();
  }
}
