import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { AuthService } from "@app/services/auth.service";

import { LockOverlayComponent } from "./lock-overlay.component";

describe("LockOverlayComponent", () => {
  let component: LockOverlayComponent;
  let fixture: ComponentFixture<LockOverlayComponent>;
  let roleSubject: BehaviorSubject<Role>;
  let stateSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    roleSubject = new BehaviorSubject<Role>(Role.VIEWER);
    stateSubject = new BehaviorSubject<any>(null);

    const mockAuthService = {
      currentRole$: roleSubject.asObservable(),
    };

    const mockDataService = {
      getSystemState: () => stateSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [LockOverlayComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DataService, useValue: mockDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LockOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should unlock when state is IDLE or null", () => {
    stateSubject.next(null);
    expect(component.isLocked).toBeFalse();

    stateSubject.next({ resourceLockState: "IDLE" });
    expect(component.isLocked).toBeFalse();
  });

  it("should unlock when state is RACE_RUNNING", () => {
    stateSubject.next({ resourceLockState: "RACE_RUNNING" });
    expect(component.isLocked).toBeFalse();
  });

  it("should lock and format TRACK_EDITOR correctly", () => {
    stateSubject.next({ resourceLockState: "TRACK_EDITOR", ownerId: "Dave" });
    expect(component.isLocked).toBeTrue();
    expect(component.ownerId).toBe("Dave");
    expect(component.lockStateString).toBe("Track Editor");
  });

  it("should lock for other lock states", () => {
    stateSubject.next({ resourceLockState: "RACE_EDITOR", ownerId: "Admin" });
    expect(component.isLocked).toBeTrue();
    expect(component.lockStateString).toBe("RACE_EDITOR");
  });

  it("should dismiss lock when dismissLock is called", () => {
    stateSubject.next({ resourceLockState: "TRACK_EDITOR", ownerId: "Dave" });
    expect(component.isLocked).toBeTrue();

    component.dismissLock();
    expect(component.isLocked).toBeFalse();
  });

  it("should update isAdmin flag when role changes", () => {
    roleSubject.next(Role.ADMIN);
    expect(component.isAdmin).toBeTrue();

    roleSubject.next(Role.VIEWER);
    expect(component.isAdmin).toBeFalse();
  });
});
