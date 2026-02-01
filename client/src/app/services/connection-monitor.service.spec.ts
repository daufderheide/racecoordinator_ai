import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ConnectionMonitorService, ConnectionState } from './connection-monitor.service';
import { DataService } from '../data.service';
import { mockDataService } from '../testing/unit-test-mocks';
import { of, throwError } from 'rxjs';

describe('ConnectionMonitorService', () => {
  let service: ConnectionMonitorService;

  beforeEach(() => {
    // Reset mock calls
    mockDataService.getDrivers.calls.reset();
    mockDataService.getDrivers.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        ConnectionMonitorService,
        { provide: DataService, useValue: mockDataService }
      ]
    });
    service = TestBed.inject(ConnectionMonitorService);
    spyOn(console, 'warn');
    spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkConnection', () => {
    it('should return true and update state to CONNECTED on success', (done) => {
      // Set initial state to something else to verify change (or verify no change if already connected)
      service.setConnectionState(ConnectionState.DISCONNECTED);

      service.checkConnection().subscribe(isConnected => {
        expect(isConnected).toBeTrue();
        service.connectionState$.subscribe(state => {
          expect(state).toBe(ConnectionState.CONNECTED);
          done();
        });
      });
    });

    it('should return false and update state to DISCONNECTED on failure', (done) => {
      mockDataService.getDrivers.and.returnValue(throwError(() => new Error('Network Error')));

      service.checkConnection().subscribe(isConnected => {
        expect(isConnected).toBeFalse();
        service.connectionState$.subscribe(state => {
          expect(state).toBe(ConnectionState.DISCONNECTED);
          done();
        });
      });
    });
  });

  describe('startMonitoring', () => {
    it('should periodically check connection', fakeAsync(() => {
      service.startMonitoring();

      // Initial tick shouldn't trigger immediate check (switchMap on interval starts after delay usually, 
      // but let's check basic interval behavior: interval(5000) emits at T+5000)
      expect(mockDataService.getDrivers).not.toHaveBeenCalled();

      tick(5000);
      expect(mockDataService.getDrivers).toHaveBeenCalledTimes(1);

      tick(5000);
      expect(mockDataService.getDrivers).toHaveBeenCalledTimes(2);

      service.stopMonitoring();
      discardPeriodicTasks();
    }));

    it('should recover from disconnected to connected during monitoring', fakeAsync(() => {
      // Start disconnected
      service.setConnectionState(ConnectionState.DISCONNECTED);

      // 1. Fail first check
      mockDataService.getDrivers.and.returnValue(throwError(() => new Error('Fail')));

      service.startMonitoring();
      tick(5000);

      service.connectionState$.subscribe(state => {
        if (mockDataService.getDrivers.calls.count() === 1) {
          expect(state).toBe(ConnectionState.DISCONNECTED);
        }
      });

      // 2. Succeed second check
      mockDataService.getDrivers.and.returnValue(of([]));
      tick(5000);

      let currentState: ConnectionState | undefined;
      service.connectionState$.subscribe(s => currentState = s);
      expect(currentState).toBe(ConnectionState.CONNECTED);

      service.stopMonitoring();
      discardPeriodicTasks();
    }));
  });

  describe('waitForConnection', () => {
    it('should resolve immediately if already connected (via check)', fakeAsync(() => {
      // Mock successful check
      mockDataService.getDrivers.and.returnValue(of([]));

      let resolved = false;
      service.waitForConnection().then(() => resolved = true);

      tick(); // Allow checkConnection observable to complete
      expect(resolved).toBeTrue();
      expect(mockDataService.getDrivers).toHaveBeenCalledTimes(1);
    }));

    it('should poll until connected if initially failing', fakeAsync(() => {
      // 1. Fail initial check
      let isSuccess = false;
      mockDataService.getDrivers.and.callFake(() => {
        if (!isSuccess) return throwError(() => new Error('Fail'));
        return of([]);
      });

      let resolved = false;
      service.waitForConnection().then(() => resolved = true);

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
