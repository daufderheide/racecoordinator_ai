import { Locator } from "@playwright/test";

import { PdfExportDialogHarnessBase } from "./pdf-export-dialog.harness.base";

export class PdfExportDialogHarnessE2e implements PdfExportDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return PdfExportDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get cancelButton() {
    return this.locator.locator(this.base.selectors.cancelButton);
  }

  private get exportButton() {
    return this.locator.locator(this.base.selectors.exportButton);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickExport(): Promise<void> {
    await this.exportButton.click();
  }
}
