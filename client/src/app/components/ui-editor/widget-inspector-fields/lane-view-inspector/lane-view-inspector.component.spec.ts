import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { FontService } from "@app/services/font.service";

import { LaneViewInspectorComponent } from "./lane-view-inspector.component";

describe("LaneViewInspectorComponent", () => {
  let component: LaneViewInspectorComponent;
  let fixture: ComponentFixture<LaneViewInspectorComponent>;
  let changeSpy: jasmine.Spy;
  let fontServiceSpy: jasmine.SpyObj<FontService>;

  beforeEach(async () => {
    const fontSpy = jasmine.createSpyObj("FontService", ["loadLocalFonts"], {
      availableFonts: () => ["Font A", "Font B"],
    });

    await TestBed.configureTestingModule({
      imports: [FormsModule, LaneViewInspectorComponent, TranslatePipe],
      providers: [{ provide: FontService, useValue: fontSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LaneViewInspectorComponent);
    component = fixture.componentInstance;
    fontServiceSpy = TestBed.inject(FontService) as jasmine.SpyObj<FontService>;

    fixture.componentRef.setInput("settings", {
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
      columnFontFamily: "",
      columnFontSize: 24,
      columnTextColor: "",
      dataFontFamily: "",
      dataFontSize: 54,
      dataTextColor: "",
      insetTimeDecimalPlaces: 3,
      insetLapDecimalPlaces: 2,
      insetFontFamily: "",
      insetFontSize: 24,
      insetTextColor: "",
    });
    fixture.componentRef.setInput("globalSettings", {
      racedayColumns: ["col1", "col2"],
      practiceRacedayColumns: ["pcol1"],
      columnVisibility: { col1: "Always" },
      practiceColumnVisibility: { pcol1: "FuelRaceOnly" },
    });
    fixture.componentRef.setInput("availableColumns", [
      { key: "col1", label: "Col 1" },
    ]);
    fixture.componentRef.setInput("isPracticeMode", false);

    changeSpy = spyOn(component.change, "emit");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit change when settings change", () => {
    component.onSettingsChange();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind timeDecimalPlaces and emit change on selection", () => {
    const selectEl =
      fixture.nativeElement.querySelectorAll("app-custom-select")[1];
    const trigger = selectEl.querySelector(
      ".custom-select-trigger",
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const opt = selectEl.querySelector(
      '.custom-select-option[data-value="1"]',
    ) as HTMLElement;
    opt?.click();
    fixture.detectChanges();
    expect(Number(component.settings().timeDecimalPlaces)).toBe(1);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind lapDecimalPlaces and emit change on selection", () => {
    const selectEl =
      fixture.nativeElement.querySelectorAll("app-custom-select")[2];
    const trigger = selectEl.querySelector(
      ".custom-select-trigger",
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    const opt = selectEl.querySelector(
      '.custom-select-option[data-value="0"]',
    ) as HTMLElement;
    opt?.click();
    fixture.detectChanges();
    expect(Number(component.settings().lapDecimalPlaces)).toBe(0);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    const event = {
      target: {
        value: "#ff0000",
      },
    } as any;

    component.onColorChange("columnTextColor", event);
    expect(component.settings().columnTextColor).toBe("#ff0000");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should reset color to empty string and emit change on resetColor", () => {
    component.settings().columnTextColor = "#ffffff";
    component.resetColor("columnTextColor");
    expect(component.settings().columnTextColor).toBe("");
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should trigger loadLocalFonts on font service when select element is focused", () => {
    const selectEl = fixture.nativeElement.querySelector("app-custom-select");
    selectEl.dispatchEvent(new Event("focus"));
    expect(fontServiceSpy.loadLocalFonts).toHaveBeenCalled();
  });

  it("should disable font size inputs when disableFontSizes is true", async () => {
    fixture.componentRef.setInput("disableFontSizes", true);
    fixture.detectChanges();
    await fixture.whenStable();
    const sliders = fixture.nativeElement.querySelectorAll(
      'input[type="range"]',
    );
    expect(sliders.length).toBeGreaterThan(0);
    sliders.forEach((slider: HTMLInputElement) => {
      expect(slider.disabled).toBeTrue();
    });
  });

  it("should get current columns based on practice mode", () => {
    expect(component.currentColumns).toEqual(["col1", "col2"]);
    fixture.componentRef.setInput("isPracticeMode", true);
    expect(component.currentColumns).toEqual(["pcol1"]);
  });

  it("should handle deleteColumn", () => {
    component.deleteColumn("col1");
    expect(component.globalSettings()?.racedayColumns).toEqual(["col2"]);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should return the correct column label", () => {
    expect(component.getColumnLabel("col1")).toBe("Col 1");
    expect(component.getColumnLabel("imageset_fuel-gauge-builtin")).toBe(
      "RD_COL_FUEL_GAUGE",
    );
    expect(component.getColumnLabel("default_fuel_gauge")).toBe(
      "RD_COL_FUEL_GAUGE",
    );
    expect(component.getColumnLabel("Default Fuel Gauge")).toBe(
      "RD_COL_FUEL_GAUGE",
    );
    expect(component.getColumnLabel("ghostPacing")).toBe(
      "RD_COL_GHOST_PACING_LANE_RECORD",
    );
    expect(component.getColumnLabel("ghostPacingPB")).toBe(
      "RD_COL_GHOST_PACING_PERSONAL_BEST",
    );
    expect(component.getColumnLabel("ghostPacingPersonalAvg")).toBe(
      "RD_COL_GHOST_PACING_PERSONAL_AVG",
    );
    expect(component.getColumnLabel("ghostPacingPersonalMedian")).toBe(
      "RD_COL_GHOST_PACING_PERSONAL_MEDIAN",
    );
    expect(component.getColumnLabel("ghostPacingLeaderAvg")).toBe(
      "RD_COL_GHOST_PACING_LEADER_AVG",
    );
    expect(component.getColumnLabel("ghostPacingLeaderMedian")).toBe(
      "RD_COL_GHOST_PACING_LEADER_MEDIAN",
    );
    expect(component.getColumnLabel("ghostPacingLeaderBest")).toBe(
      "RD_COL_GHOST_PACING_LEADER_BEST",
    );
    expect(component.getColumnLabel("unknown")).toBe("unknown");
  });

  it("should return correct column label for analysis columns in availableColumns", () => {
    fixture.componentRef.setInput("availableColumns", [
      { key: "standardDeviation", label: "RD_COL_STD_DEV" },
      { key: "consistencyScore", label: "RD_COL_CONSISTENCY" },
      { key: "averageTop5", label: "RD_COL_AVG_TOP_5" },
      { key: "averageTop10", label: "RD_COL_AVG_TOP_10" },
      { key: "averageTop15", label: "RD_COL_AVG_TOP_15" },
      { key: "top2Consecutive", label: "RD_COL_TOP_2_CONSECUTIVE" },
      { key: "top3Consecutive", label: "RD_COL_TOP_3_CONSECUTIVE" },
    ]);
    expect(component.getColumnLabel("standardDeviation")).toBe(
      "RD_COL_STD_DEV",
    );
    expect(component.getColumnLabel("consistencyScore")).toBe(
      "RD_COL_CONSISTENCY",
    );
    expect(component.getColumnLabel("averageTop5")).toBe("RD_COL_AVG_TOP_5");
    expect(component.getColumnLabel("averageTop10")).toBe("RD_COL_AVG_TOP_10");
    expect(component.getColumnLabel("averageTop15")).toBe("RD_COL_AVG_TOP_15");
    expect(component.getColumnLabel("top2Consecutive")).toBe(
      "RD_COL_TOP_2_CONSECUTIVE",
    );
    expect(component.getColumnLabel("top3Consecutive")).toBe(
      "RD_COL_TOP_3_CONSECUTIVE",
    );
  });

  it("should handle drag drop reordering", () => {
    const event = {
      previousIndex: 0,
      currentIndex: 1,
    } as any;
    component.drop(event);
    // current columns were ['col1', 'col2']. after drop they become ['col2', 'col1']
    expect(component.currentColumns).toEqual(["col2", "col1"]);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should handle onDragStart", () => {
    const dataTransferSpy = jasmine.createSpyObj("DataTransfer", ["setData"]);
    const event = { dataTransfer: dataTransferSpy } as any;
    component.onDragStart(event, { key: "newCol", label: "New Column" });
    expect(dataTransferSpy.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        type: "new-column",
        key: "newCol",
        label: "New Column",
      }),
    );
    expect(dataTransferSpy.effectAllowed).toBe("copy");
  });

  it("should set and get custom label", () => {
    fixture.componentRef.setInput("widget", { customSettings: {} });
    component.setCustomLabel("col1", "Custom Label");
    expect(component.widget()?.customSettings["columnLabels"]["col1"]).toBe(
      "Custom Label",
    );
    expect(changeSpy).toHaveBeenCalled();
    expect(component.getCustomLabel("col1")).toBe("Custom Label");
  });

  it("should get default column width when no custom width is set", () => {
    expect(component.getColumnWidth("driver.nickname")).toBe(0);
    expect(component.getColumnWidth("lapCount")).toBe(216);
    expect(component.getColumnWidth("physicalLapCount")).toBe(210);
  });

  it("should get and set custom column width in widget customSettings and globalSettings", () => {
    fixture.componentRef.setInput("widget", { customSettings: {} });
    component.setColumnWidth("col1", 350);
    expect(component.widget()?.customSettings["columnWidths"]["col1"]).toBe(
      350,
    );
    expect(component.globalSettings()?.columnWidths?.["col1"]).toBe(350);
    expect(changeSpy).toHaveBeenCalled();
    expect(component.getColumnWidth("col1")).toBe(350);
  });

  it("should handle practice mode column widths", () => {
    fixture.componentRef.setInput("isPracticeMode", true);
    fixture.componentRef.setInput("widget", { customSettings: {} });
    component.setColumnWidth("pcol1", 500);
    expect(component.globalSettings()?.practiceColumnWidths?.["pcol1"]).toBe(
      500,
    );
    expect(component.getColumnWidth("pcol1")).toBe(500);
  });

  it("should return default width of 170 for laneNumber in practice mode with horizontal layout", () => {
    fixture.componentRef.setInput("isPracticeMode", true);
    fixture.componentRef.setInput("settings", { isVertical: false });
    expect(component.getColumnWidth("laneNumber")).toBe(170);

    fixture.componentRef.setInput("settings", { isVertical: true });
    expect(component.getColumnWidth("laneNumber")).toBe(120);
  });

  it("should clean up column width on deleteColumn", () => {
    fixture.componentRef.setInput("widget", {
      customSettings: { columnWidths: { col1: 300 } },
    });
    const global = component.globalSettings();
    if (global) {
      global.columnWidths = { col1: 300 };
    }
    component.deleteColumn("col1");
    expect(global?.columnWidths?.["col1"]).toBeUndefined();
    expect(
      component.widget()?.customSettings["columnWidths"]["col1"],
    ).toBeUndefined();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should parse invalid or negative width values as 0", () => {
    fixture.componentRef.setInput("widget", { customSettings: {} });
    component.setColumnWidth("col1", "");
    expect(component.getColumnWidth("col1")).toBe(0);

    component.setColumnWidth("col1", -50);
    expect(component.getColumnWidth("col1")).toBe(0);

    component.setColumnWidth("col1", "abc");
    expect(component.getColumnWidth("col1")).toBe(0);
  });

  it("should use customUi columnsJson when provided", () => {
    const customUi = {
      entity_id: "custom_ui_1",
      name: "Custom UI 1",
      columnsJson: JSON.stringify(["colA", "ghostPacingPersonalAvg"]),
    } as any;
    fixture.componentRef.setInput("customUi", customUi);
    fixture.componentRef.setInput("availableColumns", [
      { key: "colA", label: "Col A" },
      { key: "ghostPacingPersonalAvg", label: "Pacing Personal Avg" },
      { key: "unusedCol", label: "Unused Col" },
    ]);
    fixture.detectChanges();

    expect(component.currentColumns).toEqual([
      "colA",
      "ghostPacingPersonalAvg",
    ]);
    expect(component.unusedColumns).toEqual([
      { key: "unusedCol", label: "Unused Col" },
    ]);

    // Test drop reordering with customUi
    const dropEvent: any = { previousIndex: 0, currentIndex: 1 };
    component.drop(dropEvent);
    expect(JSON.parse(customUi.columnsJson)).toEqual([
      "ghostPacingPersonalAvg",
      "colA",
    ]);
    expect(changeSpy).toHaveBeenCalled();

    // Test deleteColumn with customUi
    component.deleteColumn("colA");
    expect(JSON.parse(customUi.columnsJson)).toEqual([
      "ghostPacingPersonalAvg",
    ]);
    expect(component.unusedColumns.map((c) => c.key)).toContain("colA");
  });

  it("should handle sortByStandings and highlightRowOnLap defaults and updates", () => {
    expect(component.sortByStandings).toBeTrue();
    expect(component.highlightRowOnLap).toBeTrue();

    component.sortByStandings = false;
    expect(component.settings().sortByStandings).toBeFalse();
    expect(component.sortByStandings).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();

    component.highlightRowOnLap = false;
    expect(component.settings().highlightRowOnLap).toBeFalse();
    expect(component.highlightRowOnLap).toBeFalse();
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should toggle sortByStandings and highlightRowOnLap in template", () => {
    const sortCheckbox = fixture.nativeElement.querySelector(
      "#help-raceday-sort input[type='checkbox']",
    ) as HTMLInputElement;
    expect(sortCheckbox).toBeTruthy();
    sortCheckbox.click();
    fixture.detectChanges();
    expect(component.sortByStandings).toBeFalse();

    const highlightCheckbox = fixture.nativeElement.querySelector(
      "#help-raceday-highlight input[type='checkbox']",
    ) as HTMLInputElement;
    expect(highlightCheckbox).toBeTruthy();
    highlightCheckbox.click();
    fixture.detectChanges();
    expect(component.highlightRowOnLap).toBeFalse();
  });

  it("should hide sortByStandings when isPracticeMode is true", () => {
    fixture.componentRef.setInput("isPracticeMode", true);
    fixture.detectChanges();

    const sortSection =
      fixture.nativeElement.querySelector("#help-raceday-sort");
    expect(sortSection).toBeNull();

    const highlightSection = fixture.nativeElement.querySelector(
      "#help-raceday-highlight",
    );
    expect(highlightSection).toBeTruthy();
  });

  describe("Column Grouping & Folder Treatment", () => {
    beforeEach(() => {
      fixture.componentRef.setInput("availableColumns", [
        { key: "driver.name", label: "RD_COL_NAME" },
        { key: "lapCount", label: "RD_COL_LAP" },
        { key: "lastLapTime", label: "RD_COL_LAP_TIME" },
        { key: "standardDeviation", label: "RD_COL_STD_DEV" },
        { key: "gapLeader", label: "UI_EDITOR_COL_GAP_LEADER" },
        { key: "ghostPacing", label: "RD_COL_GHOST_PACING_LANE_RECORD" },
        { key: "participant.fuelLevel", label: "RD_COL_FUEL_LEVEL" },
        { key: "winProbability", label: "RD_COL_WIN_PROB" },
        { key: "qrCode", label: "RD_COL_LANE_QR" },
      ]);
      // current columns have col1, col2, so all above availableColumns are unused
      fixture.detectChanges();
    });

    it("should return column groups with count badges for unused columns", () => {
      const groups = component.getColumnGroups();
      expect(groups.length).toBe(9);
      expect(groups.map((g) => g.id)).toEqual([
        "driver-team",
        "laps-standings",
        "lap-times",
        "analysis",
        "gaps",
        "pacing",
        "telemetry",
        "predictions",
        "media-custom",
      ]);
      expect(groups[0].columns.length).toBe(1);
      expect(groups[0].columns[0].key).toBe("driver.name");
      expect(groups[3].columns[0].key).toBe("standardDeviation");
    });

    it("should toggle column group expansion", () => {
      expect(
        component.columnGroupExpandedStates.get("analysis"),
      ).toBeUndefined();
      component.toggleColumnGroup("analysis");
      expect(component.columnGroupExpandedStates.get("analysis")).toBeFalse();

      component.toggleColumnGroup("analysis");
      expect(component.columnGroupExpandedStates.get("analysis")).toBeTrue();
    });

    it("should save collapsed state to settings.collapsedColumnGroups and emit change on toggle", () => {
      component.toggleColumnGroup("telemetry");
      expect(
        component.settings().collapsedColumnGroups["telemetry"],
      ).toBeTrue();
      expect(changeSpy).toHaveBeenCalled();

      component.toggleColumnGroup("telemetry");
      expect(
        component.settings().collapsedColumnGroups["telemetry"],
      ).toBeFalse();
    });

    it("should load collapsed state from settings.collapsedColumnGroups object on initialization", () => {
      const customFixture = TestBed.createComponent(LaneViewInspectorComponent);
      const customComp = customFixture.componentInstance;
      customFixture.componentRef.setInput("settings", {
        collapsedColumnGroups: {
          analysis: true,
          telemetry: false,
        },
      });
      customFixture.componentRef.setInput("globalSettings", {});
      customFixture.componentRef.setInput("availableColumns", [
        { key: "standardDeviation", label: "Std Dev" },
      ]);
      customFixture.detectChanges();

      expect(customComp.columnGroupExpandedStates.get("analysis")).toBeFalse();
      expect(customComp.columnGroupExpandedStates.get("telemetry")).toBeTrue();

      const groups = customComp.getColumnGroups();
      const analysisGroup = groups.find((g) => g.id === "analysis");
      expect(analysisGroup?.expanded).toBeFalse();
    });

    it("should load collapsed state from settings.collapsedColumnGroups array on initialization", () => {
      const customFixture = TestBed.createComponent(LaneViewInspectorComponent);
      const customComp = customFixture.componentInstance;
      customFixture.componentRef.setInput("settings", {
        collapsedColumnGroups: ["analysis", "gaps"],
      });
      customFixture.componentRef.setInput("globalSettings", {});
      customFixture.componentRef.setInput("availableColumns", [
        { key: "col1", label: "Col 1" },
      ]);
      customFixture.detectChanges();

      expect(customComp.columnGroupExpandedStates.get("analysis")).toBeFalse();
      expect(customComp.columnGroupExpandedStates.get("gaps")).toBeFalse();

      // Toggle one that was in array to expand it
      customComp.toggleColumnGroup("analysis");
      expect(customComp.settings().collapsedColumnGroups).not.toContain(
        "analysis",
      );
      expect(customComp.settings().collapsedColumnGroups).toContain("gaps");
    });

    it("should filter groups and columns by search term", () => {
      component.columnSearchTerm = "pacing";
      fixture.detectChanges();

      const groups = component.getColumnGroups();
      expect(groups.length).toBe(1);
      expect(groups[0].id).toBe("pacing");
      expect(groups[0].columns[0].key).toBe("ghostPacing");
      expect(groups[0].expanded).toBeTrue();
    });

    it("should clear column search", () => {
      component.columnSearchTerm = "test";
      component.clearColumnSearch();
      expect(component.columnSearchTerm).toBe("");
    });

    it("should render folder headers and toggle expansion in DOM", () => {
      const headers = fixture.nativeElement.querySelectorAll(
        ".toolbox-group-header",
      );
      expect(headers.length).toBe(9);

      const firstHeader = headers[0] as HTMLElement;
      expect(firstHeader.classList.contains("expanded")).toBeTrue();
      const folderIcon = firstHeader.querySelector(".toolbox-folder-icon");
      expect(folderIcon?.textContent?.trim()).toBe("folder_open");

      // Click to collapse
      firstHeader.click();
      fixture.detectChanges();

      expect(firstHeader.classList.contains("expanded")).toBeFalse();
      expect(folderIcon?.textContent?.trim()).toBe("folder");
    });

    it("should display no matches message when search yields no columns", () => {
      component.columnSearchTerm = "nonexistent_term_xyz";
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector(".toolbox-subtitle");
      expect(emptyMsg).toBeTruthy();
      const headers = fixture.nativeElement.querySelectorAll(
        ".toolbox-group-header",
      );
      expect(headers.length).toBe(0);
    });
  });

  describe("Manage Columns Row Layout", () => {
    it("should render each column item with header input, width wrapper, and delete button on the same row", () => {
      const items = fixture.nativeElement.querySelectorAll(
        ".inspector-column-item",
      );
      expect(items.length).toBe(2);

      const firstItem = items[0] as HTMLElement;
      const colRow = firstItem.querySelector(".col-row");
      expect(colRow).toBeTruthy();

      const headerInput = colRow?.querySelector(
        ".col-header-input",
      ) as HTMLInputElement;
      expect(headerInput).toBeTruthy();

      const widthWrapper = colRow?.querySelector(".col-width-wrapper");
      expect(widthWrapper).toBeTruthy();

      const widthInput = widthWrapper?.querySelector(
        ".col-width-input",
      ) as HTMLInputElement;
      expect(widthInput).toBeTruthy();

      const deleteBtn = colRow?.querySelector(
        ".delete-btn",
      ) as HTMLButtonElement;
      expect(deleteBtn).toBeTruthy();
    });

    it("should invoke deleteColumn when clicking the row delete button", () => {
      spyOn(component, "deleteColumn").and.callThrough();
      const firstDeleteBtn = fixture.nativeElement.querySelector(
        ".inspector-column-item .delete-btn",
      ) as HTMLElement;
      expect(firstDeleteBtn).toBeTruthy();

      firstDeleteBtn.click();
      expect(component.deleteColumn).toHaveBeenCalledWith("col1");
    });

    it("should update column width when typing in the width input", () => {
      spyOn(component, "setColumnWidth").and.callThrough();
      const firstWidthInput = fixture.nativeElement.querySelector(
        ".inspector-column-item .col-width-input",
      ) as HTMLInputElement;
      expect(firstWidthInput).toBeTruthy();

      firstWidthInput.value = "1250";
      firstWidthInput.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(component.setColumnWidth).toHaveBeenCalledWith("col1", 1250);
    });

    it("should render drag handle to the left of the header input without overlapping", () => {
      const firstItem = fixture.nativeElement.querySelector(
        ".inspector-column-item",
      ) as HTMLElement;
      const dragHandle = firstItem.querySelector(
        ".col-drag-handle",
      ) as HTMLElement;
      const colInfo = firstItem.querySelector(".col-info") as HTMLElement;
      expect(dragHandle).toBeTruthy();
      expect(colInfo).toBeTruthy();

      // drag handle precedes col-info in DOM and acts as sibling in flex layout
      expect(dragHandle.nextElementSibling).toBe(colInfo);
    });
  });
});
