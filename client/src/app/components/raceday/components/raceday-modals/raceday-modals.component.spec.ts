import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RacedayModalsComponent } from "./raceday-modals.component";
import { RacedayModalsHarness } from "./testing/raceday-modals.harness";
describe("RacedayModalsComponent", () => {
  let component: RacedayModalsComponent;
  let fixture: ComponentFixture<RacedayModalsComponent>;
  let harness: RacedayModalsHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacedayModalsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayModalsComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayModalsHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle visibility of modals via inputs", async () => {
    // Initial state
    expect(await harness.isAckModalVisible()).toBeFalse();
    expect(await harness.isExitModalVisible()).toBeFalse();
    expect(await harness.isSkipHeatModalVisible()).toBeFalse();

    // Show Ack Modal
    fixture.componentRef.setInput("showAckModal", true);
    fixture.detectChanges();
    expect(await harness.isAckModalVisible()).toBeTrue();

    // Show Exit Confirmation Modal
    fixture.componentRef.setInput("showExitConfirmation", true);
    fixture.detectChanges();
    expect(await harness.isExitModalVisible()).toBeTrue();

    // Show Skip Heat Modal
    fixture.componentRef.setInput("showSkipHeatConfirmation", true);
    fixture.detectChanges();
    expect(await harness.isSkipHeatModalVisible()).toBeTrue();
  });

  it("should bubble up confirmation and cancellation events", async () => {
    spyOn(component.exitConfirm, "emit");
    spyOn(component.exitCancel, "emit");

    fixture.componentRef.setInput("showExitConfirmation", true);
    fixture.detectChanges();

    // Trigger buttons directly on the DOM wrapper (or using child harnesses)
    const confirmBtn = fixture.nativeElement.querySelector(
      "app-confirmation-modal:nth-of-type(1) .btn-confirm",
    );
    const cancelBtn = fixture.nativeElement.querySelector(
      "app-confirmation-modal:nth-of-type(1) .btn-cancel",
    );

    confirmBtn.click();
    expect(component.exitConfirm.emit).toHaveBeenCalled();

    cancelBtn.click();
    expect(component.exitCancel.emit).toHaveBeenCalled();
  });
});
