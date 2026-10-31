import {
  ToolboxGroup,
  ToolboxGroupHelper,
} from "@app/components/raceday/toolbox-group.helper";
import { WidgetType } from "@app/models/settings";

export class RacedayToolboxHelper {
  public static getWidgetTypeLabelKey(host: any, widgetType: string): string {
    if (widgetType?.startsWith("custom:")) {
      const def = host.customWidgetService?.getWidgetDefinition(widgetType);
      return def?.manifest?.name || widgetType.substring("custom:".length);
    }
    return "UE_WIDGET_TYPE_" + widgetType.toUpperCase().replace(/-/g, "_");
  }

  public static getUnusedWidgets(host: any): WidgetType[] {
    const allTypes: WidgetType[] = [
      "menu-bar",
      "race-name",
      "event-name",
      "season-name",
      "heat-info",
      "track-name",
      "branding",
      "qr",
      "flag",
      "timer",
      "records",
      "leaderboard",
      "group-leaderboard",
      "season-leaderboard",
      "season-race-leaderboard",
      "lane-view",
      "on-deck",
      "next-heat",
      "heat-list",
      "image",
      "action-start-resume",
      "action-pause",
      "action-next-heat",
      "action-restart-heat",
      "action-defer-heat",
      "action-skip-heat",
      "action-skip-race",
      "action-add-lap",
      "action-modify-heats",
      "action-export-pdf",
      "action-export-csv",
      "action-export-xls",
      "action-open-heat-results",
      "action-open-race-results",
      "action-open-season-results",
      "action-open-prediction-results",
      "action-master-power-on",
      "action-master-power-off",
      "action-back",
      "action-forward",
      "action-close",
    ];

    const customWidgets = host.customWidgetService?.getCustomWidgets() || [];
    for (const cw of customWidgets) {
      allTypes.push(`custom:${cw.manifest.id}`);
    }

    const used = new Set(
      host.layout?.widgets?.map((w: any) => w.widgetType) || [],
    );
    return allTypes
      .filter((t) => !used.has(t))
      .sort((a, b) => a.localeCompare(b));
  }

  public static loadToolboxExpandedStatesFromLayout(host: any): void {
    const layout = host.layout || host.currentRacedayLayout;
    host.toolboxGroupExpandedStates.clear();
    host.toolboxSubgroupExpandedStates.clear();
    host.hasLoadedToolboxStates = true;
    if (!layout) return;

    // Groups: default is expanded (true) unless collapsed
    const collapsedGroups = layout.collapsedToolboxGroups;
    if (Array.isArray(collapsedGroups)) {
      for (const id of collapsedGroups) {
        host.toolboxGroupExpandedStates.set(id, false);
      }
    } else if (collapsedGroups && typeof collapsedGroups === "object") {
      for (const [id, isCollapsed] of Object.entries(collapsedGroups)) {
        host.toolboxGroupExpandedStates.set(id, !isCollapsed);
      }
    }

    if (
      layout.toolboxGroupExpandedStates &&
      typeof layout.toolboxGroupExpandedStates === "object"
    ) {
      for (const [id, isExpanded] of Object.entries(
        layout.toolboxGroupExpandedStates,
      )) {
        host.toolboxGroupExpandedStates.set(id, !!isExpanded);
      }
    }

    // Subgroups: default is collapsed (false) unless expanded
    const collapsedSubgroups = layout.collapsedToolboxSubgroups;
    if (Array.isArray(collapsedSubgroups)) {
      for (const id of collapsedSubgroups) {
        host.toolboxSubgroupExpandedStates.set(id, false);
      }
    } else if (collapsedSubgroups && typeof collapsedSubgroups === "object") {
      for (const [id, isCollapsed] of Object.entries(collapsedSubgroups)) {
        host.toolboxSubgroupExpandedStates.set(id, !isCollapsed);
      }
    }

    if (
      layout.toolboxSubgroupExpandedStates &&
      typeof layout.toolboxSubgroupExpandedStates === "object"
    ) {
      for (const [id, isExpanded] of Object.entries(
        layout.toolboxSubgroupExpandedStates,
      )) {
        host.toolboxSubgroupExpandedStates.set(id, !!isExpanded);
      }
    }
  }

  public static ensureToolboxExpandedStatesLoaded(host: any): void {
    if (!host.hasLoadedToolboxStates) {
      if (host.loadToolboxExpandedStatesFromLayout) {
        host.loadToolboxExpandedStatesFromLayout();
      } else {
        RacedayToolboxHelper.loadToolboxExpandedStatesFromLayout(host);
      }
    }
  }

