import { TranslationService } from "@app/services/translation.service";
import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  getDriverHelpSteps,
  getRacedaySetupHelpSteps,
  getRaceHelpSteps,
} from "./raceday-setup-help.helper";

describe("raceday-setup-help.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string) => `translated_${key}`,
    );
  });

  describe("getDriverHelpSteps", () => {
    it("should return the first 3 guide steps", () => {
      const steps = getDriverHelpSteps(mockTranslationService);
      expect(steps.length).toBe(3);

      expect(steps[0]).toEqual({
        title: "translated_RDS_HELP_WELCOME_TITLE",
        content: "translated_RDS_HELP_WELCOME_CONTENT",
      });

      expect(steps[1]).toEqual({
        targetId: "available-drivers-section",
        title: "translated_RDS_HELP_DRIVER_AVAILABLE_TITLE",
        content: "translated_RDS_HELP_DRIVER_AVAILABLE_CONTENT",
        position: "right",
      });

      expect(steps[2]).toEqual({
        targetId: "racing-drivers-section",
        title: "translated_RDS_HELP_DRIVER_RACING_TITLE",
        content: "translated_RDS_HELP_DRIVER_RACING_CONTENT",
        position: "right",
      });
    });
  });

  describe("getRaceHelpSteps", () => {
    it("should return the last 3 guide steps", () => {
      const steps = getRaceHelpSteps(mockTranslationService);
      expect(steps.length).toBe(3);

      expect(steps[0]).toEqual({
        targetId: "race-selection-section",
        title: "translated_RDS_HELP_RACE_SEASON_TITLE",
        content: "translated_RDS_HELP_RACE_SEASON_CONTENT",
        position: "left",
      });

      expect(steps[1]).toEqual({
        targetId: "race-controls",
        title: "translated_RDS_HELP_START_RACE_TITLE",
        content: "translated_RDS_HELP_START_RACE_CONTENT",
        position: "top",
      });

      expect(steps[2]).toEqual({
        targetId: "setup-menu-bar",
        title: "translated_RDS_HELP_MENU_BAR_TITLE",
        content: "translated_RDS_HELP_MENU_BAR_CONTENT",
        position: "bottom",
      });
    });
  });

  describe("getRacedaySetupHelpSteps", () => {
    it("should return all 6 steps in the required order", () => {
      const steps = getRacedaySetupHelpSteps(mockTranslationService);
      expect(steps.length).toBe(6);

      expect(steps[0].title).toBe("translated_RDS_HELP_WELCOME_TITLE");
      expect(steps[0].targetId).toBeUndefined();

      expect(steps[1].targetId).toBe("available-drivers-section");
      expect(steps[1].title).toBe("translated_RDS_HELP_DRIVER_AVAILABLE_TITLE");

      expect(steps[2].targetId).toBe("racing-drivers-section");
      expect(steps[2].title).toBe("translated_RDS_HELP_DRIVER_RACING_TITLE");

      expect(steps[3].targetId).toBe("race-selection-section");
      expect(steps[3].title).toBe("translated_RDS_HELP_RACE_SEASON_TITLE");

      expect(steps[4].targetId).toBe("race-controls");
      expect(steps[4].title).toBe("translated_RDS_HELP_START_RACE_TITLE");

      expect(steps[5].targetId).toBe("setup-menu-bar");
      expect(steps[5].title).toBe("translated_RDS_HELP_MENU_BAR_TITLE");
    });

    it("should verify that all help links in en.json for raceday setup steps are well-formed", () => {
      const realTranslationService = jasmine.createSpyObj(
        "TranslationService",
        ["translate"],
      );
      realTranslationService.translate.and.callFake(
        (key: string) => (enJson as Record<string, string>)[key] || key,
      );

      const steps = getRacedaySetupHelpSteps(realTranslationService);
      expect(steps.length).toBe(6);

      for (const step of steps) {
        expect(step.title).not.toBe("");
        expect(step.content).not.toBe("");

        // Verify that any link in the content satisfies the help-link contract
        if (step.content.includes("help-link")) {
          GuideStepTestHelper.verifyHelpLinksInContent(
            step.content,
            `Step: ${step.title}`,
          );
          // Verify link points to raceday-setup article
          expect(step.content).toContain("help-article-raceday-setup");
        }
      }
    });
  });
});
