import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { RaceFlagService } from "@app/services/race-flag.service";

import { RacedayFlagComponent } from "./raceday-flag.component";
import { RacedayFlagHarness } from "./testing/raceday-flag.harness";

describe("RacedayFlagComponent", () => {
  let component: RacedayFlagComponent;
  let fixture: ComponentFixture<RacedayFlagComponent>;
  let harness: RacedayFlagHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayFlagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayFlagComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayFlagHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display flag image URL via harness", async () => {
    fixture.componentRef.setInput(
      "currentFlagUrl",
      "assets/images/flags/green.png",
    );
    fixture.detectChanges();

    expect(await harness.getFlagUrl()).toBe("assets/images/flags/green.png");
  });

  it("should fallback to RaceFlagService when currentFlagUrl input is empty", async () => {
    const mockRaceFlagService = {
      getCurrentFlagUrl: jasmine
        .createSpy("getCurrentFlagUrl")
        .and.returnValue("assets/flags/fallback.png"),
      currentFlagUrl$: of("assets/flags/fallback.png"),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RacedayFlagComponent],
      providers: [{ provide: RaceFlagService, useValue: mockRaceFlagService }],
    }).compileComponents();

    const flagFixture = TestBed.createComponent(RacedayFlagComponent);
    const flagHarness = await TestbedHarnessEnvironment.harnessForFixture(
      flagFixture,
      RacedayFlagHarness,
    );
    flagFixture.detectChanges();

    expect(await flagHarness.getFlagUrl()).toBe("assets/flags/fallback.png");
  });
});
