import { Locator } from "@playwright/test";

import { RacedayCameraQrHarnessBase } from "./raceday-camera-qr.harness.base";

export class RacedayCameraQrHarnessE2e implements RacedayCameraQrHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayCameraQrHarnessBase;
  }

  private get card() {
    return this.locator.locator(this.base.selectors.card).first();
  }

  private get qrImg() {
    return this.locator.locator(this.base.selectors.qrImg).first();
  }

  private get modal() {
    return this.locator.locator(this.base.selectors.modal).first();
  }

  private get modalInput() {
    return this.locator.locator(this.base.selectors.modalInput).first();
  }

  private get copyBtn() {
    return this.locator.locator(this.base.selectors.copyBtn).first();
  }

  private get testBtn() {
    return this.locator.locator(this.base.selectors.testBtn).first();
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn).first();
  }

  async getQrCodeSrc(): Promise<string | null> {
    if (await this.qrImg.isVisible()) {
      return await this.qrImg.getAttribute("src");
    }
    return null;
  }

  async isModalOpen(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  async clickCard(): Promise<void> {
    await this.card.click();
  }

  async clickClose(): Promise<void> {
    await this.closeBtn.click();
  }

  async getModalInputUrl(): Promise<string | null> {
    return await this.modalInput.inputValue();
  }

  async clickCopy(): Promise<void> {
    await this.copyBtn.click();
  }

  async clickTest(): Promise<void> {
    await this.testBtn.click();
  }
}
