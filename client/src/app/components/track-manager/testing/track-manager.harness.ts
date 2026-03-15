import { ComponentHarness } from '@angular/cdk/testing';
import { TrackManagerHarnessBase } from './track-manager.harness.base';
import { ArduinoSummaryHarness } from '..//arduino-summary/testing/arduino-summary.harness';

export class TrackManagerHarness extends ComponentHarness implements TrackManagerHarnessBase {
  static hostSelector = TrackManagerHarnessBase.hostSelector;

  protected getTrackItems = this.locatorForAll(TrackManagerHarnessBase.selectors.trackItem);
  protected getCreateButton = this.locatorFor(TrackManagerHarnessBase.selectors.createButton);
  protected getDetailHeader = this.locatorForOptional(TrackManagerHarnessBase.selectors.detailHeader);
  protected getArduinoSummaries = this.locatorForAll(ArduinoSummaryHarness);
  protected getLaneExpanderHeader = this.locatorFor(TrackManagerHarnessBase.selectors.laneExpanderHeader);
  protected getLaneExpanderContent = this.locatorForOptional(TrackManagerHarnessBase.selectors.laneExpanderContent);

  async getTrackNames(): Promise<string[]> {
    const items = await this.getTrackItems();
    return Promise.all(items.map(async item => {
      const nameEl = await item.locatorFor(TrackManagerHarnessBase.selectors.itemName)();
      return await nameEl.text();
    }));
  }

  async selectTrack(name: string): Promise<void> {
    const items = await this.getTrackItems();
    for (const item of items) {
      const nameEl = await item.locatorFor(TrackManagerHarnessBase.selectors.itemName)();
      if ((await nameEl.text()).trim() === name) {
        await item.click();
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

  async isLaneSummaryExpanded(): Promise<boolean> {
    const content = await this.getLaneExpanderContent();
    return content !== null;
  }

  async toggleLaneSummary(): Promise<void> {
    const header = await this.getLaneExpanderHeader();
    await header.click();
  }
}
