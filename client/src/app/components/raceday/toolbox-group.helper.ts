import { CustomWidgetDefinition } from "@app/models/custom-widget.model";
import { WidgetType } from "@app/models/settings";
import { naturalSortCompare } from "@app/utils/sorting.utils";

export interface ToolboxWidgetItem {
  type: string;
  labelKey: string;
  icon: string;
  customDef?: CustomWidgetDefinition;
}

export interface ToolboxSubgroup {
  id: string;
  nameKey: string;
  icon?: string;
  widgets: ToolboxWidgetItem[];
  expanded?: boolean;
}

export interface ToolboxGroup {
  id: string;
  nameKey: string;
  isBuiltIn: boolean;
  icon: string;
  rootWidgets: ToolboxWidgetItem[];
  subgroups: ToolboxSubgroup[];
  expanded?: boolean;
  totalCount: number;
}

export class ToolboxGroupHelper {
  public static readonly RC_AI_GROUP_ID = "race-coordinator-ai";
  public static readonly CUSTOM_ROOT_GROUP_ID = "custom-root";

  public static readonly RC_AI_ROOT_WIDGETS: {
    type: WidgetType;
    icon: string;
    labelKey: string;
  }[] = [];

  public static readonly RC_AI_SUBGROUPS: {
    id: string;
    nameKey: string;
    icon: string;
    widgets: { type: WidgetType; icon: string; labelKey: string }[];
  }[] = [
    {
      id: "actions",
      nameKey: "UE_TOOLBOX_SUBGROUP_ACTIONS",
      icon: "folder",
      widgets: [
        {
          type: "action-add-lap",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_ADD_LAP",
        },
        {
          type: "action-back",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_BACK",
        },
        {
          type: "action-defer-heat",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_DEFER_HEAT",
        },
        {
          type: "action-export-csv",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_EXPORT_CSV",
        },
        {
          type: "action-export-pdf",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_EXPORT_PDF",
        },
        {
          type: "action-export-xls",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_EXPORT_XLS",
        },
        {
          type: "action-master-power-off",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_MASTER_POWER_OFF",
        },
        {
          type: "action-master-power-on",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_MASTER_POWER_ON",
        },
        {
          type: "action-modify-heats",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_MODIFY_HEATS",
        },
        {
          type: "action-next-heat",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_NEXT_HEAT",
        },
        {
          type: "action-open-heat-results",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_OPEN_HEAT_RESULTS",
        },
        {
          type: "action-open-prediction-results",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_OPEN_PREDICTION_RESULTS",
        },
        {
          type: "action-open-race-results",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_OPEN_RACE_RESULTS",
        },
        {
          type: "action-open-season-results",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_OPEN_SEASON_RESULTS",
        },
        {
          type: "action-pause",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_PAUSE",
        },
        {
          type: "action-restart-heat",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_RESTART_HEAT",
        },
        {
          type: "action-skip-heat",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_SKIP_HEAT",
        },
        {
          type: "action-skip-race",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_SKIP_RACE",
        },
        {
          type: "action-start-resume",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ACTION_START_RESUME",
        },
      ],
    },
    {
      id: "standings-heats",
      nameKey: "UE_TOOLBOX_SUBGROUP_STANDINGS_HEATS",
      icon: "folder",
      widgets: [
        {
          type: "countdown",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_COUNTDOWN",
        },
        {
          type: "group-leaderboard",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_GROUP_LEADERBOARD",
        },
        {
          type: "heat-list",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_HEAT_LIST",
        },
        {
          type: "lane-view",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_LANE_VIEW",
        },
        {
          type: "leaderboard",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_LEADERBOARD",
        },
        {
          type: "next-heat",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_NEXT_HEAT",
        },
        {
          type: "on-deck",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_ON_DECK",
        },
        {
          type: "records",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_RECORDS",
        },
        {
          type: "season-leaderboard",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_SEASON_LEADERBOARD",
        },
        {
          type: "season-race-leaderboard",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_SEASON_RACE_LEADERBOARD",
        },
      ],
    },
    {
      id: "titles-info",
      nameKey: "UE_TOOLBOX_SUBGROUP_TITLES_INFO",
      icon: "folder",
      widgets: [
        {
          type: "event-name",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_EVENT_NAME",
        },
        {
          type: "flag",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_FLAG",
        },
        {
          type: "heat-info",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_HEAT_INFO",
        },
        {
          type: "race-name",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_RACE_NAME",
        },
        {
          type: "season-name",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_SEASON_NAME",
        },
        {
          type: "timer",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_TIMER",
        },
        {
          type: "track-name",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_TRACK_NAME",
        },
      ],
    },
    {
      id: "media-chrome",
      nameKey: "UE_TOOLBOX_SUBGROUP_MEDIA_CHROME",
      icon: "folder",
      widgets: [
        {
          type: "branding",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_BRANDING",
        },
        {
          type: "image",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_IMAGE",
        },
        {
          type: "menu-bar",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_MENU_BAR",
        },
        {
          type: "qr",
          icon: "",
          labelKey: "UE_WIDGET_TYPE_QR",
        },
      ],
    },
  ];

