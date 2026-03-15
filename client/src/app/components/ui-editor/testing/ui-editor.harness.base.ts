import { ReorderDialogHarnessBase } from '..//reorder-dialog/testing/reorder-dialog.harness.base';

export abstract class UIEditorHarnessBase {
  abstract clickReorderColumns(): Promise<void>;
  abstract getReorderDialogHarness(): Promise<ReorderDialogHarnessBase>;
  abstract clickImageSelector(index: number): Promise<void>;
}
