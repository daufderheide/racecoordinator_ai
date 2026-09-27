import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { getAssetManagerHelpSteps } from "./asset-manager-help";

describe("getAssetManagerHelpSteps", () => {
  it("should return all 15 expected help steps localized", () => {
    const steps = getAssetManagerHelpSteps(
      mockTranslationService as unknown as TranslationService,
    );
    expect(steps.length).toBe(15);
    expect(steps[0].title).toBe("AM_HELP_WELCOME_TITLE");
    expect(steps[0].position).toBe("center");
    expect(steps[1].selector).toBe(".stats-content");
    expect(steps[2].selector).toBe(".upload-zone");
    expect(steps[3].selector).toBe(".btn-image-set");
    expect(steps[4].selector).toBe(".btn-audio-set");
    expect(steps[5].selector).toBe(".btn-custom-rotation");
    expect(steps[6].selector).toBe(".library-panel");
    expect(steps[7].selector).toBe(".filter-all");
    expect(steps[8].selector).toBe(".filter-images");
    expect(steps[9].selector).toBe(".filter-image-sets");
    expect(steps[10].selector).toBe(".filter-sounds");
    expect(steps[11].selector).toBe(".filter-audio-sets");
    expect(steps[12].selector).toBe(".filter-custom-rotations");
    expect(steps[13].selector).toBe("#asset-layout-switcher");
    expect(steps[14].selector).toBe(".filter-input");
  });
});
