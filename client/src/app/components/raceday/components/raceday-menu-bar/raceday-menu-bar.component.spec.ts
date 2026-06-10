import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { Role } from "@app/models/role";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { AuthService } from "@app/services/auth.service";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayMenuBarComponent } from "./raceday-menu-bar.component";
import { RacedayMenuBarHarness } from "./testing/raceday-menu-bar.harness";

describe("RacedayMenuBarComponent", () => {
  let component: RacedayMenuBarComponent;
  let fixture: ComponentFixture<RacedayMenuBarComponent>;
  let harness: RacedayMenuBarHarness;
  let mockAuthService: any;
  let roleSubject: BehaviorSubject<Role>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    roleSubject = new BehaviorSubject<Role>(Role.DIRECTOR);

    mockAuthService = {
      currentRoleSubject: roleSubject,
      get currentRole$() {
        return this.currentRoleSubject.asObservable();
      },
      get currentRole() {
        return this.currentRoleSubject.value;
      },
    };

    await TestBed.configureTestingModule({
      imports: [RacedayMenuBarComponent, TranslatePipe],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayMenuBarComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayMenuBarHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open File menu when File button is clicked via harness", async () => {
    expect(component.isFileMenuOpen).toBeFalse();

    await harness.clickMenuButton("RD_MENU_FILE");
    expect(component.isFileMenuOpen).toBeTrue();
  });

  it("should emit fileMenuSelect output when File menu item is clicked", async () => {
    spyOn(component.fileMenuSelect, "emit");

    // Open File Menu
    await harness.clickMenuButton("RD_MENU_FILE");
    fixture.detectChanges();

    // Click "Save"
    await harness.clickMenuItem("RD_MENU_SAVE");
    expect(component.fileMenuSelect.emit).toHaveBeenCalledWith("SAVE");
    expect(component.isFileMenuOpen).toBeFalse(); // Should close menu
  });

  it("should conditionally render items based on role (Director vs Viewer)", async () => {
    // With DIRECTOR role, "Logout" should be visible (under Race Director menu)
    await harness.clickMenuButton("RD_MENU_RACE_DIRECTOR");
    fixture.detectChanges();

    const items = await fixture.nativeElement.querySelectorAll(".menu-item");
    const logoutBtnText = Array.from(items)
      .map((el: any) => el.innerText.trim())
      .find((t) => t.includes("RD_MENU_LOGOUT"));
    expect(logoutBtnText).toBeDefined();

    // Close menu
    component.toggleMenu();
    fixture.detectChanges();

    // Change role to VIEWER
    roleSubject.next(Role.VIEWER);
    fixture.detectChanges();

    // With VIEWER role, "Login" should be visible
    await harness.clickMenuButton("RD_MENU_RACE_DIRECTOR");
    fixture.detectChanges();

    const newItems = await fixture.nativeElement.querySelectorAll(".menu-item");
    const loginBtnText = Array.from(newItems)
      .map((el: any) => el.innerText.trim())
      .find((t) => t.includes("RD_MENU_LOGIN"));
    expect(loginBtnText).toBeDefined();
  });
});
