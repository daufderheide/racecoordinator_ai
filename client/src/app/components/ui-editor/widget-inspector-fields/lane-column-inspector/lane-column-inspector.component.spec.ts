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
});
