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
      service.autoStartRemaining = 5;
      expect(service.autoStatusLabel).toBe("RD_AUTO_STARTING");

      service.autoStartRemaining = 0;
      service.autoAdvanceRemaining = 3;
      expect(service.autoStatusLabel).toBe("RD_AUTO_ADVANCING");

      service.autoAdvanceRemaining = 0;
      expect(service.autoStatusLabel).toBe("");
    });

    it("should evaluate isWarmup correctly across auto-start and auto-advance states", () => {
      selectedRaceSubject.next({
        auto_start_warmup_time: 5,
        auto_start_time: 10,
        auto_advance_warmup_time: 4,
        auto_advance_time: 12,
      });

      service.autoStartRemaining = 8;
      expect(service.isWarmup).toBeTrue();

      service.autoStartRemaining = 2;
      expect(service.isWarmup).toBeFalse();

      service.autoStartRemaining = 0;
      service.autoAdvanceRemaining = 3;
      service.raceState = RaceState.HEAT_OVER;
      expect(service.isWarmup).toBeTrue();

      service.autoAdvanceRemaining = 8;
      expect(service.isWarmup).toBeFalse();

      service.autoAdvanceRemaining = 0;
      expect(service.isWarmup).toBeFalse();
    });

    it("should not evaluate isWarmup as true during auto-advance if raceState is RACE_OVER", () => {
      selectedRaceSubject.next({
        auto_advance_warmup_time: 4,
        auto_advance_time: 12,
      });
      service.autoAdvanceRemaining = 3;
      service.raceState = RaceState.RACE_OVER;
      expect(service.isWarmup).toBeFalse();
    });

    it("should not evaluate isWarmup or autoStatusLabel as active if raceState is RACE_OVER during auto-start", () => {
      selectedRaceSubject.next({
        auto_start_warmup_time: 5,
        auto_start_time: 10,
      });
      service.autoStartRemaining = 8;
      service.raceState = RaceState.RACE_OVER;
      expect(service.isWarmup).toBeFalse();
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
});
