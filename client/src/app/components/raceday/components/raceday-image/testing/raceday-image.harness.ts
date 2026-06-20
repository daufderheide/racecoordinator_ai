import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayImageHarnessBase } from "./raceday-image.harness.base";

export class RacedayImageHarness
  extends ComponentHarness
  implements RacedayImageHarnessBase
{
  static hostSelector = RacedayImageHarnessBase.hostSelector;

  protected getImageLocator = this.locatorFor(
    RacedayImageHarnessBase.selectors.image,
  );

  async getImageUrl(): Promise<string> {
    const img = await this.getImageLocator();
    return (await img.getAttribute("src")) || "";
  }
}
