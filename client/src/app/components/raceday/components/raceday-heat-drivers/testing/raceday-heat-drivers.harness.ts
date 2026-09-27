import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayHeatDriversHarnessBase } from "./raceday-heat-drivers.harness.base";

export class RacedayHeatDriversHarness
  extends ComponentHarness
  implements RacedayHeatDriversHarnessBase
{
  static hostSelector = RacedayHeatDriversHarnessBase.hostSelector;

  protected getTitleEl = this.locatorForOptional(
    RacedayHeatDriversHarnessBase.selectors.title,
  );
  protected getItems = this.locatorForAll(
    RacedayHeatDriversHarnessBase.selectors.item,
  );
  protected getDriverNameEls = this.locatorForAll(
    RacedayHeatDriversHarnessBase.selectors.driverName,
  );
  protected getLaneBadgeEls = this.locatorForAll(
    RacedayHeatDriversHarnessBase.selectors.laneBadge,
  );
  protected getEmptyEl = this.locatorForOptional(
    RacedayHeatDriversHarnessBase.selectors.empty,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleEl();
    return el ? (await el.text()).trim() : "";
  }

  async getDriverCount(): Promise<number> {
    return (await this.getItems()).length;
  }

  async getDriverNames(): Promise<string[]> {
    const els = await this.getDriverNameEls();
    const names: string[] = [];
    for (const el of els) {
      names.push((await el.text()).trim());
    }
    return names;
  }

  async getDriverName(index: number): Promise<string> {
    const names = await this.getDriverNames();
    return names[index] || "";
  }

  async getLaneBadges(): Promise<string[]> {
    const els = await this.getLaneBadgeEls();
    const badges: string[] = [];
    for (const el of els) {
      badges.push((await el.text()).trim());
    }
    return badges;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getEmptyEl()) !== null;
  }
}
