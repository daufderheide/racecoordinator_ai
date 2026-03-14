import { Locator } from '@playwright/test';
import { ImageSelectorHarnessBase } from './image-selector.harness.base';

export class ImageSelectorHarnessE2e implements ImageSelectorHarnessBase {
  constructor(private locator: Locator) {}

  private get labelElement() { return this.locator.locator('.image-label'); }
  private get previewImage() { return this.locator.locator('.image-preview img'); }
  private get previewContainer() { return this.locator.locator('.image-preview'); }
  private get removeButton() { return this.locator.locator('.remove-button'); }
  private get uploadOverlay() { return this.locator.locator('.upload-overlay'); }
  private get dragHint() { return this.locator.locator('.drop-hint'); }

  async getLabel(): Promise<string | null> {
    if (await this.labelElement.isVisible()) {
      return await this.labelElement.innerText();
    }
    return null;
  }

  async hasImage(): Promise<boolean> {
    return await this.previewImage.isVisible();
  }

  async clickPreviewToOpenSelector(): Promise<void> {
    await this.previewContainer.click();
  }

  async clickRemoveButton(): Promise<void> {
    await this.removeButton.click();
  }

  async isUploading(): Promise<boolean> {
    return await this.uploadOverlay.isVisible();
  }

  async hasDragHint(): Promise<boolean> {
    return await this.dragHint.isVisible();
  }

  async simulateDragOver(): Promise<void> {
    await this.previewContainer.dispatchEvent('dragover');
  }

  async hasDraggingState(): Promise<boolean> {
    const classList = await this.previewContainer.getAttribute('class') || '';
    return classList.includes('dragging');
  }
}
