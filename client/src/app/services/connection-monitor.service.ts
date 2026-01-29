import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription, of } from 'rxjs';
import { switchMap, catchError, map, retry, timeout } from 'rxjs/operators';
import { DataService } from '../data.service';

export enum ConnectionState {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING'
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionMonitorService implements OnDestroy {
  private connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.CONNECTED);
  public connectionState$ = this.connectionStateSubject.asObservable();

  private monitoringSubscription: Subscription | null = null;
  private readonly CHECK_INTERVAL_MS = 5000;
  private readonly TIMEOUT_MS = 3000;

  constructor(private dataService: DataService) { }

  ngOnDestroy() {
    this.stopMonitoring();
  }

  /**
   * Starts periodic connection checks.
   */
  startMonitoring() {
    if (this.monitoringSubscription) {
      return;
    }

    this.monitoringSubscription = interval(this.CHECK_INTERVAL_MS)
      .pipe(
        switchMap(() => this.checkConnection())
      )
      .subscribe();
  }

  /**
   * Stops periodic connection checks.
   */
  stopMonitoring() {
    if (this.monitoringSubscription) {
      this.monitoringSubscription.unsubscribe();
      this.monitoringSubscription = null;
    }
  }

  /**
   * Manually check connection status.
   * Returns observable that completes with true (connected) or false (disconnected).
   * Also updates the shared state.
   */
  checkConnection(): Observable<boolean> {
    return this.dataService.getDrivers().pipe(
      timeout(this.TIMEOUT_MS),
      map(() => {
        if (this.connectionStateSubject.value !== ConnectionState.CONNECTED) {
          console.log('Connection restored!');
          this.connectionStateSubject.next(ConnectionState.CONNECTED);
        }
        return true;
      }),
      catchError(err => {
        if (this.connectionStateSubject.value === ConnectionState.CONNECTED) {
          console.warn('Connection lost in monitor', err);
          this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
        }
        return of(false);
      })
    );
  }

  /**
   * Explicitly set state, useful for initial checks or handling fatal errors.
   */
  setConnectionState(state: ConnectionState) {
    this.connectionStateSubject.next(state);
  }

  /**
   * Helper to wait for connection to be established.
   */
  async waitForConnection(): Promise<void> {
    const isConnected = await this.checkConnection().toPromise();
    if (isConnected) return;

    // If not connected, poll rapidly until connected
    return new Promise(resolve => {
      const sub = interval(1000).pipe(
        switchMap(() => this.checkConnection())
      ).subscribe(connected => {
        if (connected) {
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }
}
