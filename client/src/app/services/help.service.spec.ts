import { TestBed } from "@angular/core/testing";
import { AnalyticsService } from "@app/services/analytics.service";

import { GuideStep, HelpService } from "./help.service";

describe("HelpService", () => {
  let service: HelpService;
  let AnalyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("AnalyticsService", ["trackClick"]);

    TestBed.configureTestingModule({
      providers: [HelpService, { provide: AnalyticsService, useValue: spy }],
    });
    service = TestBed.inject(HelpService);
    AnalyticsServiceSpy = TestBed.inject(
      AnalyticsService,
    ) as jasmine.SpyObj<AnalyticsService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should track help_started when guide starts", () => {
    const steps: GuideStep[] = [
      { title: "Step 1", content: "Content 1" },
      { title: "Step 2", content: "Content 2" },
    ];
    service.startGuide(steps);
    expect(AnalyticsServiceSpy.trackClick).toHaveBeenCalledWith(
      "help_started",
      { guide_name: "Step 1" },
    );
  });

  it("should track help_ended_early with step details when ended before the last step", () => {
    const steps: GuideStep[] = [
      { title: "Step 1", content: "Content 1" },
      { title: "Step 2", content: "Content 2" },
    ];
    service.startGuide(steps);
    AnalyticsServiceSpy.trackClick.calls.reset();

    service.endGuide();
    expect(AnalyticsServiceSpy.trackClick).toHaveBeenCalledWith(
      "help_ended_early",
      {
        guide_name: "Step 1",
        step_index: 0,
        step_title: "Step 1",
      },
    );
  });

  it("should track help_completed when ended on the last step", () => {
    const steps: GuideStep[] = [
      { title: "Step 1", content: "Content 1" },
      { title: "Step 2", content: "Content 2" },
    ];
    service.startGuide(steps);
    service.nextStep(); // moves to Step 2, index 1 (the last step)
    AnalyticsServiceSpy.trackClick.calls.reset();

    service.endGuide();
    expect(AnalyticsServiceSpy.trackClick).toHaveBeenCalledWith(
      "help_completed",
      { guide_name: "Step 1" },
    );
  });

  it("should automatically complete when nextStep is called on the last step", () => {
    const steps: GuideStep[] = [
      { title: "Step 1", content: "Content 1" },
      { title: "Step 2", content: "Content 2" },
    ];
    service.startGuide(steps);
    service.nextStep(); // Move to Step 2
    AnalyticsServiceSpy.trackClick.calls.reset();

    service.nextStep(); // Calling next on the last step ends the guide
    expect(AnalyticsServiceSpy.trackClick).toHaveBeenCalledWith(
      "help_completed",
      { guide_name: "Step 1" },
    );
  });
});
