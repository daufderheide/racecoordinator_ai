import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AcknowledgementModalComponent } from "./acknowledgement-modal.component";
import { AcknowledgementModalHarness } from "./testing/acknowledgement-modal.harness";

describe("AcknowledgementModalComponent", () => {
  let component: AcknowledgementModalComponent;
  let fixture: ComponentFixture<AcknowledgementModalComponent>;
  let harness: AcknowledgementModalHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcknowledgementModalComponent],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AcknowledgementModalComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AcknowledgementModalHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not be visible by default", async () => {
    expect(component.visible()).toBeFalse();
    expect(await harness.isVisible()).toBeFalse();
  });

  it("should be visible when visible input is true", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    expect(await harness.isVisible()).toBeTrue();
  });

  it("should emit acknowledge event on button click", async () => {
    spyOn(component.acknowledge, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickAcknowledge();

    expect(component.acknowledge.emit).toHaveBeenCalled();
  });

  it("should use default button text ACK_MODAL_BTN_OK when not specified", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(component.buttonText()).toBe("ACK_MODAL_BTN_OK");
    expect(await harness.getButtonText()).toBe("OK");
  });

  it("should translate custom button text such as COMMON_OK", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("buttonText", "COMMON_OK");
    fixture.detectChanges();

    expect(component.buttonText()).toBe("COMMON_OK");
    expect(await harness.getButtonText()).toBe("OK");
  });

  it("should render title and message properly", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("title", "TEST_TITLE");
    fixture.componentRef.setInput("message", "TEST_MESSAGE");
    fixture.detectChanges();

    expect(await harness.getTitle()).toBe("TEST_TITLE");
    expect(await harness.getMessage()).toBe("TEST_MESSAGE");
  });
});
