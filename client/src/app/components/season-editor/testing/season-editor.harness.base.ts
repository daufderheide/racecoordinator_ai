export abstract class SeasonEditorHarnessBase {
  static readonly hostSelector = "app-season-editor";

  static readonly selectors = {
    nameInput: "#season-name",
    dropsInput: "#season-drops",
    addRaceBtn: ".btn-add-race",
    copyBtn: "app-editor-title button.copy-btn, app-editor-title .copy",
    undoBtn: "app-editor-title .undo",
    redoBtn: "app-editor-title .redo",
    standingsTable: ".summary-section .standings-table",
    expanderCards: ".race-expander-card",
  };

  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getDrops(): Promise<number>;
  abstract setDrops(drops: number): Promise<void>;
  abstract clickCopy(): Promise<void>;
  abstract clickAddRace(): Promise<void>;
  abstract getRaceExpanderCount(): Promise<number>;
}
