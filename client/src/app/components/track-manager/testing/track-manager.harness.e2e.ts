import { Locator } from '@playwright/test';
import { TrackManagerHarnessBase } from './track-manager.harness.base';
import { ArduinoSummaryHarnessE2e } from '..//arduino-summary/testing/arduino-summary.harness.e2e';

export class TrackManagerHarnessE2e implements TrackManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get trackItems() { return this.locator.locator('.sidebar-list .list-item'); }
  private get createButton() { return this.locator.locator('#create-track-btn'); }
  private get detailHeader() { return this.locator.locator('.detail-panel .detail-header h2'); }
  private get arduinoSummaries() { return this.locator.locator('app-arduino-summary'); }
  private get laneExpanderHeader() { return this.locator.locator('.lane-viz-container .section-header'); }
  private get laneExpanderContent() { return this.locator.locator('.lane-viz-container .section-content'); }

  async getTrackNames(): Promise<string[]> {
    const count = await this.trackItems.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push(await this.trackItems.nth(i).locator('.item-name').innerText());
    }
    return names;
  }

  async selectTrack(name: string): Promise<void> {
    await this.trackItems.locator(`text=${name}`).first().click();
  }

  async getSelectedTrackName(): Promise<string | null> {
    if (await this.detailHeader.isVisible()) {
      return await this.detailHeader.innerText();
    }
    return null;
  }

  async clickCreateNew(): Promise<void> {
    await this.createButton.click();
  }

  async getArduinoSummaryHarnesses(): Promise<ArduinoSummaryHarnessE2e[]> {
    const count = await this.arduinoSummaries.count();
    const harnesses: ArduinoSummaryHarnessE2e[] = [];
    for (let i = 0; i < count; i++) {
      harnesses.push(new ArduinoSummaryHarnessE2e(this.arduinoSummaries.nth(i)));
    }
    return harnesses;
  }

  async isLaneSummaryExpanded(): Promise<boolean> {
    return await this.laneExpanderContent.isVisible();
  }

  async toggleLaneSummary(): Promise<void> {
    await this.laneExpanderHeader.click();
  }
}
