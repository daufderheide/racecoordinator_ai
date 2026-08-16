import { Locator } from "@playwright/test";

import { ReplayStatusHarnessBase } from "./replay-status.harness.base";

export class ReplayStatusHarnessE2e implements ReplayStatusHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return ReplayStatusHarnessBase;
  }

  private get container() {
    return this.locator.locator(this.base.selectors.container);
  }

  private get statusBadge() {
    return this.locator.locator(this.base.selectors.statusBadge);
  }

  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  async getStatusText(): Promise<string> {
    return (await this.statusBadge.textContent()) || "";
  }
}
