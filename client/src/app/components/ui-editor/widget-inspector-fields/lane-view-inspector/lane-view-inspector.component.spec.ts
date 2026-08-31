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
    const selectEl = fixture.nativeElement.querySelectorAll("select")[1]; // second select
    selectEl.value = "1";
    selectEl.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(Number(component.settings().timeDecimalPlaces)).toBe(1);
    expect(changeSpy).toHaveBeenCalled();
  });

  it("should bind lapDecimalPlaces and emit change on selection", () => {
    const selectEl = fixture.nativeElement.querySelectorAll("select")[2]; // third select
    selectEl.value = "0";
    selectEl.dispatchEvent(new Event("change"));
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
    const selectEl = fixture.nativeElement.querySelector("select");
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
});
