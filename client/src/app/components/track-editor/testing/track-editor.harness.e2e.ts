import { Locator } from '@playwright/test';
import { TrackEditorHarnessBase } from './track-editor.harness.base';
import { ArduinoEditorHarnessE2e } from '..//arduino-editor/testing/arduino-editor.harness.e2e';

export class TrackEditorHarnessE2e implements TrackEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return TrackEditorHarnessBase; }

  private get nameInput() { return this.locator.locator(this.base.selectors.nameInput); }
  private get laneItems() { return this.locator.locator(this.base.selectors.laneItem); }
  private get addLaneButton() { return this.locator.locator(this.base.selectors.addLaneButton); }
  private get addInterfaceButton() { return this.locator.locator(this.base.selectors.addInterfaceButton); }
  private get arduinoEditors() { return this.locator.locator('app-arduino-editor'); }
  private get duplicateButton() { return this.locator.locator(this.base.selectors.duplicateButton); }

  async getTrackName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setTrackName(name: string): Promise<void> {
    await this.nameInput.focus();
    await this.nameInput.fill(name);
    await this.nameInput.blur();
    await this.locator.page().waitForTimeout(300); // Allow Angular change detection and UndoManager debounce
  }

  async getLaneCount(): Promise<number> {
    return await this.laneItems.count();
  }

  async addLane(): Promise<void> {
    await this.addLaneButton.click();
  }

  async removeLane(index: number): Promise<void> {
    const item = this.laneItems.nth(index);
    await item.locator(this.base.selectors.removeLaneButton).click();
  }

  async getLaneLength(index: number): Promise<number> {
    const item = this.laneItems.nth(index);
    const val = await item.locator(this.base.selectors.laneLengthInput).inputValue();
    return parseFloat(val);
  }

  async setLaneLength(index: number, length: number): Promise<void> {
    const item = this.laneItems.nth(index);
    await item.locator(this.base.selectors.laneLengthInput).fill(length.toString());
  }

  async addInterface(): Promise<void> {
    await this.addInterfaceButton.click();
  }

  async getArduinoEditorHarnesses(): Promise<ArduinoEditorHarnessE2e[]> {
    const count = await this.arduinoEditors.count();
    const harnesses: ArduinoEditorHarnessE2e[] = [];
    for (let i = 0; i < count; i++) {
        harnesses.push(new ArduinoEditorHarnessE2e(this.arduinoEditors.nth(i)));
    }
    return harnesses;
  }

  async clickSaveAsNew(): Promise<void> {
    await this.duplicateButton.click();
  }

  async isNameInvalid(): Promise<boolean> {
    const section = this.locator.locator(this.base.selectors.nameSection);
    const classes = await section.getAttribute('class');
    return classes ? classes.includes('invalid') : false;
  }

  async clickBackButton(): Promise<void> {
    await this.locator.page().locator('.back-btn').click();
  }

  async waitForConfirmationModalVisible(timeout = 5000): Promise<void> {
    await this.locator.page().waitForSelector('app-back-button app-confirmation-modal .modal-content', { timeout });
  }
}

