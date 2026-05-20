import { ComponentHarness } from "@angular/cdk/testing";

import { DriverResultsHarnessBase } from "./driver-results.harness.base";

export class DriverResultsHarness
  extends ComponentHarness
  implements DriverResultsHarnessBase
{
  static hostSelector = DriverResultsHarnessBase.hostSelector;

  protected getHeaderBarEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.headerBar,
  );
  protected getOverallTableEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.overallTable,
  );
  protected getHeatsSectionEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.heatsSection,
  );
  protected getExpandedHeatCardEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.expandedHeatCard,
  );
  protected getLapsCellEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.lapsCell,
  );
  protected getLapChartSectionEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.lapChartSection,
  );
  protected getGridLinesEl = this.locatorForAll(
    DriverResultsHarnessBase.selectors.gridLine,
  );
  protected getLapBarsEl = this.locatorForAll(
    DriverResultsHarnessBase.selectors.lapBar,
  );
  protected getTeamDriverBadgesEl = this.locatorForAll(
    DriverResultsHarnessBase.selectors.teamDriverBadge,
  );
  protected getTooltipDriverEl = this.locatorForOptional(
    DriverResultsHarnessBase.selectors.tooltipDriver,
  );

  async hasHeaderBar(): Promise<boolean> {
    return (await this.getHeaderBarEl()) !== null;
  }

  async hasOverallTable(): Promise<boolean> {
    return (await this.getOverallTableEl()) !== null;
  }

  async hasHeatsSection(): Promise<boolean> {
    return (await this.getHeatsSectionEl()) !== null;
  }

  async hasExpandedHeatCard(): Promise<boolean> {
    return (await this.getExpandedHeatCardEl()) !== null;
  }

  async hasLapsCell(): Promise<boolean> {
    return (await this.getLapsCellEl()) !== null;
  }

  async hasLapChartSection(): Promise<boolean> {
    return (await this.getLapChartSectionEl()) !== null;
  }

  async getGridLineCount(): Promise<number> {
    return (await this.getGridLinesEl()).length;
  }

  async getLapBarCount(): Promise<number> {
    return (await this.getLapBarsEl()).length;
  }

  async getTeamDriverBadgeCount(): Promise<number> {
    return (await this.getTeamDriverBadgesEl()).length;
  }

  async hasTooltipDriver(): Promise<boolean> {
    return (await this.getTooltipDriverEl()) !== null;
  }

  async getTooltipDriverText(): Promise<string> {
    const el = await this.getTooltipDriverEl();
    return el ? await el.text() : "";
  }
}
