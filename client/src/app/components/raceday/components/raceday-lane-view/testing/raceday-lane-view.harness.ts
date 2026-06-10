import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayLaneViewHarnessBase } from "./raceday-lane-view.harness.base";

export class RacedayLaneRowHarness extends ComponentHarness {
  static hostSelector = RacedayLaneViewHarnessBase.selectors.tableRow;

  protected getCells = this.locatorForAll(
    RacedayLaneViewHarnessBase.selectors.cell,
  );
  protected getTeammateSelect = this.locatorForOptional(
    RacedayLaneViewHarnessBase.selectors.teammateSelect,
  );
  protected getDriftIndicator = this.locatorForOptional(
    RacedayLaneViewHarnessBase.selectors.driftIndicator,
  );

  async getCellTexts(): Promise<string[]> {
    const cells = await this.getCells();
    const texts: string[] = [];
    for (const cell of cells) {
      texts.push(await cell.text());
    }
    return texts;
  }

  async getTeammateSelectValue(): Promise<string | null> {
    const select = await this.getTeammateSelect();
    return select ? await select.getProperty("value") : null;
  }

  async setTeammateSelectValue(val: string): Promise<void> {
    const select = await this.getTeammateSelect();
    if (select) {
      const options = await this.locatorForAll(`option[value="${val}"]`)();
      if (options.length > 0) {
        await options[0].click();
        await select.dispatchEvent("change");
      }
    }
  }

  async hasDriftIndicator(): Promise<boolean> {
    const ind = await this.getDriftIndicator();
    return ind !== null;
  }

  async clickCell(colIndex: number): Promise<void> {
    const cells = await this.getCells();
    if (colIndex < cells.length) {
      await cells[colIndex].click();
    }
  }
}

export class RacedayLaneViewHarness
  extends ComponentHarness
  implements RacedayLaneViewHarnessBase
{
  static hostSelector = RacedayLaneViewHarnessBase.hostSelector;

  protected getHeaderCellEls = this.locatorForAll(
    RacedayLaneViewHarnessBase.selectors.headerCell,
  );
  protected getRows = this.locatorForAll(RacedayLaneRowHarness);

  async getHeaderCells(): Promise<string[]> {
    const cells = await this.getHeaderCellEls();
    const texts: string[] = [];
    for (const cell of cells) {
      texts.push(await cell.text());
    }
    return texts;
  }

  async getRowCount(): Promise<number> {
    return (await this.getRows()).length;
  }

  async getRowCells(rowIndex: number): Promise<string[]> {
    const rows = await this.getRows();
    if (rowIndex < rows.length) {
      return await rows[rowIndex].getCellTexts();
    }
    return [];
  }

  async getTeammateSelectValue(rowIndex: number): Promise<string | null> {
    const rows = await this.getRows();
    if (rowIndex < rows.length) {
      return await rows[rowIndex].getTeammateSelectValue();
    }
    return null;
  }

  async setTeammateSelectValue(rowIndex: number, val: string): Promise<void> {
    const rows = await this.getRows();
    if (rowIndex < rows.length) {
      await rows[rowIndex].setTeammateSelectValue(val);
    }
  }

  async hasDriftIndicator(rowIndex: number): Promise<boolean> {
    const rows = await this.getRows();
    if (rowIndex < rows.length) {
      return await rows[rowIndex].hasDriftIndicator();
    }
    return false;
  }

  async clickCell(rowIndex: number, colIndex: number): Promise<void> {
    const rows = await this.getRows();
    if (rowIndex < rows.length) {
      await rows[rowIndex].clickCell(colIndex);
    }
  }
}
