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
});
