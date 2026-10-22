import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { CustomWidgetService } from "@app/services/custom-widget.service";

import { CustomWidgetInspectorComponent } from "./custom-widget-inspector.component";

describe("CustomWidgetInspectorComponent", () => {
  let component: CustomWidgetInspectorComponent;
  let fixture: ComponentFixture<CustomWidgetInspectorComponent>;
  let mockCustomWidgetService: jasmine.SpyObj<CustomWidgetService>;

  const mockWidget: AbsoluteWidgetNode = {
    id: "cw1",
    widgetType: "custom:telemetry",
    x: 100,
    y: 100,
    width: 400,
    height: 250,
    zIndex: 10,
    customSettings: {
      showSpeed: true,
      accentColor: "#f59e0b",
      speedLimit: 60,
    },
  };

  const mockDefinition = {
    folderName: "telemetry",
    manifest: {
      id: "telemetry",
      name: "Live Telemetry",
      description: "Displays live telemetry stats",
      settingsSchema: [
        {
          key: "showSpeed",
          label: "Show Speed",
          type: "boolean",
          default: true,
        },
        {
          key: "speedLimit",
          label: "Speed Limit",
          type: "number",
          default: 50,
        },
        {
          key: "accentColor",
          label: "Accent Color",
          type: "color",
          default: "#ffffff",
        },
        {
          key: "mode",
          label: "Display Mode",
          type: "select",
          default: "full",
          colorKey: "modeColor",
          colorDefault: "#38bdf8",
          options: [
            { label: "Full", value: "full" },
            { label: "Compact", value: "compact" },
          ],
        },
        {
          key: "title",
          label: "Widget Title",
          type: "string",
          default: "Stats",
        },
      ],
    },
  } as any;

  beforeEach(async () => {
    mockCustomWidgetService = jasmine.createSpyObj("CustomWidgetService", [
      "getWidgetDefinition",
    ]);
    mockCustomWidgetService.getWidgetDefinition.and.returnValue(mockDefinition);

    await TestBed.configureTestingModule({
      imports: [CustomWidgetInspectorComponent],
      providers: [
        { provide: CustomWidgetService, useValue: mockCustomWidgetService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomWidgetInspectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", { ...mockWidget });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should retrieve schema and definition from CustomWidgetService", () => {
    expect(component.definition).toBe(mockDefinition);
    expect(component.schema.length).toBe(5);
    expect(component.widgetName).toBe("Live Telemetry");
    expect(component.widgetDescription).toBe("Displays live telemetry stats");
  });

  it("should get setting value with fallback default", () => {
    expect(component.getSettingValue("showSpeed", false)).toBeTrue();
    expect(component.getSettingValue("nonExistent", "fallback")).toBe(
      "fallback",
    );
  });

  it("should update customSettings and emit change when onSettingChanged is called", () => {
    spyOn(component.change, "emit");

    component.onSettingChanged("speedLimit", 80);
    expect(component.widget().customSettings?.["speedLimit"]).toBe(80);
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should handle color change from event", () => {
    spyOn(component.change, "emit");
    const event = { target: { value: "#10b981" } } as any;

    component.onColorChange("accentColor", event);
    expect(component.widget().customSettings?.["accentColor"]).toBe("#10b981");
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should reset color to default or empty string", () => {
    spyOn(component.change, "emit");

    component.resetColor("accentColor", "#ffffff");
    expect(component.widget().customSettings?.["accentColor"]).toBe("#ffffff");
    expect(component.change.emit).toHaveBeenCalled();

    component.resetColor("accentColor");
    expect(component.widget().customSettings?.["accentColor"]).toBe("");
  });

  it("should validate and sanitize color values with toValidHexColor", () => {
    expect(component.toValidHexColor("#123456", "#ffffff")).toBe("#123456");
    expect(component.toValidHexColor("#f00", "#000000")).toBe("#ff0000");
    expect(component.toValidHexColor("", "#ffffff")).toBe("#ffffff");
    expect(component.toValidHexColor(undefined, "#112233")).toBe("#112233");
    expect(component.toValidHexColor(null, "#223344")).toBe("#223344");
    expect(component.toValidHexColor("rgba(15, 23, 42, 0.85)", "#0f172a")).toBe(
      "#0f172a",
    );
    expect(component.toValidHexColor("not-a-color", "#ffffff")).toBe("#ffffff");
  });

  it("should fall back to valid hex color when customSettings color is empty string", () => {
    component.widget().customSettings!["accentColor"] = "";
    fixture.detectChanges();

    const colorInput = fixture.nativeElement.querySelector(
      ".color-picker-input",
    );
    expect(colorInput).toBeTruthy();
    expect(colorInput.value).toBe("#ffffff");
  });

  it("should handle checkbox, number, text, and select events", () => {
    spyOn(component.change, "emit");

    component.onCheckboxChange("showSpeed", {
      target: { checked: false },
    } as any);
    expect(component.widget().customSettings?.["showSpeed"]).toBeFalse();
    expect(component.change.emit).toHaveBeenCalled();

    component.onCheckboxChange("showSpeed", {
      target: { checked: true },
    } as any);
    expect(component.widget().customSettings?.["showSpeed"]).toBeTrue();

    component.onNumberInput("speedLimit", { target: { value: "75" } } as any);
    expect(component.widget().customSettings?.["speedLimit"]).toBe(75);

    component.onTextInput("title", {
      target: { value: "Speed Dashboard" },
    } as any);
    expect(component.widget().customSettings?.["title"]).toBe(
      "Speed Dashboard",
    );

    component.onSelectChange("mode", { target: { value: "compact" } } as any);
    expect(component.widget().customSettings?.["mode"]).toBe("compact");
  });

  it("should render inline color picker when field has colorKey", () => {
    const inlinePickers = fixture.nativeElement.querySelectorAll(
      ".inline-color-picker",
    );
    expect(inlinePickers.length).toBeGreaterThanOrEqual(1);

    const colorInput = inlinePickers[0].querySelector("input[type='color']");
    expect(colorInput).toBeTruthy();
  });
});
