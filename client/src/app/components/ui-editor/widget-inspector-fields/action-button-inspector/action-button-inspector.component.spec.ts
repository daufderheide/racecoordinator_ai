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
    fixture.componentRef.setInput("widget", {
      widgetType: "action-start-resume",
      customSettings: {},
    });
    expect(component).toBeTruthy();
  });

  it("should return correct action label for action-open-season-results", () => {
    fixture.componentRef.setInput("widget", {
      widgetType: "action-open-season-results",
      customSettings: {},
    });
    expect(component.actionLabelKey).toBe("RD_WIN_SEASON_RESULTS");
  });
});
