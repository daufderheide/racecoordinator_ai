import { ComponentHarness } from "@angular/cdk/testing";

import { AudioSetEditorHarnessBase } from "./audio-set-editor.harness.base";

export class AudioSetEditorHarness
  extends ComponentHarness
  implements AudioSetEditorHarnessBase
{
  static hostSelector = AudioSetEditorHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    AudioSetEditorHarnessBase.selectors.backdrop,
  );
  protected getCancelBtn = this.locatorFor(
    AudioSetEditorHarnessBase.selectors.cancelBtn,
  );
  protected getSaveBtn = this.locatorFor(
    AudioSetEditorHarnessBase.selectors.saveBtn,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelBtn();
    await btn.click();
  }

  async clickSave(): Promise<void> {
    const btn = await this.getSaveBtn();
    await btn.click();
  }
}
