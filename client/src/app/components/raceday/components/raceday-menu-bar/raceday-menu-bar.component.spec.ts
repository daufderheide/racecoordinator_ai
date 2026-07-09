import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
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
  let mockDataService: any;
  let roleSubject: BehaviorSubject<Role>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    roleSubject = new BehaviorSubject<Role>(Role.DIRECTOR);

    mockDataService = {
      getSystemStateValue: jasmine
        .createSpy("getSystemStateValue")
        .and.returnValue({
          hasMainRelay: false,
          hasPerLaneRelays: false,
        }),
      getDrivers: jasmine.createSpy("getDrivers").and.returnValue(of([])),
    };

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
        { provide: DataService, useValue: mockDataService },
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

  it("should emit trackPowerMainSelect when main power options are clicked", () => {
    mockDataService.getSystemStateValue.and.returnValue({
      hasMainRelay: true,
      hasPerLaneRelays: false,
    });
    spyOn(component.trackPowerMainSelect, "emit");

    component.onTrackPowerSelect("MAIN_ON");
    expect(component.trackPowerMainSelect.emit).toHaveBeenCalledWith(true);
    expect(component.isTrackPowerMenuOpen).toBeFalse();

    component.onTrackPowerSelect("MAIN_OFF");
    expect(component.trackPowerMainSelect.emit).toHaveBeenCalledWith(false);
  });

  it("should emit trackPowerLaneSelect when lane power options are clicked", () => {
    mockDataService.getSystemStateValue.and.returnValue({
      hasMainRelay: false,
      hasPerLaneRelays: true,
    });
    spyOn(component.trackPowerLaneSelect, "emit");

    component.onLanePowerSelect(1, true);
    expect(component.trackPowerLaneSelect.emit).toHaveBeenCalledWith({
      lane: 1,
      on: true,
    });
    expect(component.isTrackPowerMenuOpen).toBeFalse();

    component.onLanePowerSelect(2, false);
    expect(component.trackPowerLaneSelect.emit).toHaveBeenCalledWith({
      lane: 2,
      on: false,
    });
  });

  it("should return correct relay state from data service", () => {
    mockDataService.getSystemStateValue.and.returnValue({
      hasMainRelay: true,
      hasPerLaneRelays: false,
    });
    expect(component.hasMainRelay()).toBeTrue();
    expect(component.hasPerLaneRelays()).toBeFalse();

    mockDataService.getSystemStateValue.and.returnValue({
      hasMainRelay: false,
      hasPerLaneRelays: true,
    });
    expect(component.hasMainRelay()).toBeTrue();
    expect(component.hasPerLaneRelays()).toBeTrue();

    mockDataService.getSystemStateValue.and.returnValue(null);
    expect(component.hasMainRelay()).toBeFalse();
    expect(component.hasPerLaneRelays()).toBeFalse();
  });

  describe("driverViewMenuOptions", () => {
    it("should generate options correctly for teams and drivers, omitting empty lanes", () => {
      // Mock participants and allDrivers
      (component as any).allDrivers = [
        { objectId: "driver2", nickname: "Jesse" },
      ];

      fixture.componentRef.setInput("participants", [
        {
          driver: {
            name: "Solo Driver",
            entity_id: "driver1",
            isEmpty: () => false,
          },
        },
        {
          driver: { name: "", entity_id: "empty1", isEmpty: () => true }, // Empty driver
        },
        {
          team: {
            name: "Team Rocket",
            entity_id: "team1",
            driverIds: ["driver2"],
          },
        },
        {
          team: {
            name: "Team Rocket",
            entity_id: "team1",
            driverIds: ["driver2"],
          },
          driver: { name: "Jesse", entity_id: "driver2", isEmpty: () => false },
        },
      ]);
      const options = component.driverViewMenuOptions;

      expect(options.length).toBe(3);
      expect(options[0]).toEqual({
        id: "driver1",
        value: "driver1",
        label: "Solo Driver",
      });
      expect(options[1]).toEqual({
        id: "team1",
        value: "team1",
        label: "Team Rocket",
      });
      expect(options[2]).toEqual({
        id: "team1_driver2",
        value: "driver2",
        label: " - Jesse",
      });
    });
  });
});
