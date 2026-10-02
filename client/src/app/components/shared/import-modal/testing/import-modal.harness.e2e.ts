import { Locator } from "@playwright/test";

import { ImportModalHarnessBase } from "./import-modal.harness.base";

export class ImportModalHarnessE2e implements ImportModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return ImportModalHarnessBase;
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

  get uploadStep() {
    return this.locator.locator(this.base.selectors.uploadStep);
  }

  get dropzone() {
    return this.locator.locator(this.base.selectors.dropzone);
  }

  get fileInput() {
    return this.locator.locator(this.base.selectors.fileInput);
  }

  get fileChip() {
    return this.locator.locator(this.base.selectors.fileChip);
  }

  get validateBtn() {
    return this.locator.locator(this.base.selectors.validateBtn);
  }

  get previewStep() {
    return this.locator.locator(this.base.selectors.previewStep);
  }

  get validPill() {
    return this.locator.locator(this.base.selectors.validPill);
  }

  get conflictPill() {
    return this.locator.locator(this.base.selectors.conflictPill);
  }

  get errorPill() {
    return this.locator.locator(this.base.selectors.errorPill);
  }

  get assetsPill() {
    return this.locator.locator(this.base.selectors.assetsPill);
  }

  get tableRows() {
    return this.locator.locator(this.base.selectors.tableRows);
  }

  get nameInputs() {
    return this.locator.locator(this.base.selectors.nameInputs);
  }

  get nickInputs() {
    return this.locator.locator(this.base.selectors.nickInputs);
  }

  get commitBtn() {
    return this.locator.locator(this.base.selectors.commitBtn);
  }

  get assetsDialog() {
    return this.locator.locator(this.base.selectors.assetsDialog);
  }

  get summaryStep() {
    return this.locator.locator(this.base.selectors.summaryStep);
  }

  get doneBtn() {
    return this.locator.locator(this.base.selectors.doneBtn);
  }

  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleElement.innerText();
  }

  async clickClose(): Promise<void> {
    await this.closeBtn.click();
  }
}
