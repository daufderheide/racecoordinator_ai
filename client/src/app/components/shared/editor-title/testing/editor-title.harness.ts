import { ComponentHarness } from '@angular/cdk/testing';

import { EditorTitleHarnessBase } from './editor-title.harness.base';

export class EditorTitleHarness extends ComponentHarness implements EditorTitleHarnessBase {
  static hostSelector = EditorTitleHarnessBase.hostSelector;

  protected getTitleElement = this.locatorForOptional(EditorTitleHarnessBase.selectors.title);
  protected getBackButtonElement = this.locatorFor(EditorTitleHarnessBase.selectors.backButton);
  protected getUndoButtonElement = this.locatorForOptional(EditorTitleHarnessBase.selectors.undoButton);
  protected getRedoButtonElement = this.locatorForOptional(EditorTitleHarnessBase.selectors.redoButton);
  protected getHelpButtonElement = this.locatorForOptional(EditorTitleHarnessBase.selectors.helpButton);

  async getTitle(): Promise<string | null> {
    const el = await this.getTitleElement();
    return el ? await el.text() : null;
  }

  async clickBackButton(): Promise<void> {
    const btn = await this.getBackButtonElement();
    await btn.click();
  }

  async clickUndo(): Promise<void> {
    const btn = await this.getUndoButtonElement();
    if (btn) await btn.click();
  }

  async clickRedo(): Promise<void> {
    const btn = await this.getRedoButtonElement();
    if (btn) await btn.click();
  }

  async clickHelp(): Promise<void> {
    const btn = await this.getHelpButtonElement();
    if (btn) await btn.click();
  }

  async isUndoDisabled(): Promise<boolean> {
    const btn = await this.getUndoButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute('disabled')) !== null;
  }

  async isRedoDisabled(): Promise<boolean> {
    const btn = await this.getRedoButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute('disabled')) !== null;
  }
}
