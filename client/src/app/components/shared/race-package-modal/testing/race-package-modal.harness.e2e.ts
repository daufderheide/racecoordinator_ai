import { Locator } from "@playwright/test";

import { RacePackageModalHarnessBase } from "./race-package-modal.harness.base";

export class RacePackageModalHarnessE2e implements RacePackageModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacePackageModalHarnessBase;
  }

  get dialog(): Locator {
    return this.locator.locator(this.base.selectors.dialog);
  }

  get backdrop(): Locator {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  get title(): Locator {
    return this.locator.locator(this.base.selectors.title);
  }

  get closeBtn(): Locator {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  get step1(): Locator {
    return this.locator.locator(this.base.selectors.step1);
  }

  get step2(): Locator {
    return this.locator.locator(this.base.selectors.step2);
  }

  get duplicateSelect(): Locator {
    return this.locator.locator(this.base.selectors.duplicateSelect);
  }

  get skipBanner(): Locator {
    return this.locator.locator(this.base.selectors.skipBanner);
  }

  get raceNameInput(): Locator {
    return this.locator.locator(this.base.selectors.raceNameInput);
  }

  get configCard(): Locator {
    return this.locator.locator(this.base.selectors.configCard);
  }

  get driversSummary(): Locator {
    return this.locator.locator(this.base.selectors.driversSummary);
  }

  get toggleDriversBtn(): Locator {
    return this.locator.locator(this.base.selectors.toggleDriversBtn);
  }

  get tableRows(): Locator {
    return this.locator.locator(this.base.selectors.tableRows);
  }

  get cancelBtn(): Locator {
    return this.locator.locator(this.base.selectors.cancelBtn);
  }

  get nextBtn(): Locator {
    return this.locator.locator(this.base.selectors.secondaryBtn);
  }

  get commitBtn(): Locator {
    return this.locator.locator(this.base.selectors.commitBtn);
  }

  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async waitForVisible(timeout = 10000): Promise<void> {
    await this.dialog.waitFor({ state: "visible", timeout });
  }

  async clickClose(): Promise<void> {
    await this.closeBtn.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async clickNext(): Promise<void> {
    await this.nextBtn.click();
  }

  async clickCommit(): Promise<void> {
    await this.commitBtn.click();
  }

  async goToStep(step: 1 | 2): Promise<void> {
    if (step === 1) {
      await this.dialog.locator(".rpm-stepper .rpm-step-item").first().click();
    } else {
      await this.dialog.locator(".rpm-stepper .rpm-step-item").nth(1).click();
    }
  }

  async selectDuplicateAction(
    action: "CREATE_COPY" | "OVERWRITE" | "SKIP",
  ): Promise<void> {
    const trigger = this.duplicateSelect.locator(".custom-select-trigger");
    await trigger.click();
    await this.duplicateSelect
      .locator(`.custom-select-option[data-value="${action}"]`)
      .click();
  }
}
