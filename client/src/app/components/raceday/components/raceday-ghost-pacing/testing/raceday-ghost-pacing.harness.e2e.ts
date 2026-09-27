import { Locator } from "@playwright/test";

import { RacedayGhostPacingHarnessBase } from "./raceday-ghost-pacing.harness.base";

export class RacedayGhostPacingHarnessE2e implements RacedayGhostPacingHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayGhostPacingHarnessBase;
  }

  private get empty() {
    return this.locator.locator(this.base.selectors.empty).first();
  }

  private get benchmarkName() {
    return this.locator.locator(this.base.selectors.benchmarkName).first();
  }

  private get benchmarkLabel() {
    return this.locator.locator(this.base.selectors.benchmarkLabel).first();
  }

  private get deltaBadge() {
    return this.locator.locator(this.base.selectors.deltaBadge).first();
  }

  private get deltaValue() {
    return this.locator.locator(this.base.selectors.deltaValue).first();
  }

  private get targetTime() {
    return this.locator.locator(this.base.selectors.targetTime).first();
  }

  async isVisible(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async isEmpty(): Promise<boolean> {
    return await this.empty.isVisible();
  }

  async getBenchmarkName(): Promise<string> {
    if (await this.benchmarkName.isVisible()) {
      return (await this.benchmarkName.innerText()).trim();
    }
    if (await this.benchmarkLabel.isVisible()) {
      return (await this.benchmarkLabel.innerText()).trim();
    }
    return "";
  }

  async getDeltaText(): Promise<string> {
    if (await this.deltaValue.isVisible()) {
      return (await this.deltaValue.innerText()).trim();
    }
    return "";
  }

  async isAhead(): Promise<boolean> {
    if (await this.deltaBadge.isVisible()) {
      const cls = (await this.deltaBadge.getAttribute("class")) || "";
      return cls.includes("ahead");
    }
    return false;
  }

  async isBehind(): Promise<boolean> {
    if (await this.deltaBadge.isVisible()) {
      const cls = (await this.deltaBadge.getAttribute("class")) || "";
      return cls.includes("behind");
    }
    return false;
  }

  async getTargetTimeText(): Promise<string> {
    if (await this.targetTime.isVisible()) {
      return (await this.targetTime.innerText()).trim();
    }
    return "";
  }
}
