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

    spyOn(component.editGrid, "emit");
    const editBtn = fixture.debugElement.query(By.css(".grid-edit-btn"));
    expect(editBtn).toBeTruthy();
    editBtn.triggerEventHandler("click", null);
    expect(component.editGrid.emit).toHaveBeenCalledWith("grid-12345");

    spyOn(component.detachGrid, "emit");
    const detachBtn = fixture.debugElement.query(By.css(".grid-detach-btn"));
    expect(detachBtn).toBeTruthy();
    detachBtn.triggerEventHandler("click", null);
    expect(component.detachGrid.emit).toHaveBeenCalledWith("grid-12345");

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
    expect(component.gridBreadcrumbLabel).toBe("Grid (4 Lanes)");
    expect(component.columnBreadcrumbLabel).toBe("Driver");
    expect(component.cellBreadcrumbLabel).toBe("Lane 1");

    const scopeNav = fixture.debugElement.query(By.css(".grid-scope-nav"));
    expect(scopeNav).toBeTruthy();

    const breadcrumbs = fixture.debugElement.queryAll(
      By.css(".breadcrumb-btn"),
    );
    expect(breadcrumbs.length).toBe(3);

    // Switch to column scope
    component.setScope("column");
    fixture.detectChanges();
    expect(component.activeScope()).toBe("column");
    const columnBanner = fixture.debugElement.query(By.css(".column-banner"));
    expect(columnBanner).toBeTruthy();

    // Switch to cell scope
    component.setScope("cell");
    fixture.detectChanges();
    expect(component.activeScope()).toBe("cell");
    const cellBanner = fixture.debugElement.query(By.css(".cell-banner"));
    expect(cellBanner).toBeTruthy();
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

    it("should keep both inset time and lap decimal selectors with options [0, 3]", () => {
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
          "UE_INSPECTOR_TIME_DECIMALS",
        );
      });
      const insetLapDecSection = insetSections.find((s) => {
        const label = s.query(By.css(".inspector-label"));
        return label?.nativeElement.textContent.includes(
          "UE_INSPECTOR_LAP_DECIMALS",
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
      expect(component.change.emit).toHaveBeenCalled();

      const eventBg = { target: { value: "#654321" } } as any;
      component.onColorChange("headerBackgroundColor", eventBg);
      expect(component.currentSettings["headerBackgroundColor"]).toBe(
        "#654321",
      );
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
  });

  describe("onlyShowDecimalsWhenNotRacing", () => {
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

    it("should keep the old value if onlyShowDecimalsIfSegments was previously set", () => {
      mockSettings.onlyShowDecimalsIfSegments = true;
      delete mockSettings.onlyShowDecimalsWhenNotRacing;
      expect(component.onlyShowDecimalsWhenNotRacing).toBeTrue();

      mockSettings.onlyShowDecimalsIfSegments = false;
      expect(component.onlyShowDecimalsWhenNotRacing).toBeFalse();
    });

    it("should render onlyShowDecimalsWhenNotRacing checkbox when column is lapCount or totalLaps", () => {
      mockSettings.columnKey = "lapCount";
      fixture.detectChanges();

      let allCheckboxes = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      let segmentCheckbox = Array.from(allCheckboxes).find((el: any) =>
        el.parentElement?.textContent?.includes(
          "UE_INSPECTOR_ONLY_SHOW_DECIMALS_WHEN_NOT_RACING",
        ),
      );
      expect(segmentCheckbox).toBeTruthy();

      mockSettings.columnKey = "totalLaps";
      fixture.detectChanges();

      allCheckboxes = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      segmentCheckbox = Array.from(allCheckboxes).find((el: any) =>
        el.parentElement?.textContent?.includes(
          "UE_INSPECTOR_ONLY_SHOW_DECIMALS_WHEN_NOT_RACING",
        ),
      );
      expect(segmentCheckbox).toBeTruthy();
    });

    it("should not render onlyShowDecimalsWhenNotRacing checkbox when column is lastLapTime", () => {
      mockSettings.columnKey = "lastLapTime";
      fixture.detectChanges();

      const allCheckboxes = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      const segmentCheckbox = Array.from(allCheckboxes).find((el: any) =>
        el.parentElement?.textContent?.includes(
          "UE_INSPECTOR_ONLY_SHOW_DECIMALS_WHEN_NOT_RACING",
        ),
      );
      expect(segmentCheckbox).toBeFalsy();
    });

    it("should toggle onlyShowDecimalsWhenNotRacing and emit change", () => {
      spyOn(component.change, "emit");
      mockSettings.columnKey = "lapCount";
      mockSettings.onlyShowDecimalsWhenNotRacing = false;
      fixture.detectChanges();

      const allCheckboxes = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      const segmentCheckbox: any = Array.from(allCheckboxes).find((el: any) =>
        el.parentElement?.textContent?.includes(
          "UE_INSPECTOR_ONLY_SHOW_DECIMALS_WHEN_NOT_RACING",
        ),
      );
      expect(segmentCheckbox).toBeTruthy();

      segmentCheckbox.checked = true;
      segmentCheckbox.dispatchEvent(new Event("change"));
      fixture.detectChanges();

      expect(component.change.emit).toHaveBeenCalled();
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
    });

    it("should handle linkColumns getter and setter with _linkColumnsChanged flag", () => {
      spyOn(component.change, "emit");
      expect(component.linkColumns).toBeTrue();

      component.linkColumns = false;
      expect(mockSettings.linkColumns).toBeFalse();
      expect(mockSettings._linkColumnsChanged).toBeTrue();
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
      expect(component.change.emit).toHaveBeenCalled();

      component.applyValueStyleToAll();
      expect(mockSettings._syncAction).toBe("value");

      component.applyBorderStyleToAll();
      expect(mockSettings._syncAction).toBe("border");

      component.applyTimeFormatToAll();
      expect(mockSettings._syncAction).toBe("time");
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

    it("should handle gridLabel border properties and clamping", () => {
      // Show Border
      expect(component.gridLabelShowBorder).toBeFalse();
      component.gridLabelShowBorder = true;
      expect(component.gridLabelShowBorder).toBeTrue();
      expect(mockSettings.gridLabelShowBorder).toBeTrue();
      expect(mockSettings._gridLabelChanged).toBeTrue();

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
  });
});
