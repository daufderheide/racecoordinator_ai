import { Locator } from '@playwright/test';
import { AudioSelectorHarnessBase } from './audio-selector.harness.base';

export class AudioSelectorHarnessE2e implements AudioSelectorHarnessBase {
  constructor(private locator: Locator) {}

  private get labelElement() { return this.locator.locator('.audio-header label'); }
  private get toggleSpans() { return this.locator.locator('.toggle-group span'); }
  private get selectWrapper() { return this.locator.locator('.select-wrapper'); }
  private get selectedSoundNameElement() { return this.locator.locator('.dm-select'); }
  private get ttsInput() { return this.locator.locator('input.dm-input'); }
  private get playButton() { return this.locator.locator('.btn-play'); }

  async getLabel(): Promise<string> {
    if (await this.labelElement.isVisible()) {
      return await this.labelElement.innerText();
    }
    return '';
  }

  async getAudioType(): Promise<'preset' | 'tts'> {
    const firstSpan = this.toggleSpans.nth(0);
    const classList = (await firstSpan.getAttribute('class')) || '';
    return classList.includes('active') ? 'preset' : 'tts';
  }

  async clickPresetType(): Promise<void> {
    await this.toggleSpans.nth(0).click();
  }

  async clickTtsType(): Promise<void> {
    await this.toggleSpans.nth(1).click();
  }

  async clickSelectSound(): Promise<void> {
    await this.selectWrapper.click();
  }

  async getSelectedSoundName(): Promise<string> {
    if (await this.selectedSoundNameElement.isVisible()) {
      const text = await this.selectedSoundNameElement.innerText();
      return text.trim();
    }
    return '';
  }

  async getTtsText(): Promise<string> {
    if (await this.ttsInput.isVisible()) {
      return await this.ttsInput.inputValue();
    }
    return '';
  }

  async setTtsText(text: string): Promise<void> {
    await this.ttsInput.fill(text);
  }

  async clickPlay(): Promise<void> {
    await this.playButton.click();
  }
}
