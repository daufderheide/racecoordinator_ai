import { Locator } from "@playwright/test";

import { RacedayModalsHarnessBase } from "./raceday-modals.harness.base";

export class RacedayModalsHarnessE2e implements RacedayModalsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayModalsHarnessBase;
  }

  private get ackModal() {
    return this.locator.locator(this.base.selectors.ackModal);
  }

  private get exitModal() {
    return this.locator.locator(this.base.selectors.exitModal);
  }

  private get skipHeatModal() {
    return this.locator.locator(this.base.selectors.skipHeatModal);
  }

  private get skipRaceModal() {
    return this.locator.locator(this.base.selectors.skipRaceModal);
  }

  private get restartHeatModal() {
    return this.locator.locator(this.base.selectors.restartHeatModal);
  }

  private get deferHeatModal() {
    return this.locator.locator(this.base.selectors.deferHeatModal);
  }

  async isAckModalVisible(): Promise<boolean> {
    return (
      (await this.ackModal.count()) > 0 &&
      (await this.ackModal.locator(".modal-content").isVisible())
    );
  }

  async isExitModalVisible(): Promise<boolean> {
    return (
      (await this.exitModal.count()) > 0 &&
      (await this.exitModal.locator(".modal-content").isVisible())
    );
  }

  async isSkipHeatModalVisible(): Promise<boolean> {
    return (
      (await this.skipHeatModal.count()) > 0 &&
      (await this.skipHeatModal.locator(".modal-content").isVisible())
    );
  }

  async isSkipRaceModalVisible(): Promise<boolean> {
    return (
      (await this.skipRaceModal.count()) > 0 &&
      (await this.skipRaceModal.locator(".modal-content").isVisible())
    );
  }

  async isRestartHeatModalVisible(): Promise<boolean> {
    return (
      (await this.restartHeatModal.count()) > 0 &&
      (await this.restartHeatModal.locator(".modal-content").isVisible())
    );
  }

  async isDeferHeatModalVisible(): Promise<boolean> {
    return (
      (await this.deferHeatModal.count()) > 0 &&
      (await this.deferHeatModal.locator(".modal-content").isVisible())
    );
  }
}
