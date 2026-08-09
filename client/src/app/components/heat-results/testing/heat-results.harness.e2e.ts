import { Locator } from "@playwright/test";

import { HeatResultsHarnessBase } from "./heat-results.harness.base";

export class HeatResultsHarnessE2e implements HeatResultsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return HeatResultsHarnessBase;
  }

  private get heatDriverExpanders() {
    return this.locator.locator(this.base.selectors.heatDriverExpander);
  }

  private get twinGraphs() {
    return this.locator.locator(this.base.selectors.twinGraphs).first();
  }

  private get legendItems() {
    return this.locator.locator(this.base.selectors.legendItem);
  }

  async hasHeatDriverExpander(): Promise<boolean> {
    return (await this.heatDriverExpanders.count()) > 0;
  }

  async hasTwinGraphs(): Promise<boolean> {
    return await this.twinGraphs.isVisible();
  }

  async getHeatDriverExpanderCount(): Promise<number> {
    return await this.heatDriverExpanders.count();
  }

  async hoverLegendItem(name: string): Promise<void> {
    const item = this.legendItems.filter({ hasText: name }).first();
    await item.hover();
  }
}
