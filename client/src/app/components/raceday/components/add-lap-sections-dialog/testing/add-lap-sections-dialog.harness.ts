import { ComponentHarness } from "@angular/cdk/testing";

import { AddLapSectionsDialogHarnessBase } from "./add-lap-sections-dialog.harness.base";

export class AddLapSectionsDialogHarness
  extends ComponentHarness
  implements AddLapSectionsDialogHarnessBase
{
  static hostSelector = AddLapSectionsDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    AddLapSectionsDialogHarnessBase.selectors.backdrop,
  );
  protected getCloseBtn = this.locatorFor(
    AddLapSectionsDialogHarnessBase.selectors.closeBtn,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCloseBtn();
    await btn.click();
  }
}
