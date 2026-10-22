import { expect, test } from "@playwright/test";
import { LaneGridHeaderHelper } from "@app/components/raceday/utils/lane-grid-header.helper";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Lane Column and Grid Inspector Visuals", () => {
  const gridId = "grid-test-session";
  const totalLanes = 4;

  const testWidgets: AbsoluteWidgetNode[] = [
    // Lane 0 (Master row)
    {
      id: "grid-w-0-name",
      widgetType: "lane-column",
      x: 60,
      y: 80,
      width: 240,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "driver.name",
        gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-0-laps",
      widgetType: "lane-column",
      x: 300,
      y: 80,
      width: 100,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lapCount",
        gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-0-time",
      widgetType: "lane-column",
      x: 400,
      y: 80,
      width: 140,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lastLapTime",
        gridId,
        gridLane: 0,
        targetIndex: 0,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    // Lane 1 (Mirrored row)
    {
      id: "grid-w-1-name",
      widgetType: "lane-column",
      x: 60,
      y: 140,
      width: 240,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "driver.name",
        gridId,
        gridLane: 1,
        targetIndex: 1,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-1-laps",
      widgetType: "lane-column",
      x: 300,
      y: 140,
      width: 100,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lapCount",
        gridId,
        gridLane: 1,
        targetIndex: 1,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-1-time",
      widgetType: "lane-column",
      x: 400,
      y: 140,
      width: 140,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lastLapTime",
        gridId,
        gridLane: 1,
        targetIndex: 1,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    // Lane 2 (Mirrored row)
    {
      id: "grid-w-2-name",
      widgetType: "lane-column",
      x: 60,
      y: 200,
      width: 240,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "driver.name",
        gridId,
        gridLane: 2,
        targetIndex: 2,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-2-laps",
      widgetType: "lane-column",
      x: 300,
      y: 200,
      width: 100,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lapCount",
        gridId,
        gridLane: 2,
        targetIndex: 2,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-2-time",
      widgetType: "lane-column",
      x: 400,
      y: 200,
      width: 140,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lastLapTime",
        gridId,
        gridLane: 2,
        targetIndex: 2,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    // Lane 3 (Mirrored row)
    {
      id: "grid-w-3-name",
      widgetType: "lane-column",
      x: 60,
      y: 260,
      width: 240,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "driver.name",
        gridId,
        gridLane: 3,
        targetIndex: 3,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-3-laps",
      widgetType: "lane-column",
      x: 300,
      y: 260,
      width: 100,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lapCount",
        gridId,
        gridLane: 3,
        targetIndex: 3,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    {
      id: "grid-w-3-time",
      widgetType: "lane-column",
      x: 400,
      y: 260,
      width: 140,
      height: 60,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "lastLapTime",
        gridId,
        gridLane: 3,
        targetIndex: 3,
        gridTotalLanes: totalLanes,
        gridDirection: "vertical",
        bindingMode: "lane",
        showHeader: true,
        headerPlacement: "individual",
        layoutOrientation: "vertical",
      },
    },
    // Standalone Lane Column Widget (no gridId)
    {
      id: "standalone-lane-col",
      widgetType: "lane-column",
      x: 600,
      y: 80,
      width: 220,
      height: 100,
      zIndex: 10,
      scaleMode: "auto",
      customSettings: {
        columnKey: "bestLapTime",
        bindingMode: "position",
        targetIndex: 0,
        showHeader: true,
        layoutOrientation: "vertical",
      },
    },
  ];

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.setupThemeMocks(page);

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      racedayLayout: {
        widgets: testWidgets,
      },
    });

    await TestSetupHelper.setupFileSystemMock(page, {});
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("should display grid inspector with grid tab options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the first grid cell widget within the grid container
    const gridWidget = page
      .locator(".raceday-grid-container .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    // Wait for the inspector panel to be visible
    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Verify inspector contains lane-column-inspector
    const inspectorFields = page.locator("app-lane-column-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Verify grid settings template is active
    await inspectorPanel
      .locator(".grid-indicator-card")
      .waitFor({ state: "visible" });

    // Remove active element focus, clear hover, and scroll inspector panel so lane column fields are at the top
    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-lane-column-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    // Take screenshot of the inspector panel showing the grid tab settings
    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-grid-tab.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display grid inspector with widget tab options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the first grid cell widget within the grid container
    const gridWidget = page
      .locator(".raceday-grid-container .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    const inspectorFields = page.locator("app-lane-column-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to Widget scope tab
    const widgetScopeTab = inspectorPanel.locator(".scope-tab").nth(0);
    await widgetScopeTab.click();

    // Wait for widget banner to confirm scope switch
    await inspectorPanel
      .locator(".widget-banner")
      .waitFor({ state: "visible" });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-lane-column-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-widget-tab.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display grid inspector with column tab options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the first grid cell widget within the grid container
    const gridWidget = page
      .locator(".raceday-grid-container .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    const inspectorFields = page.locator("app-lane-column-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Switch to Column scope tab
    const columnScopeTab = inspectorPanel.locator(".scope-tab").nth(2);
    await columnScopeTab.click();

    // Wait for column banner to confirm scope switch
    await inspectorPanel
      .locator(".column-banner")
      .waitFor({ state: "visible" });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-lane-column-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-column-tab.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display standalone lane-column inspector with target driver options", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    // Select the standalone widget outside the grid container
    const standaloneWidget = page
      .locator(
        ".raceday-absolute-layout-root-wrapper > app-raceday-absolute-widget .widget-wrapper",
      )
      .first();
    await standaloneWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    const inspectorFields = page.locator("app-lane-column-inspector");
    await inspectorFields.waitFor({ state: "visible" });

    // Wait for Target Driver section to be visible
    const targetDriverTitle = inspectorPanel
      .locator(".inspector-group-title")
      .filter({ hasText: "Target Driver" });
    await targetDriverTitle.waitFor({ state: "visible" });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const fields = document.querySelector("app-lane-column-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-standalone.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display replicated lane grid on canvas in UI editor", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const previewContainer = page.locator(".raceday-preview-container").first();
    await previewContainer.waitFor({ state: "visible" });

    // Ensure lane column widgets have rendered on the canvas
    await page
      .locator("app-raceday-lane-column")
      .first()
      .waitFor({ state: "visible" });

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);

    await expect(previewContainer).toHaveScreenshot(
      "ui-editor-grid-canvas.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
      },
    );
  });

  test("should display replicated lane grid with top column headers on canvas", async ({
    page,
  }) => {
    const topWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      testWidgets,
      gridId,
      "top",
    );

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: topWidgets,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const previewContainer = page.locator(".raceday-preview-container").first();
    await previewContainer.waitFor({ state: "visible" });

    await page
      .locator(".raceday-grid-top-header")
      .first()
      .waitFor({ state: "visible" });
    await page
      .locator("app-raceday-lane-column")
      .first()
      .waitFor({ state: "visible" });

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);

    await expect(previewContainer).toHaveScreenshot(
      "ui-editor-grid-header-top.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
      },
    );
  });

  test("should display replicated lane grid with no column headers on canvas", async ({
    page,
  }) => {
    const topWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      testWidgets,
      gridId,
      "top",
    );
    const noneWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      topWidgets,
      gridId,
      "none",
    );

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: noneWidgets,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const previewContainer = page.locator(".raceday-preview-container").first();
    await previewContainer.waitFor({ state: "visible" });

    await page
      .locator("app-raceday-lane-column")
      .first()
      .waitFor({ state: "visible" });

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);

    await expect(previewContainer).toHaveScreenshot(
      "ui-editor-grid-header-none.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
      },
    );
  });

  test("should display replicated lane grid on canvas after changing header placement to none in inspector", async ({
    page,
  }) => {
    const topWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      testWidgets,
      gridId,
      "top",
    );

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: topWidgets,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const previewContainer = page.locator(".raceday-preview-container").first();
    await previewContainer.waitFor({ state: "visible" });

    // Select the first grid cell widget within the grid container
    const gridWidget = page
      .locator(".raceday-grid-scroll-content .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    // Scroll inspector so lane column fields are in view
    await page.evaluate(() => {
      const fields = document.querySelector("app-lane-column-inspector");
      fields?.scrollIntoView({ block: "start", inline: "nearest" });
    });

    // Open Header Placement select and choose none
    const placementSelect = inspectorPanel.locator(
      "app-custom-select:has(app-custom-option[value='individual'])",
    );
    await placementSelect.scrollIntoViewIfNeeded();
    await placementSelect.locator(".custom-select-trigger").click();

    const noneOption = placementSelect.locator(
      ".custom-select-dropdown .custom-select-option[data-value='none']",
    );
    await noneOption.waitFor({ state: "visible" });
    await noneOption.click();

    // Verify top header is detached
    await page
      .locator(".raceday-grid-top-header")
      .waitFor({ state: "detached" });

    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);

    await expect(previewContainer).toHaveScreenshot(
      "ui-editor-grid-header-switched-none.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
        maxDiffPixels: 10000,
      },
    );
  });

  test("should display grid inspector with top header placement options", async ({
    page,
  }) => {
    const topWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      testWidgets,
      gridId,
      "top",
    );

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: topWidgets,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const gridWidget = page
      .locator(".raceday-grid-scroll-content .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    await inspectorPanel
      .locator(".grid-indicator-card")
      .waitFor({ state: "visible" });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const el = document.querySelector(
        "app-lane-column-inspector app-custom-select:has(app-custom-option[value='individual'])",
      );
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-header-top-options.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display grid inspector with none header placement options", async ({
    page,
  }) => {
    const topWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      testWidgets,
      gridId,
      "top",
    );
    const noneWidgets = LaneGridHeaderHelper.updateGridHeaderPlacement(
      topWidgets,
      gridId,
      "none",
    );

    await TestSetupHelper.setupSettings(page, {
      columnEditorMinimized: true,
      columnEditorPositionX: 9999,
      columnEditorPositionY: 9999,
      layoutEditorMinimized: true,
      layoutEditorPositionX: 9999,
      layoutEditorPositionY: 9999,
      racedayLayout: {
        widgets: noneWidgets,
      },
    });

    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/ui-editor"),
    );
    await page.locator(".ue-container").waitFor({ state: "visible" });

    const gridWidget = page
      .locator(".raceday-grid-scroll-content .widget-wrapper")
      .first();
    await gridWidget.dispatchEvent("pointerdown");

    const inspectorPanel = page.locator(".widget-inspector-panel");
    await inspectorPanel.waitFor({ state: "visible" });

    await inspectorPanel
      .locator(".grid-indicator-card")
      .waitFor({ state: "visible" });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement)?.blur();
      const el = document.querySelector(
        "app-lane-column-inspector app-custom-select:has(app-custom-option[value='individual'])",
      );
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    await page.mouse.move(0, 0);

    await expect(inspectorPanel).toHaveScreenshot(
      "lane-column-inspector-header-none-options.png",
      {
        animations: "disabled",
      },
    );
  });
});
