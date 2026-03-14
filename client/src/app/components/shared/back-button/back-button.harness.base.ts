export abstract class BackButtonHarnessBase {
  abstract click(): Promise<void>;
  abstract getLabel(): Promise<string>;
  abstract clickModalConfirm(): Promise<void>;
  abstract clickModalCancel(): Promise<void>;
}
