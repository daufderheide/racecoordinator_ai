import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayOnDeckHarnessBase } from "./raceday-on-deck.harness.base";

export class RacedayOnDeckItemHarness extends ComponentHarness {
  static hostSelector = ".on-deck-item";
  protected getNameEl = this.locatorFor(".driver-nickname");
  protected getBadgeEl = this.locatorFor(".lane-badge");

  async getDriverName(): Promise<string> {
    return await (await this.getNameEl()).text();
  }

  async getLaneText(): Promise<string> {
    return await (await this.getBadgeEl()).text();
  }
}

export class RacedayOnDeckHarness
  extends ComponentHarness
  implements RacedayOnDeckHarnessBase
{
  static hostSelector = RacedayOnDeckHarnessBase.hostSelector;

  protected getTitleEl = this.locatorFor(
    RacedayOnDeckHarnessBase.selectors.title,
  );
  protected getItems = this.locatorForAll(RacedayOnDeckItemHarness);

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
