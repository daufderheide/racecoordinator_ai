import { ComponentHarness } from "@angular/cdk/testing";

import { DriverExportModalHarnessBase } from "./driver-export-modal.harness.base";

export class DriverExportModalHarness
  extends ComponentHarness
  implements DriverExportModalHarnessBase
{
  static hostSelector = DriverExportModalHarnessBase.hostSelector;

  protected getDialog = this.locatorForOptional(
    DriverExportModalHarnessBase.selectors.dialog,
  );
  protected getCloseBtn = this.locatorFor(
    DriverExportModalHarnessBase.selectors.closeBtn,
  );
  protected getCancelBtn = this.locatorFor(
    DriverExportModalHarnessBase.selectors.cancelBtn,
  );
  protected getConfirmBtn = this.locatorFor(
    DriverExportModalHarnessBase.selectors.confirmBtn,
  );
  protected getFormatCardCsv = this.locatorFor(
    DriverExportModalHarnessBase.selectors.formatCardCsv,
  );
  protected getFormatCardXlsx = this.locatorFor(
    DriverExportModalHarnessBase.selectors.formatCardXlsx,
  );
  protected getFormatCardJson = this.locatorFor(
    DriverExportModalHarnessBase.selectors.formatCardJson,
  );

  async isVisible(): Promise<boolean> {
    const dialog = await this.getDialog();
    return dialog !== null;
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseBtn();
    await btn.click();
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelBtn();
    await btn.click();
  }

  async clickConfirm(): Promise<void> {
    const btn = await this.getConfirmBtn();
    await btn.click();
  }

  async selectFormat(format: "csv" | "xlsx" | "json"): Promise<void> {
    switch (format) {
      case "csv": {
        const card = await this.getFormatCardCsv();
        await card.click();
        break;
      }
      case "xlsx": {
        const card = await this.getFormatCardXlsx();
        await card.click();
        break;
      }
      case "json": {
        const card = await this.getFormatCardJson();
        await card.click();
        break;
      }
    }
  }
}
