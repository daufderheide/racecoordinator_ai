import { CommonModule } from "@angular/common";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Role } from "@app/models/role";
import { AbsoluteWidgetNode } from "@app/models/settings";
import { AuthService } from "@app/services/auth.service";

import { RacedayActionButtonComponent } from "./raceday-action-button.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("RacedayActionButtonComponent", () => {
  let component: RacedayActionButtonComponent;
  let fixture: ComponentFixture<RacedayActionButtonComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockWidget: AbsoluteWidgetNode = {
    id: "test",
    widgetType: "action-start-resume",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    zIndex: 100,
  };

  const mockParent = {
    isUIEditorMode: () => false,
    isStartResumeDisabled: true,
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj("AuthService", [], {
      currentRole: Role.DIRECTOR,
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule, MockTranslatePipe, RacedayActionButtonComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayActionButtonComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("parent", mockParent);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be enabled in UI editor mode regardless of race state", () => {
    mockParent.isUIEditorMode = () => true;
    mockParent.isStartResumeDisabled = true;
    expect(component.isActionDisabled).toBeFalse();
  });

  it("should be disabled if user is a viewer", () => {
    mockParent.isUIEditorMode = () => false;
    authServiceSpy = jasmine.createSpyObj("AuthService", [], {
      currentRole: Role.VIEWER,
    });
    // Need to recreate component with new spy
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CommonModule, MockTranslatePipe, RacedayActionButtonComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(RacedayActionButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("widget", mockWidget);
    fixture.componentRef.setInput("parent", mockParent);

    expect(component.isActionDisabled).toBeTrue();
  });

  it("should be disabled if parent action is disabled and not in UI editor mode", () => {
    mockParent.isUIEditorMode = () => false;
    mockParent.isStartResumeDisabled = true;
    expect(component.isActionDisabled).toBeTrue();
  });

  it("should be enabled if parent action is enabled and not in UI editor mode", () => {
    mockParent.isUIEditorMode = () => false;
    mockParent.isStartResumeDisabled = false;
    expect(component.isActionDisabled).toBeFalse();
  });

  describe("Widget Actions and Labels", () => {
    const actionTests = [
      {
        widgetType: "action-start-resume",
        label: "RD_MENU_START_RESUME",
        action: "START_RESUME",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-pause",
        label: "RD_MENU_PAUSE",
        action: "PAUSE",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-next-heat",
        label: "RD_MENU_NEXT_HEAT",
        action: "NEXT_HEAT",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-restart-heat",
        label: "RD_MENU_RESTART",
        action: "RESTART_HEAT",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-defer-heat",
        label: "RD_MENU_DEFER",
        action: "DEFER_HEAT",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-skip-heat",
        label: "RD_MENU_SKIP_HEAT",
        action: "SKIP_HEAT",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-skip-race",
        label: "RD_MENU_SKIP_RACE",
        action: "SKIP_RACE",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-add-lap",
        label: "RD_MENU_ADD_LAP",
        action: "ADD_LAP",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-modify-heats",
        label: "RD_MENU_MODIFY",
        action: "MODIFY",
        method: "onMenuSelect",
      },
      {
        widgetType: "action-export-pdf",
        label: "RD_MENU_EXPORT_PDF",
        action: "EXPORT_PDF",
        method: "onFileMenuSelect",
      },
      {
        widgetType: "action-export-csv",
        label: "RD_MENU_EXPORT_CSV",
        action: "EXPORT_CSV",
        method: "onFileMenuSelect",
      },
      {
        widgetType: "action-open-heat-results",
        label: "RD_WIN_HEAT_RESULTS",
        action: "HEAT_RESULTS",
        method: "onWindowsMenuSelect",
      },
      {
        widgetType: "action-open-race-results",
        label: "RD_WIN_RACE_RESULTS",
        action: "RACE_RESULTS",
        method: "onWindowsMenuSelect",
      },
    ];

    actionTests.forEach((testCase) => {
      it(`should return correct label and dispatch correct event for ${testCase.widgetType}`, () => {
        // Setup mock widget
        const testWidget: AbsoluteWidgetNode = {
          ...mockWidget,
          widgetType: testCase.widgetType as any,
        };
        fixture.componentRef.setInput("widget", testWidget);

        // Ensure action is not disabled
        mockParent.isUIEditorMode = () => true;

        // Setup spy on the parent component method
        const methodSpy = jasmine.createSpy(testCase.method);
        (mockParent as any)[testCase.method] = methodSpy;
        fixture.componentRef.setInput("parent", mockParent);

        fixture.detectChanges();

        // Test label
        expect(component.actionLabelKey).toBe(testCase.label);

        // Test click
        const event = new Event("click");
        spyOn(event, "stopPropagation");
        component.onClick(event);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(methodSpy).toHaveBeenCalledWith(testCase.action);
      });
    });
  });
});
