import { Team } from "@app/models/team";
import { TranslationService } from "@app/services/translation.service";
import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  areTeamsEqual,
  cloneTeam,
  generateUniqueTeamName,
  getTeamEditorHelpSteps,
  getTeamUnsavedReasons,
  resolveTeamAvatarUrl,
} from "./team-editor.helper";

describe("team-editor.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string) => `translated_${key}`,
    );
  });

  describe("cloneTeam", () => {
    it("should create an independent deep copy of a team", () => {
      const original = new Team(
        "team-1",
        "Apex Racing",
        "avatar.png",
        ["d1", "d2"],
        ["lbl-1", "lbl-2"],
      );
      const cloned = cloneTeam(original);

      expect(cloned).not.toBe(original);
      expect(cloned.entity_id).toBe("team-1");
      expect(cloned.name).toBe("Apex Racing");
      expect(cloned.avatarUrl).toBe("avatar.png");
      expect(cloned.driverIds).toEqual(["d1", "d2"]);
      expect(cloned.labelIds).toEqual(["lbl-1", "lbl-2"]);

      // Mutating original arrays shouldn't affect clone
      original.driverIds.push("d3");
      original.labelIds.push("lbl-3");
      expect(cloned.driverIds).toEqual(["d1", "d2"]);
      expect(cloned.labelIds).toEqual(["lbl-1", "lbl-2"]);
    });

    it("should handle undefined labelIds gracefully", () => {
      const original = new Team("team-1", "Apex Racing", undefined, ["d1"]);
      (original as any).labelIds = undefined;
      const cloned = cloneTeam(original);
      expect(cloned.labelIds).toEqual([]);
    });
  });

  describe("areTeamsEqual", () => {
    it("should return true for identical teams", () => {
      const a = new Team("t1", "Apex", "img.png", ["d1", "d2"], ["l1"]);
      const b = new Team("t1", "Apex", "img.png", ["d1", "d2"], ["l1"]);
      expect(areTeamsEqual(a, b)).toBeTrue();
    });

    it("should return false if name differs", () => {
      const a = new Team("t1", "Apex", "img.png", ["d1"], ["l1"]);
      const b = new Team("t1", "Vortex", "img.png", ["d1"], ["l1"]);
      expect(areTeamsEqual(a, b)).toBeFalse();
    });

    it("should return false if avatarUrl differs", () => {
      const a = new Team("t1", "Apex", "img1.png", ["d1"], ["l1"]);
      const b = new Team("t1", "Apex", "img2.png", ["d1"], ["l1"]);
      expect(areTeamsEqual(a, b)).toBeFalse();
    });

    it("should return false if driverIds differ in length or order", () => {
      const a = new Team("t1", "Apex", "img.png", ["d1", "d2"], ["l1"]);
      const b = new Team("t1", "Apex", "img.png", ["d1"], ["l1"]);
      const c = new Team("t1", "Apex", "img.png", ["d2", "d1"], ["l1"]);
      expect(areTeamsEqual(a, b)).toBeFalse();
      expect(areTeamsEqual(a, c)).toBeFalse();
    });

    it("should return false if labelIds differ in length or order", () => {
      const a = new Team("t1", "Apex", "img.png", ["d1"], ["l1", "l2"]);
      const b = new Team("t1", "Apex", "img.png", ["d1"], ["l1"]);
      const c = new Team("t1", "Apex", "img.png", ["d1"], ["l2", "l1"]);
      expect(areTeamsEqual(a, b)).toBeFalse();
      expect(areTeamsEqual(a, c)).toBeFalse();
    });
  });

  describe("generateUniqueTeamName", () => {
    it("should keep base name if already unique", () => {
      const allTeams = [new Team("1", "Existing Team")];
      expect(generateUniqueTeamName("New Team", allTeams)).toBe("New Team");
    });

    it("should append suffix if base name exists", () => {
      const allTeams = [
        new Team("1", "Existing Team"),
        new Team("2", "Existing Team_1"),
      ];
      expect(generateUniqueTeamName("Existing Team", allTeams)).toBe(
        "Existing Team_2",
      );
    });

    it("should force suffix when requested", () => {
      const allTeams = [new Team("1", "Team A")];
      expect(generateUniqueTeamName("Team B", allTeams, true)).toBe("Team B_1");
    });
  });

  describe("resolveTeamAvatarUrl", () => {
    it("should return default avatar if url is empty", () => {
      expect(resolveTeamAvatarUrl("")).toBe("assets/images/default_avatar.svg");
      expect(resolveTeamAvatarUrl(undefined)).toBe(
        "assets/images/default_avatar.svg",
      );
    });

    it("should prefix relative server url when dataService resolves to slash path", () => {
      const dataService = {
        serverUrl: "http://localhost:8080",
        resolveAssetUrl: (u: string) => `/uploads/${u}`,
      };
      expect(resolveTeamAvatarUrl("my_logo.png", dataService)).toBe(
        "http://localhost:8080/uploads/my_logo.png",
      );
    });

    it("should return raw url if no resolution is needed", () => {
      expect(resolveTeamAvatarUrl("assets/images/preset.png")).toBe(
        "assets/images/preset.png",
      );
    });
  });

  describe("getTeamUnsavedReasons", () => {
    it("should return empty array if no editing team", () => {
      expect(getTeamUnsavedReasons(undefined, [], false, false)).toEqual([]);
    });

    it("should detect empty name", () => {
      const team = new Team("t1", "   ");
      const reasons = getTeamUnsavedReasons(team, [], false, false);
      expect(reasons).toContain("DISCARD_REASON_TEAM_NAME_EMPTY");
    });

    it("should detect duplicate name", () => {
      const existing = new Team("t2", "Apex");
      const team = new Team("t1", "Apex");
      const reasons = getTeamUnsavedReasons(
        team,
        [existing, team],
        false,
        false,
      );
      expect(reasons).toContain("DISCARD_REASON_TEAM_NAME_DUPLICATE");
    });

    it("should detect saving in progress", () => {
      const team = new Team("t1", "Apex");
      const reasons = getTeamUnsavedReasons(team, [team], true, false);
      expect(reasons).toContain("DISCARD_REASON_SAVING");
    });

    it("should detect exit too quickly when dirty with no errors", () => {
      const team = new Team("t1", "Apex");
      const reasons = getTeamUnsavedReasons(team, [team], false, true);
      expect(reasons).toContain("DISCARD_REASON_EXIT_TOO_QUICKLY");
    });
  });

  describe("getTeamEditorHelpSteps", () => {
    it("should build all 6 guide steps with correct selectors and localized keys in expected order", () => {
      const steps = getTeamEditorHelpSteps(mockTranslationService);
      expect(steps.length).toBe(6);

      // 1) Overview
      expect(steps[0].position).toBe("center");
      expect(steps[0].targetId).toBeUndefined();
      expect(steps[0].title).toBe("translated_TEM_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("translated_TEM_HELP_WELCOME_CONTENT");

      // 2) Select team
      expect(steps[1].targetId).toBe("editor-object-nav");
      expect(steps[1].selector).toBe("#editor-object-nav");
      expect(steps[1].position).toBe("bottom");
      expect(steps[1].title).toBe("translated_TEM_HELP_SELECTOR_TITLE");
      expect(steps[1].content).toBe("translated_TEM_HELP_SELECTOR_CONTENT");

      // 3) Toolbar
      expect(steps[2].targetId).toBe("edit-track-btn");
      expect(steps[2].selector).toBe("#edit-track-btn");
      expect(steps[2].highlightTargetId).toBe("toolbar-container");
      expect(steps[2].highlightSelector).toBe(".toolbar-container");
      expect(steps[2].position).toBe("bottom");
      expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
      expect(steps[2].content).toBe("translated_TOOLBAR_HELP_CONTENT");

      // 4) LHS (team profile)
      expect(steps[3].targetId).toBe("team-profile-panel");
      expect(steps[3].selector).toBe("#team-profile-panel");
      expect(steps[3].position).toBe("right");
      expect(steps[3].title).toBe("translated_TEM_HELP_PROFILE_TITLE");
      expect(steps[3].content).toBe("translated_TEM_HELP_PROFILE_CONTENT");

      // 5) Team members section
      expect(steps[4].targetId).toBe("assigned-drivers-section");
      expect(steps[4].selector).toBe("#assigned-drivers-section");
      expect(steps[4].position).toBe("left");
      expect(steps[4].title).toBe("translated_TEM_HELP_MEMBERS_TITLE");
      expect(steps[4].content).toBe("translated_TEM_HELP_MEMBERS_CONTENT");

      // 6) Available drivers section
      expect(steps[5].targetId).toBe("available-drivers-section");
      expect(steps[5].selector).toBe("#available-drivers-section");
      expect(steps[5].position).toBe("left");
      expect(steps[5].title).toBe("translated_TEM_HELP_AVAILABLE_TITLE");
      expect(steps[5].content).toBe("translated_TEM_HELP_AVAILABLE_CONTENT");
    });

    it("should verify that all help links in en.json for team editor steps are well-formed", () => {
      const realTranslationService = jasmine.createSpyObj(
        "TranslationService",
        ["translate"],
      );
      realTranslationService.translate.and.callFake(
        (key: string) => (enJson as Record<string, string>)[key] || key,
      );

      const steps = getTeamEditorHelpSteps(realTranslationService);
      expect(steps.length).toBe(6);

      for (const step of steps) {
        expect(step.title).not.toBe("");
        expect(step.content).not.toBe("");

        if (step.content.includes("help-link")) {
          GuideStepTestHelper.verifyHelpLinksInContent(
            step.content,
            `Step: ${step.title}`,
          );
        }
      }

      // Check specific article and section links
      expect(steps[0].content).toContain("help-article-team-editor");
      expect(steps[2].content).toContain("help-article-toolbar");
      expect(steps[3].content).toContain("help-article-team-editor");
      expect(steps[3].content).toContain("help-section-team-profile");
      expect(steps[4].content).toContain("help-article-team-editor");
      expect(steps[4].content).toContain("help-section-team-members");
      expect(steps[5].content).toContain("help-article-team-editor");
      expect(steps[5].content).toContain("help-section-available-drivers");
    });
  });
});
