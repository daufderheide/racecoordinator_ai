import { ComponentHarness } from "@angular/cdk/testing";

import { PdfExportDialogHarnessBase } from "./pdf-export-dialog.harness.base";

export class PdfExportDialogHarness
  extends ComponentHarness
  implements PdfExportDialogHarnessBase
{
  static hostSelector = PdfExportDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    PdfExportDialogHarnessBase.selectors.backdrop,
  );
  protected getCancelButton = this.locatorFor(
    PdfExportDialogHarnessBase.selectors.cancelButton,
  );
  protected getExportButton = this.locatorFor(
    PdfExportDialogHarnessBase.selectors.exportButton,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelButton();
    await btn.click();
  }

  async clickExport(): Promise<void> {
    const btn = await this.getExportButton();
    await btn.click();
  }
}
