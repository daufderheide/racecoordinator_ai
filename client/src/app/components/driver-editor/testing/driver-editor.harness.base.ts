import { ConfirmationModalHarnessBase } from '../../shared/confirmation-modal/testing/confirmation-modal.harness.base';

export abstract class DriverEditorHarnessBase {
  static readonly hostSelector = 'app-driver-editor';

  static readonly selectors = {
    nameInput: '.inputs-column .form-group:nth-child(1) input',
    nicknameInput: '.inputs-column .form-group:nth-child(2) input',
    undoBtn: 'app-undo-redo-controls button:nth-child(1)',
    redoBtn: 'app-undo-redo-controls button:nth-child(2)',
    backBtn: 'app-back-button button'
  };

  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getNickname(): Promise<string>;
  abstract setNickname(nickname: string): Promise<void>;
  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract clickBack(): Promise<void>;
  abstract getConfirmationModal(): Promise<ConfirmationModalHarnessBase>;
}
