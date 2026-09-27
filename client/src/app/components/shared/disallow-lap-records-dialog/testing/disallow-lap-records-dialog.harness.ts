import { ComponentHarness } from "@angular/cdk/testing";

import { DisallowLapRecordsDialogHarnessBase } from "./disallow-lap-records-dialog.harness.base";

export class DisallowLapRecordsDialogHarness
  extends ComponentHarness
  implements DisallowLapRecordsDialogHarnessBase
{
  static hostSelector = DisallowLapRecordsDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    DisallowLapRecordsDialogHarnessBase.selectors.backdrop,
  );
  protected getCloseBtn = this.locatorForOptional(
    DisallowLapRecordsDialogHarnessBase.selectors.closeBtn,
  );
  protected getRaceNameEl = this.locatorForOptional(
    DisallowLapRecordsDialogHarnessBase.selectors.raceName,
  );
  protected getLapRows = this.locatorForAll(
    DisallowLapRecordsDialogHarnessBase.selectors.lapRows,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async dismiss(): Promise<void> {
    const btn = await this.getCloseBtn();
    if (btn) {
      await btn.click();
    }
  }

  async getRaceName(): Promise<string> {
    const el = await this.getRaceNameEl();
    return el ? await el.text() : "";
  }

  async getLapRowsCount(): Promise<number> {
    const rows = await this.getLapRows();
    return rows.length;
  }
}
