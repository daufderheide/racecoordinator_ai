import { Locator } from '@playwright/test';
import { HeatListHarnessBase, LaneItemData } from './heat-list.harness.base';

export class HeatListHarnessE2e implements HeatListHarnessBase {
  constructor(private locator: Locator) {}

  private get header() { return this.locator.locator('.heat-list-header'); }
  private get heatItems() { return this.locator.locator('.heat-item'); }

  async hasHeader(): Promise<boolean> {
    return await this.header.isVisible();
  }

  async getHeatCount(): Promise<number> {
    return await this.heatItems.count();
  }

  async getHeatNumberLabel(heatIndex: number): Promise<string> {
    const heatItem = this.heatItems.nth(heatIndex);
    return await heatItem.locator('.heat-number').innerText();
  }

  async getLanesForHeat(heatIndex: number): Promise<LaneItemData[]> {
    const heatItem = this.heatItems.nth(heatIndex);
    const lanes = heatItem.locator('.lane-item');
    const count = await lanes.count();
    const result: LaneItemData[] = [];
    
    for (let i = 0; i < count; i++) {
        const ln = lanes.nth(i);
        result.push({
            laneNumberLabel: await ln.locator('.lane-label').innerText(),
            driverNumberLabel: await ln.locator('.driver-number').innerText(),
            bgColor: await ln.evaluate((el) => window.getComputedStyle(el).backgroundColor),
            fgColor: await ln.evaluate((el) => window.getComputedStyle(el).color),
        });
    }
    return result;
  }
}