  static buildToolboxGroups(
    usedWidgetTypes: Set<string>,
    customWidgets: CustomWidgetDefinition[],
    searchTerm: string = "",
    groupExpandedStates: Map<string, boolean> = new Map(),
    subgroupExpandedStates: Map<string, boolean> = new Map(),
    translateFn?: (key: string) => string,
  ): ToolboxGroup[] {
    const term = (searchTerm || "").trim().toLowerCase();
    const groups: ToolboxGroup[] = [];

    const rcGroup = ToolboxGroupHelper.buildRcAiGroup(
      usedWidgetTypes,
      term,
      groupExpandedStates,
      subgroupExpandedStates,
      translateFn,
    );
    if (rcGroup) {
      groups.push(rcGroup);
    }

    const customGroups = ToolboxGroupHelper.buildCustomGroups(
      usedWidgetTypes,
      customWidgets,
      term,
      groupExpandedStates,
      subgroupExpandedStates,
      translateFn,
    );
    groups.push(...customGroups);

    return groups;
  }

  private static buildRcAiGroup(
    usedWidgetTypes: Set<string>,
    term: string,
    groupExpandedStates: Map<string, boolean>,
    subgroupExpandedStates: Map<string, boolean>,
    translateFn?: (key: string) => string,
  ): ToolboxGroup | null {
    const rcRootWidgets: ToolboxWidgetItem[] =
      ToolboxGroupHelper.RC_AI_ROOT_WIDGETS.filter(
        (w) => !usedWidgetTypes.has(w.type),
      )
        .filter((w) => ToolboxGroupHelper.matchesSearch(w, term, translateFn))
        .map((w) => ({
          type: w.type,
          labelKey: w.labelKey,
          icon: w.icon,
        }))
        .sort((a, b) => ToolboxGroupHelper.compareWidgets(a, b, translateFn));

    const rcSubgroups: ToolboxSubgroup[] = [];
    for (const sg of ToolboxGroupHelper.RC_AI_SUBGROUPS) {
      const unusedWidgets = sg.widgets
        .filter((w) => !usedWidgetTypes.has(w.type))
        .filter((w) => ToolboxGroupHelper.matchesSearch(w, term, translateFn))
        .map((w) => ({
          type: w.type,
          labelKey: w.labelKey,
          icon: w.icon,
        }))
        .sort((a, b) => ToolboxGroupHelper.compareWidgets(a, b, translateFn));

      if (unusedWidgets.length > 0) {
        const isSgExpanded = term
          ? true
          : subgroupExpandedStates.has(sg.id)
            ? subgroupExpandedStates.get(sg.id)!
            : false;

        rcSubgroups.push({
          id: sg.id,
          nameKey: sg.nameKey,
          icon: sg.icon,
          widgets: unusedWidgets,
          expanded: isSgExpanded,
        });
      }
    }

    const rcTotalCount =
      rcRootWidgets.length +
      rcSubgroups.reduce((sum, sg) => sum + sg.widgets.length, 0);

    if (rcTotalCount === 0 && term) {
      return null;
    }

    const isRcExpanded = term
      ? true
      : groupExpandedStates.has(ToolboxGroupHelper.RC_AI_GROUP_ID)
        ? groupExpandedStates.get(ToolboxGroupHelper.RC_AI_GROUP_ID)!
        : true;

    return {
      id: ToolboxGroupHelper.RC_AI_GROUP_ID,
      nameKey: "UE_TOOLBOX_GROUP_RC_AI",
      isBuiltIn: true,
      icon: "folder",
      rootWidgets: rcRootWidgets,
      subgroups: rcSubgroups,
      expanded: isRcExpanded,
      totalCount: rcTotalCount,
    };
  }

  private static buildCustomGroups(
    usedWidgetTypes: Set<string>,
    customWidgets: CustomWidgetDefinition[],
    term: string,
    groupExpandedStates: Map<string, boolean>,
    subgroupExpandedStates: Map<string, boolean>,
    translateFn?: (key: string) => string,
  ): ToolboxGroup[] {
    const customByGroup = new Map<string, CustomWidgetDefinition[]>();
    for (const cw of customWidgets) {
      const fullType = `custom:${cw.manifest.id}`;
      if (usedWidgetTypes.has(fullType)) continue;

      const groupName = cw.group || ToolboxGroupHelper.CUSTOM_ROOT_GROUP_ID;
      if (!customByGroup.has(groupName)) {
        customByGroup.set(groupName, []);
      }
      customByGroup.get(groupName)!.push(cw);
    }

    const sortedGroupNames = Array.from(customByGroup.keys()).sort((a, b) => {
      if (a === ToolboxGroupHelper.CUSTOM_ROOT_GROUP_ID) return -1;
      if (b === ToolboxGroupHelper.CUSTOM_ROOT_GROUP_ID) return 1;
      return a.localeCompare(b);
    });

    const groups: ToolboxGroup[] = [];
    for (const groupName of sortedGroupNames) {
      const defs = customByGroup.get(groupName)!;
      const group = ToolboxGroupHelper.buildSingleCustomGroup(
        groupName,
        defs,
        term,
        groupExpandedStates,
        subgroupExpandedStates,
        translateFn,
      );
      if (group) {
        groups.push(group);
      }
    }
    return groups;
  }

