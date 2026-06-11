import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayQrHarnessBase } from "./raceday-qr.harness.base";

export class RacedayQrHarness
  extends ComponentHarness
  implements RacedayQrHarnessBase
{
  static hostSelector = RacedayQrHarnessBase.hostSelector;

  protected getQrImgEl = this.locatorForOptional(
    RacedayQrHarnessBase.selectors.qrImg,
  );

  async getQrCodeSrc(): Promise<string | null> {
    const el = await this.getQrImgEl();
    return el ? await el.getAttribute("src") : null;
  }
}
