import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfirmationModalComponent } from "./confirmation-modal.component";
import { ConfirmationModalHarness } from "./testing/confirmation-modal.harness";

@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return `TRANSLATED_${value}`;
  }
}

describe("ConfirmationModalComponent", () => {
  let component: ConfirmationModalComponent;
  let fixture: ComponentFixture<ConfirmationModalComponent>;
  let harness: ConfirmationModalHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent, MockTranslatePipe],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      ConfirmationModalHarness,
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

  it("should emit cancel event on cancel click", async () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit confirm event on confirm click", async () => {
    spyOn(component.confirm, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickConfirm();

    expect(component.confirm.emit).toHaveBeenCalled();
  });
});
