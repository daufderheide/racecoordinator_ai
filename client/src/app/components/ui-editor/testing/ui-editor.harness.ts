import { ComponentHarness } from "@angular/cdk/testing";

import { UIEditorHarnessBase } from "./ui-editor.harness.base";

export class UIEditorHarness
  extends ComponentHarness
  implements UIEditorHarnessBase
{
  static hostSelector = UIEditorHarnessBase.hostSelector;

  protected getImageSelectorsPreviews = this.locatorForAll(
    `${UIEditorHarnessBase.selectors.imageSelector} ${UIEditorHarnessBase.selectors.imagePreview}`,
  );

  async clickImageSelector(index: number): Promise<void> {
    const previews = await this.getImageSelectorsPreviews();
    if (index < previews.length) {
      await previews[index].click();
    }
  }
}
