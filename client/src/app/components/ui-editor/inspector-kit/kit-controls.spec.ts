import { ComponentFixture, TestBed } from "@angular/core/testing";

import { KitColorComponent } from "./kit-color.component";
import { KitStepperComponent } from "./kit-stepper.component";

describe("KitStepperComponent", () => {
  let fixture: ComponentFixture<KitStepperComponent>;
  let values: number[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitStepperComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(KitStepperComponent);
    fixture.componentRef.setInput("value", 5);
    fixture.componentRef.setInput("min", 0);
    fixture.componentRef.setInput("max", 6);
    fixture.componentRef.setInput("step", 1);
    fixture.componentRef.setInput("unit", "px");
    values = [];
    fixture.componentInstance.valueChange.subscribe((v) => values.push(v));
    fixture.detectChanges();
  });

  const buttons = () =>
    fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;

  it("steps up and down and shows the unit", () => {
    buttons()[1].click();
    buttons()[0].click();
    expect(values).toEqual([6, 4]);
    expect(fixture.nativeElement.textContent).toContain("px");
  });

  it("keeps typed values inside min..max", () => {
    const input = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;
    input.value = "99";
    input.dispatchEvent(new Event("change"));
    expect(values).toEqual([6]);
    expect(input.value).toBe("6");
  });

  it("disables the + button at the maximum", () => {
    fixture.componentRef.setInput("value", 6);
    fixture.detectChanges();
    expect(buttons()[1].disabled).toBeTrue();
    expect(buttons()[0].disabled).toBeFalse();
  });
});

describe("KitColorComponent", () => {
  let fixture: ComponentFixture<KitColorComponent>;
  let values: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitColorComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(KitColorComponent);
    values = [];
    fixture.componentInstance.valueChange.subscribe((v) => values.push(v));
    fixture.detectChanges();
  });

  it("shows 'theme default' while empty and the hex once set", () => {
    expect(
      fixture.nativeElement.querySelector(".kit-hex").textContent,
    ).toContain("UE_KIT_THEME_DEFAULT");
    fixture.componentRef.setInput("value", "#13263a");
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(".kit-hex").textContent.trim(),
    ).toBe("#13263A");
  });

  it("sets a quick colour or back to the theme default", () => {
    const quick = fixture.nativeElement.querySelectorAll(
      ".kit-quick-btn",
    ) as NodeListOf<HTMLButtonElement>;
    quick[1].click();
    quick[quick.length - 1].click();
    expect(values).toEqual(["#ffffff", ""]);
  });

  it("emits the picked colour", () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    input.value = "#ff0000";
    input.dispatchEvent(new Event("change"));
    expect(values).toEqual(["#ff0000"]);
  });
});
