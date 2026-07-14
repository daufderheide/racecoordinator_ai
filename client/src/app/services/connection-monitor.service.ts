import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, interval, Observable, of, Subscription } from "rxjs";
import { catchError, map, switchMap, timeout } from "rxjs/operators";
import { DataService } from "@app/data.service";

import { LoggerService } from "./logger.service";

export enum ConnectionState {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  RECONNECTING = "RECONNECTING",
}

@Injectable({
  providedIn: "root",
})
export class ConnectionMonitorService implements OnDestroy {
  private connectionStateSubject = new BehaviorSubject<ConnectionState>(
    ConnectionState.CONNECTED,
  );
  public connectionState$ = this.connectionStateSubject.asObservable();

  public get currentState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  private monitoringSubscription: Subscription | null = null;
  private readonly CHECK_INTERVAL_MS = 5000;
  private readonly TIMEOUT_MS = 3000;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private dataService: DataService,
    private logger: LoggerService,
  ) {}

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
      .pipe(switchMap(() => this.checkConnection()))
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

  private hasInitialConnectionBeenEstablished = false;
  private initialServerVersion: string | null = null;

  /**
   * Manually check connection status.
   * Returns observable that completes with true (connected) or false (disconnected).
   * Also updates the shared state.
   */
  checkConnection(): Observable<boolean> {
    return this.dataService.getServerVersion().pipe(
      timeout(this.TIMEOUT_MS),
      map((version: string) => {
        if (this.initialServerVersion === null) {
          this.initialServerVersion = version;
        } else if (
          this.initialServerVersion !== version &&
          this.hasInitialConnectionBeenEstablished
        ) {
          this.logger.info(
            `Server version changed from ${this.initialServerVersion} to ${version}. Reloading...`,
          );
          this.initialServerVersion = version;
          this.document.location?.reload();
        }

        if (this.connectionStateSubject.value !== ConnectionState.CONNECTED) {
          this.logger.info("Connection restored!");
          this.connectionStateSubject.next(ConnectionState.CONNECTED);
          if (this.hasInitialConnectionBeenEstablished) {
            this.document.location?.reload();
          }
        }
        this.hasInitialConnectionBeenEstablished = true;
        return true;
      }),
      catchError((err) => {
        if (this.connectionStateSubject.value === ConnectionState.CONNECTED) {
          if (err.status !== 0) {
            this.logger.warn("Connection lost in monitor", err);
          } else {
            this.logger.debug("Connection lost in monitor (server offline)");
          }
          this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
        }
        return of(false);
      }),
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
    return new Promise((resolve) => {
      const sub = interval(1000)
        .pipe(switchMap(() => this.checkConnection()))
        .subscribe((connected) => {
          if (connected) {
            sub.unsubscribe();
            resolve();
          }
        });
    });
  }
}
