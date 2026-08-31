import { ComponentHarness } from "@angular/cdk/testing";

import { SeasonSummaryHarnessBase } from "./season-summary.harness.base";

export class SeasonSummaryHarness
  extends ComponentHarness
  implements SeasonSummaryHarnessBase
{
  static hostSelector = SeasonSummaryHarnessBase.hostSelector;

  protected getSeasonNameEl = this.locatorForOptional(
    SeasonSummaryHarnessBase.selectors.seasonName,
  );
  protected getStandingsRows = this.locatorForAll(
    SeasonSummaryHarnessBase.selectors.standingsRows,
  );
  protected getEmptyStandingsEl = this.locatorForOptional(
    SeasonSummaryHarnessBase.selectors.emptyStandings,
  );
  protected getDemoBadgeEl = this.locatorForOptional(
    SeasonSummaryHarnessBase.selectors.demoBadge,
  );

  async getSeasonName(): Promise<string> {
    const el = await this.getSeasonNameEl();
    return el ? await el.text() : "";
  }

  async getStandingsCount(): Promise<number> {
    const rows = await this.getStandingsRows();
    return rows.length;
  }

  async getEmptyMessage(): Promise<string> {
    const el = await this.getEmptyStandingsEl();
    return el ? await el.text() : "";
  }

  async hasDemoBadge(): Promise<boolean> {
    const el = await this.getDemoBadgeEl();
    return el !== null;
  }
}
