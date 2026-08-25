import { Locator } from "@playwright/test";

import { EditorTabsHarnessBase } from "./editor-tabs.harness.base";

export class EditorTabsHarnessE2e implements EditorTabsHarnessBase {
  constructor(private readonly locator: Locator) {}

  async getTabLabels(): Promise<string[]> {
    const tabs = this.locator.locator(EditorTabsHarnessBase.selectors.tab);
    const count = await tabs.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await tabs.nth(i).textContent()) || "").trim());
    }
    return labels;
  }

  async getTabCount(): Promise<number> {
    return this.locator.locator(EditorTabsHarnessBase.selectors.tab).count();
  }

  async clickTabByIndex(index: number): Promise<void> {
    await this.locator
      .locator(EditorTabsHarnessBase.selectors.tab)
      .nth(index)
      .click();
  }

  async clickTabByText(text: string): Promise<void> {
    await this.locator
      .locator(EditorTabsHarnessBase.selectors.tab)
      .getByText(text, { exact: true })
      .click();
  }
}
