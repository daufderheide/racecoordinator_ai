import { ComponentHarness } from '@angular/cdk/testing';
import { ImageSelectorHarnessBase } from './image-selector.harness.base';

export class ImageSelectorHarness extends ComponentHarness implements ImageSelectorHarnessBase {
  static hostSelector = 'app-image-selector';

  protected getLabelElement = this.locatorForOptional('.image-label');
  protected getPreviewImage = this.locatorForOptional('.image-preview img');
  protected getPreviewContainer = this.locatorFor('.image-preview');
  protected getRemoveButton = this.locatorForOptional('.remove-button');
  protected getUploadOverlay = this.locatorForOptional('.upload-overlay');
  protected getDragHint = this.locatorForOptional('.drop-hint');

  async getLabel(): Promise<string | null> {
    const el = await this.getLabelElement();
    return el ? await el.text() : null;
  }

  async hasImage(): Promise<boolean> {
    const el = await this.getPreviewImage();
    return el !== null;
  }

  async clickPreviewToOpenSelector(): Promise<void> {
    const el = await this.getPreviewContainer();
    await el.click();
  }

  async clickRemoveButton(): Promise<void> {
    const btn = await this.getRemoveButton();
    if (btn) await btn.click();
  }

  async isUploading(): Promise<boolean> {
    const el = await this.getUploadOverlay();
    return el !== null;
  }

  async hasDragHint(): Promise<boolean> {
    const el = await this.getDragHint();
    return el !== null;
  }

  async simulateDragOver(): Promise<void> {
    const el = await this.getPreviewContainer();
    await el.dispatchEvent('dragover');
  }

  async hasDraggingState(): Promise<boolean> {
    const el = await this.getPreviewContainer();
    return await el.hasClass('dragging');
  }
}
