export abstract class RacedayLaneViewHarnessBase {
  static readonly hostSelector = "app-raceday-lane-view";

  static readonly selectors = {
    headerCell: ".table-header-row .header-cell",
    tableRow: ".table-body .table-row",
    cell: ".body-cell",
    teammateSelect: ".teammate-select",
    teammateDisplayName: ".teammate-display-name",
    driftIndicator: "[data-testid='drift-badge']",
    dragHandle: ".drag-handle",
  };

  abstract getHeaderCells(): Promise<string[]>;
  abstract getRowCount(): Promise<number>;
  abstract getRowCells(rowIndex: number): Promise<string[]>;
  abstract getTeammateSelectValue(rowIndex: number): Promise<string | null>;
  abstract setTeammateSelectValue(rowIndex: number, val: string): Promise<void>;
  abstract hasDriftIndicator(rowIndex: number): Promise<boolean>;
  abstract clickCell(rowIndex: number, colIndex: number): Promise<void>;
}
