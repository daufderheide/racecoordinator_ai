import { Locator, Page } from '@playwright/test';
import { ManagerHeaderHarnessBase } from './manager-header.harness.base';
import { BackButtonHarnessE2e } from '../../back-button/testing/back-button.harness.e2e';
import { ToolbarHarnessE2e } from '../../toolbar/testing/toolbar.harness.e2e';

export class ManagerHeaderHarnessE2e implements ManagerHeaderHarnessBase {
  constructor(private locator: Locator, private page?: Page) {}

  private get base() { return ManagerHeaderHarnessBase; }

  async getTitle(): Promise<string> {
    const title = this.locator.locator(this.base.selectors.title);
    return (await title.innerText()).trim();
  }

  async hasBackButton(): Promise<boolean> {
    const btn = this.locator.locator(this.base.selectors.backButton);
    return await btn.isVisible();
  }

  async hasToolbar(): Promise<boolean> {
    const toolbar = this.locator.locator(this.base.selectors.toolbar);
    return await toolbar.isVisible();
  }

  getBackButton(): BackButtonHarnessE2e {
    return new BackButtonHarnessE2e(this.locator.locator(this.base.selectors.backButton), this.page);
  }

  getToolbar(): ToolbarHarnessE2e {
    return new ToolbarHarnessE2e(this.locator.locator(this.base.selectors.toolbar));
  }
}
