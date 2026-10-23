import { ActivatedRoute, Router } from "@angular/router";
import { EditorTab } from "@app/components/shared/editor-tabs/editor-tabs.component";
import { TranslationService } from "@app/services/translation.service";

export interface RaceEditorSections {
  general: boolean;
  start_method: boolean;
  scoring: boolean;
  season_points: boolean;
  heats: boolean;
  groups: boolean;
  fuel_analog: boolean;
  fuel_digital: boolean;
  team: boolean;
}

export class RaceEditorUiHelper {
  static getRaceTabs(translationService: TranslationService): EditorTab[] {
    return [
      {
        id: "general-section",
        label: translationService.translate("RE_GENERAL_HEADER"),
      },
      {
        id: "heats-section",
        label: translationService.translate("RE_HEATS_HEADER"),
      },
      {
        id: "scoring-section",
        label: translationService.translate("RE_SCORING_HEADER"),
      },
      {
        id: "group-section",
        label: translationService.translate("RE_GROUPS_HEADER"),
      },
      {
        id: "start-method-section",
        label: translationService.translate("RE_START_METHOD_HEADER"),
      },
      {
        id: "team-options-section",
        label: translationService.translate("RE_TEAM_OPTIONS_HEADER"),
      },
      {
        id: "analog-fuel-section",
        label: translationService.translate("RE_ANALOG_FUEL_HEADER"),
      },
      {
        id: "digital-fuel-outer-section",
        label: translationService.translate("RE_DIGITAL_FUEL_HEADER"),
      },
      {
        id: "season-points-section",
        label: translationService.translate("SS_TITLE"),
      },
    ];
  }

  static navigateBack(
    route: ActivatedRoute,
    router: Router,
    onApproved: () => void,
  ): void {
    onApproved();
    sessionStorage.setItem("skipIntro", "true");
    const from = route.snapshot.queryParamMap.get("from");
    const returnUrl = route.snapshot.queryParamMap.get("returnUrl");
    if (returnUrl) {
      router.navigateByUrl(returnUrl);
      return;
    }
    if (from === "raceday-setup" || from === "raceday") {
      router.navigate(["/raceday-setup"], {
        queryParams: { skipIntro: "true" },
      });
      return;
    }
    router.navigate(["/raceday-setup"]);
  }
  static calculateScale(windowWidth: number, windowHeight: number): number {
    const targetWidth = 1600;
    const targetHeight = 900;
    const scaleX = windowWidth / targetWidth;
    const scaleY = windowHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);
    return scale <= 0 || isNaN(scale) ? 1 : scale;
  }

  static handleKeyboardEvent(
    event: KeyboardEvent,
    isEditMode: boolean,
    undo: () => void,
    redo: () => void,
  ): void {
    if (!isEditMode) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "y") {
      event.preventDefault();
      redo();
    }
  }

  static loadExpanderState(
    currentSections: RaceEditorSections,
  ): RaceEditorSections {
    try {
      const saved = localStorage.getItem("race_editor_expanders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fuel !== undefined) {
          parsed.fuel_analog = parsed.fuel;
          parsed.fuel_digital = parsed.fuel;
          delete parsed.fuel;
        }
        return { ...currentSections, ...parsed };
      }
    } catch {
      // Fallback to default
    }
    return currentSections;
  }

  static saveExpanderState(sections: RaceEditorSections): void {
    try {
      localStorage.setItem("race_editor_expanders", JSON.stringify(sections));
    } catch {
      // Storage unavailable
    }
  }

  static loadDriverCount(): number {
    try {
      const saved = localStorage.getItem("race_editor_driver_count");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // Storage error
    }
    return 4;
  }

  static saveDriverCount(count: number): void {
    try {
      localStorage.setItem("race_editor_driver_count", count.toString());
    } catch {
      // Storage unavailable
    }
  }

  static scrollToAndExpandSection(
    tabId: string,
    sectionsExpanded: RaceEditorSections,
  ): void {
    const sectionMap: Record<string, keyof RaceEditorSections> = {
      "general-section": "general",
      "start-method-section": "start_method",
      "scoring-section": "scoring",
      "season-points-section": "season_points",
      "heats-section": "heats",
      "group-section": "groups",
      "analog-fuel-section": "fuel_analog",
      "digital-fuel-outer-section": "fuel_digital",
      "team-options-section": "team",
    };

    const sectionKey = sectionMap[tabId];
    if (sectionKey) {
      sectionsExpanded[sectionKey] = true;
      this.saveExpanderState(sectionsExpanded);
    }

    setTimeout(() => {
      const element = document.getElementById(tabId);
      const container = document.querySelector(".sections-wrapper");
      if (element && container) {
        const topPos =
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;

        container.scrollTo({
          top: topPos - 24,
          behavior: "smooth",
        });
      } else if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
}
