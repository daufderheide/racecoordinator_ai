import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayBrandingComponent } from "./raceday-branding.component";
import { RacedayBrandingHarness } from "./testing/raceday-branding.harness";

describe("RacedayBrandingComponent", () => {
  let component: RacedayBrandingComponent;
  let fixture: ComponentFixture<RacedayBrandingComponent>;
  let harness: RacedayBrandingHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayBrandingComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayBrandingComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayBrandingHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display branding text and tagline via harness", async () => {
    expect(await harness.getLogoText()).toContain("Race Coordinator AI");
    expect(await harness.getTagline()).toBe("RD_TAGLINE"); // key returned by mockTranslationService
  });
});
