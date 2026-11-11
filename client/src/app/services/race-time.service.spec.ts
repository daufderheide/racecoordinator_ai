import { TestBed } from "@angular/core/testing";
import { BehaviorSubject, Subject } from "rxjs";
import { FinishMethod } from "@app/models/heat_scoring";
import { IRaceTime, RaceState } from "@app/proto/antigravity";

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";
import { RaceTimeService } from "./race-time.service";

describe("RaceTimeService", () => {
  let service: RaceTimeService;
  let raceTimeSubject: Subject<IRaceTime>;
  let raceStateSubject: Subject<RaceState>;
  let selectedRaceSubject: BehaviorSubject<any>;
  let mockRaceService: any;
  let mockRaceConnectionService: any;

  beforeEach(() => {
    raceTimeSubject = new Subject<IRaceTime>();
    raceStateSubject = new Subject<RaceState>();
    selectedRaceSubject = new BehaviorSubject<any>(null);

    mockRaceService = {
      selectedRace$: selectedRaceSubject.asObservable(),
      getRace: jasmine
        .createSpy("getRace")
        .and.callFake(() => selectedRaceSubject.getValue()),
    };

    mockRaceConnectionService = {
      raceTime$: raceTimeSubject.asObservable(),
      raceState$: raceStateSubject.asObservable(),
    };

    TestBed.configureTestingModule({
      providers: [
        RaceTimeService,
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
      ],
    });

    service = TestBed.inject(RaceTimeService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Timer Formatting during RACING", () => {
    beforeEach(() => {
      service.raceState = RaceState.RACING;
    });

    it("should format hours correctly (3665s -> 1:01:05)", () => {
      service.time = 3665;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("1:01:05");
    });

    it("should format minutes correctly (361s -> 6:01)", () => {
      service.time = 361;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("6:01");
    });

    it("should format minutes with padded seconds (65s -> 1:05)", () => {
      service.time = 65;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("1:05");
    });

    it("should format seconds only (45s -> 45)", () => {
      service.time = 45;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("45");
    });

    it("should show high-precision decimals for countdown < 10s (9.5s -> 9.50)", () => {
      service.time = 9.5;
      service.timeFormat = "1.2-2";
      expect(service.formattedTime).toBe("9.50");
    });

    it("should not show decimals for > 10s (61.5s -> 1:01)", () => {
      service.time = 61.5;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("1:01");
    });

    it("should format 59.9s as 59 when decimal format has 0 fraction digits (1.0-0)", () => {
      service.time = 59.9;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("59");
    });

    it("should show high-precision decimals for countdown when format has decimals > 0 (59.9s -> 59.90)", () => {
      service.time = 59.9;
      service.timeFormat = "1.2-2";
      expect(service.formattedTime).toBe("59.90");
    });

    it("should handle zero correctly", () => {
      service.time = 0;
      service.timeFormat = "1.0-0";
      expect(service.formattedTime).toBe("0");
    });

    it("should show '0' when state is HEAT_OVER and time is <= 0", () => {
      service.raceState = RaceState.HEAT_OVER;
      service.time = 0;
      expect(service.formattedTime).toBe("0");

      service.time = -1;
      expect(service.formattedTime).toBe("0");
    });
  });

  describe("Timer Formatting Presets and Subsecond Modes", () => {
    beforeEach(() => {
      service.raceState = RaceState.RACING;
    });

    it("should format as mm_ss when configured", () => {
      service.setTimerFormatOptions({ format: "mm_ss" });
      service.time = 83;
      expect(service.formattedTime).toBe("01:23");

      service.time = 45;
      expect(service.formattedTime).toBe("00:45");
    });

    it("should format as m_ss when configured", () => {
      service.setTimerFormatOptions({ format: "m_ss" });
      service.time = 83;
      expect(service.formattedTime).toBe("1:23");

      service.time = 45;
      expect(service.formattedTime).toBe("0:45");
    });

    it("should format as hh_mm_ss when configured", () => {
      service.setTimerFormatOptions({ format: "hh_mm_ss" });
      service.time = 83;
      expect(service.formattedTime).toBe("00:01:23");
    });

    it("should format as seconds when configured", () => {
      service.setTimerFormatOptions({ format: "seconds" });
      service.time = 83;
      expect(service.formattedTime).toBe("83");
    });

    it("should support always showing subseconds", () => {
      service.setTimerFormatOptions({
        format: "mm_ss",
        subsecondMode: "always",
        subsecondDecimals: 2,
      });
      service.time = 75.42;
      expect(service.formattedTime).toBe("01:15.42");
    });

    it("should support never showing subseconds", () => {
      service.setTimerFormatOptions({
        format: "dynamic",
        subsecondMode: "never",
        subsecondThreshold: 10,
        subsecondDecimals: 2,
      });
      service.time = 9.5;
      expect(service.formattedTime).toBe("9");
    });

    it("should update timeFormat to decimals during handleRaceTimeUpdate when subsecondMode is always", () => {
      service.setTimerFormatOptions({
        subsecondMode: "always",
        subsecondDecimals: 2,
      });
      service.handleRaceTimeUpdate({
        time: 75.42,
        autoStartRemaining: 0,
        autoAdvanceRemaining: 0,
      });
      expect(service.timeFormat).toBe("1.2-2");
    });

    it("should update timeFormat to 1.0-0 during handleRaceTimeUpdate when subsecondMode is never", () => {
      service.setTimerFormatOptions({
        subsecondMode: "never",
        subsecondDecimals: 2,
      });
      service.handleRaceTimeUpdate({
        time: 5,
        autoStartRemaining: 0,
        autoAdvanceRemaining: 0,
      });
      expect(service.timeFormat).toBe("1.0-0");
    });
  });

  describe("FinishMethod and State Display", () => {
    it("should display '--' when NOT_STARTED and finishMethod is not Timed", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Lap },
      });
      service.raceState = RaceState.NOT_STARTED;
      expect(service.formattedTime).toBe("--");
    });

    it("should display duration when NOT_STARTED and finishMethod is Timed", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 125 },
      });
      service.raceState = RaceState.NOT_STARTED;
      expect(service.formattedTime).toBe("2:05");
    });

    it("should display hours duration when NOT_STARTED and finishMethod is Timed (>3600s)", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 3665 },
      });
      service.raceState = RaceState.NOT_STARTED;
      expect(service.formattedTime).toBe("1:01:05");
    });

    it("should display seconds duration when NOT_STARTED and finishMethod is Timed (<60s)", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 45 },
      });
      service.raceState = RaceState.NOT_STARTED;
      expect(service.formattedTime).toBe("45");
    });

    it("should display duration during STARTING with countdown overlay for Timed races", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 180 },
      });
      service.raceState = RaceState.STARTING;
      service.showCountdownOverlay = true;
      service.isRestarting = false;
      expect(service.formattedTime).toBe("3:00");
    });

    it("should not display duration during STARTING when isRestarting is true", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 180 },
      });
      service.raceState = RaceState.PAUSED;
      service.raceState = RaceState.STARTING; // isRestarting becomes true
      service.time = 50;
      expect(service.isRestarting).toBeTrue();
      expect(service.formattedTime).toBe("50");
    });
  });

  describe("Auto Timers and Warmup", () => {
    it("should update autoStatusLabel correctly", () => {
      service.raceState = RaceState.NOT_STARTED;
      service.autoStartRemaining = 5;
      expect(service.autoStatusLabel).toBe("RD_AUTO_STARTING");

      service.raceState = RaceState.PAUSED;
      expect(service.autoStatusLabel).toBe("");

      service.raceState = RaceState.HEAT_OVER;
      service.autoStartRemaining = 0;
      service.autoAdvanceRemaining = 3;
      expect(service.autoStatusLabel).toBe("RD_AUTO_ADVANCING");

      service.raceState = RaceState.RACING;
      expect(service.autoStatusLabel).toBe("");

      service.raceState = RaceState.HEAT_OVER;
      service.autoAdvanceRemaining = 0;
      expect(service.autoStatusLabel).toBe("");
    });

    it("should evaluate isWarmup and isCooldown correctly across auto-start and auto-advance states", () => {
      let latestWarmup: boolean | undefined;
      let latestCooldown: boolean | undefined;
      const sub1 = service.isWarmup$.subscribe((w) => (latestWarmup = w));
      const sub2 = service.isCooldown$.subscribe((c) => (latestCooldown = c));

      selectedRaceSubject.next({
        auto_start_warmup_time: 5,
        auto_start_time: 10,
        auto_advance_warmup_time: 4,
        auto_advance_time: 12,
      });

      service.raceState = RaceState.NOT_STARTED;
      service.autoStartRemaining = 8;
      expect(service.isWarmup).toBeTrue();
      expect(service.isCooldown).toBeFalse();
      expect(latestWarmup).toBeTrue();
      expect(latestCooldown).toBeFalse();

      service.autoStartRemaining = 2;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();

      service.raceState = RaceState.PAUSED;
      service.autoStartRemaining = 8;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();

      service.raceState = RaceState.HEAT_OVER;
      service.autoStartRemaining = 0;
      service.autoAdvanceRemaining = 3;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeTrue();
      expect(latestWarmup).toBeFalse();
      expect(latestCooldown).toBeTrue();

      service.autoAdvanceRemaining = 8;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();

      service.raceState = RaceState.PAUSED;
      service.autoAdvanceRemaining = 3;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();

      service.autoAdvanceRemaining = 0;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it("should not evaluate isCooldown or isWarmup as true during auto-advance if raceState is RACE_OVER", () => {
      selectedRaceSubject.next({
        auto_advance_warmup_time: 4,
        auto_advance_time: 12,
      });
      service.autoAdvanceRemaining = 3;
      service.raceState = RaceState.RACE_OVER;
      expect(service.isCooldown).toBeFalse();
      expect(service.isWarmup).toBeFalse();
    });

    it("should not evaluate isWarmup, isCooldown, or autoStatusLabel as active if raceState is RACE_OVER during auto-start", () => {
      selectedRaceSubject.next({
        auto_start_warmup_time: 5,
        auto_start_time: 10,
      });
      service.autoStartRemaining = 8;
      service.raceState = RaceState.RACE_OVER;
      expect(service.isWarmup).toBeFalse();
      expect(service.isCooldown).toBeFalse();
      expect(service.autoStatusLabel).toBe("");
    });

    it("should format time as '0' when raceState is RACE_OVER and time <= 0", () => {
      service.raceState = RaceState.RACE_OVER;
      service.time = 0;
      expect(service.formattedTime).toBe("0");
    });

    it("should zero timers and ignore updates when raceState is RACE_OVER", () => {
      service.raceState = RaceState.RACE_OVER;
      raceTimeSubject.next({
        time: 50,
        autoStartRemaining: 10,
        autoAdvanceRemaining: 5,
      });
      expect(service.time).toBe(0);
      expect(service.autoStartRemaining).toBe(0);
      expect(service.autoAdvanceRemaining).toBe(0);
      expect(service.formattedTime).toBe("0");
    });

    it("should transition to RACE_OVER and zero timers when selectedRace emits a finished race", () => {
      service.autoStartRemaining = 10;
      service.time = 10;
      selectedRaceSubject.next({
        state: RaceState.RACE_OVER,
        is_finished: true,
      });
      expect(service.raceState).toBe(RaceState.RACE_OVER);
      expect(service.autoStartRemaining).toBe(0);
      expect(service.autoAdvanceRemaining).toBe(0);
      expect(service.time).toBe(0);
      expect(service.formattedTime).toBe("0");
    });
  });

  describe("handleRaceTimeUpdate and Subscriptions", () => {
    it("should update time with autoStartRemaining when not in STARTING", () => {
      service.raceState = RaceState.NOT_STARTED;
      raceTimeSubject.next({
        time: 100,
        autoStartRemaining: 5.5,
        autoAdvanceRemaining: 0,
      });

      expect(service.time).toBe(5.5);
      expect(service.autoStartRemaining).toBe(5.5);
    });

    it("should not override time with autoStartRemaining when in STARTING", () => {
      service.raceState = RaceState.STARTING;
      raceTimeSubject.next({
        time: 0,
        autoStartRemaining: 5.0,
      });

      expect(service.time).toBe(0);
    });

    it("should update time with autoAdvanceRemaining", () => {
      service.raceState = RaceState.HEAT_OVER;
      raceTimeSubject.next({
        time: 0,
        autoStartRemaining: 0,
        autoAdvanceRemaining: 8.2,
      });

      expect(service.time).toBe(8.2);
      expect(service.autoAdvanceRemaining).toBe(8.2);
    });

    it("should adjust timeFormat to subseconds when time is decreasing and below threshold", () => {
      service.raceState = RaceState.RACING;
      service.setSubsecondSettings(10, 2);

      raceTimeSubject.next({ time: 15 });
      expect(service.timeFormat).toBe("1.0-0");

      raceTimeSubject.next({ time: 8 });
      expect(service.timeFormat).toBe("1.2-2");

      // When increasing
      raceTimeSubject.next({ time: 12 });
      expect(service.timeFormat).toBe("1.0-0");
    });

    it("should emit changes on observables", (done) => {
      service.raceState = RaceState.RACING;

      service.formattedTime$.subscribe((txt) => {
        if (txt === "1:15") {
          expect(txt).toBe("1:15");
          done();
        }
      });

      raceTimeSubject.next({ time: 75 });
    });
  });

  describe("reset", () => {
    it("should reset all fields to defaults", () => {
      service.time = 50;
      service.autoStartRemaining = 5;
      service.autoAdvanceRemaining = 10;
      service.raceState = RaceState.RACING;
      service.showCountdownOverlay = true;

      service.reset();

      expect(service.time).toBe(0);
      expect(service.autoStartRemaining).toBe(0);
      expect(service.autoAdvanceRemaining).toBe(0);
      expect(service.raceState as RaceState).toBe(RaceState.UNKNOWN_STATE);
      expect(service.showCountdownOverlay).toBeFalse();
      expect(service.formattedTime).toBe("--");
    });
  });

  describe("Subsecond Interpolation Loop", () => {
    let rafSpy: jasmine.Spy;
    let cancelRafSpy: jasmine.Spy;

    beforeEach(() => {
      rafSpy = spyOn(window, "requestAnimationFrame").and.returnValue(12345);
      cancelRafSpy = spyOn(window, "cancelAnimationFrame");
    });

    it("should start interpolation loop when transitioning into RACING", () => {
      service.raceState = RaceState.RACING;
      expect(rafSpy).toHaveBeenCalled();
    });

    it("should start interpolation loop on handleRaceTimeUpdate during RACING", () => {
      service.raceState = RaceState.NOT_STARTED;
      rafSpy.calls.reset();

      service.raceState = RaceState.RACING;
      expect(rafSpy).toHaveBeenCalled();

      // Reset spy to check handleRaceTimeUpdate with an existing frame id
      rafSpy.calls.reset();
      service.handleRaceTimeUpdate({ time: 50 });
      expect(rafSpy).not.toHaveBeenCalled();
    });

    it("should stop interpolation loop when transitioning from RACING to PAUSED or HEAT_OVER", () => {
      service.raceState = RaceState.RACING;
      expect(rafSpy).toHaveBeenCalled();

      service.raceState = RaceState.PAUSED;
      expect(cancelRafSpy).toHaveBeenCalledWith(12345);
    });

    it("should stop interpolation loop on ngOnDestroy", () => {
      service.raceState = RaceState.RACING;
      expect(rafSpy).toHaveBeenCalled();

      service.ngOnDestroy();
      expect(cancelRafSpy).toHaveBeenCalledWith(12345);
    });

    it("should execute animation frame callback and schedule next frame", () => {
      let callback: FrameRequestCallback | null = null;
      rafSpy.and.callFake((cb: FrameRequestCallback) => {
        callback = cb;
        return 999;
      });

      service.raceState = RaceState.RACING;
      expect(callback).not.toBeNull();

      spyOn(service as any, "tickInterpolation");
      callback!(performance.now());

      expect((service as any).tickInterpolation).toHaveBeenCalled();
      expect(rafSpy).toHaveBeenCalledTimes(2);
    });

    it("should stop loop inside animation callback if state transitioned away from RACING", () => {
      let callback: FrameRequestCallback | null = null;
      rafSpy.and.callFake((cb: FrameRequestCallback) => {
        callback = cb;
        return 999;
      });

      service.raceState = RaceState.RACING;
      expect(callback).not.toBeNull();

      service.raceState = RaceState.HEAT_OVER;
      callback!(performance.now());

      expect(cancelRafSpy).toHaveBeenCalled();
    });

    it("should interpolate countdown time correctly during tickInterpolation", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 60 },
      });
      service.raceState = RaceState.RACING;

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({ time: 50 });
      expect(service.time).toBe(50);

      perfNow = 1250;
      (service as any).tickInterpolation();

      expect(service.time).toBeCloseTo(49.75, 2);
      expect(service.formattedTime).toBe("49");
    });

    it("should clamp countdown time to 0 when elapsed time exceeds remaining time", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 60 },
      });
      service.raceState = RaceState.RACING;

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({ time: 0.5 });
      expect(service.time).toBe(0.5);

      perfNow = 2000;
      (service as any).tickInterpolation();

      expect(service.time).toBe(0);
      expect(service.formattedTime).toBe("0");
    });

    it("should interpolate count-up time correctly for Lap races", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Lap, finishValue: 50 },
      });
      service.raceState = RaceState.RACING;

      let perfNow = 2000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({ time: 10 });
      expect(service.time).toBe(10);

      perfNow = 2500;
      (service as any).tickInterpolation();

      expect(service.time).toBeCloseTo(10.5, 2);
    });

    it("should update formattedTimeSubject only when formatted text changes", () => {
      selectedRaceSubject.next({
        heat_scoring: { finishMethod: FinishMethod.Timed, finishValue: 60 },
      });
      service.raceState = RaceState.RACING;
      service.setSubsecondSettings(10, 2);

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({ time: 8.0 });
      expect(service.formattedTime).toBe("8.00");

      const emitted: string[] = [];
      const sub = service.formattedTime$.subscribe((val) => emitted.push(val));

      // Advance 1ms: 8.0 - 0.001 = 7.999 -> rounds to 8.00
      perfNow = 1001;
      (service as any).tickInterpolation();
      expect(emitted[emitted.length - 1]).toBe("8.00");

      // Advance 21ms: 8.0 - 0.021 = 7.979 -> rounds to 7.98
      perfNow = 1021;
      (service as any).tickInterpolation();
      expect(emitted[emitted.length - 1]).toBe("7.98");

      sub.unsubscribe();
    });

    it("should not perform tickInterpolation if shouldInterpolate is false", () => {
      service.raceState = RaceState.PAUSED;
      service.time = 25;

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      perfNow = 2000;
      (service as any).tickInterpolation();

      expect(service.time).toBe(25);
    });

    it("should start interpolation loop and interpolate countdown during autoStartRemaining in NOT_STARTED", () => {
      service.raceState = RaceState.NOT_STARTED;
      service.setSubsecondSettings(10, 2);

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({
        time: 0,
        autoStartRemaining: 8.0,
      });

      expect(rafSpy).toHaveBeenCalled();
      expect(service.time).toBe(8.0);
      expect(service.formattedTime).toBe("8");

      // Advance clock by 250ms (0.25s)
      perfNow = 1250;
      (service as any).tickInterpolation();

      expect(service.time).toBeCloseTo(7.75, 2);
      expect(service.autoStartRemaining).toBeCloseTo(7.75, 2);
      expect(service.formattedTime).toBe("7");
    });

    it("should start interpolation loop and interpolate countdown during autoAdvanceRemaining in HEAT_OVER", () => {
      service.raceState = RaceState.HEAT_OVER;
      service.setSubsecondSettings(10, 2);

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({
        time: 0,
        autoAdvanceRemaining: 5.0,
      });

      expect(rafSpy).toHaveBeenCalled();
      expect(service.time).toBe(5.0);
      expect(service.formattedTime).toBe("5");

      // Advance clock by 400ms (0.40s)
      perfNow = 1400;
      (service as any).tickInterpolation();

      expect(service.time).toBeCloseTo(4.6, 2);
      expect(service.autoAdvanceRemaining).toBeCloseTo(4.6, 2);
      expect(service.formattedTime).toBe("4");
    });

    it("should clamp and stop interpolation when autoAdvanceRemaining reaches 0", () => {
      service.raceState = RaceState.HEAT_OVER;

      let perfNow = 1000;
      spyOn(performance, "now").and.callFake(() => perfNow);

      service.handleRaceTimeUpdate({
        time: 0,
        autoAdvanceRemaining: 0.2,
      });

      // Advance clock past 0.2s (e.g. 500ms)
      perfNow = 1500;
      (service as any).tickInterpolation();

      expect(service.time).toBe(0);
      expect(service.autoAdvanceRemaining).toBe(0);
      expect((service as any).shouldInterpolate).toBeFalse();
    });

    it("should not start interpolation loop if prefers-reduced-motion matches", () => {
      spyOn(window, "matchMedia").and.returnValue({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
      } as any);

      service.raceState = RaceState.RACING;
      rafSpy.calls.reset();

      service.handleRaceTimeUpdate({ time: 10 });
      expect(rafSpy).not.toHaveBeenCalled();
      expect((service as any).shouldInterpolate).toBeFalse();
    });

    it("should format auto-start and auto-advance as whole seconds in threshold mode", () => {
      service.raceState = RaceState.NOT_STARTED;
      service.setTimerFormatOptions({
        subsecondMode: "threshold",
        subsecondThreshold: 10,
        subsecondDecimals: 2,
      });

      service.handleRaceTimeUpdate({
        time: 5,
        autoStartRemaining: 5,
      });

      expect(service.formattedTime).toBe("5");

      service.raceState = RaceState.HEAT_OVER;
      service.handleRaceTimeUpdate({
        time: 8,
        autoAdvanceRemaining: 8,
      });

      expect(service.formattedTime).toBe("8");
    });

    it("should format auto-start as subseconds when subsecondMode is always", () => {
      service.raceState = RaceState.NOT_STARTED;
      service.setTimerFormatOptions({
        subsecondMode: "always",
        subsecondDecimals: 2,
      });

      service.handleRaceTimeUpdate({
        time: 5,
        autoStartRemaining: 5,
      });

      expect(service.formattedTime).toBe("5.00");
    });
  });
});
