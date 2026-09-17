import { Locator } from "@playwright/test";

import { GhostTrajectoryDialogHarnessBase } from "./ghost-trajectory-dialog.harness.base";

export class GhostTrajectoryDialogHarnessE2e implements GhostTrajectoryDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return GhostTrajectoryDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  private get driverANameEl() {
    return this.locator.locator(this.base.selectors.driverAName);
  }

  private get metricCards() {
    return this.locator.locator(this.base.selectors.metricCards);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async dismiss(): Promise<void> {
    await this.closeBtn.click();
  }

  async getDriverAName(): Promise<string> {
    return (await this.driverANameEl.textContent()) || "";
  }

  async getMetricCardCount(): Promise<number> {
    return await this.metricCards.count();
  }
}
