import { Locator } from '@playwright/test';
import { TrackEditorHarnessBase } from './track-editor.harness.base';
import { ArduinoEditorHarnessE2e } from '..//arduino-editor/testing/arduino-editor.harness.e2e';

export class TrackEditorHarnessE2e implements TrackEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get nameInput() { return this.locator.locator('#track-name-input'); }
  private get laneItems() { return this.locator.locator('.lane-item'); }
  private get addLaneButton() { return this.locator.locator('#lane-editor-section .add-list-btn'); }
  private get addInterfaceButton() { return this.locator.locator('#add-interface-btn'); }
  private get arduinoEditors() { return this.locator.locator('app-arduino-editor'); }
  private get duplicateButton() { return this.locator.locator('#track-duplicate-btn'); }

  async getTrackName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setTrackName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async getLaneCount(): Promise<number> {
    return await this.laneItems.count();
  }

  async addLane(): Promise<void> {
    await this.addLaneButton.click();
  }

  async removeLane(index: number): Promise<void> {
    const item = this.laneItems.nth(index);
    await item.locator('.action-btn.danger').click();
  }

  async getLaneLength(index: number): Promise<number> {
    const item = this.laneItems.nth(index);
    const val = await item.locator('.preview-length-input').inputValue();
    return parseFloat(val);
  }

  async setLaneLength(index: number, length: number): Promise<void> {
    const item = this.laneItems.nth(index);
    await item.locator('.preview-length-input').fill(length.toString());
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

  async isNameInvalid(): Promise<boolean> {
    const section = this.locator.locator('#track-name-section');
    const classes = await section.getAttribute('class');
    return classes ? classes.includes('invalid') : false;
  }
}

