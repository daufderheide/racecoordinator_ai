import { ComponentHarness } from "@angular/cdk/testing";

import { RaceResultsHarnessBase } from "./race-results.harness.base";

export class RaceResultsHarness
  extends ComponentHarness
  implements RaceResultsHarnessBase
{
  static hostSelector = RaceResultsHarnessBase.hostSelector;

  protected getResultsTableHeaderEl = this.locatorForOptional(
    RaceResultsHarnessBase.selectors.resultsTableHeader,
  );
  protected getResultsTableBodyEl = this.locatorForOptional(
    RaceResultsHarnessBase.selectors.resultsTableBody,
  );
  protected getResultsSvgGraphsEl = this.locatorForOptional(
    RaceResultsHarnessBase.selectors.resultsSvgGraphs,
  );
  protected getRankingsGraphEl = this.locatorForOptional(
    RaceResultsHarnessBase.selectors.rankingsGraph,
  );
  protected getLaptimesGraphEl = this.locatorForOptional(
    RaceResultsHarnessBase.selectors.laptimesGraph,
  );
  protected getDriverRowsEl = this.locatorForAll(
    RaceResultsHarnessBase.selectors.driverRow,
  );
  protected getLegendItemsEl = this.locatorForAll(
    RaceResultsHarnessBase.selectors.legendItem,
  );
  protected getDriverGroupsEl = this.locatorForAll(
    RaceResultsHarnessBase.selectors.driverGroup,
  );

  async hasResultsTableHeader(): Promise<boolean> {
    return (await this.getResultsTableHeaderEl()) !== null;
  }

  async hasResultsTableBody(): Promise<boolean> {
    return (await this.getResultsTableBodyEl()) !== null;
  }

  async hasResultsSvgGraphs(): Promise<boolean> {
    return (await this.getResultsSvgGraphsEl()) !== null;
  }

  async hasRankingsGraph(): Promise<boolean> {
    return (await this.getRankingsGraphEl()) !== null;
  }

  async hasLaptimesGraph(): Promise<boolean> {
    return (await this.getLaptimesGraphEl()) !== null;
  }

  async getDriverRowCount(): Promise<number> {
    return (await this.getDriverRowsEl()).length;
  }

  async getLegendItemCount(): Promise<number> {
    return (await this.getLegendItemsEl()).length;
  }

  async getDriverGroupCount(): Promise<number> {
    return (await this.getDriverGroupsEl()).length;
  }
}
