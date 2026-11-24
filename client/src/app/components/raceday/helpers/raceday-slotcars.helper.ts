import { catchError, of } from "rxjs";
import { SlotcarSwap } from "@app/components/raceday/raceday-slotcars-dialog/raceday-slotcars-dialog.component";
import { Car } from "@app/models/car";
import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";

/**
 * Race day "Slotcars…" (#1210): the quick car swap between heats. The menu
 * item only shows when the Slotcar database has cars.
 */
export class RacedaySlotcarsHelper {
  static loadCars(host: any, then?: () => void): void {
    const cars$ = host.dataService?.getCars?.();
    if (!cars$) return;
    cars$.pipe(catchError(() => of([]))).subscribe((list: any[]) => {
      host.raceCars = (list || []).map((c: any) => Car.fromJSON(c));
      host.cdr?.markForCheck?.();
      then?.();
    });
  }

  static carsStayInLanes(host: any): boolean {
    return !!(host.race || host.raceService?.getRace?.())?.cars_stay_in_lanes;
  }

  static laneCars(host: any): (Car | undefined)[] {
    return host.raceService?.getLaneCars?.() || [];
  }

  static hasSlotcars(host: any): boolean {
    return (host.raceCars?.length || 0) > 0;
  }

  /** No swaps while a heat counts down, runs or is paused, after the race, or for viewers. */
  static isLocked(host: any): boolean {
    const s = host.raceState;
    return (
      host.authService?.currentRole === Role.VIEWER ||
      s === RaceState.STARTING ||
      s === RaceState.RACING ||
      s === RaceState.PAUSED ||
      s === RaceState.RACE_OVER
    );
  }

  static open(host: any): void {
    // Fresh list: cars may have been added in the Slotcar editor meanwhile.
    RacedaySlotcarsHelper.loadCars(host);
    host.showSlotcarsDialog = true;
    host.cdr?.markForCheck?.();
  }

  static swap(host: any, swap: SlotcarSwap): void {
    host.dataService?.changeCar(swap.lane, swap.carId).subscribe({
      error: (err: any) => {
        host.logger?.error?.(`Error changing car on lane ${swap.lane}:`, err);
        host.ackModalTitle = "RSD_ERR_TITLE";
        host.ackModalMessage =
          typeof err?.error === "string" && err.error.startsWith("RD_")
            ? err.error
            : "RSD_ERR_MESSAGE";
        host.showAckModal = true;
        host.cdr?.markForCheck?.();
      },
    });
  }
}
