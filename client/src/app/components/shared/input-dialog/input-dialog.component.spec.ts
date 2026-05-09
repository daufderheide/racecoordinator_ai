import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationService } from "@app/services/translation.service";

import { InputDialogComponent } from "./input-dialog.component";
import { InputDialogHarness } from "./testing/input-dialog.harness";

@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return `TRANSLATED_${value}`;
  }
}

describe("InputDialogComponent", () => {
  let component: InputDialogComponent;
  let fixture: ComponentFixture<InputDialogComponent>;
  let harness: InputDialogHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputDialogComponent, MockTranslatePipe],
      providers: [
        {
          provide: TranslationService,
          useValue: {
            translate: (key: string) => `TRANSLATED_${key}`,
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(InputDialogComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      InputDialogHarness,
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

  it("should be visible and show data when visible input is true", async () => {
    fixture.componentRef.setInput("title", "TEST_TITLE");
    fixture.componentRef.setInput("message", "TEST_MESSAGE");
    fixture.componentRef.setInput("initialValue", "123");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    expect(await harness.isVisible()).toBeTrue();
    expect(await harness.getTitle()).toBe("TRANSLATED_TEST_TITLE");
    expect(await harness.getMessage()).toBe("TRANSLATED_TEST_MESSAGE");
    expect(await harness.getInputValue()).toBe("123");
  });

  it("should emit cancel event on cancel click", async () => {
    spyOn(component.cancel, "emit");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    await harness.clickCancel();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit confirm event with input value on confirm click", async () => {
    spyOn(component.confirm, "emit");
    fixture.componentRef.setInput("initialValue", "initial");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    await fixture.whenStable();

    // Use native DOM interaction to guarantee the (input) handler fires synchronously
    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "new value";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    await harness.clickConfirm();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.confirm.emit).toHaveBeenCalledWith("new value");
  });

  it("should disable confirm button if numeric input is below min", async () => {
    fixture.componentRef.setInput("type", "number");
    fixture.componentRef.setInput("min", 10);
    fixture.componentRef.setInput("initialValue", 10);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await harness.isConfirmDisabled()).toBeFalse();

    // Use native DOM interaction for reliable numeric value updates
    const inputEl = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    inputEl.value = "5";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await harness.isConfirmDisabled()).toBeTrue();

    inputEl.value = "15";
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await harness.isConfirmDisabled()).toBeFalse();
  });
});
