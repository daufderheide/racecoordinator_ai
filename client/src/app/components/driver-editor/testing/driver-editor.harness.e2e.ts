import { Locator } from '@playwright/test';
import { DriverEditorHarnessBase } from './driver-editor.harness.base';
import { ConfirmationModalHarnessE2e } from '../../shared/confirmation-modal/testing/confirmation-modal.harness.e2e';

export class DriverEditorHarnessE2e implements DriverEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get nameInput() { return this.locator.locator('.inputs-column .form-group:nth-child(1) input'); }
  private get nicknameInput() { return this.locator.locator('.inputs-column .form-group:nth-child(2) input'); }
  private get undoBtn() { return this.locator.locator('app-undo-redo-controls button').first(); }
  private get redoBtn() { return this.locator.locator('app-undo-redo-controls button').last(); }
  private get backBtn() { return this.locator.locator('app-back-button button'); }
  private get modal() { return this.locator.locator('app-confirmation-modal'); }

  async getName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async getNickname(): Promise<string> {
    return await this.nicknameInput.inputValue();
  }

  async setNickname(nickname: string): Promise<void> {
    await this.nicknameInput.fill(nickname);
  }

  async clickUndo(): Promise<void> {
    await this.undoBtn.click();
  }

  async clickRedo(): Promise<void> {
    await this.redoBtn.click();
  }

  async clickBack(): Promise<void> {
    await this.backBtn.click();
  }

  async getConfirmationModal(): Promise<ConfirmationModalHarnessE2e> {
    return new ConfirmationModalHarnessE2e(this.modal);
  }
}
