import { ComponentHarness } from "@angular/cdk/testing";

import { EditorTitleHarnessBase } from "./editor-title.harness.base";

export class EditorTitleHarness
  extends ComponentHarness
  implements EditorTitleHarnessBase
{
  static hostSelector = EditorTitleHarnessBase.hostSelector;

  protected getTitleElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.title,
  );
  protected getItemNameElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.itemName,
  );
  protected getUndoButtonElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.undoButton,
  );
  protected getRedoButtonElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.redoButton,
  );
  protected getHelpButtonElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.helpButton,
  );
  protected getPrevButtonElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.prevButton,
  );
  protected getNextButtonElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.nextButton,
  );
  protected getItemCounterElement = this.locatorForOptional(
    EditorTitleHarnessBase.selectors.itemCounter,
  );

  async getTitle(): Promise<string | null> {
    const el = await this.getTitleElement();
    return el ? await el.text() : null;
  }

  async getItemName(): Promise<string | null> {
    const el = await this.getItemNameElement();
    return el ? await el.text() : null;
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
    return (await btn.getAttribute("disabled")) !== null;
  }

  async isRedoDisabled(): Promise<boolean> {
    const btn = await this.getRedoButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute("disabled")) !== null;
  }

  async clickPrevious(): Promise<void> {
    const btn = await this.getPrevButtonElement();
    if (btn) await btn.click();
  }

  async clickNext(): Promise<void> {
    const btn = await this.getNextButtonElement();
    if (btn) await btn.click();
  }

  async isPreviousDisabled(): Promise<boolean> {
    const btn = await this.getPrevButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute("disabled")) !== null;
  }

  async isNextDisabled(): Promise<boolean> {
    const btn = await this.getNextButtonElement();
    if (!btn) return true;
    return (await btn.getAttribute("disabled")) !== null;
  }

  async getItemCounter(): Promise<string | null> {
    const el = await this.getItemCounterElement();
    return el ? await el.text() : null;
  }
}
