import { Locator } from "@playwright/test";

import { TemplateVariablesModalHarnessBase } from "./template-variables-modal.harness.base";

export class TemplateVariablesModalHarnessE2e implements TemplateVariablesModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return TemplateVariablesModalHarnessBase;
  }

  private get overlay() {
    return this.locator.locator(this.base.selectors.overlay);
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  private get searchInput() {
    return this.locator.locator(this.base.selectors.searchInput);
  }

  private get categoryTabs() {
    return this.locator.locator(this.base.selectors.categoryTabs);
  }

  private get variableCards() {
    return this.locator.locator(this.base.selectors.variableCards);
  }

  async isVisible(): Promise<boolean> {
    return await this.overlay.isVisible();
  }

  async close(): Promise<void> {
    await this.closeBtn.click();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getSearchValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  async getVariableCardCount(): Promise<number> {
    return await this.variableCards.count();
  }

  async getCategoryTabCount(): Promise<number> {
    return await this.categoryTabs.count();
  }
}
