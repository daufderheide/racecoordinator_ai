import { ChangeDetectorRef } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { SystemState } from "@app/proto/antigravity";
import { AuthService } from "@app/services/auth.service";

import { ViewerRaceEndedHandler } from "./viewer-race-ended-handler";

describe("ViewerRaceEndedHandler", () => {
  let mockDataService: jasmine.SpyObj<DataService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
  let systemStateSubject: BehaviorSubject<SystemState | null>;

  beforeEach(() => {
    systemStateSubject = new BehaviorSubject<SystemState | null>(null);

    mockDataService = jasmine.createSpyObj("DataService", [
      "getSystemState",
      "updateRaceSubscription",
    ]);
    mockDataService.getSystemState.and.returnValue(
      systemStateSubject.asObservable(),
    );
    mockDataService.updateRaceSubscription.and.stub();

    mockAuthService = jasmine.createSpyObj("AuthService", [], {
      currentRole: Role.VIEWER,
    });

    mockCdr = jasmine.createSpyObj("ChangeDetectorRef", ["markForCheck"]);
  });

  it("should initialize with default states", () => {
    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
    );
    expect(handler.showAckModal).toBeFalse();
    expect(handler.raceHasEnded).toBeFalse();
  });

  it("should not respond to system state if user is not viewer and onlyForViewer is true", () => {
    // Set role to DIRECTOR
    Object.defineProperty(mockAuthService, "currentRole", {
      get: () => Role.DIRECTOR,
    });

    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
      { onlyForViewer: true },
    );
    handler.startListening();

    systemStateSubject.next({ resourceLockState: "IDLE" } as SystemState);

    expect(handler.showAckModal).toBeFalse();
    expect(handler.raceHasEnded).toBeFalse();
    expect(mockCdr.markForCheck).not.toHaveBeenCalled();

    handler.stopListening();
  });

  it("should respond to system state if user is not viewer but onlyForViewer is false", () => {
    Object.defineProperty(mockAuthService, "currentRole", {
      get: () => Role.DIRECTOR,
    });

    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
      { onlyForViewer: false },
    );
    handler.startListening();

    systemStateSubject.next({ resourceLockState: "IDLE" } as SystemState);

    expect(handler.showAckModal).toBeTrue();
    expect(handler.raceHasEnded).toBeTrue();
    expect(handler.ackModalTitle).toBe("RD_RACE_ENDED_TITLE");
    expect(mockCdr.markForCheck).toHaveBeenCalled();

    handler.stopListening();
  });

  it("should show race ended modal when state becomes IDLE", () => {
    const onRaceEndedSpy = jasmine.createSpy("onRaceEnded");
    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
      { onRaceEnded: onRaceEndedSpy },
    );
    handler.startListening();

    systemStateSubject.next({ resourceLockState: "IDLE" } as SystemState);

    expect(handler.showAckModal).toBeTrue();
    expect(handler.raceHasEnded).toBeTrue();
    expect(handler.ackModalTitle).toBe("RD_RACE_ENDED_TITLE");
    expect(handler.ackModalMessage).toBe("RD_RACE_ENDED_MESSAGE");
    expect(handler.ackModalButtonText).toBe("RD_RACE_ENDED_BTN_OK");
    expect(onRaceEndedSpy).toHaveBeenCalled();
    expect(mockCdr.markForCheck).toHaveBeenCalled();

    handler.stopListening();
  });

  it("should transition from race ended to new race started when state becomes RACE_RUNNING", () => {
    const onRaceStartedSpy = jasmine.createSpy("onRaceStarted");
    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
      { onRaceStarted: onRaceStartedSpy },
    );
    handler.startListening();

    // End the race first
    systemStateSubject.next({ resourceLockState: "IDLE" } as SystemState);
    expect(handler.raceHasEnded).toBeTrue();

    // Start a new race
    systemStateSubject.next({
      resourceLockState: "RACE_RUNNING",
    } as SystemState);

    expect(handler.showAckModal).toBeTrue();
    expect(handler.raceHasEnded).toBeFalse();
    expect(handler.ackModalTitle).toBe("RD_RACE_STARTED_TITLE");
    expect(handler.ackModalMessage).toBe("RD_RACE_STARTED_MESSAGE");
    expect(handler.ackModalButtonText).toBe("RD_RACE_STARTED_BTN_OK");
    expect(mockDataService.updateRaceSubscription).toHaveBeenCalledWith(true);
    expect(onRaceStartedSpy).toHaveBeenCalled();
    expect(mockCdr.markForCheck).toHaveBeenCalled();

    handler.stopListening();
  });

  it("should reset showAckModal to false when acknowledge is called", () => {
    const handler = new ViewerRaceEndedHandler(
      mockDataService,
      mockAuthService,
      mockCdr,
    );
    handler.startListening();

    systemStateSubject.next({ resourceLockState: "IDLE" } as SystemState);
    expect(handler.showAckModal).toBeTrue();

    handler.acknowledge();
    expect(handler.showAckModal).toBeFalse();
    expect(mockCdr.markForCheck).toHaveBeenCalled();

    handler.stopListening();
  });
});
