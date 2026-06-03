import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, UrlTree } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";

import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  let authServiceMock: any;
  let routerMock: any;
  let roleInitializedSubject: BehaviorSubject<boolean>;

  beforeEach(() => {
    roleInitializedSubject = new BehaviorSubject<boolean>(false);
    authServiceMock = {
      roleInitialized$: roleInitializedSubject.asObservable(),
      currentRole: Role.VIEWER,
    };

    routerMock = jasmine.createSpyObj("Router", ["parseUrl"]);
    routerMock.parseUrl.and.callFake((url: string) => {
      return { url } as any; // mock UrlTree
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  const executeGuard = (routeData: any): Observable<boolean | UrlTree> => {
    const route = {
      data: routeData,
    } as ActivatedRouteSnapshot;
    const state = {} as any;

    return TestBed.runInInjectionContext(() =>
      AuthGuard(route, state),
    ) as Observable<boolean | UrlTree>;
  };

  it("should block and redirect VIEWER when route defaults to DIRECTOR", (done) => {
    authServiceMock.currentRole = Role.VIEWER;
    roleInitializedSubject.next(true);

    executeGuard({}).subscribe((result) => {
      expect(result).toEqual({ url: "/raceday" } as any);
      expect(routerMock.parseUrl).toHaveBeenCalledWith("/raceday");
      done();
    });
  });

  it("should allow DIRECTOR when route defaults to DIRECTOR", (done) => {
    authServiceMock.currentRole = Role.DIRECTOR;
    roleInitializedSubject.next(true);

    executeGuard({}).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should allow ADMIN when route defaults to DIRECTOR", (done) => {
    authServiceMock.currentRole = Role.ADMIN;
    roleInitializedSubject.next(true);

    executeGuard({}).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should allow VIEWER when route explicitly requires VIEWER", (done) => {
    authServiceMock.currentRole = Role.VIEWER;
    roleInitializedSubject.next(true);

    executeGuard({ requiredRole: Role.VIEWER }).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should allow DIRECTOR when route explicitly requires VIEWER", (done) => {
    authServiceMock.currentRole = Role.DIRECTOR;
    roleInitializedSubject.next(true);

    executeGuard({ requiredRole: Role.VIEWER }).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should allow ADMIN when route explicitly requires VIEWER", (done) => {
    authServiceMock.currentRole = Role.ADMIN;
    roleInitializedSubject.next(true);

    executeGuard({ requiredRole: Role.VIEWER }).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it("should block and redirect DIRECTOR when route explicitly requires ADMIN", (done) => {
    authServiceMock.currentRole = Role.DIRECTOR;
    roleInitializedSubject.next(true);

    executeGuard({ requiredRole: Role.ADMIN }).subscribe((result) => {
      expect(result).toEqual({ url: "/raceday" } as any);
      done();
    });
  });

  it("should wait for roleInitialized$ to be true before checking", (done) => {
    authServiceMock.currentRole = Role.VIEWER;

    let resolved = false;
    executeGuard({ requiredRole: Role.VIEWER }).subscribe((result) => {
      expect(result).toBeTrue();
      resolved = true;
      done();
    });

    expect(resolved).toBeFalse();
    roleInitializedSubject.next(true);
  });
});
