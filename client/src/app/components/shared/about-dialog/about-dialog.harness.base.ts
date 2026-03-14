export abstract class AboutDialogHarnessBase {
  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getVersionInfoText(): Promise<string>;
  abstract clickClose(): Promise<void>;
}
