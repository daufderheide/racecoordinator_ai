import { ComponentHarness } from '@angular/cdk/testing';
import { HeatListHarnessBase, LaneItemData } from './heat-list.harness.base';

export class LaneItemHarness extends ComponentHarness {
  static hostSelector = HeatListHarnessBase.selectors.laneItem;
  
  async getBgColor(): Promise<string> {
    return await (await this.host()).getCssValue('background-color');
  }
  async getFgColor(): Promise<string> {
    return await (await this.host()).getCssValue('color');
  }
}

export class HeatItemHarness extends ComponentHarness {
  static hostSelector = HeatListHarnessBase.selectors.heatItem;
  
  async getLanes(): Promise<LaneItemData[]> {
    const lanes = await this.locatorForAll(LaneItemHarness)();
    return Promise.all(lanes.map(async l => ({
      laneNumberLabel: '',
      driverNumberLabel: '',
      bgColor: await l.getBgColor(),
      fgColor: await l.getFgColor()
    })));
  }
}

export class HeatListHarness extends ComponentHarness implements HeatListHarnessBase {
  static hostSelector = HeatListHarnessBase.hostSelector;

  protected getHeader = this.locatorForOptional(HeatListHarnessBase.selectors.header);
  protected getHeatItemsRaw = this.locatorForAll(HeatListHarnessBase.selectors.heatItem);
  protected getHeatItemsHarness = this.locatorForAll(HeatItemHarness);

  async hasHeader(): Promise<boolean> {
    return (await this.getHeader()) !== null;
  }

  async getHeatCount(): Promise<number> {
    const items = await this.getHeatItemsRaw();
    return items.length;
  }

  protected getHeatNumbers = this.locatorForAll(HeatListHarnessBase.selectors.heatNumber);

  async getHeatNumberLabel(heatIndex: number): Promise<string> {
    const items = await this.getHeatNumbers();
    if (heatIndex < 0 || heatIndex >= items.length) {
      throw new Error(`Heat index ${heatIndex} out of bounds.`);
    }
    return await items[heatIndex].text();
  }

  async getLanesForHeat(heatIndex: number): Promise<LaneItemData[]> {
    const items = await this.getHeatItemsHarness();
    if (heatIndex < 0 || heatIndex >= items.length) {
        throw new Error(`Heat index ${heatIndex} out of bounds.`);
    }
    return items[heatIndex].getLanes();
  }
}
