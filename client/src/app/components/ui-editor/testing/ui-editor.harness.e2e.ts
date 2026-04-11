import { Locator } from '@playwright/test';

import { ReorderDialogHarnessE2e } from '..//reorder-dialog/testing/reorder-dialog.harness.e2e';
import { UIEditorHarnessBase } from './ui-editor.harness.base';

export class UIEditorHarnessE2e implements UIEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return UIEditorHarnessBase; }

  private get reorderBtn() { return this.locator.locator(this.base.selectors.reorderBtn).first(); }
  private get reorderDialog() { return this.locator.locator('app-reorder-dialog'); }
  private get imageSelectors() { return this.locator.locator(this.base.selectors.imageSelector); }
  private get screenCards() { return this.locator.locator(this.base.selectors.screenCards); }
  private get addScreenBtn() { return this.locator.locator(this.base.selectors.addScreenBtn).first(); }

  async clickReorderColumns(): Promise<void> {
    await this.reorderBtn.click();
  }

  async getReorderDialogHarness(): Promise<ReorderDialogHarnessE2e> {
    return new ReorderDialogHarnessE2e(this.reorderDialog);
  }

  async clickImageSelector(index: number): Promise<void> {
    const selector = this.imageSelectors.nth(index);
    await selector.locator(this.base.selectors.imagePreview).click();
  }

  // Screen Manager methods
  async getScreenCount(): Promise<number> {
    return this.screenCards.count();
  }

  async clickAddScreen(): Promise<void> {
    await this.addScreenBtn.click();
  }

  async clickEditScreen(index: number): Promise<void> {
    const card = this.screenCards.nth(index);
    await card.locator(this.base.selectors.editScreenBtn).click();
  }

  async clickDuplicateScreen(index: number): Promise<void> {
    const card = this.screenCards.nth(index);
    await card.locator(this.base.selectors.duplicateScreenBtn).click();
  }

  async clickDeleteScreen(index: number): Promise<void> {
    const card = this.screenCards.nth(index);
    await card.locator(this.base.selectors.deleteScreenBtn).click();
  }

  async clickDefaultBadge(index: number): Promise<void> {
    const card = this.screenCards.nth(index);
    await card.locator(this.base.selectors.defaultBadge).click();
  }

  async clickEnabledBadge(index: number): Promise<void> {
    const card = this.screenCards.nth(index);
    await card.locator(this.base.selectors.enabledBadge).click();
  }

  async getScreenName(index: number): Promise<string> {
    const card = this.screenCards.nth(index);
    const input = card.locator('input');
    return input.inputValue();
  }
}