  private static buildSingleCustomGroup(
    groupName: string,
    defs: CustomWidgetDefinition[],
    term: string,
    groupExpandedStates: Map<string, boolean>,
    subgroupExpandedStates: Map<string, boolean>,
    translateFn?: (key: string) => string,
  ): ToolboxGroup | null {
    const rootWidgets: ToolboxWidgetItem[] = [];
    const subgroupsMap = new Map<string, ToolboxWidgetItem[]>();

    for (const cw of defs) {
      const item: ToolboxWidgetItem = {
        type: `custom:${cw.manifest.id}`,
        labelKey: cw.manifest.name || cw.manifest.id,
        icon: "",
        customDef: cw,
      };

      if (!ToolboxGroupHelper.matchesSearch(item, term, translateFn)) {
        continue;
      }

      if (cw.subgroup) {
        if (!subgroupsMap.has(cw.subgroup)) {
          subgroupsMap.set(cw.subgroup, []);
        }
        subgroupsMap.get(cw.subgroup)!.push(item);
      } else {
        rootWidgets.push(item);
      }
    }

    rootWidgets.sort((a, b) =>
      ToolboxGroupHelper.compareWidgets(a, b, translateFn),
    );

    const subgroups: ToolboxSubgroup[] = [];
    const sortedSubNames = Array.from(subgroupsMap.keys()).sort((a, b) =>
      naturalSortCompare(a, b),
    );
    for (const subName of sortedSubNames) {
      const sWidgets = subgroupsMap.get(subName)!;
      if (sWidgets.length > 0) {
        sWidgets.sort((a, b) =>
          ToolboxGroupHelper.compareWidgets(a, b, translateFn),
        );
        const sgId = `${groupName}:${subName}`;
        const isSgExpanded = term
          ? true
          : subgroupExpandedStates.has(sgId)
            ? subgroupExpandedStates.get(sgId)!
            : true;

        subgroups.push({
          id: sgId,
          nameKey: subName,
          icon: "folder",
          widgets: sWidgets,
          expanded: isSgExpanded,
        });
      }
    }

    const groupTotal =
      rootWidgets.length +
      subgroups.reduce((sum, sg) => sum + sg.widgets.length, 0);

    if (groupTotal === 0 && term) {
      return null;
    }

    const isGroupExpanded = term
      ? true
      : groupExpandedStates.has(groupName)
        ? groupExpandedStates.get(groupName)!
        : true;

    const isCustomRoot = groupName === ToolboxGroupHelper.CUSTOM_ROOT_GROUP_ID;

    return {
      id: groupName,
      nameKey: isCustomRoot ? "UE_TOOLBOX_GROUP_CUSTOM_ROOT" : groupName,
      isBuiltIn: false,
      icon: "folder",
      rootWidgets,
      subgroups,
      expanded: isGroupExpanded,
      totalCount: groupTotal,
    };
  }

  private static compareWidgets(
    a: ToolboxWidgetItem,
    b: ToolboxWidgetItem,
    translateFn?: (key: string) => string,
  ): number {
    const labelA = ToolboxGroupHelper.getWidgetDisplayLabel(a, translateFn);
    const labelB = ToolboxGroupHelper.getWidgetDisplayLabel(b, translateFn);
    const cmp = naturalSortCompare(labelA, labelB);
    if (cmp !== 0) return cmp;
    return naturalSortCompare(a.type, b.type);
  }

  private static getWidgetDisplayLabel(
    item: ToolboxWidgetItem,
    translateFn?: (key: string) => string,
  ): string {
    if (item.type.startsWith("custom:")) {
      return item.labelKey || item.type;
    }
    if (translateFn) {
      const translated = translateFn(item.labelKey);
      if (translated) return translated;
    }
    return item.labelKey || item.type;
  }

  private static matchesSearch(
    item: ToolboxWidgetItem,
    term: string,
    translateFn?: (key: string) => string,
  ): boolean {
    if (!term) return true;
    if (item.type.toLowerCase().includes(term)) return true;
    if (item.labelKey.toLowerCase().includes(term)) return true;
    if (translateFn) {
      const translated = translateFn(item.labelKey);
      if (translated && translated.toLowerCase().includes(term)) {
        return true;
      }
    }
    return false;
  }
}
