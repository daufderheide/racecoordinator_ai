import { Locator } from '@playwright/test';
import { HeatListHarnessBase, LaneItemData } from './heat-list.harness.base';

export class HeatListHarnessE2e implements HeatListHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return HeatListHarnessBase; }

  private get header() { return this.locator.locator(this.base.selectors.header); }
  private get heatItems() { return this.locator.locator(this.base.selectors.heatItem); }

  async hasHeader(): Promise<boolean> {
    return await this.header.isVisible();
  }

  async getHeatCount(): Promise<number> {
    return await this.heatItems.count();
  }

  async getHeatNumberLabel(heatIndex: number): Promise<string> {
    const heatItem = this.heatItems.nth(heatIndex);
    return await heatItem.locator(this.base.selectors.heatNumber).innerText();
  }

  async getLanesForHeat(heatIndex: number): Promise<LaneItemData[]> {
    const heatItem = this.heatItems.nth(heatIndex);
    const lanes = heatItem.locator(this.base.selectors.laneItem);
    const count = await lanes.count();
    const result: LaneItemData[] = [];
    
    for (let i = 0; i < count; i++) {
        const ln = lanes.nth(i);
        result.push({
            laneNumberLabel: await ln.locator(this.base.selectors.laneLabel).innerText(),
            driverNumberLabel: await ln.locator(this.base.selectors.driverNumber).innerText(),
            bgColor: await ln.evaluate((el) => window.getComputedStyle(el).backgroundColor),
            fgColor: await ln.evaluate((el) => window.getComputedStyle(el).color),
        });
    }
    return result;
  }
}
