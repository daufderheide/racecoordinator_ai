import { ComponentHarness } from "@angular/cdk/testing";

import { ArduinoSummaryHarness } from "..//arduino-summary/testing/arduino-summary.harness";
import { CameraSummaryHarness } from "../camera-summary/testing/camera-summary.harness";
import { TrackManagerHarnessBase } from "./track-manager.harness.base";

export class TrackManagerHarness
  extends ComponentHarness
  implements TrackManagerHarnessBase
{
  static hostSelector = TrackManagerHarnessBase.hostSelector;

  protected getTrackItems = this.locatorForAll(
    TrackManagerHarnessBase.selectors.trackItem,
  );
  protected getTrackItemNames = this.locatorForAll(
    `${TrackManagerHarnessBase.selectors.trackItem} ${TrackManagerHarnessBase.selectors.itemName}`,
  );
  protected getCreateButton = this.locatorFor(
    TrackManagerHarnessBase.selectors.createButton,
  );
  protected getDetailHeader = this.locatorForOptional(
    TrackManagerHarnessBase.selectors.detailHeader,
  );
  protected getArduinoSummaries = this.locatorForAll(ArduinoSummaryHarness);
  protected getCameraSummaries = this.locatorForAll(CameraSummaryHarness);
  protected getLaneExpanderHeader = this.locatorFor(
    TrackManagerHarnessBase.selectors.laneExpanderHeader,
  );
  protected getLaneExpanderContent = this.locatorForOptional(
    TrackManagerHarnessBase.selectors.laneExpanderContent,
  );

  async getTrackNames(): Promise<string[]> {
    const nameEls = await this.getTrackItemNames();
    return Promise.all(nameEls.map(async (nameEl) => await nameEl.text()));
  }

  async selectTrack(name: string): Promise<void> {
    const items = await this.getTrackItems();
    const nameEls = await this.getTrackItemNames();
    for (let i = 0; i < items.length; i++) {
      if ((await nameEls[i].text()).trim() === name) {
        await items[i].click();
        return;
      }
    }
    throw new Error(`Track with name "${name}" not found`);
  }

  async getSelectedTrackName(): Promise<string | null> {
    const header = await this.getDetailHeader();
    return header ? await header.text() : null;
  }

  async clickCreateNew(): Promise<void> {
    const btn = await this.getCreateButton();
    await btn.click();
  }

  async getArduinoSummaryHarnesses(): Promise<ArduinoSummaryHarness[]> {
    return await this.getArduinoSummaries();
  }

  async getCameraSummaryHarnesses(): Promise<CameraSummaryHarness[]> {
    return await this.getCameraSummaries();
  }

  async isLaneSummaryExpanded(): Promise<boolean> {
    const content = await this.getLaneExpanderContent();
    return content !== null;
  }

  async toggleLaneSummary(): Promise<void> {
    const header = await this.getLaneExpanderHeader();
    await header.click();
  }
}
