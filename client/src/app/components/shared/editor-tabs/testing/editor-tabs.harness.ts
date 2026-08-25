import { ComponentHarness } from "@angular/cdk/testing";

import { EditorTabsHarnessBase } from "./editor-tabs.harness.base";

export class EditorTabsHarness
  extends ComponentHarness
  implements EditorTabsHarnessBase
{
  static hostSelector = EditorTabsHarnessBase.hostSelector;

  protected getContainer = this.locatorForOptional(
    EditorTabsHarnessBase.selectors.container,
  );
  protected getTabs = this.locatorForAll(EditorTabsHarnessBase.selectors.tab);

  async isVisible(): Promise<boolean> {
    const container = await this.getContainer();
    return container !== null;
  }

  async getTabLabels(): Promise<string[]> {
    const tabs = await this.getTabs();
    return Promise.all(tabs.map(async (tab) => (await tab.text()).trim()));
  }

  async getTabCount(): Promise<number> {
    const tabs = await this.getTabs();
    return tabs.length;
  }

  async clickTabByIndex(index: number): Promise<void> {
    const tabs = await this.getTabs();
    if (index < 0 || index >= tabs.length) {
      throw new Error(
        `Tab index ${index} out of bounds (found ${tabs.length} tabs)`,
      );
    }
    await tabs[index].click();
  }

  async clickTabByText(text: string): Promise<void> {
    const tabs = await this.getTabs();
    for (const tab of tabs) {
      if ((await tab.text()).trim() === text) {
        await tab.click();
        return;
      }
    }
    throw new Error(`Tab with text "${text}" not found`);
  }
}
