import { Locator } from "@playwright/test";

import { RaceResultsHarnessBase } from "./race-results.harness.base";

export class RaceResultsHarnessE2e implements RaceResultsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RaceResultsHarnessBase;
  }

  private get resultsTableHeader() {
    return this.locator.locator(this.base.selectors.resultsTableHeader).first();
  }

  private get resultsTableBody() {
    return this.locator.locator(this.base.selectors.resultsTableBody).first();
  }

  private get resultsSvgGraphs() {
    return this.locator.locator(this.base.selectors.resultsSvgGraphs).first();
  }

  private get rankingsGraph() {
    return this.locator.locator(this.base.selectors.rankingsGraph).first();
  }

  private get laptimesGraph() {
    return this.locator.locator(this.base.selectors.laptimesGraph).first();
  }

  private get driverRows() {
    return this.locator.locator(this.base.selectors.driverRow);
  }

  private get legendItems() {
    return this.locator.locator(this.base.selectors.legendItem);
  }

  private get driverGroups() {
    return this.locator.locator(this.base.selectors.driverGroup);
  }

  async hasResultsTableHeader(): Promise<boolean> {
    return await this.resultsTableHeader.isVisible();
  }

  async hasResultsTableBody(): Promise<boolean> {
    return await this.resultsTableBody.isVisible();
  }

  async hasResultsSvgGraphs(): Promise<boolean> {
    return await this.resultsSvgGraphs.isVisible();
  }

  async hasRankingsGraph(): Promise<boolean> {
    return await this.rankingsGraph.isVisible();
  }

  async hasLaptimesGraph(): Promise<boolean> {
    return await this.laptimesGraph.isVisible();
  }

  async getDriverRowCount(): Promise<number> {
    return await this.driverRows.count();
  }

  async getLegendItemCount(): Promise<number> {
    return await this.legendItems.count();
  }

  async getDriverGroupCount(): Promise<number> {
    return await this.driverGroups.count();
  }

  // Playwright specific interaction methods
  async clickLegendItem(name: string): Promise<void> {
    const item = this.legendItems.filter({ hasText: name });
    await item.click();
  }

  async doubleClickLegendItem(name: string): Promise<void> {
    const item = this.legendItems.filter({ hasText: name });
    await item.dblclick();
  }

  async hoverLegendItem(name: string): Promise<void> {
    const item = this.legendItems.filter({ hasText: name });
    await item.hover();
  }
}
