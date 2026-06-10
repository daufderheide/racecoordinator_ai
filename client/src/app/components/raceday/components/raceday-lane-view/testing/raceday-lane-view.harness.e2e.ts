import { Locator } from "@playwright/test";

import { RacedayLaneViewHarnessBase } from "./raceday-lane-view.harness.base";

export class RacedayLaneViewHarnessE2e implements RacedayLaneViewHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayLaneViewHarnessBase;
  }

  private get headerCells() {
    return this.locator.locator(this.base.selectors.headerCell);
  }

  private get tableRows() {
    return this.locator.locator(this.base.selectors.tableRow);
  }

  async getHeaderCells(): Promise<string[]> {
    return await this.headerCells.allInnerTexts();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async getRowCells(rowIndex: number): Promise<string[]> {
    const row = this.tableRows.nth(rowIndex);
    const cells = row.locator(this.base.selectors.cell);
    return await cells.allInnerTexts();
  }

  async getTeammateSelectValue(rowIndex: number): Promise<string | null> {
    const row = this.tableRows.nth(rowIndex);
    const select = row.locator(this.base.selectors.teammateSelect);
    if (await select.isVisible()) {
      return await select.inputValue();
    }
    return null;
  }

  async setTeammateSelectValue(rowIndex: number, val: string): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    const select = row.locator(this.base.selectors.teammateSelect);
    await select.selectOption(val);
  }

  async hasDriftIndicator(rowIndex: number): Promise<boolean> {
    const row = this.tableRows.nth(rowIndex);
    const ind = row.locator(this.base.selectors.driftIndicator);
    return await ind.isVisible();
  }

  async clickCell(rowIndex: number, colIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    const cells = row.locator(this.base.selectors.cell);
    await cells.nth(colIndex).click();
  }
}
