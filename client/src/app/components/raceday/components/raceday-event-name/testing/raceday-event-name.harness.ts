import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayEventNameHarnessBase } from "./raceday-event-name.harness.base";

export class RacedayEventNameHarness
  extends ComponentHarness
  implements RacedayEventNameHarnessBase
{
  static hostSelector = RacedayEventNameHarnessBase.hostSelector;

  protected getLabelEl = this.locatorForOptional(
    RacedayEventNameHarnessBase.selectors.label,
  );
  protected getEventNameEl = this.locatorForOptional(
    RacedayEventNameHarnessBase.selectors.eventName,
  );

  async isVisible(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getLabel(): Promise<string> {
    const el = await this.getLabelEl();
    return el ? (await el.text()).trim() : "";
  }

  async getEventName(): Promise<string> {
    const el = await this.getEventNameEl();
    return el ? (await el.text()).trim() : "";
  }
}
