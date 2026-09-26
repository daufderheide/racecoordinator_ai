import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayCameraQrHarnessBase } from "./raceday-camera-qr.harness.base";

export class RacedayCameraQrHarness
  extends ComponentHarness
  implements RacedayCameraQrHarnessBase
{
  static hostSelector = RacedayCameraQrHarnessBase.hostSelector;

  protected getCardEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.card,
  );
  protected getQrImgEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.qrImg,
  );
  protected getModalEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.modal,
  );
  protected getModalQrImgEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.modalQrImg,
  );
  protected getModalInputEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.modalInput,
  );
  protected getCopyBtnEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.copyBtn,
  );
  protected getTestBtnEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.testBtn,
  );
  protected getCloseBtnEl = this.locatorForOptional(
    RacedayCameraQrHarnessBase.selectors.closeBtn,
  );

  async getQrCodeSrc(): Promise<string | null> {
    const el = await this.getQrImgEl();
    return el ? await el.getAttribute("src") : null;
  }

  async isModalOpen(): Promise<boolean> {
    const el = await this.getModalEl();
    return el !== null;
  }

  async clickCard(): Promise<void> {
    const el = await this.getCardEl();
    if (el) {
      await el.click();
    }
  }

  async clickClose(): Promise<void> {
    const el = await this.getCloseBtnEl();
    if (el) {
      await el.click();
    }
  }

  async getModalInputUrl(): Promise<string | null> {
    const el = await this.getModalInputEl();
    return el ? await el.getProperty("value") : null;
  }

  async clickCopy(): Promise<void> {
    const el = await this.getCopyBtnEl();
    if (el) {
      await el.click();
    }
  }

  async clickTest(): Promise<void> {
    const el = await this.getTestBtnEl();
    if (el) {
      await el.click();
    }
  }
}
