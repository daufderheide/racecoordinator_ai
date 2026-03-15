export abstract class UndoRedoControlsHarnessBase {
  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract isUndoDisabled(): Promise<boolean>;
  abstract isRedoDisabled(): Promise<boolean>;
}
