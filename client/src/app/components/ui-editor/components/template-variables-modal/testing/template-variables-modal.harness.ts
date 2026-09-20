import { ComponentHarness } from "@angular/cdk/testing";

import { TemplateVariablesModalHarnessBase } from "./template-variables-modal.harness.base";

export class TemplateVariablesModalHarness
  extends ComponentHarness
  implements TemplateVariablesModalHarnessBase
{
  static hostSelector = TemplateVariablesModalHarnessBase.hostSelector;

  protected getOverlay = this.locatorForOptional(
    TemplateVariablesModalHarnessBase.selectors.overlay,
  );
  protected getCloseBtn = this.locatorForOptional(
    TemplateVariablesModalHarnessBase.selectors.closeBtn,
  );
  protected getSearchInput = this.locatorForOptional(
    TemplateVariablesModalHarnessBase.selectors.searchInput,
  );
  protected getCategoryTabs = this.locatorForAll(
    TemplateVariablesModalHarnessBase.selectors.categoryTabs,
  );
  protected getVariableCards = this.locatorForAll(
    TemplateVariablesModalHarnessBase.selectors.variableCards,
  );

  async isVisible(): Promise<boolean> {
    const overlay = await this.getOverlay();
    return overlay !== null;
  }

  async close(): Promise<void> {
    const btn = await this.getCloseBtn();
    if (btn) {
      await btn.click();
    }
  }

  async search(query: string): Promise<void> {
    const input = await this.getSearchInput();
    if (input) {
      await input.clear();
      if (query) {
        await input.sendKeys(query);
      }
    }
  }

  async getSearchValue(): Promise<string> {
    const input = await this.getSearchInput();
    return input ? await input.getProperty("value") : "";
  }

  async getVariableCardCount(): Promise<number> {
    const cards = await this.getVariableCards();
    return cards.length;
  }

  async getCategoryTabCount(): Promise<number> {
    const tabs = await this.getCategoryTabs();
    return tabs.length;
  }
}
