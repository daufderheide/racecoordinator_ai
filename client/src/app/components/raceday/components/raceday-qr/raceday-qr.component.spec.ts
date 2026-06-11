import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedayQrComponent } from "./raceday-qr.component";
import { RacedayQrHarness } from "./testing/raceday-qr.harness";

describe("RacedayQrComponent", () => {
  let component: RacedayQrComponent;
  let fixture: ComponentFixture<RacedayQrComponent>;
  let harness: RacedayQrHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayQrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayQrComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayQrHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should conditionalize QR code visibility via harness", async () => {
    expect(await harness.getQrCodeSrc()).toBeNull();

    fixture.componentRef.setInput("qrCodeUrl", "data:image/png;base64,mock-qr");
    fixture.detectChanges();

    expect(await harness.getQrCodeSrc()).toBe("data:image/png;base64,mock-qr");
  });
});
