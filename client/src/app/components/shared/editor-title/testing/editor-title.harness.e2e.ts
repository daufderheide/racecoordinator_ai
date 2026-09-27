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
  protected get prevButtonElement() {
    return this.locator.locator(this.base.selectors.prevButton);
  }
  protected get nextButtonElement() {
    return this.locator.locator(this.base.selectors.nextButton);
  }
  protected get itemCounterElement() {
    return this.locator.locator(this.base.selectors.itemCounter);
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

  async clickPrevious(): Promise<void> {
    await this.prevButtonElement.click();
  }

  async clickNext(): Promise<void> {
    await this.nextButtonElement.click();
  }

  async isPreviousDisabled(): Promise<boolean> {
    if (await this.prevButtonElement.isVisible()) {
      const isDisabled = await this.prevButtonElement.getAttribute("disabled");
      return isDisabled !== null;
    }
    return true;
  }

  async isNextDisabled(): Promise<boolean> {
    if (await this.nextButtonElement.isVisible()) {
      const isDisabled = await this.nextButtonElement.getAttribute("disabled");
      return isDisabled !== null;
    }
    return true;
  }

  async getItemCounter(): Promise<string | null> {
    if (await this.itemCounterElement.isVisible()) {
      return await this.itemCounterElement.innerText();
    }
    return null;
  }
}
