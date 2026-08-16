import { ComponentHarness } from "@angular/cdk/testing";

import { ReplayStatusHarnessBase } from "./replay-status.harness.base";

export class ReplayStatusHarness
  extends ComponentHarness
  implements ReplayStatusHarnessBase
{
  static hostSelector = ReplayStatusHarnessBase.hostSelector;

  protected getContainer = this.locatorForOptional(
    ReplayStatusHarnessBase.selectors.container,
  );
  protected getStatusBadge = this.locatorFor(
    ReplayStatusHarnessBase.selectors.statusBadge,
  );

  async isVisible(): Promise<boolean> {
    const container = await this.getContainer();
    return container !== null;
  }

  async getStatusText(): Promise<string> {
    const badge = await this.getStatusBadge();
    return await badge.text();
  }
}
