import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { DataService } from "@app/data.service";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { CustomWidgetService } from "@app/services/custom-widget.service";
import { DEFAULT_FONTS, FontService } from "@app/services/font.service";
import { TranslationService } from "@app/services/translation.service";

import { WidgetInspectorFieldsComponent } from "./widget-inspector-fields.component";

describe("WidgetInspectorFieldsComponent", () => {
  let component: WidgetInspectorFieldsComponent;
  let fixture: ComponentFixture<WidgetInspectorFieldsComponent>;

  beforeEach(async () => {
    const mockTranslationService = {
      translations$: new BehaviorSubject<{ [key: string]: string }>({}),
      translate: (key: string) => key,
    };

    const mockFontService = {
      availableFonts: signal(DEFAULT_FONTS).asReadonly(),
    };

    const mockDataService = {
      getDrivers: () => new BehaviorSubject([]).asObservable(),
      getTracks: () => new BehaviorSubject([]).asObservable(),
    };

    const mockCustomWidgetService = {
      getWidgetDefinition: () => undefined,
      getCustomWidgets: () => [],
      isCustomWidget: (type: string) => type?.startsWith("custom:") ?? false,
    };

    await TestBed.configureTestingModule({
      imports: [WidgetInspectorFieldsComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: FontService, useValue: mockFontService },
        { provide: DataService, useValue: mockDataService },
        { provide: CustomWidgetService, useValue: mockCustomWidgetService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetInspectorFieldsComponent);
    component = fixture.componentInstance;
    const mockWidget: AbsoluteWidgetNode = {
      id: "w1",
      widgetType: "timer",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      zIndex: 1,
    };
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should detect custom widget types", () => {
    expect(component.isCustomWidget("custom:my-widget")).toBeTrue();
    expect(component.isCustomWidget("timer")).toBeFalse();
    expect(component.isCustomWidget(undefined)).toBeFalse();
  });

  it("should emit change on onSettingsChange", () => {
    spyOn(component.change, "emit");
    component.onSettingsChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should render heat-list inspector when widget is heat-list", () => {
    const heatListWidget: AbsoluteWidgetNode = {
      id: "w-heat-list",
      widgetType: "heat-list",
      x: 0,
      y: 0,
      width: 384,
      height: 400,
      zIndex: 1,
      customSettings: {
        showHeader: true,
        autoScrollToCurrent: true,
        highlightCurrentHeat: true,
        heatColumns: "auto",
        laneColumns: "auto",
      },
    };
    fixture.componentRef.setInput("widget", heatListWidget);
    fixture.detectChanges();

    const inspectorEl = fixture.nativeElement.querySelector(
      "app-heat-list-inspector",
    );
    expect(inspectorEl).toBeTruthy();
  });

  it("should render progress-gauge inspector when widget is progress-gauge", () => {
    const progressGaugeWidget: AbsoluteWidgetNode = {
      id: "w-progress-gauge",
      widgetType: "progress-gauge",
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      zIndex: 1,
      customSettings: {
        gaugeType: "heat-progress",
        gaugeStyle: "thermometer",
      },
    };
    fixture.componentRef.setInput("widget", progressGaugeWidget);
    fixture.detectChanges();

    const inspectorEl = fixture.nativeElement.querySelector(
      "app-progress-gauge-inspector",
    );
    expect(inspectorEl).toBeTruthy();
  });

  it("should render lane-column inspector when widget is lane-column", () => {
    const laneColWidget: AbsoluteWidgetNode = {
      id: "w-lane-col",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 200,
      height: 120,
      zIndex: 1,
      customSettings: {
        columnKey: "lastLapTime",
        bindingMode: "lane",
        targetIndex: 0,
      },
    };
    fixture.componentRef.setInput("widget", laneColWidget);
    fixture.detectChanges();

    const inspectorEl = fixture.nativeElement.querySelector(
      "app-lane-column-inspector",
    );
    expect(inspectorEl).toBeTruthy();
  });

  it("should forward requestReplicate when lane-column inspector requests replicate", () => {
    const laneColWidget: AbsoluteWidgetNode = {
      id: "w-lane-col",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 200,
      height: 120,
      zIndex: 1,
      customSettings: {
        columnKey: "lastLapTime",
        bindingMode: "lane",
        targetIndex: 0,
      },
    };
    fixture.componentRef.setInput("widget", laneColWidget);
    fixture.componentRef.setInput("totalLanes", 6);
    fixture.detectChanges();

    expect(component.totalLanes()).toBe(6);

    spyOn(component.requestReplicate, "emit");
    const laneColComp =
      fixture.debugElement.children[0].children[0].componentInstance;
    expect(laneColComp.totalLanes()).toBe(6);
    laneColComp.requestReplicate.emit();
    expect(component.requestReplicate.emit).toHaveBeenCalled();
  });

  it("should forward deleteGrid when lane-column inspector emits deleteGrid", () => {
    const laneColWidget: AbsoluteWidgetNode = {
      id: "w-lane-col",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 200,
      height: 120,
      zIndex: 1,
      customSettings: {
        columnKey: "lastLapTime",
        bindingMode: "lane",
        targetIndex: 0,
        gridId: "grid-test-fwd",
      },
    };
    fixture.componentRef.setInput("widget", laneColWidget);
    fixture.detectChanges();

    spyOn(component.deleteGrid, "emit");
    const laneColComp =
      fixture.debugElement.children[0].children[0].componentInstance;
    laneColComp.deleteGrid.emit("grid-test-fwd");
    expect(component.deleteGrid.emit).toHaveBeenCalledWith("grid-test-fwd");

    spyOn(component.bringGridToFront, "emit");
    laneColComp.bringGridToFront.emit("grid-test-fwd");
    expect(component.bringGridToFront.emit).toHaveBeenCalledWith(
      "grid-test-fwd",
    );
  });

  it("should render action-button-inspector when widget is action-forward or action-close", () => {
    fixture.componentRef.setInput("widget", {
      id: "w-forward",
      widgetType: "action-forward",
      x: 0,
      y: 0,
      width: 36,
      height: 36,
      zIndex: 1,
      customSettings: {},
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("app-action-button-inspector"),
    ).toBeTruthy();

    fixture.componentRef.setInput("widget", {
      id: "w-close",
      widgetType: "action-close",
      x: 0,
      y: 0,
      width: 36,
      height: 36,
      zIndex: 1,
      customSettings: {},
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("app-action-button-inspector"),
    ).toBeTruthy();
  });

  it("should identify lane column widgets including custom widgets in grids", () => {
    const standardCol: AbsoluteWidgetNode = {
      id: "w-std",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      zIndex: 1,
    };
    expect(component.isLaneColumnWidget(standardCol)).toBeTrue();

    const customInGrid: AbsoluteWidgetNode = {
      id: "w-custom-grid",
      widgetType: "custom:advanced-laps",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      zIndex: 1,
      customSettings: { gridId: "grid-123" },
    };
    expect(component.isLaneColumnWidget(customInGrid)).toBeTrue();

    const customWithLane: AbsoluteWidgetNode = {
      id: "w-custom-lane",
      widgetType: "custom:advanced-laps",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      zIndex: 1,
      customSettings: { gridLane: 0 },
    };
    expect(component.isLaneColumnWidget(customWithLane)).toBeTrue();

    const standaloneCustom: AbsoluteWidgetNode = {
      id: "w-custom-solo",
      widgetType: "custom:banner",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      zIndex: 1,
      customSettings: {},
    };
    expect(component.isLaneColumnWidget(standaloneCustom)).toBeFalse();
  });

  it("should render lane-column-inspector when custom widget is in a grid", () => {
    const customGridWidget: AbsoluteWidgetNode = {
      id: "w-custom-grid",
      widgetType: "custom:advanced-laps",
      x: 0,
      y: 0,
      width: 200,
      height: 90,
      zIndex: 1,
      customSettings: {
        gridId: "grid-test",
        gridLane: 0,
        targetIndex: 0,
        useLaneColors: true,
      },
    };
    fixture.componentRef.setInput("widget", customGridWidget);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector("app-lane-column-inspector"),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        ":scope > app-custom-widget-inspector",
      ),
    ).toBeNull();
  });

  it("should render lane-column-inspector when custom widget has insets configured", () => {
    const customInsetWidget: AbsoluteWidgetNode = {
      id: "w-custom-inset",
      widgetType: "custom:lap-gauge",
      x: 0,
      y: 0,
      width: 250,
      height: 120,
      zIndex: 1,
      customSettings: {
        insets: { "top-right": "lastLapTime" },
      },
    };
    fixture.componentRef.setInput("widget", customInsetWidget);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector("app-lane-column-inspector"),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        ":scope > app-custom-widget-inspector",
      ),
    ).toBeNull();
  });

  it("should render custom-widget-inspector when custom widget is not in a grid or lane", () => {
    const customSoloWidget: AbsoluteWidgetNode = {
      id: "w-custom-solo",
      widgetType: "custom:banner",
      x: 0,
      y: 0,
      width: 300,
      height: 100,
      zIndex: 1,
      customSettings: {},
    };
    fixture.componentRef.setInput("widget", customSoloWidget);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector("app-custom-widget-inspector"),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector("app-lane-column-inspector"),
    ).toBeNull();
  });

  it("should forward selectedAnchor and emit anchorChange", () => {
    const laneColWidget: AbsoluteWidgetNode = {
      id: "w-lane-col",
      widgetType: "lane-column",
      x: 0,
      y: 0,
      width: 200,
      height: 90,
      zIndex: 1,
      customSettings: {
        columnKey: "lastLapTime",
      },
    };
    fixture.componentRef.setInput("widget", laneColWidget);
    fixture.componentRef.setInput("selectedAnchor", "top-left");
    fixture.detectChanges();

    expect(component.selectedAnchor()).toBe("top-left");

    const spy = spyOn(component.anchorChange, "emit");
    component.onAnchorChange("top-right");
    expect(spy).toHaveBeenCalledWith("top-right");
  });
});
