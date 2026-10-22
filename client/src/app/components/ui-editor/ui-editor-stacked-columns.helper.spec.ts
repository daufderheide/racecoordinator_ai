import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

import { StackedColumnsController } from "./ui-editor-stacked-columns.helper";

describe("StackedColumnsController", () => {
  let controller: StackedColumnsController;
  let mockComp: any;
  let mockSettings: Settings;

  const createMockUi = (id: string, layoutJson?: string): CustomUI =>
    ({
      entity_id: id,
      name: `UI ${id}`,
      layoutJson: layoutJson || "",
      is_default: false,
    }) as CustomUI;

  beforeEach(() => {
    localStorage.clear();

    mockSettings = new Settings();
    mockComp = {
      editingSettings: mockSettings,
      activeGridSession: null,
      activeCustomUi: createMockUi("default_ui_layout_rc_ai"),
      availableColumns: [
        { key: "driver.name", label: "Driver Name" },
        { key: "lapCount", label: "Lap Count" },
      ],
      translationService: {
        translate: (key: string, params?: any) => {
          if (params?.count != null) return `${key} (${params.count})`;
          return key;
        },
      },
      captureState: jasmine.createSpy("captureState"),
      markLayoutDirty: jasmine.createSpy("markLayoutDirty"),
      layoutChanged: { emit: jasmine.createSpy("emit") },
      cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      getLayout: (ui: CustomUI) => {
        if (!ui?.layoutJson) return undefined;
        try {
          return JSON.parse(ui.layoutJson);
        } catch {
          return undefined;
        }
      },
      showSuccessModal: false,
      successModalTitle: "",
      successModalMessage: "",
      successModalParams: null,
      showReviewStackedColumnsModal: false,
      detectedStackedIssues: [],
      pendingRepairStackedUi: null,
      showImportStackedConfirm: false,
      pendingImportStacked: null,
      importStackedCount: 0,
    };

    controller = new StackedColumnsController(mockComp);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const createStackedLayout = (): LayoutConfig => ({
    widgets: [
      {
        id: "w1",
        widgetType: "lane-column",
        x: 20,
        y: 100,
        width: 300,
        height: 80,
        zIndex: 100,
        customSettings: {
          gridId: "grid-1",
          columnKey: "driver.name",
          gridLane: 0,
          insets: { "bottom-left": "flag" },
        },
      },
      {
        id: "w1_grid_lane_1",
        widgetType: "lane-column",
        x: 20,
        y: 100,
        width: 300,
        height: 80,
        zIndex: 100,
        customSettings: {
          gridId: "grid-1",
          columnKey: "driver.name",
          gridLane: 0,
          insets: { "bottom-right": "photo" },
        },
      },
    ],
  });

  it("should detect stacked columns and report hasStackedColumns true", () => {
    const layout = createStackedLayout();
    const ui = createMockUi("ui-test", JSON.stringify(layout));

    expect(controller.hasStackedColumns(ui)).toBeTrue();
    expect(controller.getStackedColumnsIssueCount(ui)).toBe(1);
    expect(controller.getStackedColumnsIssues(ui).length).toBe(1);
  });

  it("should report hasStackedColumns false for clean layout", () => {
    const cleanLayout: LayoutConfig = {
      widgets: [
        {
          id: "w1",
          widgetType: "lane-column",
          x: 20,
          y: 100,
          width: 300,
          height: 80,
          zIndex: 100,
          customSettings: {
            gridId: "grid-1",
            columnKey: "driver.name",
            gridLane: 0,
          },
        },
      ],
    };
    const ui = createMockUi("ui-clean", JSON.stringify(cleanLayout));

    expect(controller.hasStackedColumns(ui)).toBeFalse();
    expect(controller.getStackedColumnsIssueCount(ui)).toBe(0);
  });

  it("should handle dismiss and reopen of banner", () => {
    const layout = createStackedLayout();
    const ui = createMockUi("ui-dismiss", JSON.stringify(layout));

    expect(controller.hasStackedColumns(ui)).toBeTrue();
    expect(controller.canReopenStackedColumnsBanner(ui)).toBeFalse();

    controller.dismissStackedColumnsBanner(ui);
    expect(controller.hasStackedColumns(ui)).toBeFalse();
    expect(controller.canReopenStackedColumnsBanner(ui)).toBeTrue();

    controller.reopenStackedColumnsBanner(ui);
    expect(controller.hasStackedColumns(ui)).toBeTrue();
    expect(controller.canReopenStackedColumnsBanner(ui)).toBeFalse();
  });

  it("should open review modal with detected issues", () => {
    const layout = createStackedLayout();
    const ui = createMockUi("ui-modal", JSON.stringify(layout));

    controller.openReviewStackedColumnsModal(ui);
    expect(mockComp.showReviewStackedColumnsModal).toBeTrue();
    expect(mockComp.pendingRepairStackedUi).toBe(ui);
    expect(mockComp.detectedStackedIssues.length).toBe(1);
  });

  it("should confirm repair, merge insets, remove duplicates and show success modal", () => {
    const layout = createStackedLayout();
    const ui = createMockUi("default_ui_layout_rc_ai", JSON.stringify(layout));
    mockComp.activeCustomUi = ui;

    controller.openReviewStackedColumnsModal(ui);
    controller.confirmRepairStackedColumns();

    expect(mockComp.captureState).toHaveBeenCalled();
    expect(mockComp.showReviewStackedColumnsModal).toBeFalse();
    expect(mockComp.showSuccessModal).toBeTrue();
    expect(mockComp.successModalParams.count).toBe(1);

    const parsedRepaired = JSON.parse(ui.layoutJson || "{}");
    expect(parsedRepaired.widgets.length).toBe(1);
    expect(parsedRepaired.widgets[0].customSettings.insets).toEqual({
      "bottom-left": "flag",
      "bottom-right": "photo",
    });
  });

  it("should handle import prompt when imported layout has stacked columns", () => {
    const layout = createStackedLayout();
    const rawJson = JSON.stringify({ layout });
    const ui = createMockUi("default_ui_layout_rc_ai");
    const onSuccess = jasmine.createSpy("onSuccess");

    const intercepted = controller.promptRepairImportedLayout(
      rawJson,
      ui,
      onSuccess,
    );
    expect(intercepted).toBeTrue();
    expect(mockComp.showImportStackedConfirm).toBeTrue();
    expect(mockComp.importStackedCount).toBe(1);

    // Confirm repair import
    controller.confirmRepairImportedLayout();
    expect(onSuccess).toHaveBeenCalled();
    expect(mockComp.showSuccessModal).toBeTrue();

    const repaired = JSON.parse(ui.layoutJson || "{}");
    expect(repaired.widgets.length).toBe(1);
  });

  it("should allow importing as-is when repair is cancelled with importAsIs", () => {
    const layout = createStackedLayout();
    const rawJson = JSON.stringify({ layout });
    const ui = createMockUi("default_ui_layout_rc_ai");
    const onSuccess = jasmine.createSpy("onSuccess");

    controller.promptRepairImportedLayout(rawJson, ui, onSuccess);
    controller.cancelRepairImportedLayout(true);

    expect(onSuccess).toHaveBeenCalled();
    const imported = JSON.parse(ui.layoutJson || "{}");
    expect(imported.widgets.length).toBe(2);
  });
});
