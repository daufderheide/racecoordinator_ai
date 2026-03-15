import { ConfirmationModalHarnessBase } from '../../shared/confirmation-modal/testing/confirmation-modal.harness.base';

export abstract class DriverEditorHarnessBase {
  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getNickname(): Promise<string>;
  abstract setNickname(nickname: string): Promise<void>;
  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract clickBack(): Promise<void>;
  abstract getConfirmationModal(): Promise<ConfirmationModalHarnessBase>;
}
