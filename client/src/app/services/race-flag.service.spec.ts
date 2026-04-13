import { TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { com } from "src/app/proto/message";

import { RaceConnectionService } from "./race-connection.service";
import { RaceFlagService } from "./race-flag.service";

describe("RaceFlagService", () => {
  let service: RaceFlagService;
  let raceFlagSubject: BehaviorSubject<com.antigravity.RaceFlag>;

  beforeEach(() => {
    raceFlagSubject = new BehaviorSubject<com.antigravity.RaceFlag>(
      com.antigravity.RaceFlag.RED,
    );

    const raceConnectionSpy = jasmine.createSpyObj(
      "RaceConnectionService",
      [],
      {
        raceFlag$: raceFlagSubject.asObservable(),
      },
    );

    TestBed.configureTestingModule({
      providers: [
        RaceFlagService,
        { provide: RaceConnectionService, useValue: raceConnectionSpy },
      ],
    });
    service = TestBed.inject(RaceFlagService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return RED flag type and color initially", () => {
    expect(service.getFlagType()).toBe("red");
    expect(service.getFlagColor()).toBe("red");
  });

  it("should update flag type and color when RaceConnectionService emits", () => {
    raceFlagSubject.next(com.antigravity.RaceFlag.GREEN);
    expect(service.getFlagType()).toBe("green");
    expect(service.getFlagColor()).toBe("green");

    raceFlagSubject.next(com.antigravity.RaceFlag.YELLOW);
    expect(service.getFlagType()).toBe("yellow");
    expect(service.getFlagColor()).toBe("yellow");

    raceFlagSubject.next(com.antigravity.RaceFlag.WHITE);
    expect(service.getFlagType()).toBe("white");
    expect(service.getFlagColor()).toBe("white");

    raceFlagSubject.next(com.antigravity.RaceFlag.CHECKERED);
    expect(service.getFlagType()).toBe("checkered");
    expect(service.getFlagColor()).toBe("checkered");

    raceFlagSubject.next(com.antigravity.RaceFlag.GREEN_YELLOW);
    expect(service.getFlagType()).toBe("green_yellow");
    expect(service.getFlagColor()).toBe("green");
  });

  it("should return translatable flag names", () => {
    raceFlagSubject.next(com.antigravity.RaceFlag.RED);
    expect(service.getFlagNameKey()).toBe("RACE_FLAG_RED");

    raceFlagSubject.next(com.antigravity.RaceFlag.GREEN);
    expect(service.getFlagNameKey()).toBe("RACE_FLAG_GREEN");
  });
});
