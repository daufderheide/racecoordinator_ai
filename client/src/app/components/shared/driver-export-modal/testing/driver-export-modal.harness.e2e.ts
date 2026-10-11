import { Locator } from "@playwright/test";

import { DriverExportModalHarnessBase } from "./driver-export-modal.harness.base";

export class DriverExportModalHarnessE2e implements DriverExportModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return DriverExportModalHarnessBase;
  }

  get dialog() {
    return this.locator.locator(this.base.selectors.dialog);
  }

  get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  get titleElement() {
    return this.locator.locator(this.base.selectors.title);
  }

  get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  get errorBanner() {
    return this.locator.locator(this.base.selectors.errorBanner);
  }

  get driverCountBadge() {
    return this.locator.locator(this.base.selectors.driverCountBadge);
  }

  get countText() {
    return this.locator.locator(this.base.selectors.countText);
  }

  get formatCardCsv() {
    return this.locator.locator(this.base.selectors.formatCardCsv);
  }

  get formatCardXlsx() {
    return this.locator.locator(this.base.selectors.formatCardXlsx);
  }

  get formatCardJson() {
    return this.locator.locator(this.base.selectors.formatCardJson);
  }

  get cancelBtn() {
    return this.locator.locator(this.base.selectors.cancelBtn);
  }

  get confirmBtn() {
    return this.locator.locator(this.base.selectors.confirmBtn);
  }

  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async clickClose(): Promise<void> {
    await this.closeBtn.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmBtn.click();
  }

  async selectFormat(format: "csv" | "xlsx" | "json"): Promise<void> {
    switch (format) {
      case "csv":
        await this.formatCardCsv.click();
        break;
      case "xlsx":
        await this.formatCardXlsx.click();
        break;
      case "json":
        await this.formatCardJson.click();
        break;
    }
  }
}
