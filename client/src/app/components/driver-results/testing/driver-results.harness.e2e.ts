import { Locator } from "@playwright/test";

import { DriverResultsHarnessBase } from "./driver-results.harness.base";

export class DriverResultsHarnessE2e implements DriverResultsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return DriverResultsHarnessBase;
  }

  private get headerBar() {
    return this.locator.locator(this.base.selectors.headerBar).first();
  }

  private get overallTable() {
    return this.locator.locator(this.base.selectors.overallTable).first();
  }

  private get heatsSection() {
    return this.locator.locator(this.base.selectors.heatsSection).first();
  }

  private get expandedHeatCard() {
    return this.locator.locator(this.base.selectors.expandedHeatCard).first();
  }

  private get lapsCell() {
    return this.locator.locator(this.base.selectors.lapsCell).first();
  }

  private get lapChartSection() {
    return this.locator.locator(this.base.selectors.lapChartSection).first();
  }

  private get gridLines() {
    return this.locator.locator(this.base.selectors.gridLine);
  }

  private get lapBars() {
    return this.locator.locator(this.base.selectors.lapBar);
  }

  private get teamDriverBadges() {
    return this.locator.locator(this.base.selectors.teamDriverBadge);
  }

  private get lapBarTooltip() {
    return this.locator.locator(this.base.selectors.lapBarTooltip).first();
  }

  private get tooltipDriver() {
    return this.locator.locator(this.base.selectors.tooltipDriver).first();
  }

  async hasHeaderBar(): Promise<boolean> {
    return await this.headerBar.isVisible();
  }

  async hasOverallTable(): Promise<boolean> {
    return await this.overallTable.isVisible();
  }

  async hasHeatsSection(): Promise<boolean> {
    return await this.heatsSection.isVisible();
  }

  async hasExpandedHeatCard(): Promise<boolean> {
    return await this.expandedHeatCard.isVisible();
  }

  async hasLapsCell(): Promise<boolean> {
    return await this.lapsCell.isVisible();
  }

  async hasLapChartSection(): Promise<boolean> {
    return await this.lapChartSection.isVisible();
  }

  async getGridLineCount(): Promise<number> {
    return await this.gridLines.count();
  }

  async getLapBarCount(): Promise<number> {
    return await this.lapBars.count();
  }

  async getTeamDriverBadgeCount(): Promise<number> {
    return await this.teamDriverBadges.count();
  }

  async hasTooltipDriver(): Promise<boolean> {
    return await this.tooltipDriver.isVisible();
  }

  async getTooltipDriverText(): Promise<string> {
    return await this.tooltipDriver.innerText();
  }

  // Playwright specific interaction/locator methods
  getLapBar(index: number): Locator {
    return this.lapBars.nth(index);
  }

  getTeamDriverBadge(index: number): Locator {
    return this.teamDriverBadges.nth(index);
  }

  getTooltip(): Locator {
    return this.lapBarTooltip;
  }

  getChartSection(): Locator {
    return this.lapChartSection;
  }

  getLapBarsLocator(): Locator {
    return this.lapBars;
  }

  getTeamDriverBadgesLocator(): Locator {
    return this.teamDriverBadges;
  }

  getExpandedHeatCardLocator(): Locator {
    return this.expandedHeatCard;
  }

  async hoverLapBar(index: number): Promise<void> {
    await this.getLapBar(index).hover();
  }
}
