import { ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { UndoManager } from "@app/components/shared/undo-redo-controls/undo-manager";
import { sortThemesForDisplay } from "@app/components/ui-editor/ui-editor-theme.helper";
import { DataService } from "@app/data.service";
import { Theme } from "@app/models/theme";
import { Track } from "@app/models/track";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { deepCopy } from "@app/utils/clone.utils";

import { RaceEditorNormalizationHelper } from "./race-editor-normalization.helper";

export interface RaceCatalogHost {
  tracks: Track[];
  themes: Theme[];
  editingRace: any;
  originalRace: any;
  defaultRaceName: string;
  isNavigationApproved: boolean;
  isLoading: boolean;
  driverCount: number;
  isReverting: boolean;
  isSwitchingSelection: boolean;
  undoManager: UndoManager<any>;
  subscriptions: Subscription[];
  route: ActivatedRoute;
  router: Router;
  dataService: DataService;
  translationService: TranslationService;
  navigationService: NavigationService;
  logger: LoggerService;
  cdr: ChangeDetectorRef;
  focusNameInput(): void;
  syncHeatPositionPoints(): void;
  enforceFuelRules(): void;
  syncSelectedCustomRotationAsset(): void;
  syncSequenceTextFromModel(): void;
  hasChanges(): boolean;
  confirmDiscard(): Promise<boolean>;
  startNewRace(): void;
  loadRace(id: string): void;
  saveDriverCount(): void;
  loadDriverCount(): void;
}

export class RaceEditorCatalogHelper {
  static getDefaultThemeId(themes: Theme[]): string {
    if (!themes || themes.length === 0) {
      return "default_classic_rc_ai";
    }
    const defaultTheme = themes.find(
      (t) => t.is_default || t.entity_id === "default_classic_rc_ai",
    );
    return (defaultTheme || themes[0]).entity_id;
  }

  static loadThemes(host: RaceCatalogHost): void {
    host.dataService.getThemes().subscribe({
      next: (themes) => {
        host.themes = sortThemesForDisplay(
          themes || [],
          host.translationService,
        );
        if (
          host.editingRace &&
          !host.editingRace.theme_id &&
          host.themes.length > 0
        ) {
          host.editingRace.theme_id = this.getDefaultThemeId(host.themes);
        }
        host.cdr.detectChanges();
      },
      error: (err) => {
        host.logger.error("Failed to load themes", err);
      },
    });
  }

  static loadTracks(host: RaceCatalogHost): void {
    host.dataService.getTracks().subscribe({
      next: (tracks) => {
        host.tracks = (tracks || []).map(
          (t) =>
            new Track({
              entity_id: t.entity_id,
              name: t.name,
              num_track_sections: t.num_track_sections || 100,
              lanes: t.lanes || [],
              has_digital_fuel: t.has_digital_fuel ?? false,
              has_per_lane_relays: t.has_per_lane_relays ?? false,
              has_main_relay: t.has_main_relay ?? false,
              arduino_configs: t.arduino_configs,
            }),
        );
        if (
          host.editingRace &&
          host.editingRace.entity_id === "new" &&
          !host.editingRace.track_entity_id &&
          host.tracks.length > 0
        ) {
          host.editingRace.track_entity_id = host.tracks[0].entity_id;
          host.syncHeatPositionPoints();
          host.originalRace = deepCopy(host.editingRace);
          host.undoManager.initialize(host.editingRace);
        } else if (host.editingRace) {
          host.syncHeatPositionPoints();
        }
        host.enforceFuelRules();
        setTimeout(() => host.cdr.detectChanges(), 0);
      },
      error: (error: any) => {
        host.logger.error("Failed to load tracks", error);
      },
    });
  }

  static createNewRace(host: RaceCatalogHost): void {
    host.isNavigationApproved = false;
    host.defaultRaceName = "";
    host.focusNameInput();
    const trackId = host.tracks.length > 0 ? host.tracks[0].entity_id : "";
    const themeId = this.getDefaultThemeId(host.themes);
    host.editingRace = RaceEditorNormalizationHelper.createDefaultRaceTemplate(
      trackId,
      themeId,
    );
    host.syncHeatPositionPoints();
    host.originalRace = deepCopy(host.editingRace);
    host.undoManager.initialize(host.editingRace);
    host.syncSelectedCustomRotationAsset();
    host.syncSequenceTextFromModel();
    host.isLoading = false;
    setTimeout(() => host.cdr.detectChanges(), 0);
  }

  static initDriverCount(host: RaceCatalogHost): void {
    const driverCountParam =
      host.route.snapshot.queryParamMap.get("driverCount");
    if (driverCountParam) {
      const parsed = parseInt(driverCountParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        host.driverCount = parsed;
        host.saveDriverCount();
      } else {
        host.loadDriverCount();
      }
    } else {
      host.loadDriverCount();
    }
  }

  static loadDefaultRace(host: RaceCatalogHost): void {
    const lastEdited = host.navigationService.getLastEditedId("race");
    if (lastEdited) {
      host.loadRace(lastEdited);
    } else {
      host.loadRace("");
    }
  }

  static initRouteHandling(host: RaceCatalogHost): void {
    if (host.route.queryParamMap) {
      host.subscriptions.push(
        host.route.queryParamMap.subscribe((paramMap) => {
          this.handleParamMap(host, paramMap);
        }),
      );
    } else {
      const id = host.route.snapshot.queryParamMap.get("id");
      this.routeToRace(host, id);
    }
  }

  private static handleParamMap(host: RaceCatalogHost, paramMap: any): void {
    if (host.isReverting) {
      host.isReverting = false;
      return;
    }
    const isEditorRoute =
      !host.router.url ||
      host.router.url === "/" ||
      host.router.url.startsWith("/race-editor") ||
      host.router.url.includes("mock");
    if (!isEditorRoute) {
      return;
    }
    if (host.isSwitchingSelection) {
      host.isSwitchingSelection = false;
      return;
    }
    const nextId = paramMap.get("id");
    if (nextId && nextId !== "new") {
      host.navigationService.setLastEditedId("race", nextId);
    }
    const currentId = host.editingRace?.entity_id;
    if (
      currentId &&
      nextId !== currentId &&
      host.hasChanges() &&
      !host.isNavigationApproved
    ) {
      this.promptDiscardAndNavigate(host, currentId);
    } else {
      this.routeToRace(host, nextId);
    }
  }

  private static promptDiscardAndNavigate(
    host: RaceCatalogHost,
    currentId: string,
  ): void {
    host.confirmDiscard().then((confirmed) => {
      if (confirmed) {
        const id = host.route.snapshot.queryParamMap.get("id");
        this.routeToRace(host, id);
      } else {
        host.isReverting = true;
        host.router.navigate([], {
          relativeTo: host.route,
          queryParams: {
            id: currentId,
            from: host.route.snapshot.queryParamMap.get("from"),
            returnUrl: host.route.snapshot.queryParamMap.get("returnUrl"),
          },
          queryParamsHandling: "merge",
        });
      }
    });
  }

  private static routeToRace(
    host: RaceCatalogHost,
    id: string | null | undefined,
  ): void {
    if (id === "new") {
      host.startNewRace();
    } else if (id) {
      host.loadRace(id);
    } else {
      this.loadDefaultRace(host);
    }
  }
}
