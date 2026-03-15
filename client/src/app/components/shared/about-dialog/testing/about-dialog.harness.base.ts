export abstract class AboutDialogHarnessBase {
  static readonly hostSelector = 'app-about-dialog';

  static readonly selectors = {
    content: '.modal-content',
    title: '.modal-title',
    versionInfo: '.version-info',
    closeButton: '.btn-confirm'
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getVersionInfoText(): Promise<string>;
  abstract clickClose(): Promise<void>;
}
