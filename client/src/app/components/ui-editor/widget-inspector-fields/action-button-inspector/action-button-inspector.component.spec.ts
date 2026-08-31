import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { ActionButtonInspectorComponent } from "./action-button-inspector.component";

describe("ActionButtonInspectorComponent", () => {
  let component: ActionButtonInspectorComponent;
  let fixture: ComponentFixture<ActionButtonInspectorComponent>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [ActionButtonInspectorComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionButtonInspectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", {
      id: "w1",
      widgetType: "action-start-resume",
      x: 0,
      y: 0,
      customSettings: {},
    });
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should default customSettings if missing", () => {
    fixture.componentRef.setInput("widget", {
      id: "w2",
      widgetType: "action-pause",
      x: 0,
      y: 0,
    } as any);
    expect(component.settings).toEqual({});
  });

  it("should return correct action label keys for all widget types", () => {
    const expectations: Record<string, string> = {
      "action-start-resume": "RD_MENU_START_RESUME",
      "action-pause": "RD_MENU_PAUSE",
      "action-next-heat": "RD_MENU_NEXT_HEAT",
      "action-restart-heat": "RD_MENU_RESTART",
      "action-defer-heat": "RD_MENU_DEFER",
      "action-skip-heat": "RD_MENU_SKIP_HEAT",
      "action-skip-race": "RD_MENU_SKIP_RACE",
      "action-add-lap": "RD_MENU_ADD_LAP",
      "action-modify-heats": "RD_MENU_MODIFY",
      "action-export-pdf": "RD_MENU_EXPORT_PDF",
      "action-export-csv": "RD_MENU_EXPORT_CSV",
      "action-export-xls": "RD_MENU_EXPORT_XLS",
      "action-open-heat-results": "RD_WIN_HEAT_RESULTS",
      "action-open-race-results": "RD_WIN_RACE_RESULTS",
      "action-open-season-results": "RD_WIN_SEASON_RESULTS",
      "action-open-prediction-results": "RD_WIN_PREDICTION_RESULTS",
      "action-master-power-on": "RD_MENU_MAIN_POWER_ON",
      "action-master-power-off": "RD_MENU_MAIN_POWER_OFF",
      "unknown-action": "",
    };

    for (const [type, expectedKey] of Object.entries(expectations)) {
      fixture.componentRef.setInput("widget", {
        widgetType: type,
        customSettings: {},
      });
      expect(component.actionLabelKey).toBe(expectedKey);
    }
  });

  it("should emit change on onFieldChange", () => {
    spyOn(component.change, "emit");
    component.onFieldChange();
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should update color and emit change on onColorChange", () => {
    spyOn(component.change, "emit");
    const fakeEvent = {
      target: { value: "#ff0000" },
    } as unknown as Event;

    component.onColorChange("textColor", fakeEvent);
    expect(component.settings.textColor).toBe("#ff0000");
    expect(component.change.emit).toHaveBeenCalled();
  });

  it("should reset color and emit change on resetColor", () => {
    component.settings.textColor = "#ff0000";
    spyOn(component.change, "emit");

    component.resetColor("textColor");
    expect(component.settings.textColor).toBe("");
    expect(component.change.emit).toHaveBeenCalled();
  });
});
