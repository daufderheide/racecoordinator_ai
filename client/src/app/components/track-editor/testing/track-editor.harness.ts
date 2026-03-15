import { ComponentHarness } from '@angular/cdk/testing';
import { TrackEditorHarnessBase } from './track-editor.harness.base';
import { ArduinoEditorHarness } from '..//arduino-editor/testing/arduino-editor.harness';

export class TrackEditorHarness extends ComponentHarness implements TrackEditorHarnessBase {
  static hostSelector = 'app-track-editor';

  protected getNameInput = this.locatorFor('#track-name-input');
  protected getLaneItems = this.locatorForAll('.lane-item');
  protected getAddLaneButton = this.locatorFor('#lane-editor-section .add-list-btn');
  protected getAddInterfaceButton = this.locatorFor('#add-interface-btn');
  protected getArduinoEditors = this.locatorForAll(ArduinoEditorHarness);
  protected getDuplicateButton = this.locatorFor('#track-duplicate-btn');

  async getTrackName(): Promise<string> {
    const input = await this.getNameInput();
    return await input.getProperty('value');
  }

  async setTrackName(name: string): Promise<void> {
    const input = await this.getNameInput();
    await input.clear();
    await input.sendKeys(name);
  }

  async getLaneCount(): Promise<number> {
    const items = await this.getLaneItems();
    return items.length;
  }

  async addLane(): Promise<void> {
    const btn = await this.getAddLaneButton();
    await btn.click();
  }

  async removeLane(index: number): Promise<void> {
    const items = await this.getLaneItems();
    if (index < items.length) {
      const btn = await items[index].locatorFor('.action-btn.danger')();
      await btn.click();
    }
  }

  async getLaneLength(index: number): Promise<number> {
    const items = await this.getLaneItems();
    if (index < items.length) {
      const input = await items[index].locatorFor('.preview-length-input')();
      return parseFloat(await input.getProperty('value'));
    }
    return 0;
  }

  async setLaneLength(index: number, length: number): Promise<void> {
    const items = await this.getLaneItems();
    if (index < items.length) {
      const input = await items[index].locatorFor('.preview-length-input')();
      await input.clear();
      await input.sendKeys(length.toString());
    }
  }

  async addInterface(): Promise<void> {
    const btn = await this.getAddInterfaceButton();
    await btn.click();
  }

  async getArduinoEditorHarnesses(): Promise<ArduinoEditorHarness[]> {
    return await this.getArduinoEditors();
  }

  async clickSaveAsNew(): Promise<void> {
    const btn = await this.getDuplicateButton();
    await btn.click();
  }

  async isNameInvalid(): Promise<boolean> {
    const section = await this.locatorFor('#track-name-section')();
    return await section.hasClass('invalid');
  }
}

