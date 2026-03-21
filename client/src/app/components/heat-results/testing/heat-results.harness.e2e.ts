import { Locator } from '@playwright/test';
import { HeatResultsHarnessBase } from './heat-results.harness.base';

export class HeatResultsHarnessE2e implements HeatResultsHarnessBase {
  constructor(private container: Locator) {}

  async getRankingsGraph(): Promise<any> {
    return this.container.locator(HeatResultsHarnessBase.selectors.rankingsGraph);
  }

  async getLaptimesGraph(): Promise<any> {
    return this.container.locator(HeatResultsHarnessBase.selectors.laptimesGraph);
  }

  async getLegendItemCount(): Promise<number> {
    return await this.container.locator(HeatResultsHarnessBase.selectors.legendItems).count();
  }
}
