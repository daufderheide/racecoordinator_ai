import { RacedayEventNameHarnessBase } from "./raceday-event-name.harness.base";

export class RacedayEventNameHarnessE2e implements RacedayEventNameHarnessBase {
  static readonly hostSelector = RacedayEventNameHarnessBase.hostSelector;

  constructor(private page: any) {}

  async getLabel(): Promise<string> {
    return (
      (await this.page
        .locator(
          `${RacedayEventNameHarnessE2e.hostSelector} ${RacedayEventNameHarnessBase.selectors.label}`,
        )
        .textContent()) ?? ""
    ).trim();
  }

  async getEventName(): Promise<string> {
    return (
      (await this.page
        .locator(
          `${RacedayEventNameHarnessE2e.hostSelector} ${RacedayEventNameHarnessBase.selectors.eventName}`,
        )
        .textContent()) ?? ""
    ).trim();
  }
}
