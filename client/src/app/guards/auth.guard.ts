import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { filter, map, take } from "rxjs/operators";
import { isAtLeast, Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";

export const AuthGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Determine required role from route data or default to DIRECTOR for protected routes
  const requiredRole = route.data["requiredRole"] || Role.DIRECTOR;

  return authService.roleInitialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => {
      if (isAtLeast(authService.currentRole, requiredRole)) {
        return true;
      }
      return router.parseUrl("/raceday");
    }),
  );
};
