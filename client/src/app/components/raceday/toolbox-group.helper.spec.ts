import { CustomWidgetDefinition } from "@app/models/custom-widget.model";

import { ToolboxGroupHelper } from "./toolbox-group.helper";

describe("ToolboxGroupHelper", () => {
  it("should build default Race Coordinator AI group when no widgets are used", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [];

    const groups = ToolboxGroupHelper.buildToolboxGroups(used, customWidgets);

    expect(groups.length).toBe(1);
    const rcAiGroup = groups[0];
    expect(rcAiGroup.id).toBe(ToolboxGroupHelper.RC_AI_GROUP_ID);
    expect(rcAiGroup.isBuiltIn).toBeTrue();
    expect(rcAiGroup.rootWidgets.length).toBe(0);
    expect(rcAiGroup.rootWidgets).toEqual([]);

    expect(rcAiGroup.subgroups.length).toBe(5);
    expect(rcAiGroup.subgroups.map((sg) => sg.id)).toEqual([
      "actions",
      "heat-data",
      "media-chrome",
      "standings-heats",
      "titles-info",
    ]);

    const actionsSg = rcAiGroup.subgroups.find((sg) => sg.id === "actions");
    expect(actionsSg?.widgets.length).toBe(19);

    const standingsSg = rcAiGroup.subgroups.find(
      (sg) => sg.id === "standings-heats",
    );
    expect(standingsSg?.widgets.length).toBe(10);
    expect(standingsSg?.widgets.map((w) => w.type)).toContain("countdown");
    expect(standingsSg?.widgets.map((w) => w.type)).toContain("lane-view");
    expect(standingsSg?.widgets.map((w) => w.type)).toContain("leaderboard");

    const titlesSg = rcAiGroup.subgroups.find((sg) => sg.id === "titles-info");
    expect(titlesSg?.widgets.length).toBe(7);
    expect(titlesSg?.widgets.map((w) => w.type)).toContain("timer");
    expect(titlesSg?.widgets.map((w) => w.type)).toContain("flag");
    expect(titlesSg?.widgets.map((w) => w.type)).toContain("heat-info");

    const mediaSg = rcAiGroup.subgroups.find((sg) => sg.id === "media-chrome");
    expect(mediaSg?.widgets.length).toBe(4);

    expect(rcAiGroup.totalCount).toBe(95);
  });

  it("should exclude used widgets from root and subgroups", () => {
    const used = new Set<string>([
      "lane-view",
      "action-start-resume",
      "branding",
      "event-name",
    ]);
    const customWidgets: CustomWidgetDefinition[] = [];

    const groups = ToolboxGroupHelper.buildToolboxGroups(used, customWidgets);
    const rcAiGroup = groups[0];

    const standingsSg = rcAiGroup.subgroups.find(
      (sg) => sg.id === "standings-heats",
    );
    expect(
      standingsSg?.widgets.find((w) => w.type === "lane-view"),
    ).toBeUndefined();
    expect(standingsSg?.widgets.length).toBe(9);

    const actionsSg = rcAiGroup.subgroups.find((sg) => sg.id === "actions");
    expect(
      actionsSg?.widgets.find((w) => w.type === "action-start-resume"),
    ).toBeUndefined();
    expect(actionsSg?.widgets.length).toBe(18);

    const titlesSg = rcAiGroup.subgroups.find((sg) => sg.id === "titles-info");
    expect(
      titlesSg?.widgets.find((w) => w.type === "event-name"),
    ).toBeUndefined();
    expect(titlesSg?.widgets.length).toBe(6);

    const mediaSg = rcAiGroup.subgroups.find((sg) => sg.id === "media-chrome");
    expect(mediaSg?.widgets.find((w) => w.type === "branding")).toBeUndefined();
    expect(mediaSg?.widgets.length).toBe(3);

    expect(rcAiGroup.totalCount).toBe(91);
  });

  it("should organize custom widgets into groups, subgroups, and custom-root", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [
      {
        folderName: "sample-gauge",
        group: "sample",
        manifest: { id: "sample-gauge", name: "Telemetry Gauge" },
      },
      {
        folderName: "sample-delta",
        group: "sample",
        subgroup: "timing",
        manifest: { id: "sample-delta", name: "Lap Delta" },
      },
      {
        folderName: "root-widget",
        group: "custom-root",
        manifest: { id: "root-widget", name: "Legacy Root Widget" },
      },
      {
        folderName: "my-custom",
        group: "community-pack",
        manifest: { id: "my-custom", name: "Community Widget" },
      },
    ];

    const groups = ToolboxGroupHelper.buildToolboxGroups(used, customWidgets);

    // Group order: RC AI, custom-root, then alphabetically: community-pack, sample
    expect(groups.length).toBe(4);
    expect(groups[0].id).toBe(ToolboxGroupHelper.RC_AI_GROUP_ID);
    expect(groups[1].id).toBe(ToolboxGroupHelper.CUSTOM_ROOT_GROUP_ID);
    expect(groups[1].nameKey).toBe("UE_TOOLBOX_GROUP_CUSTOM_ROOT");
    expect(groups[1].rootWidgets.length).toBe(1);
    expect(groups[1].rootWidgets[0].type).toBe("custom:root-widget");

    expect(groups[2].id).toBe("community-pack");
    expect(groups[2].rootWidgets.length).toBe(1);

    expect(groups[3].id).toBe("sample");
    expect(groups[3].rootWidgets.length).toBe(1);
    expect(groups[3].rootWidgets[0].type).toBe("custom:sample-gauge");
    expect(groups[3].subgroups.length).toBe(1);
    expect(groups[3].subgroups[0].id).toBe("sample:timing");
    expect(groups[3].subgroups[0].nameKey).toBe("timing");
    expect(groups[3].subgroups[0].widgets[0].type).toBe("custom:sample-delta");
  });

  it("should filter widgets across groups and subgroups by search term", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [
      {
        folderName: "sample-telemetry",
        group: "sample",
        manifest: { id: "sample-telemetry", name: "Speed Telemetry" },
      },
    ];

    const translate = (key: string) => {
      if (key === "UE_WIDGET_TYPE_TIMER") return "Race Timer";
      if (key === "UE_WIDGET_TYPE_ACTION_PAUSE") return "Pause Heat";
      return key;
    };

    // Searching "timer" should match timer in titles-info subgroup of RC AI
    const groups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "timer",
      new Map(),
      new Map(),
      translate,
    );

    expect(groups.length).toBe(1);
    const rc = groups[0];
    expect(rc.rootWidgets.length).toBe(0);
    expect(rc.subgroups.length).toBe(1);
    expect(rc.subgroups[0].id).toBe("titles-info");
    expect(rc.subgroups[0].widgets[0].type).toBe("timer");
    expect(rc.subgroups[0].expanded).toBeTrue();
    expect(rc.expanded).toBeTrue();

    // Searching "race state" should match flag widget translated to "Race State"
    const translateRaceState = (key: string) => {
      if (key === "UE_WIDGET_TYPE_FLAG") return "Race State";
      return key;
    };
    const stateGroups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "race state",
      new Map(),
      new Map(),
      translateRaceState,
    );
    expect(stateGroups.length).toBe(1);
    expect(stateGroups[0].subgroups.length).toBe(1);
    expect(stateGroups[0].subgroups[0].id).toBe("titles-info");
    expect(stateGroups[0].subgroups[0].widgets[0].type).toBe("flag");
  });

  it("should auto-expand matching subgroups when searching", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [];

    const groups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "pause",
      new Map(),
      new Map(),
    );

    expect(groups.length).toBe(1);
    const rc = groups[0];
    expect(rc.subgroups.length).toBe(1);
    expect(rc.subgroups[0].id).toBe("actions");
    expect(rc.subgroups[0].expanded).toBeTrue();
    expect(rc.subgroups[0].widgets.length).toBe(1);
    expect(rc.subgroups[0].widgets[0].type).toBe("action-pause");
  });

  it("should respect manual expansion states when not searching", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [];

    const groupStates = new Map<string, boolean>([
      [ToolboxGroupHelper.RC_AI_GROUP_ID, false],
    ]);
    const subgroupStates = new Map<string, boolean>([["actions", true]]);

    const groups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "",
      groupStates,
      subgroupStates,
    );

    const rc = groups[0];
    expect(rc.expanded).toBeFalse();
    const actions = rc.subgroups.find((s) => s.id === "actions");
    expect(actions?.expanded).toBeTrue();
    const standings = rc.subgroups.find((s) => s.id === "standings-heats");
    expect(standings?.expanded).toBeFalse();
  });

  it("should sort widgets alphabetically in each folder when translated", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [];

    const mockTranslations: Record<string, string> = {
      UE_WIDGET_TYPE_ACTION_START_RESUME: "Start/Resume Heat",
      UE_WIDGET_TYPE_ACTION_PAUSE: "Pause Heat",
      UE_WIDGET_TYPE_ACTION_BACK: "Back",
      UE_WIDGET_TYPE_ACTION_ADD_LAP: "Add Laps/Sections",
      UE_WIDGET_TYPE_TIMER: "Timer",
      UE_WIDGET_TYPE_FLAG: "Race State",
      UE_WIDGET_TYPE_EVENT_NAME: "Event Name",
      UE_WIDGET_TYPE_HEAT_INFO: "Heat Info",
      UE_WIDGET_TYPE_RACE_NAME: "Race Name",
      UE_WIDGET_TYPE_SEASON_NAME: "Season Name",
      UE_WIDGET_TYPE_TRACK_NAME: "Track Name",
    };

    const translate = (key: string) => mockTranslations[key] || key;

    const groups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "",
      new Map(),
      new Map(),
      translate,
    );

    const rc = groups[0];
    for (const sg of rc.subgroups) {
      const labels = sg.widgets.map((w) => translate(w.labelKey));
      const sortedLabels = [...labels].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      expect(labels).toEqual(sortedLabels);
    }

    const titlesSg = rc.subgroups.find((s) => s.id === "titles-info");
    const titleLabels = titlesSg?.widgets.map((w) => translate(w.labelKey));
    expect(titleLabels).toEqual([
      "Event Name",
      "Heat Info",
      "Race Name",
      "Race State",
      "Season Name",
      "Timer",
      "Track Name",
    ]);
  });

  it("should sort custom widgets alphabetically in folders and root", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [
      {
        folderName: "cw-z",
        group: "custom-pack",
        subgroup: "telemetry",
        manifest: { id: "cw-z", name: "Zebra Meter" },
      },
      {
        folderName: "cw-a",
        group: "custom-pack",
        subgroup: "telemetry",
        manifest: { id: "cw-a", name: "Alpha Meter" },
      },
      {
        folderName: "cw-m",
        group: "custom-pack",
        subgroup: "telemetry",
        manifest: { id: "cw-m", name: "Middle Gauge" },
      },
      {
        folderName: "root-b",
        group: "custom-pack",
        manifest: { id: "root-b", name: "Beta Root" },
      },
      {
        folderName: "root-a",
        group: "custom-pack",
        manifest: { id: "root-a", name: "Alpha Root" },
      },
    ];

    const groups = ToolboxGroupHelper.buildToolboxGroups(used, customWidgets);
    const customPack = groups.find((g) => g.id === "custom-pack");
    expect(customPack).toBeDefined();

    expect(customPack?.rootWidgets.map((w) => w.labelKey)).toEqual([
      "Alpha Root",
      "Beta Root",
    ]);

    const telemetrySg = customPack?.subgroups.find(
      (s) => s.id === "custom-pack:telemetry",
    );
    expect(telemetrySg?.widgets.map((w) => w.labelKey)).toEqual([
      "Alpha Meter",
      "Middle Gauge",
      "Zebra Meter",
    ]);
  });

  it("should nest Heat Data inside Race Coordinator AI with 9 alphabetized subgroups", () => {
    const used = new Set<string>([
      "lane-col:lastLapTime",
      "lane-column",
      "timer",
    ]);
    const customWidgets: CustomWidgetDefinition[] = [];

    const groups = ToolboxGroupHelper.buildToolboxGroups(used, customWidgets);
    const rcGroup = groups.find(
      (g) => g.id === ToolboxGroupHelper.RC_AI_GROUP_ID,
    );
    expect(rcGroup).toBeDefined();

    const heatDataSubgroup = rcGroup!.subgroups.find(
      (sg) => sg.id === ToolboxGroupHelper.HEAT_DATA_GROUP_ID,
    );
    expect(heatDataSubgroup).toBeDefined();
    expect(heatDataSubgroup!.nameKey).toBe("UE_TOOLBOX_GROUP_HEAT_DATA");
    expect(heatDataSubgroup!.subgroups?.length).toBe(9);

    // Verify alphabetized order of the 9 category subfolders inside Heat Data
    const expectedSubgroups = [
      "lane-col-sg-driver-team",
      "lane-col-sg-analysis",
      "lane-col-sg-gaps",
      "lane-col-sg-lap-times",
      "lane-col-sg-laps-standings",
      "lane-col-sg-pacing",
      "lane-col-sg-predictions",
      "lane-col-sg-media-custom",
      "lane-col-sg-telemetry",
    ];
    expect(heatDataSubgroup!.subgroups?.map((sg) => sg.id)).toEqual(
      expectedSubgroups,
    );

    // Verify lastLapTime is still present despite being in used
    const lapTimesSg = heatDataSubgroup!.subgroups?.find(
      (sg) => sg.id === "lane-col-sg-lap-times",
    );
    expect(lapTimesSg).toBeDefined();
    const lastLapWidget = lapTimesSg!.widgets.find(
      (w) => w.type === "lane-col:lastLapTime",
    );
    expect(lastLapWidget).toBeDefined();
  });

  it("should include custom image sets in media-custom subgroup of Heat Data", () => {
    const used = new Set<string>();
    const customWidgets: CustomWidgetDefinition[] = [];
    const availableColumns = [
      { key: "driver.nickname", label: "RD_COL_NICKNAME" },
      { key: "imageset_custom_gauge", label: "Custom Gauge Asset" },
    ];

    const groups = ToolboxGroupHelper.buildToolboxGroups(
      used,
      customWidgets,
      "",
      new Map(),
      new Map(),
      undefined,
      availableColumns,
    );

    const rcGroup = groups.find(
      (g) => g.id === ToolboxGroupHelper.RC_AI_GROUP_ID,
    );
    const heatDataSubgroup = rcGroup!.subgroups.find(
      (sg) => sg.id === ToolboxGroupHelper.HEAT_DATA_GROUP_ID,
    );
    expect(heatDataSubgroup).toBeDefined();

    const mediaCustomSg = heatDataSubgroup!.subgroups?.find(
      (sg) => sg.id === "lane-col-sg-media-custom",
    );
    expect(mediaCustomSg).toBeDefined();
    expect(
      mediaCustomSg!.widgets.some(
        (w) => w.type === "lane-col:imageset_custom_gauge",
      ),
    ).toBeTrue();
  });

  it("should expand Heat Data subgroup when legacy lane-columns id is saved in expanded states", () => {
    const subgroupStates = new Map<string, boolean>([["lane-columns", true]]);
    const groups = ToolboxGroupHelper.buildToolboxGroups(
      new Set(),
      [],
      "",
      new Map(),
      subgroupStates,
    );
    const rcGroup = groups.find(
      (g) => g.id === ToolboxGroupHelper.RC_AI_GROUP_ID,
    );
    const heatDataSubgroup = rcGroup!.subgroups.find(
      (sg) => sg.id === ToolboxGroupHelper.HEAT_DATA_GROUP_ID,
    );
    expect(heatDataSubgroup?.expanded).toBeTrue();
  });

  it("should maintain LANE_COLUMNS_GROUP_ID and buildLaneColumnsGroup backwards compatibility", () => {
    expect(ToolboxGroupHelper.LANE_COLUMNS_GROUP_ID).toBe(
      ToolboxGroupHelper.HEAT_DATA_GROUP_ID,
    );
    const legacyGroup = ToolboxGroupHelper.buildLaneColumnsGroup(
      "",
      new Map(),
      new Map(),
    );
    expect(legacyGroup).toBeDefined();
    expect(legacyGroup!.id).toBe(ToolboxGroupHelper.HEAT_DATA_GROUP_ID);
    expect(legacyGroup!.nameKey).toBe("UE_TOOLBOX_GROUP_HEAT_DATA");
  });
});
