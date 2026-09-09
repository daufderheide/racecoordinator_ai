import { Locator } from "@playwright/test";

import { EditorTitleHarnessBase } from "./editor-title.harness.base";

export class EditorTitleHarnessE2e implements EditorTitleHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return EditorTitleHarnessBase;
  }

  private get titleElement() {
    return this.locator.locator(this.base.selectors.title);
  }

  private get itemNameElement() {
    return this.locator.locator(this.base.selectors.itemName);
  }

  protected get undoButtonElement() {
    return this.locator.locator(this.base.selectors.undoButton);
  }
  protected get redoButtonElement() {
    return this.locator.locator(this.base.selectors.redoButton);
  }
  protected get helpButtonElement() {
    return this.locator.locator(this.base.selectors.helpButton);
  }

  async getTitle(): Promise<string | null> {
    if (await this.titleElement.isVisible()) {
      return await this.titleElement.innerText();
    }
    return null;
  }

  async getItemName(): Promise<string | null> {
    if (await this.itemNameElement.isVisible()) {
      return await this.itemNameElement.innerText();
    }
    return null;
  }

  async clickUndo(): Promise<void> {
    await this.undoButtonElement.click();
  }

  async clickRedo(): Promise<void> {
    await this.redoButtonElement.click();
  }

  async clickHelp(): Promise<void> {
    await this.helpButtonElement.click();
  }

  async isUndoDisabled(): Promise<boolean> {
    if (await this.undoButtonElement.isVisible()) {
      const isDisabled = await this.undoButtonElement.getAttribute("disabled");
      return isDisabled !== null;
    }
    return true;
  }

  async isRedoDisabled(): Promise<boolean> {
    if (await this.redoButtonElement.isVisible()) {
      const isDisabled = await this.redoButtonElement.getAttribute("disabled");
      return isDisabled !== null;
    }
    return true;
  }
}
