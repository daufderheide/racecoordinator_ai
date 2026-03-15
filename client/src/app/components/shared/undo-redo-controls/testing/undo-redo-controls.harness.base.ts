export abstract class UndoRedoControlsHarnessBase {
  static readonly hostSelector = 'app-undo-redo-controls';

  static readonly selectors = {
    buttons: '.btn-icon'
  };

  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract isUndoDisabled(): Promise<boolean>;
  abstract isRedoDisabled(): Promise<boolean>;
}
