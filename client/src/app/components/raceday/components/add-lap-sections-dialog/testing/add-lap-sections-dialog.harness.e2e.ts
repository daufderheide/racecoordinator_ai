import { Locator } from "@playwright/test";

import { AddLapSectionsDialogHarnessBase } from "./add-lap-sections-dialog.harness.base";

export class AddLapSectionsDialogHarnessE2e implements AddLapSectionsDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AddLapSectionsDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async clickCancel(): Promise<void> {
    await this.closeBtn.click();
  }
}
