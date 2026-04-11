import { ReorderDialogHarnessBase } from '..//reorder-dialog/testing/reorder-dialog.harness.base';

export abstract class UIEditorHarnessBase {
  static readonly hostSelector = 'app-ui-editor';

  static readonly selectors = {
    reorderBtn: '.column-actions button',
    imageSelector: 'app-image-selector',
    imagePreview: '.image-preview',
    screenCards: '.screen-card',
    addScreenBtn: '.sidebar-header .toolbar-btn.info',
    defaultBadge: '.default-badge',
    enabledBadge: '.enabled-badge',
    editScreenBtn: '.toolbar-btn.ghost .material-icons:has-text("edit")',
    duplicateScreenBtn: '.toolbar-btn.ghost .material-icons:has-text("content_copy")',
    deleteScreenBtn: '.toolbar-btn.danger .delete-x',
  };

  abstract clickReorderColumns(): Promise<void>;
  abstract getReorderDialogHarness(): Promise<ReorderDialogHarnessBase>;
  abstract clickImageSelector(index: number): Promise<void>;

  // Screen Manager methods
  abstract getScreenCount(): Promise<number>;
  abstract clickAddScreen(): Promise<void>;
  abstract clickEditScreen(index: number): Promise<void>;
  abstract clickDuplicateScreen(index: number): Promise<void>;
  abstract clickDeleteScreen(index: number): Promise<void>;
  abstract clickDefaultBadge(index: number): Promise<void>;
  abstract clickEnabledBadge(index: number): Promise<void>;
  abstract getScreenName(index: number): Promise<string>;
}