  public static saveToolboxExpandedStatesToLayout(host: any): void {
    if (!host.layout) {
      if (host.currentRacedayLayout) {
        host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
      } else {
        host.layout = host.getDefaultLayout();
      }
    }

    if (!host.layout.collapsedToolboxGroups) {
      host.layout.collapsedToolboxGroups = {};
    }
    if (Array.isArray(host.layout.collapsedToolboxGroups)) {
      const set = new Set<string>(host.layout.collapsedToolboxGroups);
      for (const [
        id,
        isExpanded,
      ] of host.toolboxGroupExpandedStates.entries()) {
        if (!isExpanded) {
          set.add(id);
        } else {
          set.delete(id);
        }
      }
      host.layout.collapsedToolboxGroups = Array.from(set);
    } else {
      for (const [
        id,
        isExpanded,
      ] of host.toolboxGroupExpandedStates.entries()) {
        host.layout.collapsedToolboxGroups[id] = !isExpanded;
      }
    }

    if (!host.layout.collapsedToolboxSubgroups) {
      host.layout.collapsedToolboxSubgroups = {};
    }
    if (Array.isArray(host.layout.collapsedToolboxSubgroups)) {
      const set = new Set<string>(host.layout.collapsedToolboxSubgroups);
      for (const [
        id,
        isExpanded,
      ] of host.toolboxSubgroupExpandedStates.entries()) {
        if (!isExpanded) {
          set.add(id);
        } else {
          set.delete(id);
        }
      }
      host.layout.collapsedToolboxSubgroups = Array.from(set);
    } else {
      for (const [
        id,
        isExpanded,
      ] of host.toolboxSubgroupExpandedStates.entries()) {
        host.layout.collapsedToolboxSubgroups[id] = !isExpanded;
      }
    }

    if (host.isUIEditorMode()) {
      host.layoutChanged.emit(host.layout);
    } else {
      host.currentRacedayLayout = host.layout;
      const settings = host.settingsService.getSettings();
      if (host.isPracticeLayout) {
        settings.practiceRacedayLayout = host.layout;
      } else {
        settings.racedayLayout = host.layout;
      }
      host.settingsService.saveSettings(settings);
    }
  }

  public static getToolboxGroups(host: any): ToolboxGroup[] {
    RacedayToolboxHelper.ensureToolboxExpandedStatesLoaded(host);
    const used = new Set<string>(
      host.layout?.widgets?.map((w: any) => w.widgetType as string) || [],
    );
    const customWidgets = host.customWidgetService?.getCustomWidgets() || [];
    return ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      host.toolboxSearchTerm,
      host.toolboxGroupExpandedStates,
      host.toolboxSubgroupExpandedStates,
      (key) => host.translationService?.translate(key) || key,
    );
  }

  public static toggleToolboxGroup(host: any, groupId: string): void {
    RacedayToolboxHelper.ensureToolboxExpandedStatesLoaded(host);
    const current = host.toolboxGroupExpandedStates.has(groupId)
      ? host.toolboxGroupExpandedStates.get(groupId)!
      : true;
    host.toolboxGroupExpandedStates.set(groupId, !current);
    if (host.saveToolboxExpandedStatesToLayout) {
      host.saveToolboxExpandedStatesToLayout();
    } else {
      RacedayToolboxHelper.saveToolboxExpandedStatesToLayout(host);
    }
  }

  public static toggleToolboxSubgroup(host: any, subgroupId: string): void {
    RacedayToolboxHelper.ensureToolboxExpandedStatesLoaded(host);
    const current = host.toolboxSubgroupExpandedStates.has(subgroupId)
      ? host.toolboxSubgroupExpandedStates.get(subgroupId)!
      : false;
    host.toolboxSubgroupExpandedStates.set(subgroupId, !current);
    if (host.saveToolboxExpandedStatesToLayout) {
      host.saveToolboxExpandedStatesToLayout();
    } else {
      RacedayToolboxHelper.saveToolboxExpandedStatesToLayout(host);
    }
  }

  public static clearToolboxSearch(host: any): void {
    host.toolboxSearchTerm = "";
  }

  public static onToolboxDragStart(
    host: any,
    event: DragEvent,
    type: string,
  ): void {
    host.draggedWidgetType = type;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "all";
      event.dataTransfer.setData("text/plain", type);
      const key = type.startsWith("lane-col:")
        ? type.substring("lane-col:".length)
        : type;
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({ type, key }),
      );
    }
  }
}
