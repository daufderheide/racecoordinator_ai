import { TestBed } from "@angular/core/testing";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { Subject } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";

import { GuideStep, HelpService } from "./help.service";

describe("HelpService", () => {
  let service: HelpService;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("AnalyticsService", [
      "trackEvent",
      "trackClick",
    ]);

    TestBed.configureTestingModule({
      providers: [HelpService, { provide: AnalyticsService, useValue: spy }],
    });
    service = TestBed.inject(HelpService);
    analyticsServiceSpy = TestBed.inject(
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
    expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
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
    analyticsServiceSpy.trackClick.calls.reset();

    service.endGuide();
    expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
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
    analyticsServiceSpy.trackClick.calls.reset();

    service.endGuide();
    expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
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
    analyticsServiceSpy.trackClick.calls.reset();

    service.nextStep(); // Calling next on the last step ends the guide
    expect(analyticsServiceSpy.trackClick).toHaveBeenCalledWith(
      "help_completed",
      { guide_name: "Step 1" },
    );
  });

  it("should not start guide if steps array is empty or undefined", () => {
    service.startGuide([]);
    expect(service.isVisible).toBeFalse();
    expect(service.steps.length).toBe(0);

    service.startGuide(undefined as any);
    expect(service.isVisible).toBeFalse();
  });

  it("should execute onEnter on the initial step and onLeave / onEnter across transitions", () => {
    const step1OnEnter = jasmine.createSpy("step1OnEnter");
    const step1OnLeave = jasmine.createSpy("step1OnLeave");
    const step2OnEnter = jasmine.createSpy("step2OnEnter");
    const step2OnLeave = jasmine.createSpy("step2OnLeave");

    const steps: GuideStep[] = [
      {
        title: "Step 1",
        content: "C1",
        onEnter: step1OnEnter,
        onLeave: step1OnLeave,
      },
      {
        title: "Step 2",
        content: "C2",
        onEnter: step2OnEnter,
        onLeave: step2OnLeave,
      },
    ];

    service.startGuide(steps);
    expect(step1OnEnter).toHaveBeenCalledTimes(1);
    expect(step1OnLeave).not.toHaveBeenCalled();

    service.nextStep();
    expect(step1OnLeave).toHaveBeenCalledTimes(1);
    expect(step2OnEnter).toHaveBeenCalledTimes(1);

    service.previousStep();
    expect(step2OnLeave).toHaveBeenCalledTimes(1);
    expect(step1OnEnter).toHaveBeenCalledTimes(2);
  });

  it("should correctly update hasNext and hasPrevious observable streams", () => {
    const hasNextValues: boolean[] = [];
    const hasPrevValues: boolean[] = [];
    service.hasNext$.subscribe((val) => hasNextValues.push(val));
    service.hasPrevious$.subscribe((val) => hasPrevValues.push(val));

    const steps: GuideStep[] = [
      { title: "Step 1", content: "C1" },
      { title: "Step 2", content: "C2" },
      { title: "Step 3", content: "C3" },
    ];

    service.startGuide(steps);
    expect(hasNextValues[hasNextValues.length - 1]).toBeTrue();
    expect(hasPrevValues[hasPrevValues.length - 1]).toBeFalse();

    service.nextStep(); // Step 2 (middle)
    expect(hasNextValues[hasNextValues.length - 1]).toBeTrue();
    expect(hasPrevValues[hasPrevValues.length - 1]).toBeTrue();

    service.nextStep(); // Step 3 (last)
    expect(hasNextValues[hasNextValues.length - 1]).toBeFalse();
    expect(hasPrevValues[hasPrevValues.length - 1]).toBeTrue();

    service.previousStep(); // Back to Step 2
    expect(hasNextValues[hasNextValues.length - 1]).toBeTrue();
    expect(hasPrevValues[hasPrevValues.length - 1]).toBeTrue();
  });

  it("should do nothing when previousStep is called on the first step", () => {
    const step1OnLeave = jasmine.createSpy("step1OnLeave");
    const steps: GuideStep[] = [
      { title: "Step 1", content: "C1", onLeave: step1OnLeave },
      { title: "Step 2", content: "C2" },
    ];
    service.startGuide(steps);
    expect(service.currentStepIndex).toBe(0);

    service.previousStep();
    expect(service.currentStepIndex).toBe(0);
    expect(step1OnLeave).not.toHaveBeenCalled();
  });

  it("should update isVisible property when starting and ending guide", () => {
    expect(service.isVisible).toBeFalse();
    const steps: GuideStep[] = [{ title: "Step 1", content: "Content 1" }];
    service.startGuide(steps);
    expect(service.isVisible).toBeTrue();
    service.endGuide();
    expect(service.isVisible).toBeFalse();
  });

  describe("navigation handling", () => {
    let routerEvents$: Subject<any>;
    let mockRouter: any;

    beforeEach(() => {
      routerEvents$ = new Subject<any>();
      mockRouter = {
        url: "/driver-editor",
        events: routerEvents$.asObservable(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HelpService,
          { provide: Router, useValue: mockRouter },
          {
            provide: AnalyticsService,
            useValue: jasmine.createSpyObj("AnalyticsService", [
              "trackEvent",
              "trackClick",
            ]),
          },
        ],
      });
      service = TestBed.inject(HelpService);
    });

    it("should close guided help when navigating away via NavigationStart", () => {
      service.startGuide([{ title: "Driver Step", content: "Details" }]);
      expect(service.isVisible).toBeTrue();

      // Navigate away to /raceday-setup
      routerEvents$.next(new NavigationStart(1, "/raceday-setup"));
      expect(service.isVisible).toBeFalse();
    });

    it("should keep guided help open when navigating with query parameters on the same page", () => {
      service.startGuide([{ title: "Driver Step", content: "Details" }]);
      expect(service.isVisible).toBeTrue();

      // Update query params on same route
      routerEvents$.next(new NavigationStart(2, "/driver-editor?id=d2"));
      expect(service.isVisible).toBeTrue();
    });

    it("should close guided help when navigating away via NavigationEnd", () => {
      service.startGuide([{ title: "Driver Step", content: "Details" }]);
      expect(service.isVisible).toBeTrue();

      // Redirected navigation to /
      routerEvents$.next(new NavigationEnd(3, "/raceday-setup", "/"));
      expect(service.isVisible).toBeFalse();
    });

    it("should close guided help on popstate when navigating back to a different page", () => {
      service.startGuide([{ title: "Driver Step", content: "Details" }]);
      expect(service.isVisible).toBeTrue();

      // Simulate popstate event when navigating back
      mockRouter.url = "/";
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(service.isVisible).toBeFalse();
    });
  });
});
