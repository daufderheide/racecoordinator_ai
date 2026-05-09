import { ReorderDialogHarnessBase } from '..//reorder-dialog/testing/reorder-dialog.harness.base';

export abstract class UIEditorHarnessBase {
  static readonly hostSelector = 'app-ui-editor';

  static readonly selectors = {
    reorderBtn: '.column-actions button',
    imageSelector: 'app-image-selector',
    imagePreview: '.image-preview'
  };

  abstract clickReorderColumns(): Promise<void>;
  abstract getReorderDialogHarness(): Promise<ReorderDialogHarnessBase>;
  abstract clickImageSelector(index: number): Promise<void>;
}
