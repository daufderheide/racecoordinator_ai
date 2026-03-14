import { Locator } from '@playwright/test';
import { ToolbarHarnessBase } from './toolbar.harness.base';

export class ToolbarHarnessE2e implements ToolbarHarnessBase {
  constructor(private locator: Locator) {}

  private get undoButton() { return this.locator.locator('.undo'); }
  private get redoButton() { return this.locator.locator('.redo'); }
  private get editButton() { return this.locator.locator('#edit-track-btn'); }
  private get helpButton() { return this.locator.locator('#help-track-btn'); }
  private get deleteButton() { return this.locator.locator('#delete-track-btn'); }

  async isUndoVisible(): Promise<boolean> {
    return await this.undoButton.isVisible();
  }
  async isRedoVisible(): Promise<boolean> {
    return await this.redoButton.isVisible();
  }
  async isEditVisible(): Promise<boolean> {
    return await this.editButton.isVisible();
  }
  async isHelpVisible(): Promise<boolean> {
    return await this.helpButton.isVisible();
  }
  async isDeleteVisible(): Promise<boolean> {
    return await this.deleteButton.isVisible();
  }

  async isUndoDisabled(): Promise<boolean> {
    return await this.undoButton.isDisabled();
  }
  async isRedoDisabled(): Promise<boolean> {
    return await this.redoButton.isDisabled();
  }
  async isEditDisabled(): Promise<boolean> {
    return await this.editButton.isDisabled();
  }
  async isDeleteDisabled(): Promise<boolean> {
    return await this.deleteButton.isDisabled();
  }

  async clickUndo(): Promise<void> {
    await this.undoButton.click();
  }
  async clickRedo(): Promise<void> {
    await this.redoButton.click();
  }
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }
  async clickHelp(): Promise<void> {
    await this.helpButton.click();
  }
  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  /**
   * Hover over the help button (Playwright specific for visual testing)
   */
  async hoverHelp(): Promise<void> {
    await this.helpButton.hover();
  }

  /**
   * Hover over the delete button (Playwright specific for visual testing)
   */
  async hoverDelete(): Promise<void> {
    await this.deleteButton.hover();
  }
}
