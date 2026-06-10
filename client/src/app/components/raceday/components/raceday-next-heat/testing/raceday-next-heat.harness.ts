import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayNextHeatHarnessBase } from "./raceday-next-heat.harness.base";

export class RacedayNextHeatItemHarness extends ComponentHarness {
  static hostSelector = ".next-heat-item";
  protected getNameEl = this.locatorFor(".driver-nickname");
  protected getBadgeEl = this.locatorFor(".lane-badge");

  async getDriverName(): Promise<string> {
    return await (await this.getNameEl()).text();
  }

  async getLaneText(): Promise<string> {
    return await (await this.getBadgeEl()).text();
  }
}

export class RacedayNextHeatHarness
  extends ComponentHarness
  implements RacedayNextHeatHarnessBase
{
  static hostSelector = RacedayNextHeatHarnessBase.hostSelector;

  protected getTitleEl = this.locatorFor(
    RacedayNextHeatHarnessBase.selectors.title,
  );
  protected getItems = this.locatorForAll(RacedayNextHeatItemHarness);

  async getTitle(): Promise<string> {
    return await (await this.getTitleEl()).text();
  }

  async getEntryCount(): Promise<number> {
    return (await this.getItems()).length;
  }

  async getEntryDriverName(index: number): Promise<string> {
    const items = await this.getItems();
    if (index < items.length) {
      return await items[index].getDriverName();
    }
    return "";
  }

  async getEntryLaneText(index: number): Promise<string> {
    const items = await this.getItems();
    if (index < items.length) {
      return await items[index].getLaneText();
    }
    return "";
  }
}
