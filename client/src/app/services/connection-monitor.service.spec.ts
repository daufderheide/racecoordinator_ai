import { DOCUMENT } from "@angular/common";
import {
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { mockDataService } from "@app/testing/unit-test-mocks";

import {
  ConnectionMonitorService,
  ConnectionState,
} from "./connection-monitor.service";
import { LoggerService } from "./logger.service";

describe("ConnectionMonitorService", () => {
  let service: ConnectionMonitorService;
  let mockDocument: any;

  beforeEach(() => {
    // Reset mock calls
    mockDataService.getServerVersion.calls.reset();
    mockDataService.getServerVersion.and.returnValue(of("1.0.0"));

    const mockLogger = {
      info: jasmine.createSpy("info"),
      warn: jasmine.createSpy("warn"),
      error: jasmine.createSpy("error"),
      debug: jasmine.createSpy("debug"),
    };

    mockDocument = {
      location: {
        reload: jasmine.createSpy("reload"),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        ConnectionMonitorService,
        { provide: DataService, useValue: mockDataService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
    service = TestBed.inject(ConnectionMonitorService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("checkConnection", () => {
    it("should return true and update state to CONNECTED on success, but not reload the page on initial connection", (done) => {
      // Set initial state to something else to verify change
      service.setConnectionState(ConnectionState.DISCONNECTED);

      service.checkConnection().subscribe((isConnected) => {
        expect(isConnected).toBeTrue();
        expect(mockDocument.location.reload).not.toHaveBeenCalled();
        service.connectionState$.subscribe((state) => {
          expect(state).toBe(ConnectionState.CONNECTED);
          done();
        });
      });
    });

    it("should reload the page if connection is lost and restored after initial connection", (done) => {
      // 1. Establish initial connection
      service.checkConnection().subscribe(() => {
        expect(mockDocument.location.reload).not.toHaveBeenCalled();

        // 2. Connection is lost
        service.setConnectionState(ConnectionState.DISCONNECTED);

        // 3. Connection is restored
        service.checkConnection().subscribe((isConnected) => {
          expect(isConnected).toBeTrue();
          expect(mockDocument.location.reload).toHaveBeenCalled();
          done();
        });
      });
    });

    it("should not reload the page if already connected", (done) => {
      service.setConnectionState(ConnectionState.CONNECTED);

      service.checkConnection().subscribe((isConnected) => {
        expect(isConnected).toBeTrue();
        expect(mockDocument.location.reload).not.toHaveBeenCalled();
        done();
      });
    });

    it("should reload the page if server version changes", (done) => {
      // 1. Establish initial connection with version 1.0.0
      service.checkConnection().subscribe(() => {
        expect(mockDocument.location.reload).not.toHaveBeenCalled();

        // 2. Mock a version change
        mockDataService.getServerVersion.and.returnValue(of("1.1.0"));

        // 3. Next check should trigger reload
        service.checkConnection().subscribe((isConnected) => {
          expect(isConnected).toBeTrue();
          expect(mockDocument.location.reload).toHaveBeenCalled();
          done();
        });
      });
    });

    it("should return false and update state to DISCONNECTED on failure", (done) => {
      mockDataService.getServerVersion.and.returnValue(
        throwError(() => new Error("Network Error")),
      );

      service.checkConnection().subscribe((isConnected) => {
        expect(isConnected).toBeFalse();
        service.connectionState$.subscribe((state) => {
          expect(state).toBe(ConnectionState.DISCONNECTED);
          done();
        });
      });
    });
  });

  describe("startMonitoring", () => {
    it("should periodically check connection", fakeAsync(() => {
      service.startMonitoring();

      // Initial tick shouldn't trigger immediate check (switchMap on interval starts after delay usually,
      // but let's check basic interval behavior: interval(5000) emits at T+5000)
      expect(mockDataService.getServerVersion).not.toHaveBeenCalled();

      tick(5000);
      expect(mockDataService.getServerVersion).toHaveBeenCalledTimes(1);

      tick(5000);
      expect(mockDataService.getServerVersion).toHaveBeenCalledTimes(2);

      service.stopMonitoring();
      discardPeriodicTasks();
    }));

    it("should recover from disconnected to connected during monitoring", fakeAsync(() => {
      // Start disconnected
      service.setConnectionState(ConnectionState.DISCONNECTED);

      // 1. Fail first check
      mockDataService.getServerVersion.and.returnValue(
        throwError(() => new Error("Fail")),
      );

      service.startMonitoring();
      tick(5000);

      service.connectionState$.subscribe((state) => {
        if (mockDataService.getServerVersion.calls.count() === 1) {
          expect(state).toBe(ConnectionState.DISCONNECTED);
        }
      });

      // 2. Succeed second check
      mockDataService.getServerVersion.and.returnValue(of("1.0.0"));
      tick(5000);

      let currentState: ConnectionState | undefined;
      service.connectionState$.subscribe((s) => (currentState = s));
      expect(currentState).toBe(ConnectionState.CONNECTED);

      service.stopMonitoring();
      discardPeriodicTasks();
    }));
  });

  describe("waitForConnection", () => {
    it("should resolve immediately if already connected (via check)", fakeAsync(() => {
      // Mock successful check
      mockDataService.getServerVersion.and.returnValue(of("1.0.0"));

      let resolved = false;
      service.waitForConnection().then(() => (resolved = true));

      tick(); // Allow checkConnection observable to complete
      expect(resolved).toBeTrue();
      expect(mockDataService.getServerVersion).toHaveBeenCalledTimes(1);
    }));

    it("should poll until connected if initially failing", fakeAsync(() => {
      // 1. Fail initial check
      let isSuccess = false;
      mockDataService.getServerVersion.and.callFake(() => {
        if (!isSuccess) return throwError(() => new Error("Fail"));
        return of("1.0.0");
      });

      let resolved = false;
      service.waitForConnection().then(() => (resolved = true));

      tick(); // Initial check fails
      expect(resolved).toBeFalse();

      // 2. Fail next poll (interval is 1000ms in waitForConnection)
      tick(1000);
      expect(resolved).toBeFalse();

      // 3. Succeed next poll
      isSuccess = true;
      tick(1000);

      expect(resolved).toBeTrue();

      discardPeriodicTasks(); // In case any other intervals are suspected, though waitForConnection unsubscribes on success
    }));
  });
});
