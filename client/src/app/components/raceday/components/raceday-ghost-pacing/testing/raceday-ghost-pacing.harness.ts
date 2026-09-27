import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayGhostPacingHarnessBase } from "./raceday-ghost-pacing.harness.base";

export class RacedayGhostPacingHarness
  extends ComponentHarness
  implements RacedayGhostPacingHarnessBase
{
  static hostSelector = RacedayGhostPacingHarnessBase.hostSelector;

  protected getEmptyEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.empty,
  );
  protected getBenchmarkNameEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.benchmarkName,
  );
  protected getBenchmarkLabelEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.benchmarkLabel,
  );
  protected getDeltaBadgeEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.deltaBadge,
  );
  protected getDeltaValueEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.deltaValue,
  );
  protected getTargetTimeEl = this.locatorForOptional(
    RacedayGhostPacingHarnessBase.selectors.targetTime,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getEmptyEl()) !== null;
  }

  async getBenchmarkName(): Promise<string> {
    const nameEl = await this.getBenchmarkNameEl();
    if (nameEl) return (await nameEl.text()).trim();
    const labelEl = await this.getBenchmarkLabelEl();
    if (labelEl) return (await labelEl.text()).trim();
    return "";
  }

  async getDeltaText(): Promise<string> {
    const el = await this.getDeltaValueEl();
    return el ? (await el.text()).trim() : "";
  }

  async isAhead(): Promise<boolean> {
    const badge = await this.getDeltaBadgeEl();
    if (!badge) return false;
    return await badge.hasClass("ahead");
  }

  async isBehind(): Promise<boolean> {
    const badge = await this.getDeltaBadgeEl();
    if (!badge) return false;
    return await badge.hasClass("behind");
  }

  async getTargetTimeText(): Promise<string> {
    const el = await this.getTargetTimeEl();
    return el ? (await el.text()).trim() : "";
  }
}
