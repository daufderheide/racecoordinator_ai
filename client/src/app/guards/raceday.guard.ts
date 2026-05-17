import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanDeactivate,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable } from "rxjs";

/**
 * Interface for components that can be guarded by RacedayGuard.
 */
export interface CanComponentDeactivate {
  canDeactivate: (
    nextState?: RouterStateSnapshot,
  ) => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: "root",
})
export class RacedayGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(
    component: CanComponentDeactivate,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    return component && component.canDeactivate
      ? component.canDeactivate(nextState)
      : true;
  }
}
