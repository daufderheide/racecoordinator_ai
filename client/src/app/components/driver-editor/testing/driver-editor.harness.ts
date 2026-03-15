import { ComponentHarness } from '@angular/cdk/testing';
import { DriverEditorHarnessBase } from './driver-editor.harness.base';
import { ConfirmationModalHarness } from '../../shared/confirmation-modal/testing/confirmation-modal.harness';

export class DriverEditorHarness extends ComponentHarness implements DriverEditorHarnessBase {
  static hostSelector = 'app-driver-editor';

  protected getNameEl = this.locatorFor('.inputs-column .form-group:nth-child(1) input');
  protected getNicknameEl = this.locatorFor('.inputs-column .form-group:nth-child(2) input');
  protected getUndoBtn = this.locatorFor('app-undo-redo-controls button:nth-child(1)');
  protected getRedoBtn = this.locatorFor('app-undo-redo-controls button:nth-child(2)');
  protected getBackBtn = this.locatorFor('app-back-button button');
  protected getModal = this.locatorFor(ConfirmationModalHarness);

  async getName(): Promise<string> {
    const input = await this.getNameEl();
    return await input.getProperty('value');
  }

  async setName(name: string): Promise<void> {
    const input = await this.getNameEl();
    await input.clear();
    await input.sendKeys(name);
  }

  async getNickname(): Promise<string> {
    const input = await this.getNicknameEl();
    return await input.getProperty('value');
  }

  async setNickname(nickname: string): Promise<void> {
    const input = await this.getNicknameEl();
    await input.clear();
    await input.sendKeys(nickname);
  }

  async clickUndo(): Promise<void> {
    const btn = await this.getUndoBtn();
    await btn.click();
  }

  async clickRedo(): Promise<void> {
    const btn = await this.getRedoBtn();
    await btn.click();
  }

  async clickBack(): Promise<void> {
    const btn = await this.getBackBtn();
    await btn.click();
  }

  async getConfirmationModal(): Promise<ConfirmationModalHarness> {
    return await this.getModal();
  }
}
