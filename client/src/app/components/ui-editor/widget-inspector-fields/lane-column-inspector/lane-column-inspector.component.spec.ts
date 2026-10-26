import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { LaneColumnInspectorComponent } from "./lane-column-inspector.component";

describe("LaneColumnInspectorComponent", () => {
  let component: LaneColumnInspectorComponent;
  let fixture: ComponentFixture<LaneColumnInspectorComponent>;
  let mockWidget: AbsoluteWidgetNode;
  let mockSettings: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    mockSettings = {
      columnKey: "lastLapTime",
      bindingMode: "lane",
      targetIndex: 0,
      layoutOrientation: "vertical",
      showHeader: true,
      customLabel: "",
      headerFontFamily: "",
      headerFontSize: 14,
      headerTextColor: "",
      headerAlignment: "start",
      valueFontFamily: "",
      valueFontSize: 36,
      valueTextColor: "",
      valueAlignment: "center",
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
      useLaneColors: true,
      backgroundColor: "#1e293b",
      textColor: "#ffffff",
      showBorder: true,
      borderColor: "#334155",
      borderWidth: 1,
      borderRadius: 8,
    };

    mockWidget = {
      id: "lane-col-1",
      widgetType: "lane-column",
      x: 10,
      y: 10,
      width: 200,
      height: 120,
      zIndex: 10,
      customSettings: mockSettings,
    };

    await TestBed.configureTestingModule({
      imports: [LaneColumnInspectorComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: FontService, useValue: fontSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LaneColumnInspectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("settings", mockSettings);
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("availableColumns", [
      { key: "lastLapTime", label: "RD_LAST_LAP_TIME" },
      { key: "bestLapTime", label: "RD_BEST_LAP_TIME" },
    ]);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change on onFieldChange()", () => {
    spyOn(component.change, "emit");
    component.onFieldChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should toggle replicate modal on openReplicateModal and closeReplicateModal", () => {
    expect(component.showReplicateModal()).toBeFalse();
    component.openReplicateModal();
    expect(component.showReplicateModal()).toBeTrue();
    component.closeReplicateModal();
    expect(component.showReplicateModal()).toBeFalse();
  });

  it("should emit requestReplicate on openReplicateModal", () => {
    spyOn(component.requestReplicate, "emit");
    component.openReplicateModal();
    expect(component.requestReplicate.emit).toHaveBeenCalled();
  });

  it("should emit replicate options on onReplicateConfirm", () => {
    spyOn(component.replicate, "emit");
    component.openReplicateModal();
    expect(component.showReplicateModal()).toBeTrue();

    const options = {
      direction: "horizontal" as const,
      targetCount: 4,
      distributionMode: "auto-fit" as const,
      replaceExisting: true,
      sourceIndex: 0,
      sourceBindingMode: "lane" as const,
    };

    component.onReplicateConfirm(options);
    expect(component.showReplicateModal()).toBeFalse();
    expect(component.replicate.emit).toHaveBeenCalledWith(options);
  });

  it("should have anti-autofill attributes on custom label text input", () => {
    fixture.detectChanges();
    const labelInput = fixture.debugElement.query(
      By.css("input.inspector-input"),
    );
    expect(labelInput).toBeTruthy();
    const attrs = labelInput.nativeElement;
    expect(attrs.getAttribute("autocomplete")).toBe("off");
    expect(attrs.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(attrs.getAttribute("data-1p-ignore")).toBe("true");
    expect(attrs.getAttribute("data-lpignore")).toBe("true");
    expect(attrs.getAttribute("data-bwignore")).toBe("true");
    expect(attrs.getAttribute("data-form-type")).toBe("other");
  });

  it("should render color inputs when useLaneColors is false", () => {
    mockSettings.useLaneColors = false;
    fixture.detectChanges();

    const colorInputs = fixture.debugElement.queryAll(
      By.css("input.inspector-color-input"),
    );
    expect(colorInputs.length).toBeGreaterThanOrEqual(2);
  });

  it("should validate and sanitize color values with toValidHexColor", () => {
    expect(component.toValidHexColor("#123456", "#ffffff")).toBe("#123456");
    expect(component.toValidHexColor("#ABCDEF", "#ffffff")).toBe("#ABCDEF");
    expect(component.toValidHexColor("#f00", "#000000")).toBe("#ff0000");
    expect(component.toValidHexColor("", "#ffffff")).toBe("#ffffff");
    expect(component.toValidHexColor(undefined, "#112233")).toBe("#112233");
    expect(component.toValidHexColor(null, "#223344")).toBe("#223344");
    expect(component.toValidHexColor("rgba(15, 23, 42, 0.85)", "#0f172a")).toBe(
      "#0f172a",
    );
    expect(component.toValidHexColor("invalid-color", "#ffffff")).toBe(
      "#ffffff",
    );
  });

  it("should ensure color inputs never receive empty strings even if settings are empty", () => {
    mockSettings.useLaneColors = false;
    mockSettings.backgroundColor = "";
    mockSettings.textColor = "";
    fixture.detectChanges();

    const colorInputs = fixture.debugElement.queryAll(
      By.css("input.inspector-color-input"),
    );
    expect(colorInputs.length).toBeGreaterThanOrEqual(2);
    expect(colorInputs[0].nativeElement.value).toBe("#000000");
    expect(colorInputs[1].nativeElement.value).toBe("#ffffff");
  });

  it("should set default black background and white text when unchecking useLaneColors", () => {
    const changeSpy = spyOn(component.change, "emit");
    mockSettings.useLaneColors = false;
    mockSettings.backgroundColor = "";
    mockSettings.textColor = "";

    component.onUseLaneColorsChange();

    expect(mockSettings.backgroundColor).toBe("#000000");
    expect(mockSettings.textColor).toBe("#ffffff");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should fix both black text and background to white text when unchecking useLaneColors", () => {
    const changeSpy = spyOn(component.change, "emit");
    mockSettings.useLaneColors = false;
    mockSettings.backgroundColor = "#000000";
    mockSettings.textColor = "#000000";

    component.onUseLaneColorsChange();

    expect(mockSettings.backgroundColor).toBe("#000000");
    expect(mockSettings.textColor).toBe("#ffffff");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should emit change when re-checking useLaneColors", () => {
    const changeSpy = spyOn(component.change, "emit");
    mockSettings.useLaneColors = true;

    component.onUseLaneColorsChange();

    expect(changeSpy).toHaveBeenCalled();
  });

  it("should format target lane options with 1-based lane numbers", () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "UE_INSPECTOR_LANE_INDEX") {
          return `Lane ${params?.index}`;
        }
        return key;
      },
    );
    mockSettings.bindingMode = "lane";
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.css("app-custom-option"));
    const optionTexts = options.map((opt) =>
      opt.nativeElement.textContent.trim(),
    );
    expect(optionTexts).toContain("Lane 1");
    expect(optionTexts).toContain("Lane 2");
    expect(optionTexts).toContain("Lane 8");
    expect(optionTexts).not.toContain("Lane 0");
    expect(optionTexts).not.toContain("Lane {index}");
  });

  it("should format target position options with 1-based position numbers", () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "UE_INSPECTOR_POSITION_INDEX") {
          return `Position ${params?.index}`;
        }
        return key;
      },
    );
    mockSettings.bindingMode = "position";
    fixture.detectChanges();

    const options = fixture.debugElement.queryAll(By.css("app-custom-option"));
    const optionTexts = options.map((opt) =>
      opt.nativeElement.textContent.trim(),
    );
    expect(optionTexts).toContain("Position 1");
    expect(optionTexts).toContain("Position 2");
    expect(optionTexts).toContain("Position 8");
    expect(optionTexts).not.toContain("Position 0");
    expect(optionTexts).not.toContain("Position {index}");
  });

  it("should display grid indicator card when widget has gridId", () => {
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-12345",
      gridLane: 0,
      gridTotalLanes: 4,
    });
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css(".grid-indicator-card"));
    expect(card).toBeTruthy();

    const editBtn = fixture.debugElement.query(By.css(".grid-edit-btn"));
    expect(editBtn).toBeNull();

    spyOn(component.editGrid, "emit");
    component.onEditGridTemplate();
    expect(component.editGrid.emit).toHaveBeenCalledWith("grid-12345");

    spyOn(component.detachGrid, "emit");
    const detachBtn = fixture.debugElement.query(By.css(".grid-detach-btn"));
    expect(detachBtn).toBeTruthy();
    detachBtn.triggerEventHandler("click", null);
    expect(component.detachGrid.emit).toHaveBeenCalledWith("grid-12345");

    spyOn(component.bringGridToFront, "emit");
    const bringFrontBtn = fixture.debugElement.query(
      By.css(".grid-bring-front-btn"),
    );
    expect(bringFrontBtn).toBeTruthy();
    bringFrontBtn.triggerEventHandler("click", null);
    expect(component.bringGridToFront.emit).toHaveBeenCalledWith("grid-12345");

    spyOn(component.deleteGrid, "emit");
    const deleteBtn = fixture.debugElement.query(By.css(".grid-delete-btn"));
    expect(deleteBtn).toBeTruthy();
    deleteBtn.triggerEventHandler("click", null);
    expect(component.deleteGrid.emit).toHaveBeenCalledWith("grid-12345");
  });

  it("should not display grid indicator card when widget does not have gridId", () => {
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
    });
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css(".grid-indicator-card"));
    expect(card).toBeNull();
  });

  it("should provide scope breadcrumbs and switch scope between grid, column, and cell", () => {
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-12345",
      gridLane: 0,
      gridTotalLanes: 4,
      customLabel: "Driver",
    });
    fixture.detectChanges();

    expect(component.activeScope()).toBe("grid");
    expect(component.widgetBreadcrumbLabel).toBeTruthy();
    expect(component.gridBreadcrumbLabel).toBe("Grid (4 Lanes)");
    expect(component.columnBreadcrumbLabel).toBe("Driver");
    expect(component.cellBreadcrumbLabel).toBe("Lane 1");

    const scopeNav = fixture.debugElement.query(By.css(".grid-scope-nav"));
    expect(scopeNav).toBeTruthy();

    const breadcrumbs = fixture.debugElement.queryAll(
      By.css(".breadcrumb-btn"),
    );
    expect(breadcrumbs.length).toBe(3);

    // Switch to widget scope
    component.setScope("widget");
    fixture.detectChanges();
    expect(component.activeScope()).toBe("widget");
    const widgetBanner = fixture.debugElement.query(By.css(".widget-banner"));
    expect(widgetBanner).toBeTruthy();

    // Switch to column scope
    component.setScope("column");
    fixture.detectChanges();
    expect(component.activeScope()).toBe("column");
    const columnBanner = fixture.debugElement.query(By.css(".column-banner"));
    expect(columnBanner).toBeTruthy();

    // Switch to inset scope
    fixture.componentRef.setInput("selectedAnchor", "top-left");
    fixture.detectChanges();
    expect(component.activeScope()).toBe("inset");
    const scopeTabs = fixture.debugElement.queryAll(By.css(".scope-tab"));
    expect(scopeTabs.length).toBe(4);
    const insetTab = scopeTabs[3];
    expect(insetTab.nativeElement.getAttribute("title")).toBe(
      "UE_SCOPE_TAB_INSET",
    );
  });

  it("should compute breadcrumb labels correctly for position and header widgets", () => {
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      bindingMode: "position",
      targetIndex: 2,
      gridTotalLanes: 6,
      columnKey: "lastLapTime",
      isHeaderWidget: false,
    });
    fixture.detectChanges();

    expect(component.gridBreadcrumbLabel).toBe("Grid (6 Pos)");
    expect(component.columnBreadcrumbLabel).toBe("RD_LAST_LAP_TIME");
    expect(component.cellBreadcrumbLabel).toBe("Pos 3");

    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      isHeaderWidget: true,
      customLabel: "My Header",
    });
    fixture.detectChanges();
    expect(component.cellBreadcrumbLabel).toBe("Header");
    expect(component.columnBreadcrumbLabel).toBe("My Header");
  });

  it("should localize columnBreadcrumbLabel using translationService for RD_COL_NAME", () => {
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "RD_COL_NAME") return "Driver Name";
      return key;
    });
    fixture.componentRef.setInput("availableColumns", [
      { key: "driver.name", label: "RD_COL_NAME" },
    ]);
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      columnKey: "driver.name",
      customLabel: "",
    });
    fixture.detectChanges();

    expect(component.columnBreadcrumbLabel).toBe("Driver Name");
  });

  it("should correctly identify isMasterCell and display master or mirrored badge", () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "UE_GRID_POSITION_MASTER_BADGE")
          return "Position 1 (Master)";
        if (key === "UE_GRID_POSITION_MIRRORED_BADGE")
          return `Position ${params?.index} (Mirrored)`;
        if (key === "UE_GRID_LANE_MASTER_BADGE") return "Lane 1 (Master)";
        return key;
      },
    );

    // Master position cell (targetIndex: 0)
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      bindingMode: "position",
      targetIndex: 0,
      isHeaderWidget: false,
    });
    fixture.detectChanges();
    expect(component.isMasterCell).toBeTrue();
    const badge = fixture.debugElement.query(By.css(".grid-card-badge"));
    expect(badge.nativeElement.textContent.trim()).toBe("Position 1 (Master)");

    // Mirrored position cell (targetIndex: 1)
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      bindingMode: "position",
      targetIndex: 1,
      isHeaderWidget: false,
    });
    fixture.detectChanges();
    expect(component.isMasterCell).toBeFalse();
    expect(badge.nativeElement.textContent.trim()).toBe(
      "Position 2 (Mirrored)",
    );

    // Master lane cell (gridLane: 0)
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-lane",
      bindingMode: "lane",
      gridLane: 0,
      isHeaderWidget: false,
    });
    fixture.detectChanges();
    expect(component.isMasterCell).toBeTrue();
    expect(badge.nativeElement.textContent.trim()).toBe("Lane 1 (Master)");

    // Header widget is not master cell
    fixture.componentRef.setInput("settings", {
      ...mockSettings,
      gridId: "grid-pos",
      targetIndex: 0,
      isHeaderWidget: true,
    });
    fixture.detectChanges();
    expect(component.isMasterCell).toBeFalse();
  });

  it("should get and set anchor values in settings.insets and emit change", () => {
    spyOn(component.change, "emit");

    expect(component.getAnchorValue("top-left")).toBe("");

    component.setAnchorValue("top-left", "driver.nickname");
    expect(component.getAnchorValue("top-left")).toBe("driver.nickname");
    expect(component.currentSettings.insets["top-left"]).toBe(
      "driver.nickname",
    );
    expect(component.change.emit).toHaveBeenCalled();

    // Deleting value when empty string is passed
    component.setAnchorValue("top-left", "");
    expect(component.getAnchorValue("top-left")).toBe("");
    expect(component.currentSettings.insets["top-left"]).toBeUndefined();
  });

  it("should reset inset text color override and emit change", () => {
    spyOn(component.change, "emit");
    component.currentSettings.insetTextColor = "#ff0000";

    component.resetInsetTextColor();
    expect(component.currentSettings.insetTextColor).toBeUndefined();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should render 8 anchor position options with UE_INSPECTOR_INSET_NONE", () => {
    fixture.detectChanges();
    expect(component.ANCHOR_POSITIONS.length).toBe(8);

    const anchorKeys = component.ANCHOR_POSITIONS.map((p) => p.key);
    expect(anchorKeys).toEqual([
      "top-left",
      "top-center",
      "top-right",
      "center-left",
      "center-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ]);
  });

  it("should provide extended availableIndices for overallPosition and seed modes", () => {
    mockSettings.bindingMode = "overallPosition";
    expect(component.availableIndices.length).toBe(16);

    mockSettings.bindingMode = "seed";
    expect(component.availableIndices.length).toBe(16);

    mockSettings.bindingMode = "lane";
    expect(component.availableIndices.length).toBe(8);

    mockSettings.bindingMode = "position";
    expect(component.availableIndices.length).toBe(8);
  });

  describe("Decimal place selectors", () => {
    it("should correctly identify time columns via isTimeColumn", () => {
      mockSettings.columnKey = "lastLapTime";
      expect(component.isTimeColumn).toBeTrue();

      mockSettings.columnKey = "bestLapTime";
      expect(component.isTimeColumn).toBeTrue();

      mockSettings.columnKey = "gapLeader";
      expect(component.isTimeColumn).toBeTrue();

      mockSettings.columnKey = "totalTime";
      expect(component.isTimeColumn).toBeTrue();

      mockSettings.columnKey = "ghostPacingLeaderAvg";
      expect(component.isTimeColumn).toBeTrue();

      mockSettings.columnKey = "lapCount";
      expect(component.isTimeColumn).toBeFalse();

      mockSettings.columnKey = "driver.name";
      expect(component.isTimeColumn).toBeFalse();

      mockSettings.columnKey = "";
      expect(component.isTimeColumn).toBeFalse();
    });

    it("should correctly identify gap columns and manage gapTarget and gapMode", () => {
      mockSettings.columnKey = "gap";
      expect(component.isGapColumn).toBeTrue();
      expect(component.isTimeColumn).toBeTrue();
      expect(component.isLapColumn).toBeFalse();

      component.gapMode = "always_laps";
      expect(component.isLapColumn).toBeTrue();
      expect(component.isTimeColumn).toBeFalse();

      component.gapTarget = "position";
      expect(mockSettings.gapTarget).toBe("position");
      expect(component.gapTarget).toBe("position");

      mockSettings.columnKey = "overallGap";
      expect(component.isGapColumn).toBeTrue();

      // Legacy gapLeader key should normalize to gap with leader target and always_time mode
      mockSettings.columnKey = "gapLeader";
      delete mockSettings.gapTarget;
      delete mockSettings.gapMode;
      expect(component.isGapColumn).toBeTrue();
      expect(component.gapTarget).toBe("leader");
      expect(component.gapMode).toBe("always_time");
      expect(mockSettings.columnKey).toBe("gap");

      // Legacy gapPositionF1 key should normalize to gap with position target and laps_and_time mode
      mockSettings.columnKey = "gapPositionF1";
      delete mockSettings.gapTarget;
      delete mockSettings.gapMode;
      expect(component.isGapColumn).toBeTrue();
      expect(component.gapTarget).toBe("position");
      expect(component.gapMode).toBe("laps_and_time");
      expect(mockSettings.columnKey).toBe("gap");
    });

    it("should render gap calculation mode options including laps_and_time", async () => {
      mockSettings.columnKey = "gap";
      fixture.detectChanges();
      await fixture.whenStable();

      const options =
        fixture.nativeElement.querySelectorAll("app-custom-option");
      const optionValues = Array.from(options).map((opt: any) =>
        opt.getAttribute("value"),
      );
      expect(optionValues).toContain("always_time");
      expect(optionValues).toContain("laps_and_time");
      expect(optionValues).toContain("always_laps");
    });

    it("should correctly identify lastLaps column and manage lastLapsCount", () => {
      mockSettings.columnKey = "driver";
      expect(component.isLastLapsColumn).toBeFalse();

      mockSettings.columnKey = "lastLaps";
      expect(component.isLastLapsColumn).toBeTrue();
      expect(component.lastLapsCount).toBe(5);

      component.lastLapsCount = 10;
      expect(mockSettings.lastLapsCount).toBe(10);
      expect(component.lastLapsCount).toBe(10);

      // Handle invalid or zero values gracefully with default 5
      component.lastLapsCount = 0;
      expect(component.lastLapsCount).toBe(5);

      component.lastLapsCount = -3;
      expect(component.lastLapsCount).toBe(5);

      component.lastLapsCount = NaN as any;
      expect(component.lastLapsCount).toBe(5);
    });

    it("should render last laps configuration section with slider and number input when isLastLapsColumn is true", async () => {
      mockSettings.columnKey = "lastLaps";
      mockSettings.lastLapsCount = 7;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const lastLapsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes("UE_INSPECTOR_LAST_LAPS_SECTION"),
      );
      expect(lastLapsTitle).toBeTruthy();

      const slider = fixture.debugElement.query(
        By.css('input[type="range"][min="1"][max="20"]'),
      );
      const numberInput = fixture.debugElement.query(
        By.css('input[type="number"][min="1"][max="50"]'),
      );
      expect(slider).toBeTruthy();
      expect(numberInput).toBeTruthy();
      expect(slider.nativeElement.value).toBe("7");
      expect(numberInput.nativeElement.value).toBe("7");
    });

    it("should handle inset gap column configuration including legacy keys", () => {
      mockSettings.insets = {};
      expect(component.isInsetGapColumn("top-right")).toBeFalse();
      mockSettings.insets["top-right"] = "gap";
      expect(component.isInsetGapColumn("top-right")).toBeTrue();

      component.setInsetGapTarget("top-right", "position");
      expect(component.getInsetGapTarget("top-right")).toBe("position");

      component.setInsetGapMode("top-right", "always_laps");
      expect(component.getInsetGapMode("top-right")).toBe("always_laps");
      expect(component.isInsetLapColumn("top-right")).toBeTrue();
      expect(component.isInsetTimeColumn("top-right")).toBeFalse();

      // Legacy inset key
      mockSettings.insets["bottom-right"] = "gapLeader";
      delete mockSettings.insetsConfig?.["bottom-right"];
      expect(component.isInsetGapColumn("bottom-right")).toBeTrue();
      expect(component.getInsetGapTarget("bottom-right")).toBe("leader");
      expect(component.getInsetGapMode("bottom-right")).toBe("always_time");
    });

    it("should display only time decimals selector with options [0, 3] when column is time data", () => {
      mockSettings.columnKey = "lastLapTime";
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      // Inspect sections before the insets title (main value settings)
      const mainSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );

      const mainTimeDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_TIME_DECIMALS",
        );
      });
      const mainLapDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_LAP_DECIMALS",
        );
      });

      expect(mainTimeDecSection).toBeTruthy();
      expect(mainLapDecSection).toBeFalsy();

      // Check options in the main time decimal select
      const options = mainTimeDecSection!.queryAll(By.css("app-custom-option"));
      const optionValues = options.map((opt) => opt.componentInstance.value());
      expect(optionValues).toEqual([0, 1, 2, 3]);
    });

    it("should display only lap decimals selector with options [0, 3] when column is not time data", () => {
      mockSettings.columnKey = "lapCount";
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const mainSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );

      const mainTimeDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_TIME_DECIMALS",
        );
      });
      const mainLapDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_LAP_DECIMALS",
        );
      });

      expect(mainTimeDecSection).toBeFalsy();
      expect(mainLapDecSection).toBeTruthy();

      // Check options in the main lap decimal select
      const options = mainLapDecSection!.queryAll(By.css("app-custom-option"));
      const optionValues = options.map((opt) => opt.componentInstance.value());
      expect(optionValues).toEqual([0, 1, 2, 3]);
    });

    it("should keep both inset time and lap decimal selectors with options [0, 3] when corresponding insets are set", () => {
      mockSettings.columnKey = "lastLapTime";
      mockSettings.insets = {
        "top-left": "lastLapTime",
        "bottom-right": "lapCount",
      };
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const insetSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_PRECEDING,
        );

      const insetTimeDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_TIME_DECIMALS",
        );
      });
      const insetLapDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_LAP_DECIMALS",
        );
      });

      expect(insetTimeDecSection).toBeTruthy();
      expect(insetLapDecSection).toBeTruthy();

      const timeOptions = insetTimeDecSection!.queryAll(
        By.css("app-custom-option"),
      );
      expect(timeOptions.map((opt) => opt.componentInstance.value())).toEqual([
        0, 1, 2, 3,
      ]);

      const lapOptions = insetLapDecSection!.queryAll(
        By.css("app-custom-option"),
      );
      expect(lapOptions.map((opt) => opt.componentInstance.value())).toEqual([
        0, 1, 2, 3,
      ]);
    });

    it("should not display decimal selectors for non-numeric columns like driver.name or rankHeat", () => {
      mockSettings.columnKey = "driver.name";
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const mainSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );

      const mainTimeDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_TIME_DECIMALS",
        );
      });
      const mainLapDecSection = mainSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_LAP_DECIMALS",
        );
      });

      expect(mainTimeDecSection).toBeFalsy();
      expect(mainLapDecSection).toBeFalsy();
    });

    it("should not display inset typography, color, or decimal selectors when no insets are configured", () => {
      mockSettings.columnKey = "lastLapTime";
      mockSettings.insets = {};
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const insetSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_PRECEDING,
        );

      const insetTimeDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_TIME_DECIMALS",
        );
      });
      const insetLapDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_LAP_DECIMALS",
        );
      });
      const insetFontFamily = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_FONT_FAMILY",
        );
      });

      expect(insetTimeDecSection).toBeFalsy();
      expect(insetLapDecSection).toBeFalsy();
      expect(insetFontFamily).toBeFalsy();
    });

    it("should hide typography and text color controls for image columns", () => {
      mockSettings.columnKey = "driver.avatarUrl";
      mockSettings.useLaneColors = false;
      fixture.detectChanges();

      expect(component.isImageColumn).toBeTrue();

      const labels = fixture.debugElement
        .queryAll(By.css(".inspector-label"))
        .map((l) => l.nativeElement.textContent.trim());

      expect(
        labels.some((l) => l.includes("UE_INSPECTOR_VALUE_FONT_FAMILY")),
      ).toBeFalse();
      expect(
        labels.some((l) => l.includes("UE_INSPECTOR_VALUE_FONT_SIZE")),
      ).toBeFalse();
      expect(
        labels.some((l) => l.includes("UE_INSPECTOR_VALUE_ALIGNMENT")),
      ).toBeFalse();
      expect(
        labels.some((l) => l.includes("UE_INSPECTOR_TEXT_COLOR")),
      ).toBeFalse();
      expect(
        labels.some((l) => l.includes("UE_INSPECTOR_BACKGROUND_COLOR")),
      ).toBeTrue();
    });

    it("should display only inset time decimals when only time insets are configured", () => {
      mockSettings.columnKey = "lastLapTime";
      mockSettings.insets = { "top-left": "lastLapTime" };
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const insetSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_PRECEDING,
        );

      const insetTimeDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_TIME_DECIMALS",
        );
      });
      const insetLapDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_LAP_DECIMALS",
        );
      });

      expect(insetTimeDecSection).toBeTruthy();
      expect(insetLapDecSection).toBeFalsy();
    });

    it("should display only inset lap decimals when only lap insets are configured", () => {
      mockSettings.columnKey = "lastLapTime";
      mockSettings.insets = { "top-left": "lapCount" };
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const insetsTitle = titles.find((t) =>
        t.nativeElement.textContent.includes(
          "UE_INSPECTOR_LANE_VIEW_INSET_DATA_SECTION",
        ),
      )!;

      const insetSections = fixture.debugElement
        .queryAll(By.css(".inspector-section"))
        .filter(
          (s) =>
            s.nativeElement.compareDocumentPosition(insetsTitle.nativeElement) &
            Node.DOCUMENT_POSITION_PRECEDING,
        );

      const insetTimeDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_TIME_DECIMALS",
        );
      });
      const insetLapDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_INSET_LAP_DECIMALS",
        );
      });

      expect(insetTimeDecSection).toBeFalsy();
      expect(insetLapDecSection).toBeTruthy();
    });

    it("should clamp decimal values to [0, 3] on onFieldChange", () => {
      spyOn(component.change, "emit");

      mockSettings.timeDecimalPlaces = 5;
      mockSettings.lapDecimalPlaces = -1;
      mockSettings.insetTimeDecimalPlaces = 4;
      mockSettings.insetLapDecimalPlaces = 99;

      component.onFieldChange();

      expect(mockSettings.timeDecimalPlaces).toBe(3);
      expect(mockSettings.lapDecimalPlaces).toBe(0);
      expect(mockSettings.insetTimeDecimalPlaces).toBe(3);
      expect(mockSettings.insetLapDecimalPlaces).toBe(3);
      expect(component.change.emit).toHaveBeenCalled();
    });
  });

  describe("Title Bar Settings", () => {
    it("should render the Title Bar Settings title and showHeader checkbox", () => {
      fixture.detectChanges();
      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const titleBarTitle = titles.find((t) =>
        t.nativeElement.textContent.includes("UE_INSPECTOR_TITLE_BAR_SETTINGS"),
      );
      expect(titleBarTitle).toBeTruthy();

      const showHeaderCheckbox = fixture.debugElement.query(
        By.css(".form-checkbox"),
      );
      expect(showHeaderCheckbox).toBeTruthy();
    });

    it("should hide title bar controls when showHeader is false", () => {
      mockSettings.showHeader = false;
      fixture.detectChanges();

      const customLabelInput = fixture.debugElement.query(
        By.css('input[placeholder="UE_INSPECTOR_LABEL_PLACEHOLDER"]'),
      );
      expect(customLabelInput).toBeNull();
    });

    it("should show title bar controls when showHeader is true", () => {
      mockSettings.showHeader = true;
      fixture.detectChanges();

      const customLabelInput = fixture.debugElement.query(
        By.css('input[placeholder="UE_INSPECTOR_LABEL_PLACEHOLDER"]'),
      );
      expect(customLabelInput).toBeTruthy();
    });

    it("should update header colors on onColorChange and emit change", () => {
      spyOn(component.change, "emit");
      const eventText = { target: { value: "#123456" } } as any;
      component.onColorChange("headerTextColor", eventText);
      expect(component.currentSettings["headerTextColor"]).toBe("#123456");
      expect(component.currentSettings["_syncAction"]).toBe("header");
      expect(component.change.emit).toHaveBeenCalled();

      const eventBg = { target: { value: "#654321" } } as any;
      component.onColorChange("headerBackgroundColor", eventBg);
      expect(component.currentSettings["headerBackgroundColor"]).toBe(
        "#654321",
      );
      expect(component.currentSettings["_syncAction"]).toBe("header");
    });

    it("should reset header text color on resetHeaderTextColor", () => {
      spyOn(component.change, "emit");
      component.currentSettings["headerTextColor"] = "#ff0000";
      component.resetHeaderTextColor();
      expect(component.currentSettings["headerTextColor"]).toBeFalsy();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should reset header background color on resetHeaderBackgroundColor", () => {
      spyOn(component.change, "emit");
      component.currentSettings["headerBackgroundColor"] = "#00ff00";
      component.resetHeaderBackgroundColor();
      expect(component.currentSettings["headerBackgroundColor"]).toBeFalsy();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should set _syncAction = 'header' even when linkColumns is false", () => {
      component.currentSettings["linkColumns"] = false;
      const eventText = { target: { value: "#333333" } } as any;
      component.onColorChange("headerTextColor", eventText);
      expect(component.currentSettings["_syncAction"]).toBe("header");

      component.currentSettings["_syncAction"] = null;
      component.resetHeaderTextColor();
      expect(component.currentSettings["_syncAction"]).toBe("header");

      component.currentSettings["_syncAction"] = null;
      component.onHeaderStyleChange();
      expect(component.currentSettings["_syncAction"]).toBe("header");
    });
  });

  describe("isLapColumn", () => {
    it("should return true for isLapColumn when columnKey is lapCount, overallLapCount, totalLaps, heatTotalLaps, raceTotalLaps, or overallTotalLaps", () => {
      component.currentSettings["columnKey"] = "lapCount";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "overallLapCount";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "totalLaps";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "heatTotalLaps";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "raceTotalLaps";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "overallTotalLaps";
      expect(component.isLapColumn).toBeTrue();

      component.currentSettings["columnKey"] = "lastLapTime";
      expect(component.isLapColumn).toBeFalse();
    });

    it("should render lapDecimalPlaces when column is lapCount", () => {
      mockSettings.columnKey = "lapCount";
      fixture.detectChanges();

      expect(component.isLapColumn).toBeTrue();
    });
  });

  describe("Timer formatting options for totalTime and overallTotalTime", () => {
    it("should identify total time columns correctly", () => {
      mockSettings.columnKey = "totalTime";
      expect(component.isTotalTimeColumn).toBeTrue();

      mockSettings.columnKey = "overallTotalTime";
      expect(component.isTotalTimeColumn).toBeTrue();

      mockSettings.columnKey = "lastLapTime";
      expect(component.isTotalTimeColumn).toBeFalse();
    });

    it("should render timer display format dropdown, subsecond mode, and live preview for totalTime", () => {
      mockSettings.columnKey = "totalTime";
      mockSettings.timeDisplayFormat = "dynamic";
      mockSettings.timeSubsecondMode = "threshold";
      mockSettings.timeSubsecondThreshold = 10;
      mockSettings.timeSubsecondDecimals = 2;
      fixture.detectChanges();

      const previewGrid = fixture.nativeElement.querySelector(
        ".timer-preview-grid",
      );
      expect(previewGrid).toBeTruthy();

      const previewItems = fixture.nativeElement.querySelectorAll(
        ".timer-preview-item",
      );
      expect(previewItems.length).toBe(4);
    });

    it("should compute correct preview values", () => {
      mockSettings.columnKey = "totalTime";
      mockSettings.timeDisplayFormat = "dynamic";
      mockSettings.timeSubsecondMode = "threshold";
      mockSettings.timeSubsecondThreshold = 10;
      mockSettings.timeSubsecondDecimals = 2;

      expect(component.getPreview(3665)).toBe("1:01:05");
      expect(component.getPreview(75)).toBe("1:15");
      expect(component.getPreview(45)).toBe("45");
      expect(component.getPreview(8.45)).toBe("8.45");
    });

    it("should default to never subsecond mode when timeSubsecondMode is unset", () => {
      mockSettings.columnKey = "totalTime";
      mockSettings.timeDisplayFormat = "hh_mm_ss";
      delete mockSettings.timeSubsecondMode;

      expect(component.getPreview(8.45)).toBe("00:00:08");
    });

    it("should clamp subsecond threshold and decimals in onFieldChange", () => {
      spyOn(component.change, "emit");
      mockSettings.columnKey = "totalTime";
      mockSettings.timeSubsecondThreshold = -5;
      mockSettings.timeSubsecondDecimals = 5;

      component.onFieldChange();

      expect(mockSettings.timeSubsecondThreshold).toBe(0);
      expect(mockSettings.timeSubsecondDecimals).toBe(3);
      expect(component.change.emit).toHaveBeenCalled();
    });
  });

  describe("Header widget, highlightRowOnLap, and Grid group manipulation options", () => {
    it("should detect isHeaderWidget correctly and toggle highlightRowOnLap", () => {
      expect(component.isHeaderWidget).toBeFalse();
      mockSettings.isHeaderWidget = true;
      expect(component.isHeaderWidget).toBeTrue();

      mockSettings.highlightRowOnLap = true;
      expect(component.highlightRowOnLap).toBeTrue();
      component.highlightRowOnLap = false;
      expect(mockSettings.highlightRowOnLap).toBeFalse();
      expect(component.highlightRowOnLap).toBeFalse();
      expect(component.highlightLapStyle).toBe("none");

      component.highlightLapStyle = "glow-border";
      expect(mockSettings.highlightLapStyle).toBe("glow-border");
      expect(component.highlightLapStyle).toBe("glow-border");
      expect(component.highlightRowOnLap).toBeTrue();

      component.highlightLapStyle = "none";
      expect(mockSettings.highlightLapStyle).toBe("none");
      expect(component.highlightRowOnLap).toBeFalse();

      component.highlightRowOnLap = true;
      expect(component.highlightRowOnLap).toBeTrue();
      expect(component.highlightLapStyle).toBe("shimmer");
    });

    it("should handle linkColumns getter and setter with _linkColumnsChanged flag", () => {
      spyOn(component.change, "emit");
      expect(component.linkColumns).toBeTrue();

      component.linkColumns = false;
      expect(mockSettings.linkColumns).toBeFalse();
      expect(mockSettings._linkColumnsChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should handle gridType getter and setter with _gridTypeChanged flag", () => {
      spyOn(component.change, "emit");
      expect(component.gridType).toBe("heat");

      component.gridType = "overall";
      expect(mockSettings.gridType).toBe("overall");
      expect(mockSettings._gridTypeChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should handle gridSortOrder getter and setter with _gridSortOrderChanged flag", () => {
      spyOn(component.change, "emit");
      expect(component.gridSortOrder).toBe("lane");

      component.gridSortOrder = "position";
      expect(mockSettings.bindingMode).toBe("position");
      expect(mockSettings._gridSortOrderChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should handle sortByBindingMode getter and setter with _sortByBindingModeChanged flag", () => {
      spyOn(component.change, "emit");
      expect(component.sortByBindingMode).toBeTrue();

      component.sortByBindingMode = false;
      expect(mockSettings.sortByBindingMode).toBeFalse();
      expect(mockSettings._sortByBindingModeChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should handle gridHeaderPlacement and gridHeaderHeight updates", () => {
      spyOn(component.change, "emit");
      expect(component.gridHeaderPlacement).toBe("individual");
      expect(component.currentGridHeaderHeight).toBe(36);

      component.onGridHeaderPlacementChange("top");
      expect(mockSettings.headerPlacement).toBe("top");
      expect(mockSettings._headerPlacementChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();

      component.onGridHeaderHeightChange(45);
      expect(mockSettings.headerHeight).toBe(45);
      expect(mockSettings._headerHeightChanged).toBeTrue();

      // Should clamp between 20 and 200
      component.onGridHeaderHeightChange(10);
      expect(mockSettings.headerHeight).toBe(20);
      component.onGridHeaderHeightChange(250);
      expect(mockSettings.headerHeight).toBe(200);
    });

    it("should trigger group sync actions and set _syncAction", () => {
      spyOn(component.change, "emit");

      component.applyHeaderStyleToAll();
      expect(mockSettings._syncAction).toBe("header");
      expect(mockSettings._forceAllColumns).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();

      component.applyValueStyleToAll();
      expect(mockSettings._syncAction).toBe("value");
      expect(mockSettings._forceAllColumns).toBeTrue();

      component.applyBorderStyleToAll();
      expect(mockSettings._syncAction).toBe("border");
      expect(mockSettings._forceAllColumns).toBeTrue();

      component.applyTimeFormatToAll();
      expect(mockSettings._syncAction).toBe("time");
      expect(mockSettings._forceAllColumns).toBeTrue();

      component.applyHighlightStyleToAll();
      expect(mockSettings._syncAction).toBe("highlight");
      expect(mockSettings._forceAllColumns).toBeTrue();

      component.gridHighlightLapStyle = "glow-border";
      expect(mockSettings.highlightLapStyle).toBe("glow-border");
      expect(mockSettings._syncAction).toBe("highlight");
      expect(mockSettings._forceAllColumns).toBeTrue();
      expect(component.gridHighlightLapStyle).toBe("glow-border");

      component.resetColor("textColor");
      expect(mockSettings._syncAction).toBe("value");
      expect(mockSettings._reset_textColor).toBeTrue();
    });

    it("should handle grid header font family, font size, colors, alignment, and resets", () => {
      spyOn(component.change, "emit");
      mockSettings.linkColumns = true;

      // Font Family
      component.gridHeaderFontFamily = "Roboto";
      expect(mockSettings.headerFontFamily).toBe("Roboto");
      expect(mockSettings._syncAction).toBe("header");
      expect(component.gridHeaderFontFamily).toBe("Roboto");

      // Font Size with clamping
      component.gridHeaderFontSize = 24;
      expect(mockSettings.headerFontSize).toBe(24);
      expect(component.gridHeaderFontSize).toBe(24);
      component.gridHeaderFontSize = 4;
      expect(mockSettings.headerFontSize).toBe(8);
      component.gridHeaderFontSize = 100;
      expect(mockSettings.headerFontSize).toBe(72);

      // Alignment
      component.gridHeaderAlignment = "end";
      expect(mockSettings.headerAlignment).toBe("end");
      expect(component.gridHeaderAlignment).toBe("end");

      // Text color & reset
      const fakeTextEvent = { target: { value: "#123456" } } as any;
      component.onGridHeaderTextColorChange(fakeTextEvent);
      expect(mockSettings.headerTextColor).toBe("#123456");
      expect(component.gridHeaderTextColor).toBe("#123456");
      component.resetGridHeaderTextColor();
      expect(mockSettings.headerTextColor).toBeUndefined();
      expect(mockSettings._reset_headerTextColor).toBeTrue();
      expect(mockSettings._syncAction).toBe("header");

      // Background color & reset
      const fakeBgEvent = { target: { value: "#abcdef" } } as any;
      component.onGridHeaderBgColorChange(fakeBgEvent);
      expect(mockSettings.headerBackgroundColor).toBe("#abcdef");
      expect(component.gridHeaderBackgroundColor).toBe("#abcdef");
      component.resetGridHeaderBackgroundColor();
      expect(mockSettings.headerBackgroundColor).toBeUndefined();
      expect(mockSettings._reset_headerBackgroundColor).toBeTrue();
      expect(mockSettings._syncAction).toBe("header");
    });

    it("should handle gridLayoutOrientation getter and onGridLayoutOrientationChange", () => {
      spyOn(component.change, "emit");
      delete mockSettings.layoutOrientation;
      expect(component.gridLayoutOrientation).toBe("vertical");

      component.onGridLayoutOrientationChange("horizontal");
      expect(mockSettings.layoutOrientation).toBe("horizontal");
      expect(mockSettings._layoutOrientationChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
      expect(component.gridLayoutOrientation).toBe("horizontal");

      component.onGridLayoutOrientationChange("vertical");
      expect(mockSettings.layoutOrientation).toBe("vertical");
      expect(mockSettings._layoutOrientationChanged).toBeTrue();
      expect(component.gridLayoutOrientation).toBe("vertical");
    });

    it("should handle gridTotalLanes getter, clamping and onGridTotalLanesChange", () => {
      spyOn(component.change, "emit");
      delete mockSettings.gridTotalLanes;
      expect(component.gridTotalLanes).toBe(4);

      component.onGridTotalLanesChange(6);
      expect(mockSettings.gridTotalLanes).toBe(6);
      expect(mockSettings._gridTotalLanesChanged).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();
      expect(component.gridTotalLanes).toBe(6);

      // Clamp lower bound
      component.onGridTotalLanesChange(0);
      expect(mockSettings.gridTotalLanes).toBe(1);

      // Clamp upper bound
      component.onGridTotalLanesChange(50);
      expect(mockSettings.gridTotalLanes).toBe(32);
    });

    it("should return gridDirection and gridTotalLanes from settings", () => {
      delete mockSettings.gridDirection;
      expect(component.gridDirection).toBe("vertical");

      mockSettings.gridDirection = "horizontal";
      expect(component.gridDirection).toBe("horizontal");

      mockSettings.gridDirection = "vertical";
      mockSettings.gridTotalLanes = 8;
      expect(component.gridDirection).toBe("vertical");
      expect(component.gridTotalLanes).toBe(8);
    });

    it("should render inspector-number-input controls for mirrored lanes count without redundant badge", () => {
      fixture.componentRef.setInput("settings", {
        ...mockSettings,
        gridId: "grid-12345",
        gridLane: 0,
        gridTotalLanes: 3,
      });
      component.setScope("grid");
      fixture.detectChanges();
      const numberInput = fixture.debugElement.query(
        By.css("input.inspector-number-input"),
      );
      expect(numberInput).toBeTruthy();
      expect(numberInput.nativeElement.getAttribute("type")).toBe("number");
      expect(numberInput.nativeElement.getAttribute("min")).toBe("1");
      expect(numberInput.nativeElement.getAttribute("max")).toBe("32");

      const mirrorSection =
        numberInput.nativeElement.closest(".inspector-section");
      expect(mirrorSection.querySelector(".inspector-val-badge")).toBeNull();
    });

    it("should handle gridLabel typography and style properties", () => {
      mockSettings.linkColumns = true;

      // Font Family
      component.gridLabelFontFamily = "Roboto";
      expect(mockSettings.gridLabelFontFamily).toBe("Roboto");
      expect(mockSettings._gridLabelChanged).toBeTrue();
      expect(component.gridLabelFontFamily).toBe("Roboto");

      // Font Size with clamping
      component.gridLabelFontSize = 28;
      expect(mockSettings.gridLabelFontSize).toBe(28);
      expect(component.gridLabelFontSize).toBe(28);
      component.gridLabelFontSize = 4;
      expect(mockSettings.gridLabelFontSize).toBe(8);
      component.gridLabelFontSize = 150;
      expect(mockSettings.gridLabelFontSize).toBe(72);

      // Bold & Italic
      component.gridLabelFontBold = false;
      expect(component.gridLabelFontBold).toBeFalse();
      expect(mockSettings.gridLabelFontBold).toBeFalse();
      component.gridLabelFontBold = true;
      expect(component.gridLabelFontBold).toBeTrue();
      expect(mockSettings.gridLabelFontBold).toBeTrue();

      component.gridLabelFontItalic = true;
      expect(component.gridLabelFontItalic).toBeTrue();
      expect(mockSettings.gridLabelFontItalic).toBeTrue();
      component.gridLabelFontItalic = false;
      expect(component.gridLabelFontItalic).toBeFalse();
      expect(mockSettings.gridLabelFontItalic).toBeFalse();

      // Alignment
      component.gridLabelAlignment = "end";
      expect(mockSettings.gridLabelAlignment).toBe("end");
      expect(component.gridLabelAlignment).toBe("end");

      // Text Color & Reset
      const fakeTextEvent = { target: { value: "#112233" } } as any;
      component.onGridLabelTextColorChange(fakeTextEvent);
      expect(mockSettings.gridLabelTextColor).toBe("#112233");
      expect(component.gridLabelTextColor).toBe("#112233");
      component.resetGridLabelTextColor();
      expect(mockSettings.gridLabelTextColor).toBeUndefined();

      // Background Color & Reset
      const fakeBgEvent = { target: { value: "#445566" } } as any;
      component.onGridLabelBgColorChange(fakeBgEvent);
      expect(mockSettings.gridLabelBackgroundColor).toBe("#445566");
      expect(component.gridLabelBackgroundColor).toBe("#445566");
      component.resetGridLabelBackgroundColor();
      expect(mockSettings.gridLabelBackgroundColor).toBeUndefined();
    });

    it("should handle gridLabelText getter and setter", () => {
      mockSettings.gridLabelText = "My Custom Title";
      expect(component.gridLabelText).toBe("My Custom Title");

      component.gridLabelText = "Updated Title";
      expect(mockSettings.gridLabelText).toBe("Updated Title");
      expect(mockSettings._gridLabelChanged).toBeTrue();
    });

    it("should render custom grid card title if gridLabelText is provided", () => {
      mockSettings.gridId = "grid-1";
      mockSettings.linkColumns = true;
      mockSettings.gridLabelText = "My Custom Leaderboard";
      fixture.detectChanges();

      const titleEl = fixture.debugElement.query(By.css(".grid-card-title"));
      expect(titleEl.nativeElement.textContent).toContain(
        "My Custom Leaderboard",
      );
    });

    it("should render grid label position control before header placement control in grid scope", () => {
      mockSettings.gridId = "grid-1";
      component.setScope("grid");
      fixture.detectChanges();

      const labels = Array.from(
        fixture.nativeElement.querySelectorAll(".inspector-label"),
      ).map((el: any) => el.textContent.trim());

      const gridLabelIndex = labels.findIndex(
        (text) =>
          text === "Grid Label Position" || text === "UE_GRID_LABEL_POSITION",
      );
      const headerPlacementIndex = labels.findIndex(
        (text) =>
          text === "Header Placement" || text === "UE_GRID_HEADER_PLACEMENT",
      );

      expect(gridLabelIndex).toBeGreaterThan(-1);
      expect(headerPlacementIndex).toBeGreaterThan(-1);
      expect(gridLabelIndex).toBeLessThan(headerPlacementIndex);
    });

    it("should handle gridLabel border properties and clamping", () => {
      // Show Border (defaults to true)
      expect(component.gridLabelShowBorder).toBeTrue();
      component.gridLabelShowBorder = false;
      expect(component.gridLabelShowBorder).toBeFalse();
      expect(mockSettings.gridLabelShowBorder).toBeFalse();
      expect(mockSettings._gridLabelChanged).toBeTrue();
      component.gridLabelShowBorder = true;
      expect(component.gridLabelShowBorder).toBeTrue();
      expect(mockSettings.gridLabelShowBorder).toBeTrue();

      // Border Color with default fallback and reset
      expect(component.gridLabelBorderColor).toBe("#ffffff");
      mockSettings.gridLabelTextColor = "#a0aec0";
      expect(component.gridLabelBorderColor).toBe("#a0aec0");

      component.gridLabelBorderColor = "#ff007f";
      expect(mockSettings.gridLabelBorderColor).toBe("#ff007f");
      expect(component.gridLabelBorderColor).toBe("#ff007f");

      const fakeColorEvent = { target: { value: "#10b981" } } as any;
      component.onGridLabelBorderColorChange(fakeColorEvent);
      expect(mockSettings.gridLabelBorderColor).toBe("#10b981");

      component.resetGridLabelBorderColor();
      expect(mockSettings.gridLabelBorderColor).toBeUndefined();
      expect(component.gridLabelBorderColor).toBe("#a0aec0");

      // Border Width with default and clamping (0 to 10)
      expect(component.gridLabelBorderWidth).toBe(1);
      component.gridLabelBorderWidth = 5;
      expect(mockSettings.gridLabelBorderWidth).toBe(5);
      expect(component.gridLabelBorderWidth).toBe(5);

      component.gridLabelBorderWidth = -3;
      expect(mockSettings.gridLabelBorderWidth).toBe(0);
      component.gridLabelBorderWidth = 15;
      expect(mockSettings.gridLabelBorderWidth).toBe(10);

      // Border Radius with default and clamping (0 to 32)
      expect(component.gridLabelBorderRadius).toBe(4);
      component.gridLabelBorderRadius = 12;
      expect(mockSettings.gridLabelBorderRadius).toBe(12);
      expect(component.gridLabelBorderRadius).toBe(12);

      component.gridLabelBorderRadius = -5;
      expect(mockSettings.gridLabelBorderRadius).toBe(0);
      component.gridLabelBorderRadius = 50;
      expect(mockSettings.gridLabelBorderRadius).toBe(32);
    });

    it("should toggle mirrorRows and emit reMirrorGrid", () => {
      fixture.componentRef.setInput("settings", mockSettings);
      mockSettings.gridId = "grid-test-1";

      expect(component.mirrorRows).toBeTrue();
      component.mirrorRows = false;
      expect(component.mirrorRows).toBeFalse();
      expect(mockSettings.mirrorRows).toBeFalse();
      expect(mockSettings._mirrorRowsChanged).toBeTrue();

      spyOn(component.reMirrorGrid, "emit");
      component.onReMirrorGrid();
      expect(component.mirrorRows).toBeTrue();
      expect(component.reMirrorGrid.emit).toHaveBeenCalledWith("grid-test-1");
    });

    it("should correctly compute isGridHorizontal and isLanesMirrored in vertical and horizontal orientations", () => {
      fixture.componentRef.setInput("settings", mockSettings);
      mockSettings.gridId = "grid-test-1";

      // Vertical (default)
      mockSettings.layoutOrientation = "vertical";
      mockSettings.gridDirection = undefined;
      expect(component.isGridHorizontal).toBeFalse();

      component.mirrorRows = true;
      component.linkColumns = false;
      expect(component.isLanesMirrored).toBeTrue();

      component.mirrorRows = false;
      expect(component.isLanesMirrored).toBeFalse();

      // Horizontal orientation via layoutOrientation
      mockSettings.layoutOrientation = "horizontal";
      expect(component.isGridHorizontal).toBeTrue();

      // In horizontal, isLanesMirrored reflects linkColumns (since columns are lanes)
      component.linkColumns = true;
      component.mirrorRows = false;
      expect(component.isLanesMirrored).toBeTrue();

      component.linkColumns = false;
      expect(component.isLanesMirrored).toBeFalse();

      // Horizontal orientation via gridDirection fallback
      mockSettings.layoutOrientation = undefined;
      mockSettings.gridDirection = "horizontal";
      expect(component.isGridHorizontal).toBeTrue();
      expect(component.isLanesMirrored).toBeFalse();
      component.linkColumns = true;
      expect(component.isLanesMirrored).toBeTrue();
    });

    it("should re-mirror columns and emit reMirrorGrid when horizontal", () => {
      fixture.componentRef.setInput("settings", mockSettings);
      mockSettings.gridId = "grid-test-horiz";
      mockSettings.layoutOrientation = "horizontal";
      component.linkColumns = false;

      spyOn(component.reMirrorGrid, "emit");
      component.onReMirrorGrid();
      expect(component.linkColumns).toBeTrue();
      expect(component.reMirrorGrid.emit).toHaveBeenCalledWith(
        "grid-test-horiz",
      );
    });
  });

  describe("Custom Widget integration", () => {
    it("should identify custom widget and provide appropriate name and breadcrumb", () => {
      const customWidget: AbsoluteWidgetNode = {
        id: "w-custom-1",
        widgetType: "custom:advanced-laps",
        x: 0,
        y: 0,
        width: 150,
        height: 60,
        zIndex: 2,
        customSettings: {
          gridId: "grid-test",
          gridLane: 0,
          targetIndex: 0,
          useLaneColors: true,
        },
      };

      fixture.componentRef.setInput("widget", customWidget);
      fixture.componentRef.setInput("settings", customWidget.customSettings);
      fixture.detectChanges();

      expect(component.isCustomWidget).toBeTrue();
      expect(component.customWidgetName).toBe("advanced-laps");
      expect(component.columnBreadcrumbLabel).toBe("advanced-laps");
    });

    it("should use customLabel for columnBreadcrumbLabel if configured", () => {
      const customWidget: AbsoluteWidgetNode = {
        id: "w-custom-1",
        widgetType: "custom:advanced-laps",
        x: 0,
        y: 0,
        width: 150,
        height: 60,
        zIndex: 2,
        customSettings: {
          gridId: "grid-test",
          customLabel: "Super Laps",
        },
      };

      fixture.componentRef.setInput("widget", customWidget);
      fixture.componentRef.setInput("settings", customWidget.customSettings);
      fixture.detectChanges();

      expect(component.columnBreadcrumbLabel).toBe("Super Laps");
    });

    it("should update currentSettings and emit change on onCustomWidgetChange", () => {
      spyOn(component.change, "emit");
      const updatedNode: AbsoluteWidgetNode = {
        id: "w-custom-1",
        widgetType: "custom:advanced-laps",
        x: 0,
        y: 0,
        width: 150,
        height: 60,
        zIndex: 2,
        customSettings: {
          decimalPlaces: 3,
          mode: "overall",
        },
      };

      component.onCustomWidgetChange(updatedNode);
      expect(component.currentSettings["decimalPlaces"]).toBe(3);
      expect(component.currentSettings["mode"]).toBe("overall");
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should render custom widget badge and custom-widget-inspector in widget scope, and compact info in column scope", () => {
      const customWidget: AbsoluteWidgetNode = {
        id: "w-custom-1",
        widgetType: "custom:advanced-laps",
        x: 0,
        y: 0,
        width: 150,
        height: 60,
        zIndex: 2,
        customSettings: {
          gridId: "grid-test",
          gridLane: 0,
        },
      };

      fixture.componentRef.setInput("widget", customWidget);
      fixture.componentRef.setInput("settings", customWidget.customSettings);
      component.setScope("widget");
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(".custom-widget-badge");
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain("advanced-laps");

      const customInspector = fixture.nativeElement.querySelector(
        "app-custom-widget-inspector",
      );
      expect(customInspector).toBeTruthy();

      component.setScope("column");
      fixture.detectChanges();
      const columnInfo = fixture.nativeElement.querySelector(
        ".custom-widget-column-info",
      );
      expect(columnInfo).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector("app-custom-widget-inspector"),
      ).toBeNull();
    });
  });

  describe("Inset Scope & InsetConfig", () => {
    beforeEach(() => {
      mockSettings.insets = {
        "top-left": "lastLapTime",
        "top-right": "totalTime",
      };
      mockSettings.insetsConfig = {
        "top-left": {
          timeDecimalPlaces: 2,
          fontFamily: "Courier",
          fontSize: 14,
          textColor: "#38bdf8",
        },
      };
      fixture.detectChanges();
    });

    it("should switch activeScope to inset when selectedAnchor is set and back to column when cleared", () => {
      component.setScope("column");
      expect(component.activeScope()).toBe("column");

      fixture.componentRef.setInput("selectedAnchor", "top-left");
      fixture.detectChanges();
      expect(component.activeScope()).toBe("inset");

      fixture.componentRef.setInput("selectedAnchor", null);
      fixture.detectChanges();
      expect(component.activeScope()).toBe("column");
    });

    it("should return placedInsetAnchors with configured keys", () => {
      expect(component.placedInsetAnchors).toEqual(["top-left", "top-right"]);
    });

    it("should resolve effectiveSelectedAnchor", () => {
      fixture.componentRef.setInput("selectedAnchor", "top-right");
      expect(component.effectiveSelectedAnchor).toBe("top-right");

      fixture.componentRef.setInput("selectedAnchor", null);
      expect(component.effectiveSelectedAnchor).toBe("top-left");
    });

    it("should compute insetBreadcrumbLabel", () => {
      fixture.componentRef.setInput("selectedAnchor", "top-left");
      expect(component.insetBreadcrumbLabel).toBe("Inset: RD_LAST_LAP_TIME");

      component.setAnchorValue("top-left", "");
      expect(component.insetBreadcrumbLabel).toContain("UE_ANCHOR_top-left");
    });

    it("should get and set anchor value", () => {
      spyOn(component.change, "emit");
      fixture.componentRef.setInput("selectedAnchor", "top-left");

      expect(component.getAnchorValue("top-left")).toBe("lastLapTime");
      component.setAnchorValue("top-left", "bestLapTime");
      expect(mockSettings.insets["top-left"]).toBe("bestLapTime");
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should get and set inset timer configuration", () => {
      spyOn(component.change, "emit");
      fixture.componentRef.setInput("selectedAnchor", "top-right");

      expect(component.getInsetTimeDisplayFormat("top-right")).toBe("dynamic");
      component.setInsetTimeDisplayFormat("top-right", "seconds");
      expect(mockSettings.insetsConfig["top-right"]?.timeDisplayFormat).toBe(
        "seconds",
      );
      expect(component.change.emit).toHaveBeenCalled();

      expect(component.getInsetTimeSubsecondMode("top-right")).toBe("never");
      component.setInsetTimeSubsecondMode("top-right", "always");
      expect(mockSettings.insetsConfig["top-right"]?.timeSubsecondMode).toBe(
        "always",
      );

      expect(component.getInsetTimeSubsecondThreshold("top-right")).toBe(10);
      component.setInsetTimeSubsecondThreshold("top-right", 15);
      expect(
        mockSettings.insetsConfig["top-right"]?.timeSubsecondThreshold,
      ).toBe(15);

      expect(component.getInsetTimeSubsecondDecimals("top-right")).toBe(2);
      component.setInsetTimeSubsecondDecimals("top-right", 3);
      expect(
        mockSettings.insetsConfig["top-right"]?.timeSubsecondDecimals,
      ).toBe(3);
    });

    it("should get and set decimal places for insets", () => {
      spyOn(component.change, "emit");
      fixture.componentRef.setInput("selectedAnchor", "top-left");

      expect(component.getInsetTimeDecimalPlaces("top-left")).toBe(2);
      component.setInsetTimeDecimalPlaces("top-left", 3);
      expect(mockSettings.insetsConfig["top-left"]?.timeDecimalPlaces).toBe(3);
      expect(component.change.emit).toHaveBeenCalled();

      expect(component.getInsetLapDecimalPlaces("top-left")).toBe(2);
      component.setInsetLapDecimalPlaces("top-left", 1);
      expect(mockSettings.insetsConfig["top-left"]?.lapDecimalPlaces).toBe(1);

      expect(component.getInsetDecimalPlaces("top-left")).toBe(2);
      component.setInsetDecimalPlaces("top-left", 0);
      expect(mockSettings.insetsConfig["top-left"]?.decimalPlaces).toBe(0);

      // Verify unconfigured anchor does not inherit from column settings
      mockSettings.timeDecimalPlaces = 1;
      mockSettings.lapDecimalPlaces = 0;
      expect(component.getInsetTimeDecimalPlaces("bottom-right")).toBe(3);
      expect(component.getInsetLapDecimalPlaces("bottom-right")).toBe(2);
    });

    it("should get, set, and reset inset typography", () => {
      spyOn(component.change, "emit");
      fixture.componentRef.setInput("selectedAnchor", "top-left");

      expect(component.getInsetFontFamily("top-left")).toBe("Courier");
      component.setInsetFontFamily("top-left", "Roboto");
      expect(mockSettings.insetsConfig["top-left"]?.fontFamily).toBe("Roboto");

      expect(component.getInsetFontSize("top-left")).toBe(14);
      component.setInsetFontSize("top-left", 16);
      expect(mockSettings.insetsConfig["top-left"]?.fontSize).toBe(16);

      expect(component.getInsetTextColor("top-left")).toBe("#38bdf8");
      component.setInsetTextColor("top-left", "#ffffff");
      expect(mockSettings.insetsConfig["top-left"]?.textColor).toBe("#ffffff");

      component.resetInsetCustomColor("top-left");
      expect(mockSettings.insetsConfig["top-left"]?.textColor).toBeUndefined();
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should emit anchorChange on selectInsetAnchor", () => {
      const anchorSpy = spyOn(component.anchorChange, "emit");
      component.selectInsetAnchor("bottom-right");
      expect(anchorSpy).toHaveBeenCalledWith("bottom-right");
    });

    it("should configure inset and switch scope on configureInset", () => {
      const anchorSpy = spyOn(component.anchorChange, "emit");
      component.configureInset("top-right");
      expect(component.activeScope()).toBe("inset");
      expect(anchorSpy).toHaveBeenCalledWith("top-right");
    });

    it("should switch back to column scope on backToColumn", () => {
      const anchorSpy = spyOn(component.anchorChange, "emit");
      component.setScope("inset");
      component.backToColumn();
      expect(component.activeScope()).toBe("column");
      expect(anchorSpy).toHaveBeenCalledWith(null);
    });

    it("should remove inset and clean up insetsConfig on removeInset", () => {
      spyOn(component.change, "emit");
      const anchorSpy = spyOn(component.anchorChange, "emit");
      fixture.componentRef.setInput("selectedAnchor", "top-left");

      component.removeInset("top-left");
      expect(mockSettings.insets["top-left"]).toBeUndefined();
      expect(mockSettings.insetsConfig["top-left"]).toBeUndefined();
      expect(component.activeScope()).toBe("column");
      expect(anchorSpy).toHaveBeenCalledWith(null);
      expect(component.change.emit).toHaveBeenCalled();
    });

    it("should identify column types for insets", () => {
      fixture.componentRef.setInput("selectedAnchor", "top-right"); // totalTime
      expect(component.isInsetTotalTime("top-right")).toBeTrue();
      expect(component.isInsetTimeColumn("top-right")).toBeFalse(); // totalTime is excluded from isInsetTimeColumn
      expect(component.isInsetLapColumn("top-right")).toBeFalse();
      expect(component.isInsetNumericColumn("top-right")).toBeFalse();

      fixture.componentRef.setInput("selectedAnchor", "top-left"); // lastLapTime
      expect(component.isInsetTotalTime("top-left")).toBeFalse();
      expect(component.isInsetTimeColumn("top-left")).toBeTrue();
      expect(component.isInsetLapColumn("top-left")).toBeFalse();
      expect(component.isInsetNumericColumn("top-left")).toBeFalse();

      mockSettings.insets["top-left"] = "lapCount";
      expect(component.isInsetLapColumn("top-left")).toBeTrue();
      expect(component.isInsetTimeColumn("top-left")).toBeFalse();

      mockSettings.insets["top-left"] = "points";
      expect(component.isInsetNumericColumn("top-left")).toBeTrue();
    });

    it("should produce formatted live preview from getInsetPreview", () => {
      fixture.componentRef.setInput("selectedAnchor", "top-right");
      component.setInsetTimeDisplayFormat("top-right", "mm_ss");
      component.setInsetTimeSubsecondMode("top-right", "never");
      expect(component.getInsetPreview("top-right", 83)).toBe("01:23");
    });

    it("should render timer-preview-grid with 4 items matching main column preview for inset totalTime", () => {
      fixture.componentRef.setInput("selectedAnchor", "top-right");
      component.selectInsetAnchor("top-right");
      mockSettings.insets["top-right"] = "totalTime";
      fixture.detectChanges();

      const previewGrid = fixture.nativeElement.querySelector(
        ".timer-preview-grid",
      );
      expect(previewGrid).toBeTruthy();

      const previewItems = fixture.nativeElement.querySelectorAll(
        ".timer-preview-item",
      );
      expect(previewItems.length).toBe(4);
      const labels = Array.from(
        fixture.nativeElement.querySelectorAll(".timer-preview-label"),
      ).map((el: any) => el.textContent.trim());
      expect(labels).toEqual(["> 1 hr", "> 1 min", "< 1 min", "< 10s"]);
    });
  });

  describe("Phase 1 Section Groups and Geometry Titles", () => {
    it("should render all 4 section groups in grid scope", () => {
      mockSettings.gridId = "grid-1";
      component.setScope("grid");
      fixture.detectChanges();

      const groups = fixture.debugElement.queryAll(
        By.css(".inspector-section-group"),
      );
      expect(groups.length).toBe(4);

      const layoutGroup = fixture.debugElement.query(
        By.css(".inspector-section-group.layout-group"),
      );
      expect(layoutGroup).toBeTruthy();
      expect(layoutGroup.nativeElement.textContent).toContain(
        "UE_GRID_SECTION_LAYOUT",
      );

      const titleGroup = fixture.debugElement.query(
        By.css(".inspector-section-group.title-bar-group"),
      );
      expect(titleGroup).toBeTruthy();
      expect(titleGroup.nativeElement.textContent).toContain(
        "UE_GRID_SECTION_TITLE",
      );

      const headerGroup = fixture.debugElement.query(
        By.css(".inspector-section-group.header-row-group"),
      );
      expect(headerGroup).toBeTruthy();
      expect(headerGroup.nativeElement.textContent).toContain(
        "UE_GRID_SECTION_COLUMN_HEADERS",
      );

      const actionsGroup = fixture.debugElement.query(
        By.css(".inspector-section-group.actions-group"),
      );
      expect(actionsGroup).toBeTruthy();
      expect(actionsGroup.nativeElement.textContent).toContain(
        "UE_GRID_SECTION_ACTIONS",
      );
    });

    it("should render Column Header, Data Styling, and Border geometry titles in column scope", () => {
      mockSettings.gridId = "grid-1";
      mockSettings.columnKey = "totalTime";
      mockSettings.showHeader = true;
      component.setScope("column");
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const titleTexts = titles.map((t) => t.nativeElement.textContent.trim());

      expect(
        titleTexts.some((t) => t.includes("UE_INSPECTOR_TITLE_BAR_SETTINGS")),
      ).toBeTrue();
      expect(
        titleTexts.some((t) =>
          t.includes("UE_INSPECTOR_DATA_STYLING_SETTINGS"),
        ),
      ).toBeTrue();
      expect(
        titleTexts.some((t) => t.includes("UE_INSPECTOR_BORDER_SECTION")),
      ).toBeTrue();
    });

    it("should render Format geometry title in widget scope for time columns", () => {
      mockSettings.gridId = "grid-1";
      mockSettings.columnKey = "totalTime";
      component.setScope("widget");
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-geometry-title"),
      );
      const titleTexts = titles.map((t) => t.nativeElement.textContent.trim());

      expect(
        titleTexts.some((t) => t.includes("UE_INSPECTOR_FORMAT_SECTION")),
      ).toBeTrue();
    });

    it("should render Target Driver title for standalone widget", () => {
      delete mockSettings.gridId;
      component.setScope("widget");
      fixture.detectChanges();

      const titles = fixture.debugElement.queryAll(
        By.css(".inspector-group-title"),
      );
      const titleTexts = titles.map((t) => t.nativeElement.textContent.trim());

      expect(
        titleTexts.some((t) => t.includes("UE_INSPECTOR_TARGET_DRIVER")),
      ).toBeTrue();
    });
  });

  describe("Inset Map and Drop Zone Card", () => {
    it("should select anchor when selectAnchorFromMap is called", () => {
      spyOn(component.anchorChange, "emit");
      component.selectAnchorFromMap("top-left");
      expect(component.selectedMapAnchor).toBe("top-left");
      expect(component.effectiveSelectedAnchor).toBe("top-left");
      expect(component.anchorChange.emit).toHaveBeenCalledWith("top-left");

      // Center-center switches to column scope and resets anchor
      component.selectAnchorFromMap("center-center");
      expect(component.selectedMapAnchor).toBe("center-center");
      expect(component.activeScope()).toBe("column");
      expect(component.anchorChange.emit).toHaveBeenCalledWith(null);
    });

    it("should reset activeInspectorAnchor when selecting a different widget", () => {
      component.selectAnchorFromMap("bottom-center");
      expect(component.selectedMapAnchor).toBe("bottom-center");

      // Switch to a new widget
      fixture.componentRef.setInput("widget", {
        id: "widget_different_column",
        widgetType: "lane-column",
        customSettings: { columnKey: "bestLapTime", insets: {} },
      } as any);
      fixture.detectChanges();

      expect(component.selectedMapAnchor).toBe("center-center");
      expect(component.activeInspectorAnchor()).toBeNull();
    });

    it("should clear activeInspectorAnchor when selectedAnchor is set to null or center-center", () => {
      fixture.componentRef.setInput("selectedAnchor", "bottom-center");
      fixture.detectChanges();
      expect(component.selectedMapAnchor).toBe("bottom-center");
      expect(component.activeInspectorAnchor()).toBe("bottom-center");

      fixture.componentRef.setInput("selectedAnchor", null);
      fixture.detectChanges();
      expect(component.selectedMapAnchor).toBe("center-center");
      expect(component.activeInspectorAnchor()).toBeNull();

      fixture.componentRef.setInput("selectedAnchor", "top-right");
      fixture.detectChanges();
      expect(component.selectedMapAnchor).toBe("top-right");
      expect(component.activeInspectorAnchor()).toBe("top-right");

      fixture.componentRef.setInput("selectedAnchor", "center-center");
      fixture.detectChanges();
      expect(component.selectedMapAnchor).toBe("center-center");
      expect(component.activeInspectorAnchor()).toBeNull();
    });

    it("should return localized label for selected anchor including center-center", () => {
      expect(component.getSelectedAnchorLabel("top-left")).toBeDefined();
      expect(component.getSelectedAnchorLabel("center-center")).toBeDefined();
    });

    it("should handle inspector dragover and dragenter/dragleave classes", () => {
      const target = document.createElement("div");
      const dragOverEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        dataTransfer: { dropEffect: "none" },
      } as unknown as DragEvent;

      component.onInspectorDragOver(dragOverEvent);
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.dataTransfer!.dropEffect).toBe("copy");

      const enterEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        currentTarget: target,
      } as unknown as DragEvent;
      component.onInspectorDragEnter(enterEvent);
      expect(target.classList.contains("drag-over")).toBeTrue();

      const leaveEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        currentTarget: target,
      } as unknown as DragEvent;
      component.onInspectorDragLeave(leaveEvent);
      expect(target.classList.contains("drag-over")).toBeFalse();
    });

    it("should drop widget onto anchor and update settings", () => {
      const target = document.createElement("div");
      target.classList.add("drag-over");
      const dropEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        currentTarget: target,
        dataTransfer: {
          getData: (type: string) => {
            if (type === "application/json") {
              return JSON.stringify({ key: "custom:dopamine:advanced-laps" });
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      component.onInspectorDrop(dropEvent, "top-center");
      expect(target.classList.contains("drag-over")).toBeFalse();
      expect(component.getAnchorValue("top-center")).toBe(
        "custom:dopamine:advanced-laps",
      );
      expect(component.effectiveSelectedAnchor).toBe("top-center");
    });

    it("should drop widget onto center-center anchor to set main columnKey", () => {
      const target = document.createElement("div");
      const dropEvent = {
        preventDefault: jasmine.createSpy("preventDefault"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
        currentTarget: target,
        dataTransfer: {
          getData: (type: string) => {
            if (type === "application/json") {
              return JSON.stringify({ key: "custom:my-main-widget" });
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      component.onInspectorDrop(dropEvent, "center-center");
      expect(component.getAnchorValue("center-center")).toBe(
        "custom:my-main-widget",
      );
      expect(component.currentSettings["columnKey"]).toBe(
        "custom:my-main-widget",
      );
    });

    it("should include custom widgets in allAvailableColumns", () => {
      const cols = component.allAvailableColumns;
      expect(cols.length).toBeGreaterThanOrEqual(
        component.availableColumns().length,
      );
    });

    it("should build mainCustomWidgetNode and handle custom widget changes", () => {
      component.currentSettings["columnKey"] = "custom:gauge";
      const node = component.mainCustomWidgetNode;
      expect(node.widgetType).toBe("custom:gauge" as any);

      component.onCustomWidgetChange({
        id: "w1",
        widgetType: "custom:gauge" as any,
        customSettings: { decimalPlaces: 2 },
      } as any);
      expect(component.currentSettings["decimalPlaces"]).toBe(2);
      expect(component.currentSettings["lapDecimalPlaces"]).toBe(2);
    });

    it("should build inset custom widget node and handle inset changes", () => {
      component.setAnchorValue("top-right", "custom:fuel");
      const insetNode = component.getInsetCustomWidgetNode("top-right");
      expect(insetNode.widgetType).toBe("custom:fuel" as any);

      component.onInsetCustomWidgetChange("top-right", {
        id: "inset-w",
        widgetType: "custom:fuel" as any,
        customSettings: { fuelCapacity: 50, decimalPlaces: 3 },
      } as any);
      expect(
        (component.getInsetConfig("top-right") as any)["fuelCapacity"],
      ).toBe(50);
      expect(
        (component.getInsetConfig("top-right") as any)["decimalPlaces"],
      ).toBe(3);
      expect(
        (component.getInsetConfig("top-right") as any)["lapDecimalPlaces"],
      ).toBe(3);
    });

    it("should resolve display name and icon for widgets", () => {
      expect(component.getWidgetIcon("custom:widget")).toBe("extension");
      expect(component.getWidgetIcon("bestLapTime")).toBe("schedule");
      expect(component.getWidgetDisplayName("")).toBe("");
      expect(component.isCustomWidgetKey("custom:my-widget")).toBeTrue();
      expect(component.isCustomWidgetKey("lap")).toBeFalse();
    });

    it("should remove inset when removeInset is invoked", () => {
      component.setAnchorValue("top-center", "lap-time");
      expect(component.getAnchorValue("top-center")).toBe("lap-time");
      component.removeInset("top-center");
      expect(component.getAnchorValue("top-center")).toBe("");
    });

    it("should correctly identify heats count column and handle display mode", () => {
      component.currentSettings["columnKey"] = "lastLapTime";
      expect(component.isHeatsCountColumn).toBeFalse();

      component.currentSettings["columnKey"] = "heatsRaced";
      expect(component.isHeatsCountColumn).toBeTrue();

      component.currentSettings["columnKey"] = "heatsRemaining";
      expect(component.isHeatsCountColumn).toBeTrue();
    });

    it("should manage inset heats display mode correctly", () => {
      component.setAnchorValue("top-left", "heatsRaced");
      expect(component.isInsetHeatsCount("top-left")).toBeTrue();
      expect(component.getInsetHeatsDisplayMode("top-left")).toBe("raced");

      spyOn(component.change, "emit");
      component.setInsetHeatsDisplayMode("top-left", "remaining");
      expect(component.getInsetHeatsDisplayMode("top-left")).toBe("remaining");
      expect(component.change.emit).toHaveBeenCalled();

      expect(component.isInsetHeatsCount("bottom-right")).toBeFalse();
      expect(component.getInsetHeatsDisplayMode("bottom-right")).toBe("raced");
    });

    it("should manage inset horizontal and vertical alignment and emit change", () => {
      component.setAnchorValue("top-left", "bestLapTime");
      expect(component.getInsetHorizontalAlignment("top-left")).toBe("left");
      expect(component.getInsetVerticalAlignment("top-left")).toBe("top");

      spyOn(component.change, "emit");
      component.setInsetHorizontalAlignment("top-left", "right");
      expect(component.getInsetHorizontalAlignment("top-left")).toBe("right");
      expect(component.change.emit).toHaveBeenCalled();

      component.setInsetVerticalAlignment("top-left", "bottom");
      expect(component.getInsetVerticalAlignment("top-left")).toBe("bottom");
      expect(component.change.emit).toHaveBeenCalledTimes(2);
    });

    it("should get and set gridEmptyRowsMode and emit change", () => {
      // heat/lane grid defaults to "empty"
      component.currentSettings["gridId"] = "grid-heat-1";
      component.currentSettings["gridType"] = "heat";
      component.currentSettings["bindingMode"] = "lane";
      delete component.currentSettings["emptyRowsMode"];
      expect(component.gridEmptyRowsMode).toBe("empty");

      // overall grid defaults to "remove"
      component.currentSettings["gridType"] = "overall";
      component.currentSettings["bindingMode"] = "overallPosition";
      expect(component.gridEmptyRowsMode).toBe("remove");

      // set to "blank"
      spyOn(component.change, "emit");
      component.gridEmptyRowsMode = "blank";
      expect(component.gridEmptyRowsMode).toBe("blank");
      expect(component.currentSettings["emptyRowsMode"]).toBe("blank");
      expect(component.currentSettings["_gridEmptyRowsModeChanged"]).toBeTrue();
      expect(component.change.emit).toHaveBeenCalled();

      // set to "remove"
      component.gridEmptyRowsMode = "remove";
      expect(component.gridEmptyRowsMode).toBe("remove");
      expect(component.currentSettings["emptyRowsMode"]).toBe("remove");
      expect(component.currentSettings["_gridEmptyRowsModeChanged"]).toBeTrue();
      expect(component.change.emit).toHaveBeenCalledTimes(2);
    });
  });
});
