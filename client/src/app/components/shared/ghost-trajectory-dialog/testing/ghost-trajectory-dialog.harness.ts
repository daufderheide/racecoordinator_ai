import { ComponentHarness } from "@angular/cdk/testing";

import { GhostTrajectoryDialogHarnessBase } from "./ghost-trajectory-dialog.harness.base";

export class GhostTrajectoryDialogHarness
  extends ComponentHarness
  implements GhostTrajectoryDialogHarnessBase
{
  static hostSelector = GhostTrajectoryDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    GhostTrajectoryDialogHarnessBase.selectors.backdrop,
  );
  protected getCloseBtn = this.locatorForOptional(
    GhostTrajectoryDialogHarnessBase.selectors.closeBtn,
  );
  protected getDriverANameEl = this.locatorForOptional(
    GhostTrajectoryDialogHarnessBase.selectors.driverAName,
  );
  protected getMetricCards = this.locatorForAll(
    GhostTrajectoryDialogHarnessBase.selectors.metricCards,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async dismiss(): Promise<void> {
    const btn = await this.getCloseBtn();
    if (btn) {
      await btn.click();
    }
  }

  async getDriverAName(): Promise<string> {
    const el = await this.getDriverANameEl();
    return el ? await el.text() : "";
  }

  async getMetricCardCount(): Promise<number> {
    const cards = await this.getMetricCards();
    return cards.length;
  }
}
