import { ComponentHarness } from '@angular/cdk/testing';
import { HeatResultsHarnessBase } from './heat-results.harness.base';

export class HeatResultsHarness extends ComponentHarness implements HeatResultsHarnessBase {
  static hostSelector = HeatResultsHarnessBase.hostSelector;

  protected getRankingsGraphEl = this.locatorForOptional(HeatResultsHarnessBase.selectors.rankingsGraph);
  protected getLaptimesGraphEl = this.locatorForOptional(HeatResultsHarnessBase.selectors.laptimesGraph);
  protected getLegendItemsEl = this.locatorForAll(HeatResultsHarnessBase.selectors.legendItems);

  async getRankingsGraph(): Promise<any> {
    return await this.getRankingsGraphEl();
  }

  async getLaptimesGraph(): Promise<any> {
    return await this.getLaptimesGraphEl();
  }

  async getLegendItemCount(): Promise<number> {
    return (await this.getLegendItemsEl()).length;
  }
}
