import { ComponentHarness } from "@angular/cdk/testing";

import { ReorderDialogHarness } from "..//reorder-dialog/testing/reorder-dialog.harness";
import { UIEditorHarnessBase } from "./ui-editor.harness.base";

export class UIEditorHarness
  extends ComponentHarness
  implements UIEditorHarnessBase
{
  static hostSelector = UIEditorHarnessBase.hostSelector;

  protected getReorderBtn = this.locatorFor(
    UIEditorHarnessBase.selectors.reorderBtn,
  );
  protected getReorderDialog = this.locatorFor(ReorderDialogHarness);
  protected getImageSelectorsPreviews = this.locatorForAll(
    `${UIEditorHarnessBase.selectors.imageSelector} ${UIEditorHarnessBase.selectors.imagePreview}`,
  );

  async clickReorderColumns(): Promise<void> {
    const btn = await this.getReorderBtn();
    await btn.click();
  }

  async getReorderDialogHarness(): Promise<ReorderDialogHarness> {
    return await this.getReorderDialog();
  }

  async clickImageSelector(index: number): Promise<void> {
    const previews = await this.getImageSelectorsPreviews();
    if (index < previews.length) {
      await previews[index].click();
    }
  }

  // Screen Manager methods - stub implementations for unit tests
  async getScreenCount(): Promise<number> {
    return 0;
  }

  async clickAddScreen(): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickAddScreen not implemented in unit test harness");
  }

  async clickEditScreen(index: number): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickEditScreen not implemented in unit test harness");
  }

  async clickDuplicateScreen(index: number): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickDuplicateScreen not implemented in unit test harness");
  }

  async clickDeleteScreen(index: number): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickDeleteScreen not implemented in unit test harness");
  }

  async clickDefaultBadge(index: number): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickDefaultBadge not implemented in unit test harness");
  }

  async clickEnabledBadge(index: number): Promise<void> {
    // Not implemented in unit test harness
    throw new Error("clickEnabledBadge not implemented in unit test harness");
  }

  async getScreenName(index: number): Promise<string> {
    // Not implemented in unit test harness
    return "";
  }
}
