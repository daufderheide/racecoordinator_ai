import { ConfirmationModalHarnessBase } from '../../confirmation-modal/testing/confirmation-modal.harness.base';

export abstract class BackButtonHarnessBase {
  static readonly hostSelector = 'app-back-button';

  static readonly selectors = {
    button: '.back-btn',
    confirmModalConfirm: `${ConfirmationModalHarnessBase.hostSelector} ${ConfirmationModalHarnessBase.selectors.confirmButton}`,
    confirmModalCancel: `${ConfirmationModalHarnessBase.hostSelector} ${ConfirmationModalHarnessBase.selectors.cancelButton}`
  };

  abstract click(): Promise<void>;
  abstract getLabel(): Promise<string>;
  abstract clickModalConfirm(): Promise<void>;
  abstract clickModalCancel(): Promise<void>;
}
