import { ComponentHarness } from '@angular/cdk/testing';
import { DriverEditorHarnessBase } from './driver-editor.harness.base';
import { ConfirmationModalHarness } from '../../shared/confirmation-modal/testing/confirmation-modal.harness';

export class DriverEditorHarness extends ComponentHarness implements DriverEditorHarnessBase {
  static hostSelector = DriverEditorHarnessBase.hostSelector;

  protected getNameEl = this.locatorFor(DriverEditorHarnessBase.selectors.nameInput);
  protected getNicknameEl = this.locatorFor(DriverEditorHarnessBase.selectors.nicknameInput);
  protected getUndoBtn = this.locatorFor(DriverEditorHarnessBase.selectors.undoBtn);
  protected getRedoBtn = this.locatorFor(DriverEditorHarnessBase.selectors.redoBtn);
  protected getBackBtn = this.locatorFor(DriverEditorHarnessBase.selectors.backBtn);
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
