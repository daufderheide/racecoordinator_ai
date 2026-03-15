export abstract class ToolbarHarnessBase {
  static readonly hostSelector = 'app-toolbar';

  static readonly selectors = {
    undo: '.undo',
    redo: '.redo',
    edit: '#edit-track-btn',
    help: '#help-track-btn',
    delete: '#delete-track-btn'
  };

  abstract isUndoVisible(): Promise<boolean>;
  abstract isRedoVisible(): Promise<boolean>;
  abstract isEditVisible(): Promise<boolean>;
  abstract isHelpVisible(): Promise<boolean>;
  abstract isDeleteVisible(): Promise<boolean>;

  abstract isUndoDisabled(): Promise<boolean>;
  abstract isRedoDisabled(): Promise<boolean>;
  abstract isEditDisabled(): Promise<boolean>;
  abstract isDeleteDisabled(): Promise<boolean>;

  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract clickEdit(): Promise<void>;
  abstract clickHelp(): Promise<void>;
  abstract clickDelete(): Promise<void>;
}
