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
});
