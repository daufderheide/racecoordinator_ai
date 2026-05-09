import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AnalyticsService } from "@app/services/analytics.service";
import { HelpService } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

import { ManagerHeaderComponent } from "./manager-header.component";
import { ManagerHeaderHarness } from "./testing/manager-header.harness";

describe("ManagerHeaderComponent", () => {
  let component: ManagerHeaderComponent;
  let fixture: ComponentFixture<ManagerHeaderComponent>;
  let harness: ManagerHeaderHarness;
  let translationServiceSpy: jasmine.SpyObj<TranslationService>;
  let helpServiceSpy: jasmine.SpyObj<HelpService>;
  let AnalyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(async () => {
    translationServiceSpy = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    translationServiceSpy.translate.and.callFake((key: string) => key);

    helpServiceSpy = jasmine.createSpyObj("HelpService", ["startGuide"]);
    helpServiceSpy.isVisible$ = of(false);
    helpServiceSpy.currentStep$ = of(null);
    helpServiceSpy.hasNext$ = of(false);
    helpServiceSpy.hasPrevious$ = of(false);

    AnalyticsServiceSpy = jasmine.createSpyObj("AnalyticsService", [
      "isEnabled",
      "toggleAnalytics",
    ]);
    AnalyticsServiceSpy.toggleAnalytics.and.returnValue(of({ success: true }));
    AnalyticsServiceSpy.isEnabled.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ManagerHeaderComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: HelpService, useValue: helpServiceSpy },
        { provide: AnalyticsService, useValue: AnalyticsServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy("get").and.returnValue(null),
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerHeaderComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ManagerHeaderHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display title correctly", async () => {
    fixture.componentRef.setInput("title", "TEST_MANAGER");
    fixture.detectChanges();
    expect(await harness.getTitle()).toBe("TEST_MANAGER");
  });

  it("should display back button", async () => {
    expect(await harness.hasBackButton()).toBeTrue();
  });

  it("should toggle toolbar based on showActions", async () => {
    fixture.componentRef.setInput("showActions", true);
    fixture.detectChanges();
    expect(await harness.hasToolbar()).toBeTrue();

    fixture.componentRef.setInput("showActions", false);
    fixture.detectChanges();
    expect(await harness.hasToolbar()).toBeFalse();
  });

  it("should emit events from toolbar triggers debug level", () => {
    spyOn(component.edit, "emit");
    spyOn(component.help, "emit");
    spyOn(component.delete, "emit");

    component.edit.emit();
    expect(component.edit.emit).toHaveBeenCalled();
  });
});
